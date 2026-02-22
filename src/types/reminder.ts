export type EventType = "birthday" | "anniversary" | "bill" | "custom";
export type RecurrenceType = "yearly" | "monthly" | "custom";

export interface Reminder {
  id: string;
  user_id: string;
  title: string;
  event_type: EventType;
  relation: string | null;
  event_date: string;
  reminder_time: string;
  is_recurring: boolean;
  recurrence_type: RecurrenceType | null;
  notes: string | null;
  email_sent: boolean;
  created_at: string;
  updated_at: string;
}

export type ReminderInsert = Omit<
  Reminder,
  "id" | "created_at" | "updated_at" | "email_sent"
>;

export type ReminderUpdate = Partial<
  Omit<Reminder, "id" | "user_id" | "created_at" | "updated_at">
>;
