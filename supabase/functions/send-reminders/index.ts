import { createClient, type SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";
import { atMinutesFor, computeNextReminderAt } from "../_shared/schedule.ts";
import { DIGEST_VERSION, digestSubject, generateDigest, istDateKey, renderDigestEmail, type Digest } from "../_shared/news.ts";
import { generateMessages, shareLinks, type MessageSuggestion } from "../_shared/messages.ts";

const BREVO_API_KEY = Deno.env.get("BREVO_API_KEY")!;
const BREVO_SENDER_EMAIL =
  Deno.env.get("BREVO_SENDER_EMAIL") || "noreply@life-moments.app";
const BREVO_SENDER_NAME = Deno.env.get("BREVO_SENDER_NAME") || "Life Moments";
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const GOOGLE_GEMINI_API_KEY = Deno.env.get("GOOGLE_GEMINI_API_KEY") ?? "";
/** Optional extra secret; callers may send it as `x-cron-secret` instead of the service role key. */
const CRON_SECRET = Deno.env.get("CRON_SECRET") ?? "";

const BATCH_SIZE = 50;
const CONCURRENCY = 5;
/** A claim older than this is assumed to belong to a crashed run and may be re-taken. */
const CLAIM_TTL_MS = 10 * 60 * 1000;
/** After this many failed attempts an occurrence is skipped (recurring) or parked (once). */
const MAX_ATTEMPTS = 5;
/** Per-user cap on reminder emails in a rolling 24h window (anti-abuse). */
const DAILY_SEND_CAP = 30;

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

interface Reminder {
  id: string;
  user_id: string;
  title: string;
  event_type: string;
  relation: string | null;
  notes: string | null;
  event_month: number;
  event_day: number;
  reminder_offset: string;
  recurrence_type: string;
  next_reminder_at: string;
  email_sent: boolean;
  attempts: number;
  last_sent_at: string | null;
}

type Supabase = SupabaseClient;

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function timingSafeEqual(a: string, b: string): boolean {
  const enc = new TextEncoder();
  const x = enc.encode(a);
  const y = enc.encode(b);
  if (x.length !== y.length) return false;
  let diff = 0;
  for (let i = 0; i < x.length; i++) diff |= x[i] ^ y[i];
  return diff === 0;
}

async function isAuthorized(req: Request): Promise<boolean> {
  const bearer = req.headers.get("authorization")?.replace(/^Bearer\s+/i, "") ?? "";
  if (bearer && timingSafeEqual(bearer, SUPABASE_SERVICE_ROLE_KEY)) return true;

  const secret = req.headers.get("x-cron-secret") ?? "";
  if (CRON_SECRET !== "" && timingSafeEqual(secret, CRON_SECRET)) return true;

  // Accept any other genuine secret key for this project (e.g. a new-style
  // sb_secret_ key, or a rotated service_role JWT in the cron job): prove it
  // by making an admin-only call with it. Anon/user tokens are rejected.
  if (!bearer) return false;
  try {
    const probe = createClient(SUPABASE_URL, bearer, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
    const { error } = await probe.auth.admin.listUsers({ page: 1, perPage: 1 });
    return !error;
  } catch {
    return false;
  }
}

async function sendEmail(recipients: { email: string }[], subject: string, html: string) {
  const res = await fetch("https://api.brevo.com/v3/smtp/email", {
    method: "POST",
    headers: {
      "api-key": BREVO_API_KEY,
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify({
      sender: { name: BREVO_SENDER_NAME, email: BREVO_SENDER_EMAIL },
      to: recipients,
      subject,
      htmlContent: html,
    }),
    signal: AbortSignal.timeout(15_000),
  });
  if (!res.ok) {
    throw new Error(`Brevo API error ${res.status}: ${(await res.text()).slice(0, 300)}`);
  }
  // Success: don't parse the body — a parse failure must not trigger a retry of a delivered email.
  await res.body?.cancel();
}

const BRAND = "#7c5cfc";

function renderMessages(messages: MessageSuggestion[], relation: string): string {
  if (messages.length === 0) return "";
  const cards = messages
    .map((m) => {
      const wa = escapeHtml(shareLinks(m.text).whatsapp);
      return `
        <div style="background: #ffffff; border: 1px solid #ede9fe; border-radius: 12px; padding: 16px; margin: 0 0 12px;">
          <p style="margin: 0 0 6px; font-size: 11px; font-weight: 700; letter-spacing: .04em; text-transform: uppercase; color: ${BRAND};">${escapeHtml(m.label)}</p>
          <p style="margin: 0 0 12px; color: #1f2937; font-size: 15px; line-height: 1.5;">${escapeHtml(m.text)}</p>
          <a href="${wa}" style="display: inline-block; background: #25d366; color: #ffffff; text-decoration: none; font-size: 13px; font-weight: 600; padding: 8px 14px; border-radius: 999px;">Send on WhatsApp</a>
        </div>`;
    })
    .join("");
  return `
      <div style="background: #f5f3ff; border-radius: 12px; padding: 20px; margin: 16px 0;">
        <p style="margin: 0 0 4px; font-weight: 700; color: #4c1d95;">✨ Message ideas${relation ? ` for your ${escapeHtml(relation.toLowerCase())}` : ""}</p>
        <p style="margin: 0 0 14px; color: #6b7280; font-size: 13px;">Pick one, tweak it if you like, and send it your way.</p>
        ${cards}
      </div>`;
}

function renderEmail(reminder: Reminder, messages: MessageSuggestion[]): string {
  const title = escapeHtml(reminder.title);
  const type = escapeHtml(reminder.event_type);
  const relation = reminder.relation ? escapeHtml(reminder.relation) : "";
  const date = `${MONTHS[reminder.event_month - 1]} ${reminder.event_day}`;
  return `
    <div style="font-family: -apple-system, Segoe UI, Roboto, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #1a1a1a;">Life Moments Reminder</h2>
      <div style="background: #f9fafb; border-radius: 12px; padding: 24px; margin: 16px 0;">
        <h3 style="margin: 0 0 8px;">${title}</h3>
        <p style="color: #6b7280; margin: 4px 0;">Type: ${type}</p>
        ${relation ? `<p style="color: #6b7280; margin: 4px 0;">For: ${relation}</p>` : ""}
        <p style="color: #6b7280; margin: 4px 0;">Date: ${date}</p>
      </div>
      ${renderMessages(messages, reminder.relation ?? "")}
      <p style="color: #9ca3af; font-size: 12px;">Sent by Life Moments</p>
    </div>`;
}

function nextScheduleFor(reminder: Reminder) {
  if (reminder.recurrence_type === "once") {
    return { completed_at: new Date().toISOString() };
  }
  return {
    next_reminder_at: computeNextReminderAt(
      {
        month: reminder.event_month,
        day: reminder.event_day,
        offset: reminder.reminder_offset,
        recurrence: reminder.recurrence_type,
        atMinutes: atMinutesFor(reminder.event_type),
      },
      {
        // Continue the series from the occurrence just handled; always strictly later.
        after: Math.max(Date.now(), Date.parse(reminder.next_reminder_at)),
        previousReminderAt: reminder.next_reminder_at,
      },
    ),
  };
}

/** Today's AI news digest: cached in news_digests so it's built once per IST day. */
let digestInFlight: { date: string; promise: Promise<Digest> } | null = null;

function getTodaysDigest(supabase: Supabase): Promise<Digest> {
  const date = istDateKey();
  if (digestInFlight?.date === date) return digestInFlight.promise;
  const promise = (async () => {
    const { data } = await supabase.from("news_digests").select("digest").eq("digest_date", date).maybeSingle();
    const cached = data?.digest as Digest | undefined;
    if (cached?.items?.length && cached.version === DIGEST_VERSION) return cached;
    const digest = await generateDigest();
    if (digest.items.length > 0) {
      // Overwrites an older-format digest for the same day.
      await supabase.from("news_digests").upsert({ digest_date: date, digest }, { onConflict: "digest_date" });
    }
    return digest;
  })();
  digestInFlight = { date, promise };
  promise.catch(() => (digestInFlight = null));
  return promise;
}

/** Releases the claim and moves the reminder on to its next occurrence. */
async function advance(supabase: Supabase, reminder: Reminder, extra: Record<string, unknown> = {}) {
  const patch = {
    ...nextScheduleFor(reminder),
    email_sent: false,
    claimed_at: null,
    attempts: 0,
    last_error: null,
    ...extra,
  };
  // Retry: if this write is lost, the row would be re-claimed later (last_sent_at prevents a resend).
  for (let i = 0; i < 3; i++) {
    const { error } = await supabase.from("reminders").update(patch).eq("id", reminder.id);
    if (!error) return;
    await new Promise((r) => setTimeout(r, 300 * (i + 1)));
  }
  throw new Error("Failed to save next schedule");
}

async function recordFailure(supabase: Supabase, reminder: Reminder, message: string) {
  const attempts = (reminder.attempts ?? 0) + 1;
  if (attempts >= MAX_ATTEMPTS && reminder.recurrence_type !== "once") {
    // Give up on this occurrence but keep the series alive.
    await advance(supabase, reminder, { last_error: `Skipped after ${attempts} attempts: ${message}` });
    return;
  }
  await supabase
    .from("reminders")
    .update({ email_sent: false, claimed_at: null, attempts, last_error: message.slice(0, 500) })
    .eq("id", reminder.id);
}

type Outcome = "sent" | "skipped" | "deferred" | "failed";

async function processReminder(supabase: Supabase, candidate: Reminder): Promise<Outcome> {
  const tag = candidate.id.slice(0, 8);
  const staleBefore = new Date(Date.now() - CLAIM_TTL_MS).toISOString();

  // Atomic claim: only one run can take an unclaimed (or abandoned) row.
  const { data: reminder } = await supabase
    .from("reminders")
    .update({ email_sent: true, claimed_at: new Date().toISOString() })
    .eq("id", candidate.id)
    .is("completed_at", null)
    .or(`email_sent.eq.false,claimed_at.lt.${staleBefore},claimed_at.is.null`)
    .select()
    .maybeSingle<Reminder>();
  if (!reminder) return "skipped";

  try {
    // This occurrence was already delivered by an earlier run whose bookkeeping failed.
    if (reminder.last_sent_at && Date.parse(reminder.last_sent_at) >= Date.parse(reminder.next_reminder_at)) {
      await advance(supabase, reminder);
      return "skipped";
    }

    const { data: { user } } = await supabase.auth.admin.getUserById(reminder.user_id);
    if (!user?.email) {
      await recordFailure(supabase, reminder, "User has no email address");
      return "failed";
    }

    const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    const { count } = await supabase
      .from("email_sends")
      .select("id", { count: "exact", head: true })
      .eq("user_id", reminder.user_id)
      .gte("sent_at", since);
    if ((count ?? 0) >= DAILY_SEND_CAP) {
      console.warn(`[${tag}] Daily send cap reached for user; deferring`);
      await supabase
        .from("reminders")
        .update({ email_sent: false, claimed_at: null, last_error: "Daily send cap reached" })
        .eq("id", reminder.id);
      return "deferred";
    }

    const { data: extra, error: recipientsError } = await supabase
      .from("notification_recipients")
      .select("email")
      .eq("user_id", reminder.user_id)
      .limit(5);
    if (recipientsError) console.error(`[${tag}] Failed to fetch extra recipients`);

    const recipients = [
      ...new Set([user.email, ...(extra ?? []).map((r: { email: string }) => r.email)].map((e) => e.toLowerCase())),
    ].map((email) => ({ email }));

    let subject: string;
    let html: string;
    if (reminder.event_type === "ai_news") {
      const digest = await getTodaysDigest(supabase);
      // No stories (all sources down): fail so it retries on the next run instead of sending an empty email.
      if (digest.items.length === 0) throw new Error("AI news digest unavailable");
      subject = digestSubject(digest);
      html = renderDigestEmail(digest, { title: reminder.title });
    } else {
      const { messages } = await generateMessages(
        {
          eventType: reminder.event_type,
          relation: reminder.relation,
          title: reminder.title,
          notes: reminder.notes,
        },
        { apiKey: GOOGLE_GEMINI_API_KEY, timeoutMs: 10_000 },
      );
      subject = `Reminder: ${reminder.title.replace(/[\r\n]+/g, " ")}`;
      html = renderEmail(reminder, messages);
    }

    await sendEmail(recipients, subject, html);
    const sentAt = new Date().toISOString();

    await supabase
      .from("email_sends")
      .insert({ user_id: reminder.user_id, reminder_id: reminder.id, recipients: recipients.length });
    await advance(supabase, reminder, { last_sent_at: sentAt });
    return "sent";
  } catch (err) {
    const message = (err as Error).message;
    console.error(`[${tag}] Error processing reminder: ${message}`);
    await recordFailure(supabase, reminder, message).catch(() => {});
    return "failed";
  }
}

async function runPool<T, R>(items: T[], limit: number, fn: (item: T) => Promise<R>): Promise<R[]> {
  const results: R[] = [];
  let next = 0;
  const workers = Array.from({ length: Math.min(limit, items.length) }, async () => {
    while (next < items.length) {
      const i = next++;
      results[i] = await fn(items[i]);
    }
  });
  await Promise.all(workers);
  return results;
}

Deno.serve(async (req) => {
  if (!(await isAuthorized(req))) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  const executionId = crypto.randomUUID().slice(0, 8);
  const executionStart = new Date().toISOString();

  try {
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    const staleBefore = new Date(Date.now() - CLAIM_TTL_MS).toISOString();

    const { data: reminders, error: fetchError } = await supabase
      .from("reminders")
      .select("*")
      .lte("next_reminder_at", executionStart)
      .is("completed_at", null)
      .lt("attempts", MAX_ATTEMPTS)
      .or(`email_sent.eq.false,claimed_at.lt.${staleBefore},claimed_at.is.null`)
      .order("next_reminder_at", { ascending: true })
      .limit(BATCH_SIZE);

    if (fetchError) throw new Error(`Failed to fetch reminders: ${fetchError.message}`);

    const outcomes = await runPool((reminders ?? []) as Reminder[], CONCURRENCY, (r) =>
      processReminder(supabase, r),
    );
    const tally = (o: Outcome) => outcomes.filter((x) => x === o).length;

    return new Response(
      JSON.stringify({
        sent: tally("sent"),
        skipped: tally("skipped"),
        deferred: tally("deferred"),
        failed: tally("failed"),
        executionId,
        executionTime: executionStart,
      }),
      { headers: { "Content-Type": "application/json" } },
    );
  } catch (err) {
    console.error(`[${executionId}] Fatal error:`, (err as Error).message);
    return new Response(JSON.stringify({ error: "Internal error", executionId }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
});
