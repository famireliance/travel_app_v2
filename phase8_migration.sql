-- ========================================================
-- Phase 8: ネイティブ広告対応（テキスト・タイトル情報の追加）
-- ========================================================

ALTER TABLE public.ad_campaigns
ADD COLUMN IF NOT EXISTS title TEXT DEFAULT '',
ADD COLUMN IF NOT EXISTS subtitle TEXT DEFAULT '',
ADD COLUMN IF NOT EXISTS sponsor_name TEXT DEFAULT '';
