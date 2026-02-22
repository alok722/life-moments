import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Compute the next occurrence of a month/day event, then subtract the
 * reminder offset to get the timestamp we should fire the reminder at.
 */
export function computeNextReminderAt(
  month: number,
  day: number,
  offset: string
): string {
  const now = new Date();
  const year = now.getFullYear();

  let eventDate = new Date(year, month - 1, day, 9, 0, 0);

  // If the event date already passed this year, use next year
  if (eventDate <= now) {
    eventDate = new Date(year + 1, month - 1, day, 9, 0, 0);
  }

  const reminderDate = new Date(eventDate);

  switch (offset) {
    case "1h":
      reminderDate.setHours(reminderDate.getHours() - 1);
      break;
    case "4h":
      reminderDate.setHours(reminderDate.getHours() - 4);
      break;
    case "1d":
      reminderDate.setDate(reminderDate.getDate() - 1);
      break;
    case "2d":
      reminderDate.setDate(reminderDate.getDate() - 2);
      break;
    case "1w":
      reminderDate.setDate(reminderDate.getDate() - 7);
      break;
    case "same":
      break;
  }

  return reminderDate.toISOString();
}

export function getDaysInMonth(month: number): number {
  // Use a non-leap year as base; Feb gets 29 to allow for leap years
  const daysInMonth = [31, 29, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
  return daysInMonth[month - 1] ?? 31;
}
