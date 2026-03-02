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
  // Use IST timezone (UTC+5:30) for all date calculations
  const IST_OFFSET_MS = 5.5 * 60 * 60 * 1000;
  const nowUTC = new Date();
  const nowIST = new Date(nowUTC.getTime() + IST_OFFSET_MS);
  
  const year = nowIST.getFullYear();
  let eventDate = new Date(year, month - 1, day, 0, 0, 0);

  if (eventDate <= nowIST) {
    eventDate = new Date(year + 1, month - 1, day, 0, 0, 0);
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

  // Convert back to UTC for storage
  const reminderDateUTC = new Date(reminderDate.getTime() - IST_OFFSET_MS);
  return reminderDateUTC.toISOString();
}

export function getDaysInMonth(month: number): number {
  // Use a non-leap year as base; Feb gets 29 to allow for leap years
  const daysInMonth = [31, 29, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
  return daysInMonth[month - 1] ?? 31;
}
