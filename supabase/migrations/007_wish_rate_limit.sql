-- Per-user rate limit for the AI wish generator (/api/generate-wish).
-- Serverless instances don't share memory, so the limit lives in Postgres.

CREATE TABLE IF NOT EXISTS public.api_usage (
  id         BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  user_id    UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  kind       TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_api_usage_user_kind_time
  ON public.api_usage(user_id, kind, created_at DESC);

-- RLS on with no policies: only reachable through the function below.
ALTER TABLE public.api_usage ENABLE ROW LEVEL SECURITY;

-- Returns true and records a use if the caller is under both limits.
CREATE OR REPLACE FUNCTION public.consume_wish_quota()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  uid uuid := auth.uid();
  last_hour integer;
  last_day integer;
BEGIN
  IF uid IS NULL THEN
    RETURN false;
  END IF;

  PERFORM pg_advisory_xact_lock(hashtext('wish:' || uid::text));

  SELECT
    count(*) FILTER (WHERE created_at > now() - interval '1 hour'),
    count(*)
  INTO last_hour, last_day
  FROM public.api_usage
  WHERE user_id = uid AND kind = 'wish' AND created_at > now() - interval '1 day';

  IF last_hour >= 20 OR last_day >= 100 THEN
    RETURN false;
  END IF;

  INSERT INTO public.api_usage (user_id, kind) VALUES (uid, 'wish');

  -- Opportunistic cleanup of this user's old rows.
  DELETE FROM public.api_usage
  WHERE user_id = uid AND created_at < now() - interval '2 days';

  RETURN true;
END;
$$;

REVOKE ALL ON FUNCTION public.consume_wish_quota() FROM public, anon;
GRANT EXECUTE ON FUNCTION public.consume_wish_quota() TO authenticated;
