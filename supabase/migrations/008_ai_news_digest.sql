-- "AI News" reminders: a daily digest of trending AI stories (sent 7:00 AM IST).

-- Allow the new event type (001 created the inline check with the default name).
ALTER TABLE public.reminders DROP CONSTRAINT IF EXISTS reminders_event_type_check;
ALTER TABLE public.reminders DROP CONSTRAINT IF EXISTS chk_event_type;
ALTER TABLE public.reminders ADD CONSTRAINT chk_event_type
  CHECK (event_type IN ('birthday', 'anniversary', 'bill', 'custom', 'ai_news'));

-- One digest per IST day, shared by every AI News reminder (Gemini runs once a day).
CREATE TABLE IF NOT EXISTS public.news_digests (
  digest_date DATE PRIMARY KEY,
  digest      JSONB NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Service role only (RLS on, no policies).
ALTER TABLE public.news_digests ENABLE ROW LEVEL SECURITY;
