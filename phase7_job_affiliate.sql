-- ========================================================
-- Phase 7: リゾートバイト・求人 アフィリエイト枠の追加
-- ========================================================

-- islandsテーブルにリゾートバイト・求人用のJSON保存カラムを追加
ALTER TABLE public.islands 
ADD COLUMN IF NOT EXISTS aff_job_url TEXT DEFAULT '[]';
