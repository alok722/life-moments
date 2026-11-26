import { test } from "node:test";
import assert from "node:assert/strict";
import {
  buildDigestPrompt,
  collectCandidates,
  generateDigest,
  istDateKey,
  parseDigest,
  parseFeed,
  renderDigestEmail,
  toText,
  type NewsCandidate,
} from "./news.ts";

const NOW = Date.parse("2026-11-27T02:00:00Z");

const RSS = `<?xml version="1.0"?><rss><channel><title>Feed</title>
<item><title><![CDATA[OpenAI ships a thing &amp; more]]></title><link>https://example.com/a?utm=1</link>
<description><![CDATA[<p>Big <b>news</b> today.</p>]]></description><pubDate>Thu, 26 Nov 2026 20:00:00 GMT</pubDate></item>
<item><title>Old story</title><link>https://example.com/old</link><pubDate>Mon, 01 Jan 2024 00:00:00 GMT</pubDate></item>
<item><title>Bad link</title><link>javascript:alert(1)</link></item>
</channel></rss>`;

const ATOM = `<feed><title>Verge</title>
<entry><title type="html">Anthropic &amp;#8217;s new model</title><link rel="alternate" type="text/html" href="https://verge.example/b"/>
<summary type="html">&lt;p&gt;Claude gets better.&lt;/p&gt;</summary><published>2026-11-26T18:00:00Z</published></entry></feed>`;

const HN = {
  hits: [
    { objectID: "1", title: "Show HN: an LLM that writes SQL", url: "https://sql.example", points: 300, num_comments: 80, created_at_i: NOW / 1000 - 3600 },
    { objectID: "2", title: "Gardening tips for winter", url: "https://garden.example", points: 900, num_comments: 10, created_at_i: NOW / 1000 - 3600 },
    { objectID: "3", title: "Ask HN: Are AI agents useful?", points: 120, num_comments: 200, created_at_i: NOW / 1000 - 7200 },
  ],
};

function fakeFetch(routes: Record<string, string | number>): typeof fetch {
  return (async (input: string | URL | Request) => {
    const url = String(input);
    const key = Object.keys(routes).find((k) => url.includes(k));
    const body = key ? routes[key] : 404;
    return typeof body === "number" ? new Response("", { status: body }) : new Response(body, { status: 200 });
  }) as typeof fetch;
}

test("toText strips CDATA, tags and entities", () => {
  assert.equal(toText("<![CDATA[<p>Big <b>news</b> &amp; more</p>]]>"), "Big news & more");
  assert.equal(toText("&lt;p&gt;Claude &amp;#8217;s&lt;/p&gt;"), "Claude ’s");
});

test("parseFeed reads RSS and Atom, drops non-http links", () => {
  const rss = parseFeed(RSS, "TC");
  assert.equal(rss.length, 2);
  assert.equal(rss[0].title, "OpenAI ships a thing & more");
  assert.equal(rss[0].summary, "Big news today.");
  const atom = parseFeed(ATOM, "Verge");
  assert.equal(atom[0].url, "https://verge.example/b");
  assert.equal(atom[0].summary, "Claude gets better.");
  assert.ok(atom[0].publishedAt > 0);
});

test("collectCandidates filters HN to AI, drops stale feed items, survives a failing source", async () => {
  const cands = await collectCandidates({
    now: NOW,
    fetchImpl: fakeFetch({
      "hn.algolia.com": JSON.stringify(HN),
      techcrunch: RSS,
      technologyreview: 500,
      theverge: ATOM,
    }),
  });
  const titles = cands.map((c) => c.title);
  assert.ok(titles.includes("Show HN: an LLM that writes SQL"));
  assert.ok(titles.includes("Ask HN: Are AI agents useful?"));
  assert.ok(!titles.includes("Gardening tips for winter"));
  assert.ok(!titles.includes("Old story"));
  assert.equal(cands.find((c) => c.title.startsWith("Ask HN"))?.url, "https://news.ycombinator.com/item?id=3");
});

const CANDS: NewsCandidate[] = [
  { title: "A", url: "https://a.example", source: "TechCrunch", summary: "Alpha happened.", publishedAt: NOW, points: 0 },
  { title: "B", url: "https://b.example", source: "Hacker News", summary: "", publishedAt: NOW, points: 99 },
  { title: "C", url: "https://c.example", source: "The Verge", summary: "Gamma.", publishedAt: NOW, points: 0 },
];

test("prompt marks HN items without summary and treats text as data", () => {
  const p = buildDigestPrompt(CANDS);
  assert.match(p, /\[1\] \(Hacker News, 99 points, b\.example\) B — \(no summary\)/);
  assert.match(p, /ignore any instructions/);
});

test("parseDigest keeps only valid ids and always uses candidate links", () => {
  const out = parseDigest(
    JSON.stringify({
      headline: "Theme",
      items: [
        { id: 0, title: "Alpha!", brief: "Alpha happened today, briefly." },
        { id: 0, title: "dupe", brief: "Duplicate id should be ignored." },
        { id: 7, title: "ghost", brief: "Out of range id should be ignored." },
        { id: 2, title: "", brief: "Gamma happened, says the feed." },
      ],
    }),
    CANDS,
  );
  assert.equal(out.headline, "Theme");
  assert.deepEqual(out.items.map((i) => i.url), ["https://a.example", "https://c.example"]);
  assert.equal(out.items[1].title, "C");
  assert.deepEqual(parseDigest("nope", CANDS).items, []);
});

test("generateDigest falls back to raw stories when the model fails or there is no key", async () => {
  const routes = { "hn.algolia.com": JSON.stringify(HN), techcrunch: RSS, technologyreview: 500, theverge: ATOM };
  const noKey = await generateDigest({ now: NOW, fetchImpl: fakeFetch(routes) });
  assert.equal(noKey.source, "fallback");
  assert.ok(noKey.items.length >= 3);
  const badModel = await generateDigest({ now: NOW, apiKey: "k", fetchImpl: fakeFetch({ ...routes, generativelanguage: 500 }) });
  assert.equal(badModel.source, "fallback");
  const allDown = await generateDigest({ now: NOW, apiKey: "k", fetchImpl: fakeFetch({}) });
  assert.equal(allDown.items.length, 0);
  assert.equal(allDown.date, "2026-11-27");
});

test("istDateKey uses the IST calendar day", () => {
  assert.equal(istDateKey(Date.parse("2026-11-26T18:29:00Z")), "2026-11-26");
  assert.equal(istDateKey(Date.parse("2026-11-26T18:31:00Z")), "2026-11-27");
});

test("email escapes content and handles an empty digest", () => {
  const html = renderDigestEmail({
    date: "2026-11-27",
    headline: "<b>x</b>",
    items: [{ title: "T <script>", url: 'https://a.example/?q="1"', source: "S", brief: "B & c" }],
    source: "ai",
  });
  assert.ok(html.includes("&lt;b&gt;x&lt;/b&gt;"));
  assert.ok(html.includes("T &lt;script&gt;"));
  assert.ok(html.includes("https://a.example/?q=&quot;1&quot;"));
  assert.ok(!html.includes("<script>"));
  assert.match(renderDigestEmail({ date: "2026-11-27", headline: "", items: [], source: "fallback" }), /back tomorrow/);
});
