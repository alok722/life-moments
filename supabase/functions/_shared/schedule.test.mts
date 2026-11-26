// Run: npm test   (Node's built-in test runner; Node ≥22.18 strips TS types natively)
import { test } from "node:test";
import assert from "node:assert/strict";
import { computeNextReminderAt, type ScheduleRule } from "./schedule.ts";

/** UTC instant for a wall-clock time in IST. */
const ist = (y: number, mo: number, d: number, h = 0, mi = 0) =>
  Date.UTC(y, mo - 1, d, h, mi) - 5.5 * 60 * 60 * 1000;
const iso = (t: number) => new Date(t).toISOString();

const next = (rule: Partial<ScheduleRule>, after: number, previousReminderAt?: string) =>
  computeNextReminderAt(
    { month: 1, day: 1, offset: "same", recurrence: "yearly", ...rule },
    { after, previousReminderAt },
  );

test("yearly: same-day offset fires at 00:00 IST", () => {
  assert.equal(next({ month: 3, day: 5 }, ist(2026, 3, 1)), iso(ist(2026, 3, 5)));
});

test("yearly: offsets subtract from IST midnight", () => {
  const now = ist(2026, 3, 1);
  assert.equal(next({ month: 3, day: 5, offset: "4h" }, now), iso(ist(2026, 3, 4, 20)));
  assert.equal(next({ month: 3, day: 5, offset: "1h" }, now), iso(ist(2026, 3, 4, 23)));
  assert.equal(next({ month: 3, day: 5, offset: "1d" }, now), iso(ist(2026, 3, 4)));
  assert.equal(next({ month: 3, day: 15, offset: "1w" }, now), iso(ist(2026, 3, 8)));
});

test("yearly: reminder time already passed → next year", () => {
  assert.equal(next({ month: 3, day: 5, offset: "1w" }, ist(2026, 3, 1)), iso(ist(2027, 2, 26)));
  assert.equal(next({ month: 3, day: 5 }, ist(2026, 6, 1)), iso(ist(2027, 3, 5)));
});

test("BUG FIX: reschedule after a send that crossed into the previous year advances", () => {
  // Jan 3 event, 1w offset → fires Dec 27. Rescheduling right after that send
  // used to return Dec 27 again (re-sending every 15 min).
  const sentAt = ist(2026, 12, 27);
  const r = next({ month: 1, day: 3, offset: "1w" }, sentAt + 60_000, iso(sentAt));
  assert.equal(r, iso(ist(2027, 12, 27)));
});

test("BUG FIX: monthly on the 1st with 1d offset advances one month", () => {
  const sentAt = ist(2026, 4, 30); // for May 1
  const r = next({ day: 1, offset: "1d", recurrence: "monthly" }, sentAt + 60_000, iso(sentAt));
  assert.equal(r, iso(ist(2026, 5, 31))); // for June 1
});

test("BUG FIX: monthly day 31 clamps to short months instead of overflowing", () => {
  assert.equal(next({ day: 31, recurrence: "monthly" }, ist(2026, 4, 2)), iso(ist(2026, 4, 30)));
  assert.equal(next({ day: 31, recurrence: "monthly" }, ist(2026, 2, 2)), iso(ist(2026, 2, 28)));
  assert.equal(next({ day: 31, recurrence: "monthly" }, ist(2026, 5, 2)), iso(ist(2026, 5, 31)));
});

test("BUG FIX: Feb 29 yearly fires Feb 28 in non-leap years, Feb 29 in leap years", () => {
  assert.equal(next({ month: 2, day: 29 }, ist(2026, 1, 1)), iso(ist(2026, 2, 28)));
  assert.equal(next({ month: 2, day: 29 }, ist(2027, 3, 1)), iso(ist(2028, 2, 29)));
});

test("BUG FIX: new daily reminder starts tomorrow, not on the yearly date", () => {
  const now = ist(2026, 11, 27, 10);
  assert.equal(next({ month: 8, day: 15, recurrence: "daily" }, now), iso(ist(2026, 11, 28)));
  assert.equal(next({ month: 8, day: 15, recurrence: "daily", offset: "4h" }, now), iso(ist(2026, 11, 27, 20)));
});

test("BUG FIX: new weekly reminder follows the date's weekday, within 7 days", () => {
  // 2026-12-20 is a Sunday; from Fri Nov 27 the next Sunday is Nov 29.
  const r = next({ month: 12, day: 20, recurrence: "weekly" }, ist(2026, 11, 27, 10));
  assert.equal(r, iso(ist(2026, 11, 29)));
});

test("weekly keeps its weekday across the year boundary when continuing a series", () => {
  const sentAt = ist(2026, 12, 27); // Sunday
  const r = next({ month: 12, day: 20, recurrence: "weekly" }, sentAt + 60_000, iso(sentAt));
  assert.equal(r, iso(ist(2027, 1, 3))); // following Sunday
});

test("BUG FIX: new monthly reminder fires this/next month, not on the yearly date", () => {
  assert.equal(next({ month: 9, day: 10, recurrence: "monthly" }, ist(2026, 11, 27)), iso(ist(2026, 12, 10)));
});

test("once behaves like the next yearly occurrence", () => {
  assert.equal(next({ month: 12, day: 25, recurrence: "once" }, ist(2026, 11, 27)), iso(ist(2026, 12, 25)));
});

test("always strictly in the future for every rule", () => {
  const recurrences = ["once", "daily", "weekly", "monthly", "yearly"];
  const offsets = ["1h", "4h", "1d", "2d", "1w", "same"];
  for (let i = 0; i < 400; i++) {
    const after = ist(2026, 1, 1) + i * 23 * 60 * 60 * 1000 + i * 7919;
    for (const recurrence of recurrences)
      for (const offset of offsets) {
        const rule = { month: (i % 12) + 1, day: (i % 31) + 1, offset, recurrence };
        const t = Date.parse(next(rule, after));
        assert.ok(t > after, `${JSON.stringify(rule)} after ${iso(after)}`);
        // and continuing from it advances again
        assert.ok(Date.parse(next(rule, t + 1, iso(t))) > t);
      }
  }
});
