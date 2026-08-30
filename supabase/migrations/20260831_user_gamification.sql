-- ============================================================
-- KIRATABI Gamification Data Migration
-- ============================================================

CREATE TABLE IF NOT EXISTS public.user_gamification (
  user_id               UUID          PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  total_xp              INTEGER       NOT NULL DEFAULT 0,
  collected_fairies     JSONB         NOT NULL DEFAULT '[]'::jsonb,
  collected_fairy_dates JSONB         NOT NULL DEFAULT '{}'::jsonb,
  companion_id          TEXT          DEFAULT 'default',
  companion_stage       INTEGER       NOT NULL DEFAULT 1,
  spots_visited         JSONB         NOT NULL DEFAULT '{}'::jsonb,
  created_at            TIMESTAMPTZ   NOT NULL DEFAULT now(),
  updated_at            TIMESTAMPTZ   NOT NULL DEFAULT now()
);

-- RLS (Row Level Security) 設定
ALTER TABLE public.user_gamification ENABLE ROW LEVEL SECURITY;

-- ユーザー自身のみが自分のデータを読み書きできるポリシー
CREATE POLICY "Users can view own gamification data"
  ON public.user_gamification
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own gamification data"
  ON public.user_gamification
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own gamification data"
  ON public.user_gamification
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- trigger for updated_at
CREATE OR REPLACE FUNCTION update_gamification_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_user_gamification_updated_at
    BEFORE UPDATE ON public.user_gamification
    FOR EACH ROW
    EXECUTE FUNCTION update_gamification_updated_at();
