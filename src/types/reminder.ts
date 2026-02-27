export type EventType = "birthday" | "anniversary" | "bill" | "custom";
export type RecurrenceType = "daily" | "weekly" | "monthly" | "yearly";
export type ReminderOffset = "1h" | "4h" | "1d" | "2d" | "1w" | "same";

export interface Reminder {
  id: string;
  user_id: string;
  title: string;
  event_type: EventType;
  relation: string | null;
  event_month: number;
  event_day: number;
  reminder_offset: ReminderOffset;
  recurrence_type: RecurrenceType;
  notes: string | null;
  email_sent: boolean;
  next_reminder_at: string;
  created_at: string;
  updated_at: string;
}

export type ReminderInsert = Omit<
  Reminder,
  "id" | "created_at" | "updated_at" | "email_sent" | "next_reminder_at"
>;

export type ReminderUpdate = Partial<
  Omit<Reminder, "id" | "user_id" | "created_at" | "updated_at">
>;

export interface NotificationRecipient {
  id: string;
  user_id: string;
  email: string;
  created_at: string;
}
