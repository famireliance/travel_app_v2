-- ヒーロー画像用カラムの追加スクリプト
ALTER TABLE public.islands ADD COLUMN IF NOT EXISTS hero_image_url TEXT;
