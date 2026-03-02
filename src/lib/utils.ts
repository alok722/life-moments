import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

const IST_OFFSET_MS = 5.5 * 60 * 60 * 1000;

function applyOffset(eventMidnightUTC: number, offset: string): number {
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

export function computeNextReminderAt(
  month: number,
  day: number,
  offset: string
): string {
  const now = Date.now();
  const nowIST = new Date(now + IST_OFFSET_MS);
  const istYear = nowIST.getUTCFullYear();

  let eventMidnight = Date.UTC(istYear, month - 1, day) - IST_OFFSET_MS;

  if (applyOffset(eventMidnight, offset) <= now) {
    eventMidnight = Date.UTC(istYear + 1, month - 1, day) - IST_OFFSET_MS;
  }

  return new Date(applyOffset(eventMidnight, offset)).toISOString();
}

export function getDaysInMonth(month: number): number {
  // Use a non-leap year as base; Feb gets 29 to allow for leap years
  const daysInMonth = [31, 29, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
  return daysInMonth[month - 1] ?? 31;
}
