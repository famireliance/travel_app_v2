-- Create certificates table if it doesn't exist at all (in case phase9 was missed)
CREATE TABLE IF NOT EXISTS public.certificates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    island_id TEXT NOT NULL,
    serial_number INT NOT NULL,
    payment_status TEXT DEFAULT 'pending',
    type text NOT NULL DEFAULT 'high_quality',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(island_id, serial_number)
);

-- Ensure created_at exists (if they had issued_at instead)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'certificates' AND column_name = 'issued_at') THEN
        ALTER TABLE certificates RENAME COLUMN issued_at TO created_at;
    END IF;
END $$;

-- Add type column to certificates table if it doesn't exist (for existing tables)
ALTER TABLE certificates ADD COLUMN IF NOT EXISTS type text NOT NULL DEFAULT 'high_quality';

-- Update existing certificates to high_quality
UPDATE certificates SET type = 'high_quality' WHERE type IS NULL;

-- Add tickets column to user_profiles
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS high_quality_tickets integer NOT NULL DEFAULT 0;

-- Create promo_codes table
CREATE TABLE IF NOT EXISTS app_promo_codes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text UNIQUE NOT NULL,
  reward_type text NOT NULL DEFAULT 'high_quality_ticket',
  reward_amount integer NOT NULL DEFAULT 1,
  valid_until timestamp with time zone,
  max_uses integer,
  current_uses integer DEFAULT 0,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create promo_code_redemptions to track who used what
CREATE TABLE IF NOT EXISTS promo_code_redemptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  promo_code_id uuid REFERENCES app_promo_codes(id) ON DELETE CASCADE,
  redeemed_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE(user_id, promo_code_id)
);

-- RLS setup for new tables (managed by service role mostly, but users can read their redemptions)
ALTER TABLE app_promo_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE promo_code_redemptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read promo codes" ON app_promo_codes FOR SELECT USING (true);
CREATE POLICY "Users can read own redemptions" ON promo_code_redemptions FOR SELECT USING (auth.uid() = user_id);
