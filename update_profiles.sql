-- user_profiles テーブルにサブスクリプション関連のカラムを追加します
ALTER TABLE user_profiles
ADD COLUMN IF NOT EXISTS subscription_tier text DEFAULT 'free',
ADD COLUMN IF NOT EXISTS stripe_customer_id text,
ADD COLUMN IF NOT EXISTS stripe_subscription_id text,
ADD COLUMN IF NOT EXISTS premium_until timestamp with time zone;

-- （オプション）既存のユーザーを一括で 'free' に設定する場合
UPDATE user_profiles SET subscription_tier = 'free' WHERE subscription_tier IS NULL;
