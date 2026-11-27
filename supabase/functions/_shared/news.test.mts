import { test } from "node:test";
import assert from "node:assert/strict";
import {
  cleanDescription,
  DIGEST_VERSION,
  digestFailureSubject,
  digestSubject,
  generateDigest,
  istDateKey,
  parseCobunDigest,
  renderDigestEmail,
  renderDigestFailureEmail,
} from "./news.ts";

const NOW = Date.parse("2026-11-27T02:00:00Z");

const item = (n: number, extra: Record<string, unknown> = {}) => ({
  id: `x-${n}`,
  title: `Story ${n}`,
  link: `https://example.com/${n}`,
  src: "Src",
  srcLabel: "Source Label",
  sum: `Story ${n} happened today and it is described in a full, useful sentence. A second sentence adds detail.`,
  why: `It matters for reason ${n}.`,
  ...extra,
});

const COBUN = {
  intro: "ignored",
  categories: [
    {
      id: "model",
      label: "Models & Releases",
      items: [
        item(1, { sum: "Big model shipped with better scores than its larger sibling. The post Big model appeared first on Blog." }),
        item(2),
        item(3),
      ],
    },
    {
      id: "repo",
      label: "Repos & Projects",
      items: [
        item(4, { srcLabel: "undefined", src: "GitHub", sum: "…", why: "" }), // no usable description → skipped
        item(5, { srcLabel: undefined, src: "GitHub", sum: "Discussion on Hacker News.", why: "Lets developers run models locally." }),
      ],
    },
    {
      id: "discuss",
      label: "Community",
      items: [item(6, { link: "javascript:alert(1)" }), item(7, { link: "https://example.com/1" }), item(8)],
    },
  ],
};

test("cleanDescription strips WordPress tails, cut-off endings and boilerplate", () => {
  assert.equal(
    cleanDescription("Code Mode was 120x cheaper and 18x faster on fan-outs. The post Code Mode vs X appeared first on TDS"),
    "Code Mode was 120x cheaper and 18x faster on fan-outs.",
  );
  assert.equal(
    cleanDescription("We distilled the model into a smaller one with 93% of the score. Code and costs included.…"),
    "We distilled the model into a smaller one with 93% of the score.",
  );
  assert.equal(cleanDescription("…"), "");
  assert.equal(cleanDescription("Discussion on Hacker News."), "");
  assert.equal(cleanDescription("Story 1", "Story 1"), "");
  assert.ok(cleanDescription("word ".repeat(200)).length <= 301);
});

test("parseCobunDigest picks described stories, keeps real links, groups by category", () => {
  const d = parseCobunDigest(COBUN, "2026-11-27");
  assert.equal(d.version, DIGEST_VERSION);
  assert.deepEqual(
    d.items.map((i) => i.title),
    ["Story 1", "Story 2", "Story 5", "Story 8"],
  );
  const [first, , fromRepo, fromDiscuss] = d.items;
  assert.equal(first.brief, "Big model shipped with better scores than its larger sibling.");
  assert.equal(first.why, "It matters for reason 1.");
  assert.equal(first.category, "Models & Releases");
  // No usable description → falls back to "why", which is then not repeated.
  assert.equal(fromRepo.brief, "Lets developers run models locally.");
  assert.equal(fromRepo.why, "");
  assert.equal(fromRepo.source, "GitHub");
  // Non-http and duplicate links are skipped.
  assert.equal(fromDiscuss.url, "https://example.com/8");
  assert.match(d.headline, /^4 stories today across Models & Releases, Repos & Projects, Community\.$/);
});

test("parseCobunDigest caps at 10 stories, at most 2 per category", () => {
  const big = {
    categories: Array.from({ length: 6 }, (_, c) => ({
      id: `c${c}`,
      label: `Cat ${c}`,
      items: Array.from({ length: 5 }, (_, i) => item(c * 10 + i)),
    })),
  };
  const d = parseCobunDigest(big, "2026-11-27");
  assert.equal(d.items.length, 10);
  const perCat = d.items.reduce((a, i) => ((a[i.category] = (a[i.category] || 0) + 1), a), {} as Record<string, number>);
  assert.ok(Object.values(perCat).every((n) => n <= 2));
  assert.equal(Object.keys(perCat).length, 6, "every category represented");
});

