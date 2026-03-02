/**
 * Test script for reminder timezone logic.
 * Run with: node test-reminder-logic.mjs
 *
 * Core invariant: events happen at midnight IST (00:00 IST = 18:30 UTC previous day).
 * Offsets subtract from that midnight IST.
 */

const IST_OFFSET_MS = 5.5 * 60 * 60 * 1000;

function applyOffset(eventMidnightUTC, offset) {
  switch (offset) {
    case "1h": return eventMidnightUTC - 1 * 60 * 60 * 1000;
    case "4h": return eventMidnightUTC - 4 * 60 * 60 * 1000;
    case "1d": return eventMidnightUTC - 24 * 60 * 60 * 1000;
    case "2d": return eventMidnightUTC - 2 * 24 * 60 * 60 * 1000;
    case "1w": return eventMidnightUTC - 7 * 24 * 60 * 60 * 1000;
    case "same":
    default: return eventMidnightUTC;
  }
}

// Client-side: used when CREATING/EDITING a reminder
function computeNextReminderAtClient(month, day, offset, fakeNow) {
  const now = fakeNow ?? Date.now();
  const nowIST = new Date(now + IST_OFFSET_MS);
  const istYear = nowIST.getUTCFullYear();

  let eventMidnight = Date.UTC(istYear, month - 1, day) - IST_OFFSET_MS;

  if (applyOffset(eventMidnight, offset) <= now) {
    eventMidnight = Date.UTC(istYear + 1, month - 1, day) - IST_OFFSET_MS;
  }

  return new Date(applyOffset(eventMidnight, offset)).toISOString();
}

// Server-side: used AFTER sending, to schedule the NEXT occurrence
function computeNextReminderAtServer(month, day, offset, recurrenceType, fakeNow) {
  const now = fakeNow ?? Date.now();
  const nowIST = new Date(now + IST_OFFSET_MS);
  const istYear = nowIST.getUTCFullYear();
  const istMonth = nowIST.getUTCMonth();
  const istDate = nowIST.getUTCDate();

  let eventMidnight;

  switch (recurrenceType) {
    case "daily": {
      eventMidnight = Date.UTC(istYear, istMonth, istDate + 1) - IST_OFFSET_MS;
      while (applyOffset(eventMidnight, offset) <= now) {
        eventMidnight += 24 * 60 * 60 * 1000;
      }
      break;
    }
    case "weekly": {
      eventMidnight = Date.UTC(istYear, istMonth, istDate + 7) - IST_OFFSET_MS;
      while (applyOffset(eventMidnight, offset) <= now) {
        eventMidnight += 7 * 24 * 60 * 60 * 1000;
      }
      break;
    }
    case "monthly": {
      let m = istMonth + 1;
      let y = istYear;
      if (m > 11) { m = 0; y++; }
      eventMidnight = Date.UTC(y, m, day) - IST_OFFSET_MS;
      break;
    }
    case "yearly":
    default: {
      eventMidnight = Date.UTC(istYear + 1, month - 1, day) - IST_OFFSET_MS;
      break;
    }
  }

  return new Date(applyOffset(eventMidnight, offset)).toISOString();
}

// ── Helpers ──────────────────────────────────────────────
function utcISO(year, month, day, h = 0, m = 0) {
  return new Date(Date.UTC(year, month - 1, day, h, m, 0, 0)).toISOString();
}

function fakeNowUTC(year, month, day, h, m) {
  return Date.UTC(year, month - 1, day, h, m, 0, 0);
}

function toIST(iso) {
  const d = new Date(iso);
  const ist = new Date(d.getTime() + IST_OFFSET_MS);
  return `${ist.getUTCFullYear()}-${String(ist.getUTCMonth() + 1).padStart(2, "0")}-${String(ist.getUTCDate()).padStart(2, "0")} ${String(ist.getUTCHours()).padStart(2, "0")}:${String(ist.getUTCMinutes()).padStart(2, "0")} IST`;
}

let passed = 0;
let failed = 0;

function assert(name, actual, expected) {
  if (actual === expected) {
    console.log(`  ✅ ${name}`);
    passed++;
  } else {
    console.log(`  ❌ ${name}`);
    console.log(`     expected: ${expected}  (${toIST(expected)})`);
    console.log(`     actual:   ${actual}  (${toIST(actual)})`);
    failed++;
  }
}

// ── Tests ────────────────────────────────────────────────

