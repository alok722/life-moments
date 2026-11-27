/**
 * Daily AI news digest for "AI News" reminders.
 *
 * Source: Cobun AI (https://cobunai.com) — a free AI news brief built hourly
 * from 26 sources (OpenAI, arXiv, Hacker News, GitHub, …). We read the same
 * public JSON its website loads and pick the top stories per category.
 * Each story keeps its original link and description, so nothing is invented.
 *
 * Dependency-free and fetch-based: runs in Node (tests/preview) and Deno.
 */

export const DIGEST_VERSION = 2;
export const COBUN_DIGEST_URL = "https://data.cobunai.com/digest.json";
const USER_AGENT = "Mozilla/5.0 (compatible; NewsDigest/1.0)";

export interface DigestItem {
  title: string;
  url: string;
  source: string;
  /** What happened (from the original article). */
  brief: string;
  /** Why it matters (may be empty). */
  why: string;
  category: string;
}

export interface Digest {
  version: number;
  date: string;
  headline: string;
  items: DigestItem[];
  source: "cobun";
}

interface CobunItem {
  title?: unknown;
  link?: unknown;
  src?: unknown;
  srcLabel?: unknown;
  sum?: unknown;
  why?: unknown;
}

interface CobunCategory {
  id?: unknown;
  label?: unknown;
  items?: unknown;
}

const IST_OFFSET_MS = 5.5 * 60 * 60 * 1000;
const MAX_ITEMS = 10;
const PER_CATEGORY = 2;

/** YYYY-MM-DD of the IST calendar day containing `now`. */
export function istDateKey(now = Date.now()): string {
  return new Date(now + IST_OFFSET_MS).toISOString().slice(0, 10);
}

const str = (v: unknown) => (typeof v === "string" ? v : "");

function isHttpUrl(u: string): boolean {
  try {
    const p = new URL(u).protocol;
    return p === "https:" || p === "http:";
  } catch {
    return false;
  }
}

/** Limits text to whole sentences within `max` characters. */
function toSentences(text: string, max: number): string {
  if (text.length <= max) return text;
  const cut = text.slice(0, max);
  const end = Math.max(cut.lastIndexOf(". "), cut.lastIndexOf("! "), cut.lastIndexOf("? "));
  if (end > 40) return cut.slice(0, end + 1);
  return `${cut.slice(0, cut.lastIndexOf(" ")).trimEnd()}…`;
}

/** Cleans a feed description: drops "The post … appeared first on …", cut-off tails and boilerplate. */
export function cleanDescription(raw: unknown, title = ""): string {
  let s = str(raw).replace(/\s+/g, " ").trim();
  s = s.replace(/\s*The post\b[\s\S]*$/i, "").trim(); // WordPress "The post X appeared first on Y"
  // Drop a trailing unfinished sentence ("… some words…").
  if (/(…|\.\.\.)$/.test(s)) {
    const lastStop = Math.max(s.lastIndexOf(". "), s.lastIndexOf("! "), s.lastIndexOf("? "));
    s = lastStop > 0 ? s.slice(0, lastStop + 1) : s.replace(/(…|\.\.\.)$/, "").trim();
  }
  if (/^discussion on hacker news\.?$/i.test(s) || s.replace(/[.…\s]/g, "").length < 25) return "";
  if (title && s.toLowerCase() === title.toLowerCase()) return "";
  return toSentences(s, 300);
}

/** Turns Cobun's digest.json into our digest; [] items if the payload is unusable. */
export function parseCobunDigest(raw: unknown, date: string): Digest {
  const categories = Array.isArray((raw as { categories?: unknown })?.categories)
    ? ((raw as { categories: CobunCategory[] }).categories)
    : [];

  const seen = new Set<string>();
  const perCategory: DigestItem[][] = categories.map((cat) => {
    const label = str(cat.label) || str(cat.id) || "AI";
    const list = Array.isArray(cat.items) ? (cat.items as CobunItem[]) : [];
    const picked: DigestItem[] = [];
    for (const it of list) {
      if (picked.length >= PER_CATEGORY) break;
      const title = str(it.title).trim();
      const url = str(it.link).trim();
      if (!title || !isHttpUrl(url) || seen.has(url)) continue;
      const why = toSentences(str(it.why).replace(/\s+/g, " ").trim(), 200);
      const brief = cleanDescription(it.sum, title) || why;
      if (!brief) continue; // the whole point is a useful description
      seen.add(url);
      picked.push({
        title: title.slice(0, 160),
        url,
        source: (str(it.srcLabel) && str(it.srcLabel) !== "undefined" ? str(it.srcLabel) : str(it.src)) || new URL(url).hostname.replace(/^www\./, ""),
        brief,
        why: brief === why ? "" : why,
        category: label,
      });
    }
    return picked;
  });

  // Round-robin across categories so every area is represented before any gets a second story.
  const items: DigestItem[] = [];
  for (let round = 0; round < PER_CATEGORY && items.length < MAX_ITEMS; round++) {
    for (const list of perCategory) {
      if (list[round] && items.length < MAX_ITEMS) items.push(list[round]);
    }
  }
  // Keep category groups together in the email, in Cobun's order.
  const order = categories.map((c) => str(c.label) || str(c.id) || "AI");
  items.sort((a, b) => order.indexOf(a.category) - order.indexOf(b.category));

  const areas = [...new Set(items.map((i) => i.category))];
  const headline =
    items.length > 0
      ? `${items.length} stories today across ${areas.slice(0, 3).join(", ")}${areas.length > 3 ? " and more" : ""}.`
      : "";
  return { version: DIGEST_VERSION, date, headline, items, source: "cobun" };
}