test("generateDigest returns no items when Cobun is down or returns junk", async () => {
  const down = (async () => new Response("", { status: 503 })) as unknown as typeof fetch;
  const junk = (async () => new Response("<html>", { status: 200 })) as unknown as typeof fetch;
  const throws = (async () => { throw new Error("net"); }) as unknown as typeof fetch;
  for (const fetchImpl of [down, junk, throws]) {
    const d = await generateDigest({ now: NOW, fetchImpl });
    assert.equal(d.items.length, 0);
    assert.equal(d.date, "2026-11-27");
  }
  const ok = (async () => Response.json(COBUN)) as unknown as typeof fetch;
  assert.equal((await generateDigest({ now: NOW, fetchImpl: ok })).items.length, 4);
});

test("istDateKey uses the IST calendar day", () => {
  assert.equal(istDateKey(Date.parse("2026-11-26T18:29:00Z")), "2026-11-26");
  assert.equal(istDateKey(Date.parse("2026-11-26T18:31:00Z")), "2026-11-27");
});

test("email shows descriptions and why-it-matters, escapes content, credits Cobun", () => {
  const d = parseCobunDigest(COBUN, "2026-11-27");
  const html = renderDigestEmail(d);
  assert.match(html, /Big model shipped with better scores/);
  assert.match(html, /Why it matters:<\/strong> It matters for reason 1\./);
  assert.match(html, /Models &amp; Releases/);
  assert.match(html, /cobunai\.com/);
  assert.doesNotMatch(html, /Trending on Hacker News/);
  assert.equal(digestSubject(d), "Your Daily AI News — 27 Nov");

  const evil = renderDigestEmail({
    version: DIGEST_VERSION,
    date: "2026-11-27",
    headline: "<b>x</b>",
    items: [{ title: "T <script>", url: 'https://a.example/?q="1"', source: "S", brief: "B & c", why: "", category: "C" }],
    source: "cobun",
  });
  assert.ok(evil.includes("&lt;b&gt;x&lt;/b&gt;"));
  assert.ok(evil.includes("https://a.example/?q=&quot;1&quot;"));
  assert.ok(!evil.includes("<script>"));
  assert.match(
    renderDigestEmail({ version: DIGEST_VERSION, date: "2026-11-27", headline: "", items: [], source: "cobun" }),
    /back tomorrow/,
  );
});

test("failures carry a clear reason and never any items", async () => {
  const cases: Array<[typeof fetch, RegExp]> = [
    [(async () => new Response("", { status: 503, statusText: "Service Unavailable" })) as unknown as typeof fetch, /HTTP 503 Service Unavailable/],
    [(async () => new Response("<html>", { status: 200, headers: { "content-type": "text/html" } })) as unknown as typeof fetch, /wasn't valid JSON \(content-type: text\/html\)/],
    [(async () => { throw new TypeError("getaddrinfo ENOTFOUND"); }) as unknown as typeof fetch, /Couldn't reach Cobun: getaddrinfo ENOTFOUND/],
    [(async () => { throw new DOMException("t", "TimeoutError"); }) as unknown as typeof fetch, /didn't respond within 15s/],
    [(async () => Response.json({ stories: [] })) as unknown as typeof fetch, /no `categories` list/],
    [(async () => Response.json({ categories: [{ label: "X", items: [{ headline: "renamed fields" }] }] })) as unknown as typeof fetch, /Only 0 usable stories \(need 3\) out of 1 items/],
  ];
  for (const [fetchImpl, reason] of cases) {
    const d = await generateDigest({ now: NOW, fetchImpl });
    assert.equal(d.items.length, 0);
    assert.match(d.error ?? "", reason);
  }
  const ok = await generateDigest({ now: NOW, fetchImpl: (async () => Response.json(COBUN)) as unknown as typeof fetch });
  assert.equal(ok.error, undefined);
});

test("failure alert explains the reason and where to fix it", () => {
  assert.equal(digestFailureSubject("2026-11-28"), "⚠️ Daily AI News failed — 28 Nov");
  const html = renderDigestFailureEmail({ date: "2026-11-28", error: "Cobun returned HTTP 503 <oops>.", attempts: 5, appUrl: "https://app.example" });
  assert.match(html, /Cobun returned HTTP 503 &lt;oops&gt;\./);
  assert.match(html, /5 \(every 15 minutes\)/);
  assert.match(html, /supabase\/functions\/_shared\/news\.ts/);
  assert.match(html, /data\.cobunai\.com\/digest\.json/);
  assert.match(html, /https:\/\/app\.example/);
});