console.log("\n═══ CLIENT-SIDE (creating reminder) ═══\n");

console.log("── Same day offset, event March 5 ──");
{
  const now = fakeNowUTC(2026, 3, 1, 10, 0);
  const result = computeNextReminderAtClient(3, 5, "same", now);
  assert("same day → fires at midnight IST", result, utcISO(2026, 3, 4, 18, 30));
}

console.log("\n── 4h offset, event March 5 ──");
{
  const now = fakeNowUTC(2026, 3, 1, 10, 0);
  const result = computeNextReminderAtClient(3, 5, "4h", now);
  assert("4h before → fires at 8 PM IST", result, utcISO(2026, 3, 4, 14, 30));
}

console.log("\n── 1h offset, event March 5 ──");
{
  const now = fakeNowUTC(2026, 3, 1, 10, 0);
  const result = computeNextReminderAtClient(3, 5, "1h", now);
  assert("1h before → fires at 11 PM IST", result, utcISO(2026, 3, 4, 17, 30));
}

console.log("\n── 1d offset, event March 5 ──");
{
  const now = fakeNowUTC(2026, 3, 1, 10, 0);
  const result = computeNextReminderAtClient(3, 5, "1d", now);
  assert("1 day before → fires at midnight IST prev day", result, utcISO(2026, 3, 3, 18, 30));
}

console.log("\n── 1w offset, event March 5 ──");
{
  const now = fakeNowUTC(2026, 3, 1, 10, 0);
  const result = computeNextReminderAtClient(3, 5, "1w", now);
  assert("1 week before → bumps to next year", result, utcISO(2027, 2, 25, 18, 30));
}

console.log("\n── 1w offset, event far enough in the future ──");
{
  const now = fakeNowUTC(2026, 3, 1, 10, 0);
  const result = computeNextReminderAtClient(3, 15, "1w", now);
  assert("1 week before → fires 7 days prior", result, utcISO(2026, 3, 7, 18, 30));
}

console.log("\n── Event already passed this year → bumps to next year ──");
{
  const now = fakeNowUTC(2026, 3, 6, 10, 0);
  const result = computeNextReminderAtClient(3, 5, "same", now);
  assert("past event → next year", result, utcISO(2027, 3, 4, 18, 30));
}

console.log("\n── 1w offset, event already passed including offset ──");
{
  const now = fakeNowUTC(2026, 3, 1, 10, 0);
  const result = computeNextReminderAtClient(3, 3, "1w", now);
  assert("1w offset past → next year", result, utcISO(2027, 2, 23, 18, 30));
}

console.log("\n── Event today, same day offset, not yet midnight IST ──");
{
  const now = fakeNowUTC(2026, 3, 4, 15, 0);
  const result = computeNextReminderAtClient(3, 5, "same", now);
  assert("event upcoming today → fires tonight", result, utcISO(2026, 3, 4, 18, 30));
}


console.log("\n═══ SERVER-SIDE (after sending, compute next occurrence) ═══\n");

console.log("── Yearly, same day, just sent at midnight IST ──");
{
  const now = fakeNowUTC(2026, 3, 4, 18, 35);
  const result = computeNextReminderAtServer(3, 5, "same", "yearly", now);
  assert("yearly same → next year midnight IST", result, utcISO(2027, 3, 4, 18, 30));
}

console.log("\n── Yearly, 4h offset, sent at 8 PM IST ──");
{
  const now = fakeNowUTC(2026, 3, 4, 14, 35);
  const result = computeNextReminderAtServer(3, 5, "4h", "yearly", now);
  assert("yearly 4h → next year 8 PM IST", result, utcISO(2027, 3, 4, 14, 30));
}

console.log("\n── Daily, same day, sent at midnight IST ──");
{
  const now = fakeNowUTC(2026, 3, 4, 18, 35);
  const result = computeNextReminderAtServer(3, 5, "same", "daily", now);
  assert("daily same → tomorrow midnight IST", result, utcISO(2026, 3, 5, 18, 30));
}

console.log("\n── Daily, 1h offset, sent at 11 PM IST ──");
{
  const now = fakeNowUTC(2026, 3, 4, 17, 35);
  const result = computeNextReminderAtServer(3, 5, "1h", "daily", now);
  assert("daily 1h → next day 11 PM IST", result, utcISO(2026, 3, 5, 17, 30));
}

