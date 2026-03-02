import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function computeNextReminderAt(
  month: number,
  day: number,
  offset: string
): string {
  const now = new Date();
  const year = now.getUTCFullYear();

  // Set reminder at 18:30 UTC (midnight IST next day)
  let eventDate = new Date(Date.UTC(year, month - 1, day, 18, 30, 0, 0));

  if (eventDate <= now) {
    eventDate = new Date(Date.UTC(year + 1, month - 1, day, 18, 30, 0, 0));
  }

  const reminderDate = new Date(eventDate);

  switch (offset) {
    case "1h":
      reminderDate.setUTCHours(reminderDate.getUTCHours() - 1);
      break;
    case "4h":
      reminderDate.setUTCHours(reminderDate.getUTCHours() - 4);
      break;
    case "1d":
      reminderDate.setUTCDate(reminderDate.getUTCDate() - 1);
      break;
    case "2d":
      reminderDate.setUTCDate(reminderDate.getUTCDate() - 2);
      break;
    case "1w":
      reminderDate.setUTCDate(reminderDate.getUTCDate() - 7);
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
