import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
});

export type LoginFormData = z.infer<typeof loginSchema>;

export const reminderSchema = z.object({
  title: z.string().min(1, "Title is required").max(100, "Title too long"),
  event_type: z.enum(["birthday", "anniversary", "bill", "custom"], {
    message: "Select an event type",
  }),
  relation: z.string().max(100).optional().nullable(),
  event_date: z.string().min(1, "Event date is required"),
  reminder_time: z.string().min(1, "Reminder time is required"),
    is_recurring: z.boolean(),
  recurrence_type: z
    .enum(["yearly", "monthly", "custom"])
    .optional()
    .nullable(),
  notes: z.string().max(500).optional().nullable(),
});

export type ReminderFormData = z.infer<typeof reminderSchema>;

export const generateWishSchema = z.object({
  event_type: z.enum(["birthday", "anniversary", "bill", "custom"]),
  relation: z.string().optional(),
  title: z.string(),
});

export type GenerateWishInput = z.infer<typeof generateWishSchema>;
