-- Migrate reminders table: event_date → event_month + event_day,
-- reminder_time → reminder_offset + next_reminder_at,
-- is_recurring removed (all entries are recurring),
-- recurrence_type updated to include daily/weekly

-- Add new columns
ALTER TABLE public.reminders ADD COLUMN event_month INTEGER;
ALTER TABLE public.reminders ADD COLUMN event_day INTEGER;
ALTER TABLE public.reminders ADD COLUMN reminder_offset TEXT DEFAULT 'same';
ALTER TABLE public.reminders ADD COLUMN next_reminder_at TIMESTAMPTZ;

-- Migrate existing data
UPDATE public.reminders SET
  event_month = EXTRACT(MONTH FROM event_date),
  event_day = EXTRACT(DAY FROM event_date),
  next_reminder_at = reminder_time;

-- Make new columns NOT NULL after populating
ALTER TABLE public.reminders ALTER COLUMN event_month SET NOT NULL;
ALTER TABLE public.reminders ALTER COLUMN event_day SET NOT NULL;
ALTER TABLE public.reminders ALTER COLUMN reminder_offset SET NOT NULL;
ALTER TABLE public.reminders ALTER COLUMN next_reminder_at SET NOT NULL;

-- Add constraints
ALTER TABLE public.reminders ADD CONSTRAINT chk_event_month
  CHECK (event_month >= 1 AND event_month <= 12);
ALTER TABLE public.reminders ADD CONSTRAINT chk_event_day
  CHECK (event_day >= 1 AND event_day <= 31);
ALTER TABLE public.reminders ADD CONSTRAINT chk_reminder_offset
  CHECK (reminder_offset IN ('1h', '4h', '1d', '2d', '1w', 'same'));

-- Drop old constraints and update recurrence_type constraint
ALTER TABLE public.reminders DROP CONSTRAINT IF EXISTS reminders_recurrence_type_check;
ALTER TABLE public.reminders ADD CONSTRAINT chk_recurrence_type
  CHECK (recurrence_type IN ('daily', 'weekly', 'monthly', 'yearly'));

-- Set default recurrence for existing rows that had none
UPDATE public.reminders SET recurrence_type = 'yearly' WHERE recurrence_type IS NULL;
ALTER TABLE public.reminders ALTER COLUMN recurrence_type SET NOT NULL;
ALTER TABLE public.reminders ALTER COLUMN recurrence_type SET DEFAULT 'yearly';

-- Drop old columns
ALTER TABLE public.reminders DROP COLUMN IF EXISTS event_date;
ALTER TABLE public.reminders DROP COLUMN IF EXISTS reminder_time;
ALTER TABLE public.reminders DROP COLUMN IF EXISTS is_recurring;

-- Update indexes
DROP INDEX IF EXISTS idx_reminders_reminder_time;
DROP INDEX IF EXISTS idx_reminders_pending;
CREATE INDEX idx_reminders_next_reminder ON public.reminders(next_reminder_at, email_sent)
  WHERE email_sent = false;
