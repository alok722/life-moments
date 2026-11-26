/**
 * Reminder scheduling — single source of truth.
 *
 * Imported by the Next.js app (via src/lib/schedule.ts) and by the
 * send-reminders edge function (Deno). Keep this file dependency-free.
 *
 * Model:
 * - Every event happens at 00:00 IST on its date.
 * - The reminder fires `offset` before that midnight.
 * - "Next" always means the first occurrence whose *reminder time* is
 *   strictly after `after`, so rescheduling right after a send can never
 *   return the same moment again.
 */

export type RecurrenceType = "once" | "daily" | "weekly" | "monthly" | "yearly";
export type ReminderOffset = "1h" | "4h" | "1d" | "2d" | "1w" | "same";

export const IST_OFFSET_MS = 5.5 * 60 * 60 * 1000;
const HOUR = 60 * 60 * 1000;
const DAY = 24 * HOUR;
const WEEK = 7 * DAY;

const OFFSET_MS: Record<ReminderOffset, number> = {
  "1h": HOUR,
  "4h": 4 * HOUR,
  "1d": DAY,
  "2d": 2 * DAY,
  "1w": WEEK,
  same: 0,
};

export function offsetToMs(offset: string): number {
  return OFFSET_MS[offset as ReminderOffset] ?? 0;
}

export function daysInMonth(year: number, month0: number): number {
  return new Date(Date.UTC(year, month0 + 1, 0)).getUTCDate();
}

/** UTC epoch ms of 00:00 IST on the given date; `day` is clamped to the month's length (31 → 30/28, Feb 29 → 28). */
function istMidnight(year: number, month0: number, day: number): number {
  const d = Math.min(day, daysInMonth(year, month0));
  return Date.UTC(year, month0, d) - IST_OFFSET_MS;
}

/** Rounds a UTC timestamp down to 00:00 IST of the IST day it falls in. */
function floorToIstMidnight(t: number): number {
  return Math.floor((t + IST_OFFSET_MS) / DAY) * DAY - IST_OFFSET_MS;
}

export interface ScheduleRule {
  /** 1–12 */
  month: number;
  /** 1–31 */
  day: number;
  offset: string;
  recurrence: string;
}

export interface ScheduleOptions {
  /** Find the first reminder strictly after this instant. Defaults to now. */
  after?: number;
  /**
   * The reminder time that was just used (ISO). Daily/weekly series continue
   * from it so a weekly reminder keeps its weekday across year boundaries.
   */
  previousReminderAt?: string | null;
}

/** Epoch ms of the next event midnight (00:00 IST) whose reminder time is > `after`. */
export function nextEventAt(rule: ScheduleRule, opts: ScheduleOptions = {}): number {
  const after = opts.after ?? Date.now();
  const off = offsetToMs(rule.offset);
  const firesAfter = (eventAt: number) => eventAt - off > after;

  const nowIst = new Date(after + IST_OFFSET_MS);
  const y = nowIst.getUTCFullYear();
  const m0 = nowIst.getUTCMonth();
  const today = istMidnight(y, m0, nowIst.getUTCDate());

  const prevEvent =
    opts.previousReminderAt != null && !Number.isNaN(Date.parse(opts.previousReminderAt))
      ? floorToIstMidnight(Date.parse(opts.previousReminderAt) + off)
      : null;

  /** Smallest base + k·step (k any integer) whose reminder fires after `after`. */
  const stepFrom = (base: number, step: number) => {
    const k = Math.floor((after + off - base) / step) + 1;
    let t = base + k * step;
    while (!firesAfter(t)) t += step; // guards float edge cases
    while (firesAfter(t - step)) t -= step;
    return t;
  };

  switch (rule.recurrence) {
    case "daily":
      return stepFrom(prevEvent ?? today, DAY);

    case "weekly": {
      // Weekly series fall on the weekday of the chosen date.
      const anchor = prevEvent ?? istMidnight(y, rule.month - 1, rule.day);
      return stepFrom(anchor, WEEK);
    }

    case "monthly": {
      for (let i = 0; i < 14; i++) {
        const mi = m0 + i;
        const t = istMidnight(y + Math.floor(mi / 12), mi % 12, rule.day);
        if (firesAfter(t)) return t;
      }
      break;
    }

    case "once":
    case "yearly":
    default: {
      for (let i = 0; i < 3; i++) {
        const t = istMidnight(y + i, rule.month - 1, rule.day);
        if (firesAfter(t)) return t;
      }
      break;
    }
  }
  throw new Error(`Could not schedule reminder: ${JSON.stringify(rule)}`);
}

/** ISO timestamp of the next time the reminder email should be sent. */
export function computeNextReminderAt(rule: ScheduleRule, opts: ScheduleOptions = {}): string {
  return new Date(nextEventAt(rule, opts) - offsetToMs(rule.offset)).toISOString();
}

/** Max selectable day for a month in the form (Feb allows 29; it is sent on the 28th in non-leap years). */
export function maxDayForMonth(month: number): number {
  return [31, 29, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31][month - 1] ?? 31;
}