console.log("\n── Daily, 4h offset, sent at 8 PM IST ──");
{
  const now = fakeNowUTC(2026, 3, 4, 14, 35);
  const result = computeNextReminderAtServer(3, 5, "4h", "daily", now);
  assert("daily 4h → next day 8 PM IST", result, utcISO(2026, 3, 5, 14, 30));
}

console.log("\n── Weekly, same day ──");
{
  const now = fakeNowUTC(2026, 3, 4, 18, 35);
  const result = computeNextReminderAtServer(3, 5, "same", "weekly", now);
  assert("weekly same → next week midnight IST", result, utcISO(2026, 3, 11, 18, 30));
}

console.log("\n── Weekly, 1h offset ──");
{
  const now = fakeNowUTC(2026, 3, 4, 17, 35);
  const result = computeNextReminderAtServer(3, 5, "1h", "weekly", now);
  assert("weekly 1h → next week 11 PM IST", result, utcISO(2026, 3, 10, 17, 30));
}

console.log("\n── Monthly, same day, event on day 5 ──");
{
  const now = fakeNowUTC(2026, 3, 4, 18, 35);
  const result = computeNextReminderAtServer(3, 5, "same", "monthly", now);
  assert("monthly same → next month midnight IST", result, utcISO(2026, 4, 4, 18, 30));
}

console.log("\n── Monthly, 4h offset, December → January ──");
{
  const now = fakeNowUTC(2026, 12, 4, 14, 35);
  const result = computeNextReminderAtServer(12, 5, "4h", "monthly", now);
  assert("monthly 4h Dec→Jan → correct year rollover", result, utcISO(2027, 1, 4, 14, 30));
}


console.log("\n═══ EDGE CASES ═══\n");

console.log("── 2d offset ──");
{
  const now = fakeNowUTC(2026, 3, 1, 10, 0);
  const result = computeNextReminderAtClient(3, 5, "2d", now);
  assert("2d offset → 2 days before midnight IST", result, utcISO(2026, 3, 2, 18, 30));
}

console.log("\n── Event on Jan 1, created in December ──");
{
  const now = fakeNowUTC(2026, 12, 20, 10, 0);
  const result = computeNextReminderAtClient(1, 1, "same", now);
  assert("Jan 1 event in Dec → Dec 31 18:30 UTC", result, utcISO(2026, 12, 31, 18, 30));
}

console.log("\n── Event on Feb 29 (leap year handling) ──");
{
  const now = fakeNowUTC(2027, 1, 10, 10, 0);
  const result = computeNextReminderAtClient(2, 29, "same", now);
  assert("Feb 29 non-leap → rolls to Mar 1 midnight IST", result, utcISO(2027, 2, 28, 18, 30));
}


console.log("\n═══ DUPLICATE PREVENTION ═══\n");

console.log("── After sending yearly reminder, next_reminder_at must be > 1 year away ──");
{
  const now = fakeNowUTC(2026, 3, 4, 18, 35);
  const result = computeNextReminderAtServer(3, 5, "same", "yearly", now);
  const reminderTime = new Date(result).getTime();
  const daysAway = (reminderTime - now) / (1000 * 60 * 60 * 24);
  assert("yearly: next reminder > 360 days away", daysAway > 360, true);
}

console.log("\n── After sending daily reminder, next is ~24h away ──");
{
  const now = fakeNowUTC(2026, 3, 4, 18, 35);
  const result = computeNextReminderAtServer(3, 5, "same", "daily", now);
  const reminderTime = new Date(result).getTime();
  const hoursAway = (reminderTime - now) / (1000 * 60 * 60);
  assert("daily: next reminder ~24h away", hoursAway > 23 && hoursAway < 25, true);
}

console.log("\n── After sending daily 1h-offset reminder, next is ~24h away ──");
{
  const now = fakeNowUTC(2026, 3, 4, 17, 35);
  const result = computeNextReminderAtServer(3, 5, "1h", "daily", now);
  const reminderTime = new Date(result).getTime();
  const hoursAway = (reminderTime - now) / (1000 * 60 * 60);
  assert("daily 1h: next reminder ~24h away", hoursAway > 23 && hoursAway < 25, true);
}


// ── Summary ──────────────────────────────────────────────
console.log(`\n${"═".repeat(40)}`);
console.log(`Results: ${passed} passed, ${failed} failed`);
console.log(`${"═".repeat(40)}\n`);

process.exit(failed > 0 ? 1 : 0);
