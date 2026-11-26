-- Harden reminder sending against abuse and stuck/duplicate sends.
--
-- 1. Recipients: max 5 per user, valid lowercase emails — enforced in the DB,
--    not only in the UI.
-- 2. Reminders: field length limits; clients cannot schedule in the past or
--    touch the sender's bookkeeping columns.
-- 3. Sending bookkeeping: claim lease (claimed_at), retry counter, last error,
--    and an email_sends log used for a per-user daily send cap.

-- ── 1. Notification recipients ──────────────────────────────────────────────

-- Normalise existing rows; drop duplicates that only differed by case.
DELETE FROM public.notification_recipients a
USING public.notification_recipients b
WHERE a.user_id = b.user_id
  AND lower(a.email) = lower(b.email)
  AND (a.created_at, a.id) > (b.created_at, b.id);
UPDATE public.notification_recipients SET email = lower(trim(email));

ALTER TABLE public.notification_recipients
  ADD CONSTRAINT chk_recipient_email
  CHECK (
    char_length(email) <= 254
    AND email = lower(email)
    AND email ~ '^[^@\s]+@[^@\s]+\.[^@\s]+$'
  ) NOT VALID;

CREATE OR REPLACE FUNCTION public.enforce_recipient_rules()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  recipient_count integer;
BEGIN
  NEW.email := lower(trim(NEW.email));

  -- Serialise inserts per user so concurrent requests cannot exceed the cap.
  PERFORM pg_advisory_xact_lock(hashtext('recipients:' || NEW.user_id::text));

  SELECT count(*) INTO recipient_count
  FROM public.notification_recipients
  WHERE user_id = NEW.user_id;

  IF recipient_count >= 5 THEN
    RAISE EXCEPTION 'You can add at most 5 notification recipients'
      USING ERRCODE = 'check_violation';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_enforce_recipient_rules ON public.notification_recipients;
CREATE TRIGGER trg_enforce_recipient_rules
  BEFORE INSERT ON public.notification_recipients
  FOR EACH ROW EXECUTE FUNCTION public.enforce_recipient_rules();

-- ── 2. Reminders ────────────────────────────────────────────────────────────

ALTER TABLE public.reminders
  ADD COLUMN IF NOT EXISTS claimed_at   TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS attempts     INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS last_error   TEXT,
  ADD COLUMN IF NOT EXISTS last_sent_at TIMESTAMPTZ;

ALTER TABLE public.reminders
  ADD CONSTRAINT chk_reminder_lengths
  CHECK (
    char_length(title) BETWEEN 1 AND 100
    AND (relation IS NULL OR char_length(relation) <= 50)
    AND (notes IS NULL OR char_length(notes) <= 500)
  ) NOT VALID;

-- Guard writes made by signed-in users through the public API.
-- The edge function uses the service role and is not affected.
CREATE OR REPLACE FUNCTION public.guard_reminder_client_writes()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  reminder_count integer;
BEGIN
  IF coalesce(auth.role(), '') <> 'authenticated' THEN
    RETURN NEW;
  END IF;

  -- No scheduling in the past (small allowance for clock skew).
  IF (TG_OP = 'INSERT' OR NEW.next_reminder_at IS DISTINCT FROM OLD.next_reminder_at)
     AND NEW.next_reminder_at < now() - interval '5 minutes' THEN
    RAISE EXCEPTION 'next_reminder_at must be in the future'
      USING ERRCODE = 'check_violation';
  END IF;

  IF TG_OP = 'INSERT' THEN
    SELECT count(*) INTO reminder_count
    FROM public.reminders WHERE user_id = NEW.user_id;
    IF reminder_count >= 500 THEN
      RAISE EXCEPTION 'Reminder limit reached'
        USING ERRCODE = 'check_violation';
    END IF;
    NEW.email_sent   := false;
    NEW.completed_at := NULL;
  ELSE
    -- Sender bookkeeping is server-owned.
    NEW.last_sent_at := OLD.last_sent_at;
    NEW.completed_at := OLD.completed_at;
  END IF;

  -- Any client save starts a fresh, unclaimed schedule.
  NEW.claimed_at := NULL;
  NEW.attempts   := 0;
  NEW.last_error := NULL;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_guard_reminder_client_writes ON public.reminders;
CREATE TRIGGER trg_guard_reminder_client_writes
  BEFORE INSERT OR UPDATE ON public.reminders
  FOR EACH ROW EXECUTE FUNCTION public.guard_reminder_client_writes();

-- ── 3. Send log (service role only — RLS on, no policies) ───────────────────

CREATE TABLE IF NOT EXISTS public.email_sends (
  id          BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  user_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  reminder_id UUID REFERENCES public.reminders(id) ON DELETE SET NULL,
  recipients  INTEGER NOT NULL,
  sent_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_email_sends_user_sent_at
  ON public.email_sends(user_id, sent_at DESC);

ALTER TABLE public.email_sends ENABLE ROW LEVEL SECURITY;
