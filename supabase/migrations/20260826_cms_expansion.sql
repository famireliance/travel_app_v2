-- ============================================================
-- KIRATABI CMS 拡張マイグレーション
-- 公的証明書管理 / B2Bパートナー / 販売加盟店 / お問い合わせ拡張
-- ============================================================

-- 1. islands テーブルへの公的証明書関連カラムの追加
ALTER TABLE public.islands
  ADD COLUMN IF NOT EXISTS official_cert_enabled     BOOLEAN      NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS official_org_name         TEXT,
  ADD COLUMN IF NOT EXISTS official_seal_url         TEXT,
  ADD COLUMN IF NOT EXISTS official_cert_price       INTEGER      NOT NULL DEFAULT 500,
  ADD COLUMN IF NOT EXISTS official_sales_start_at   TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS official_sales_end_at     TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS official_template_id      TEXT         DEFAULT 'standard_seal';

-- 2. b2b_partners テーブルの新規作成（宿・交通機関スポンサー）
CREATE TABLE IF NOT EXISTS public.b2b_partners (
  id                    UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  name                  TEXT          NOT NULL,
  type                  TEXT          NOT NULL CHECK (type IN ('transport', 'lodging')),
  category_detail       TEXT,
  island_id             TEXT          NOT NULL,
  logo_url              TEXT,
  banner_photo_url      TEXT,
  official_website_url  TEXT,
  perk_text             TEXT,
  sponsor_tier          TEXT          NOT NULL DEFAULT 'STANDARD' CHECK (sponsor_tier IN ('GOLD', 'SILVER', 'STANDARD')),
  contract_start        TIMESTAMPTZ   NOT NULL DEFAULT now(),
  contract_end          TIMESTAMPTZ   NOT NULL DEFAULT (now() + interval '1 year'),
  notification_email    TEXT,
  is_active             BOOLEAN       NOT NULL DEFAULT true,
  created_at            TIMESTAMPTZ   NOT NULL DEFAULT now(),
  updated_at            TIMESTAMPTZ   NOT NULL DEFAULT now()
);

-- b2b_partners は管理者専用テーブルのため Service Role Key からのみアクセス可
ALTER TABLE public.b2b_partners ENABLE ROW LEVEL SECURITY;

CREATE POLICY IF NOT EXISTS "b2b_partners_service_only"
  ON public.b2b_partners
  FOR ALL
  USING (auth.role() = 'service_role');

-- 3. distributor_stores テーブルの新規作成（島内加盟店・販売手数料還元システム）
CREATE TABLE IF NOT EXISTS public.distributor_stores (
  id                       UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  shop_name                TEXT          NOT NULL,
  island_id                TEXT          NOT NULL,
  referral_code            TEXT          NOT NULL UNIQUE,
  commission_rate          NUMERIC(5,2)  NOT NULL DEFAULT 15.00
                             CHECK (commission_rate >= 0 AND commission_rate <= 100),
  contact_person           TEXT,
  email                    TEXT,
  phone                    TEXT,
  total_sales_count        INTEGER       NOT NULL DEFAULT 0,
  total_revenue            NUMERIC(12,2) NOT NULL DEFAULT 0,
  accumulated_commission   NUMERIC(12,2) NOT NULL DEFAULT 0,
  is_active                BOOLEAN       NOT NULL DEFAULT true,
  created_at               TIMESTAMPTZ   NOT NULL DEFAULT now(),
  updated_at               TIMESTAMPTZ   NOT NULL DEFAULT now()
);

-- distributor_stores は管理者専用テーブルのため Service Role Key からのみアクセス可
ALTER TABLE public.distributor_stores ENABLE ROW LEVEL SECURITY;

CREATE POLICY IF NOT EXISTS "distributor_stores_service_only"
  ON public.distributor_stores
  FOR ALL
  USING (auth.role() = 'service_role');

-- 4. contacts テーブルへの管理者メモ・返信下書きカラムの追加
ALTER TABLE public.contacts
  ADD COLUMN IF NOT EXISTS admin_note   TEXT,
  ADD COLUMN IF NOT EXISTS reply_text   TEXT;

-- ============================================================
-- インデックスの追加（パフォーマンス最適化）
-- ============================================================

CREATE INDEX IF NOT EXISTS idx_b2b_partners_island_id ON public.b2b_partners (island_id);
CREATE INDEX IF NOT EXISTS idx_b2b_partners_is_active ON public.b2b_partners (is_active);
CREATE INDEX IF NOT EXISTS idx_b2b_partners_contract_end ON public.b2b_partners (contract_end);
CREATE INDEX IF NOT EXISTS idx_distributor_stores_island_id ON public.distributor_stores (island_id);
CREATE INDEX IF NOT EXISTS idx_distributor_stores_referral_code ON public.distributor_stores (referral_code);
