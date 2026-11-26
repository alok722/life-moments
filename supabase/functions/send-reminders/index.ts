import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { computeNextReminderAt } from "../_shared/schedule.ts";

const BREVO_API_KEY = Deno.env.get("BREVO_API_KEY")!;
const BREVO_SENDER_EMAIL =
  Deno.env.get("BREVO_SENDER_EMAIL") || "noreply@life-moments.app";
const BREVO_SENDER_NAME = Deno.env.get("BREVO_SENDER_NAME") || "Life Moments";
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const GOOGLE_GEMINI_API_KEY = Deno.env.get("GOOGLE_GEMINI_API_KEY")!;

const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

interface Reminder {
  id: string;
  user_id: string;
  title: string;
  event_type: string;
  relation: string | null;
  event_month: number;
  event_day: number;
  reminder_offset: string;
  recurrence_type: string;
  next_reminder_at: string;
  email_sent: boolean;
}

async function generateWish(
  eventType: string,
  relation: string | null,
  title: string,
): Promise<string> {
  try {
    if (eventType === "bill") return "";

    const prompt = `Generate 1 short, heartfelt ${eventType} wish${relation ? ` for my ${relation}` : ""}${title ? ` regarding "${title}"` : ""}. Keep it under 2 sentences. Return only the wish text, no quotes or extra formatting.`;

    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent?key=${GOOGLE_GEMINI_API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { temperature: 0.8, maxOutputTokens: 200 },
        }),
      },
    );

    if (!res.ok) return "";

    const data = await res.json();
    return data.candidates?.[0]?.content?.parts?.[0]?.text?.trim() ?? "";
  } catch {
    return "";
  }
}

async function sendEmail(
  recipients: { email: string }[],
  subject: string,
  html: string,
) {
  const payload = {
    sender: { name: BREVO_SENDER_NAME, email: BREVO_SENDER_EMAIL },
    to: recipients,
    subject,
    htmlContent: html,
  };

  const res = await fetch("https://api.brevo.com/v3/smtp/email", {
    method: "POST",
    headers: {
      "api-key": BREVO_API_KEY,
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const error = await res.text();
    throw new Error(`Brevo API error: ${error}`);
  }

  const result = await res.json();
  return result;
}

Deno.serve(async () => {
  const executionId = crypto.randomUUID().slice(0, 8);
  const executionStart = new Date().toISOString();

  try {
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    const { data: reminders, error: fetchError } = await supabase
      .from("reminders")
      .select("*")
      .lte("next_reminder_at", new Date().toISOString())
      .eq("email_sent", false)
      .is("completed_at", null)
      .limit(50);

    if (fetchError) {
      throw new Error(`Failed to fetch reminders: ${fetchError.message}`);
    }

    if (!reminders || reminders.length === 0) {
      return new Response(JSON.stringify({ sent: 0, executionId }), {
        headers: { "Content-Type": "application/json" },
      });
    }

    let sentCount = 0;
    let skippedCount = 0;

    for (const reminder of reminders as Reminder[]) {
      const reminderId = reminder.id.slice(0, 8);
      try {
        // Atomically mark as sent to prevent duplicate processing
        // Only update if email_sent is still false (prevents race conditions)
        const { data: updated, error: updateError } = await supabase
          .from("reminders")
          .update({ email_sent: true })
          .eq("id", reminder.id)
          .eq("email_sent", false)
          .select()
          .single();

        // If update failed (already processed by another instance), skip
        if (updateError || !updated) {
          skippedCount++;
          continue;
        }

        const {
          data: { user },
        } = await supabase.auth.admin.getUserById(reminder.user_id);

        if (!user?.email) {
          console.error(
            `[${reminderId}] User not found or no email for user_id: ${reminder.user_id}`,
          );
          await supabase
            .from("reminders")
            .update({ email_sent: false })
            .eq("id", reminder.id);
          continue;
        }

        const { data: extraRecipients, error: recipientsError } = await supabase
          .from("notification_recipients")
          .select("email")
          .eq("user_id", reminder.user_id);

        if (recipientsError) {
          console.error(
            `[${reminderId}] Failed to fetch recipients for user ${reminder.user_id}`,
          );
        }

        const allEmails = new Set([
          user.email.toLowerCase(),
          ...(extraRecipients ?? []).map((r: { email: string }) =>
            r.email.toLowerCase(),
          ),
        ]);
        const recipients = [...allEmails].map((e) => ({ email: e }));

        const wish = await generateWish(
          reminder.event_type,
          reminder.relation,
          reminder.title,
        );

        const eventDateStr = `${MONTHS[reminder.event_month - 1]} ${reminder.event_day}`;
        const subject = `Reminder: ${reminder.title}`;
        const html = `
          <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #1a1a1a;">Life Moments Reminder</h2>
            <div style="background: #f9fafb; border-radius: 12px; padding: 24px; margin: 16px 0;">
              <h3 style="margin: 0 0 8px;">${reminder.title}</h3>
              <p style="color: #6b7280; margin: 4px 0;">Type: ${reminder.event_type}</p>
              ${reminder.relation ? `<p style="color: #6b7280; margin: 4px 0;">For: ${reminder.relation}</p>` : ""}
              <p style="color: #6b7280; margin: 4px 0;">Date: ${eventDateStr}</p>
            </div>
            ${
              wish
                ? `
            <div style="background: #fefce8; border-radius: 12px; padding: 20px; margin: 16px 0; border-left: 4px solid #eab308;">
              <p style="margin: 0 0 4px; font-weight: 600; color: #854d0e;">Suggested Wish</p>
              <p style="margin: 0; color: #713f12; font-style: italic;">${wish}</p>
            </div>
            `
                : ""
            }
            <p style="color: #9ca3af; font-size: 12px;">Sent by Life Moments</p>
          </div>
        `;

        await sendEmail(recipients, subject, html);

        if (reminder.recurrence_type === "once") {
          await supabase
            .from("reminders")
            .update({ completed_at: new Date().toISOString() })
            .eq("id", reminder.id);
        } else {
          // Continue the series from the occurrence just sent; always strictly later.
          const nextReminderAt = computeNextReminderAt(
            {
              month: reminder.event_month,
              day: reminder.event_day,
              offset: reminder.reminder_offset,
              recurrence: reminder.recurrence_type,
            },
            {
              after: Math.max(Date.now(), Date.parse(reminder.next_reminder_at)),
              previousReminderAt: reminder.next_reminder_at,
            },
          );

          await supabase
            .from("reminders")
            .update({
              email_sent: false,
              next_reminder_at: nextReminderAt,
            })
            .eq("id", reminder.id);
        }

        sentCount++;
      } catch (err) {
        console.error(
          `[${reminderId}] Error processing reminder:`,
          (err as Error).message,
        );
        // Reset email_sent on error so it can be retried
        await supabase
          .from("reminders")
          .update({ email_sent: false })
          .eq("id", reminder.id);
      }
    }

    return new Response(
      JSON.stringify({
        sent: sentCount,
        skipped: skippedCount,
        executionId,
        executionTime: executionStart,
      }),
      {
        headers: { "Content-Type": "application/json" },
      },
    );
  } catch (err) {
    console.error(`[${executionId}] Fatal error:`, (err as Error).message);
    return new Response(
      JSON.stringify({ error: (err as Error).message, executionId }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      },
    );
  }
});
