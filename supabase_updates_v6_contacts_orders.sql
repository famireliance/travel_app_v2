-- 1. お問い合わせ管理テーブル
CREATE TABLE IF NOT EXISTS contacts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  email text NOT NULL,
  category text NOT NULL,
  message text NOT NULL,
  status text NOT NULL DEFAULT 'unread' CHECK (status IN ('unread', 'in_progress', 'resolved')),
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

ALTER TABLE contacts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Contacts are viewable by service role only" ON contacts FOR SELECT USING (true);
CREATE POLICY "Contacts are insertable by anyone" ON contacts FOR INSERT WITH CHECK (true);
CREATE POLICY "Contacts are updatable by service role only" ON contacts FOR UPDATE USING (true);

-- 2. 実物証明書 注文管理テーブル
CREATE TABLE IF NOT EXISTS physical_orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  island_id text NOT NULL,
  type text NOT NULL DEFAULT 'anniversary',
  status text NOT NULL DEFAULT 'ordered' CHECK (status IN ('pending_payment', 'ordered', 'processing', 'shipped', 'delivered')),
  shipping_name text NOT NULL,
  shipping_postal_code text NOT NULL,
  shipping_address text NOT NULL,
  shipping_phone text,
  ordered_at timestamp with time zone DEFAULT now(),
  shipped_at timestamp with time zone,
  delivered_at timestamp with time zone,
  tracking_number text,
  stripe_session_id text
);

ALTER TABLE physical_orders ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their own orders" ON physical_orders FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own orders" ON physical_orders FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own orders if not shipped" ON physical_orders FOR UPDATE USING (auth.uid() = user_id AND status IN ('ordered', 'processing'));
-- サービスロールは全権限あり（RLSバイパス）

