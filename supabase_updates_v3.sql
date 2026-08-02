-- 1. 自己紹介文（bio）カラムの追加
ALTER TABLE public.user_profiles
ADD COLUMN IF NOT EXISTS bio TEXT DEFAULT '';

-- 2. トラベラーネーム（nickname）の重複チェック用 UNIQUE 制約の追加
-- すでに重複しているデータがある場合は、事前に末尾にIDを付けるなどして重複を解消する必要があります。
-- 重複データを解消するスクリプト（安全のためコメントアウトしています。必要に応じて実行してください）
/*
WITH duplicates AS (
  SELECT id, nickname, ROW_NUMBER() OVER(PARTITION BY nickname ORDER BY created_at) as rn
  FROM public.user_profiles
  WHERE nickname IS NOT NULL
)
UPDATE public.user_profiles up
SET nickname = up.nickname || '_' || substr(up.id::text, 1, 4)
FROM duplicates d
WHERE up.id = d.id AND d.rn > 1;
*/

-- nicknameにUNIQUE制約を追加
ALTER TABLE public.user_profiles
DROP CONSTRAINT IF EXISTS user_profiles_nickname_key;

ALTER TABLE public.user_profiles
ADD CONSTRAINT user_profiles_nickname_key UNIQUE (nickname);
