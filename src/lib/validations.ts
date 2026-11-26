import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
});

export type LoginFormData = z.infer<typeof loginSchema>;

export const reminderSchema = z.object({
  title: z.string().min(1, "Title is required").max(100, "Title too long"),
  event_type: z.enum(["birthday", "anniversary", "bill", "custom", "ai_news"], {
    message: "Select an event type",
  }),
  relation: z.string().max(50).optional().nullable(),
  event_month: z.number().min(1).max(12, "Select a month"),
  event_day: z.number().min(1).max(31, "Select a day"),
  reminder_offset: z.enum(["1h", "4h", "1d", "2d", "1w", "same"], {
    message: "Select when to remind",
  }),
  recurrence_type: z.enum(["once", "daily", "weekly", "monthly", "yearly"], {
    message: "Select recurrence",
  }),
  notes: z.string().max(500).optional().nullable(),
});

export type ReminderFormData = z.infer<typeof reminderSchema>;

export const generateWishSchema = z.object({
  // Message ideas are only offered for personal occasions.
  event_type: z.enum(["birthday", "anniversary"]),
  relation: z.string().trim().max(50).optional(),
  title: z.string().trim().max(100).optional(),
  notes: z.string().trim().max(500).optional(),
});

export type GenerateWishInput = z.infer<typeof generateWishSchema>;

export const recipientEmailSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
});
