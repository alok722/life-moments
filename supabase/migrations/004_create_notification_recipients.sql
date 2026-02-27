-- Account-level notification recipients
-- Users can add extra email addresses that receive ALL their reminder notifications

CREATE TABLE public.notification_recipients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, email)
);

CREATE INDEX idx_notification_recipients_user_id
  ON public.notification_recipients(user_id);

-- Row Level Security
ALTER TABLE public.notification_recipients ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own recipients"
  ON public.notification_recipients FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can add own recipients"
  ON public.notification_recipients FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own recipients"
  ON public.notification_recipients FOR DELETE
  USING (auth.uid() = user_id);
