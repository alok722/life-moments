-- Add 'once' recurrence type and completed_at tracking column

-- Update recurrence_type constraint to include 'once'
ALTER TABLE public.reminders DROP CONSTRAINT chk_recurrence_type;
ALTER TABLE public.reminders ADD CONSTRAINT chk_recurrence_type
  CHECK (recurrence_type IN ('daily', 'weekly', 'monthly', 'yearly', 'once'));

-- Track when a one-time reminder has been fulfilled
ALTER TABLE public.reminders ADD COLUMN completed_at TIMESTAMPTZ DEFAULT NULL;

-- Rebuild index to exclude completed reminders from the pending query
DROP INDEX IF EXISTS idx_reminders_next_reminder;
CREATE INDEX idx_reminders_next_reminder ON public.reminders(next_reminder_at, email_sent)
  WHERE email_sent = false AND completed_at IS NULL;
