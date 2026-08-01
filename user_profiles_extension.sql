-- user_profilesテーブルの拡張（ニックネーム等を追加）
ALTER TABLE public.user_profiles
ADD COLUMN IF NOT EXISTS nickname TEXT,
ADD COLUMN IF NOT EXISTS avatar_url TEXT;

-- 既存のユーザーがニックネームを持っていない場合は、メールアドレスの@前を仮設定
UPDATE public.user_profiles
SET nickname = split_part(email, '@', 1)
WHERE nickname IS NULL AND email IS NOT NULL;