export interface DigestOptions {
  fetchImpl?: typeof fetch;
  now?: number;
  timeoutMs?: number;
  /** Unused (kept for call-site compatibility). */
  apiKey?: string | null;
}

/** Fetches today's digest; never throws (returns zero items if Cobun is unreachable). */
export async function generateDigest(opts: DigestOptions = {}): Promise<Digest> {
  const date = istDateKey(opts.now ?? Date.now());
  const doFetch = opts.fetchImpl ?? fetch;
  try {
    const res = await doFetch(COBUN_DIGEST_URL, {
      headers: { "User-Agent": USER_AGENT, Accept: "application/json" },
      signal: AbortSignal.timeout(opts.timeoutMs ?? 15_000),
    });
    if (!res.ok) throw new Error(`Cobun ${res.status}`);
    return parseCobunDigest(await res.json(), date);
  } catch {
    return { version: DIGEST_VERSION, date, headline: "", items: [], source: "cobun" };
  }
}

const esc = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");

export function digestSubject(digest: Digest): string {
  const label = new Date(`${digest.date}T00:00:00Z`).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    timeZone: "UTC",
  });
  return `Your Daily AI News — ${label}`;
}

export function renderDigestEmail(digest: Digest, opts: { title?: string } = {}): string {
  const dateLabel = new Date(`${digest.date}T00:00:00Z`).toLocaleDateString("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
    timeZone: "UTC",
  });

  let lastCategory = "";
  const rows = digest.items
    .map((it) => {
      const heading =
        it.category !== lastCategory
          ? `<tr><td style="padding: 10px 0 8px;"><p style="margin: 0; font-size: 13px; font-weight: 700; color: #4c1d95;">${esc(it.category)}</p></td></tr>`
          : "";
      lastCategory = it.category;
      return `${heading}
      <tr><td style="padding: 0 0 12px;">
        <div style="background: #ffffff; border: 1px solid #ede9fe; border-radius: 12px; padding: 16px 18px;">
          <p style="margin: 0 0 4px; font-size: 11px; font-weight: 700; letter-spacing: .04em; text-transform: uppercase; color: #7c5cfc;">${esc(it.source)}</p>
          <p style="margin: 0 0 6px; font-size: 16px; font-weight: 700; line-height: 1.35;"><a href="${esc(it.url)}" style="color: #111827; text-decoration: none;">${esc(it.title)}</a></p>
          <p style="margin: 0 0 8px; color: #374151; font-size: 14px; line-height: 1.55;">${esc(it.brief)}</p>
          ${it.why ? `<p style="margin: 0 0 10px; color: #6b7280; font-size: 13px; line-height: 1.5;"><strong style="color: #4b5563;">Why it matters:</strong> ${esc(it.why)}</p>` : ""}
          <a href="${esc(it.url)}" style="color: #7c5cfc; font-size: 13px; font-weight: 600; text-decoration: none;">Read more →</a>
        </div>
      </td></tr>`;
    })
    .join("");

  const body =
    digest.items.length > 0
      ? `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse: collapse;">${rows}</table>`
      : `<p style="color: #6b7280;">We couldn't reach our news source today — your digest will be back tomorrow.</p>`;

  return `
  <div style="font-family: -apple-system, Segoe UI, Roboto, sans-serif; max-width: 600px; margin: 0 auto; color: #111827;">
    <div style="background: linear-gradient(135deg, #7c5cfc, #5b8def); border-radius: 16px; padding: 22px 24px; color: #ffffff; margin: 0 0 8px;">
      <p style="margin: 0; font-size: 12px; opacity: .85; letter-spacing: .04em; text-transform: uppercase;">${esc(opts.title || "Daily AI News")} · ${esc(dateLabel)}</p>
      <p style="margin: 6px 0 0; font-size: 20px; font-weight: 700; line-height: 1.3;">${esc(digest.headline || "Today in AI")}</p>
    </div>
    ${body}
    <p style="color: #9ca3af; font-size: 12px; line-height: 1.5;">
      Stories curated by <a href="https://cobunai.com" style="color: #7c5cfc;">Cobun AI</a> from 26 sources — tap through for the full story.<br/>
      Sent by Life Moments · edit or delete this reminder in the app to stop it.
    </p>
  </div>`;
}
