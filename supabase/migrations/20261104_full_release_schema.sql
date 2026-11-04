-- ============================================================
-- 20261104_full_release_schema.sql
-- KIRATABI SHIMASENKA 完全版リリース向け統合スキーマ補完マイグレーション
-- ※すべて IF NOT EXISTS 指定のため何度実行しても安全です
-- ============================================================

-- 1. islands テーブルの公的証明書設定カラム追加
ALTER TABLE public.islands
  ADD COLUMN IF NOT EXISTS official_cert_enabled     BOOLEAN      NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS official_org_name         TEXT,
  ADD COLUMN IF NOT EXISTS official_seal_url         TEXT,
  ADD COLUMN IF NOT EXISTS official_cert_price       INTEGER      NOT NULL DEFAULT 3000,
  ADD COLUMN IF NOT EXISTS official_sales_start_at   TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS official_sales_end_at     TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS official_template_id      TEXT         DEFAULT 'standard';

-- 2. user_profiles テーブルの拡張カラム追加
ALTER TABLE public.user_profiles
  ADD COLUMN IF NOT EXISTS total_points              INTEGER      NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS player_level              INTEGER      NOT NULL DEFAULT 1,
  ADD COLUMN IF NOT EXISTS ultimate_started_at       TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS anniversary_cert_used     BOOLEAN      NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS avatar_url                TEXT;

-- 3. orders テーブルの配送追跡カラム追加
ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS tracking_number           TEXT,
  ADD COLUMN IF NOT EXISTS carrier                   TEXT,
  ADD COLUMN IF NOT EXISTS notes                     TEXT,
  ADD COLUMN IF NOT EXISTS shipped_at                TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS delivered_at              TIMESTAMPTZ;

-- 4. physical_orders テーブル（実物到達証明書オーダー管理）
CREATE TABLE IF NOT EXISTS public.physical_orders (
  id                    UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id               TEXT          NOT NULL,
  island_id             TEXT          NOT NULL,
  type                  TEXT          NOT NULL DEFAULT 'standard',
  shipping_name         TEXT          NOT NULL,
  shipping_postal_code  TEXT          NOT NULL,
  shipping_address      TEXT          NOT NULL,
  shipping_phone        TEXT,
  status                TEXT          NOT NULL DEFAULT 'ordered',
  stripe_session_id     TEXT,
  stripe_payment_intent TEXT,
  tracking_number       TEXT,
  carrier               TEXT,
  notes                 TEXT,
  ordered_at            TIMESTAMPTZ   NOT NULL DEFAULT now(),
  shipped_at            TIMESTAMPTZ,
  delivered_at          TIMESTAMPTZ
);
ALTER TABLE public.physical_orders ENABLE ROW LEVEL SECURITY;

-- 5. contacts テーブル（お問い合わせ管理）
CREATE TABLE IF NOT EXISTS public.contacts (
  id                    UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  name                  TEXT          NOT NULL,
  email                 TEXT          NOT NULL,
  category              TEXT          DEFAULT 'general',
  message               TEXT          NOT NULL,
  status                TEXT          NOT NULL DEFAULT 'unread',
  admin_note            TEXT,
  reply_text            TEXT,
  created_at            TIMESTAMPTZ   NOT NULL DEFAULT now(),
  updated_at            TIMESTAMPTZ   NOT NULL DEFAULT now()
);
ALTER TABLE public.contacts ENABLE ROW LEVEL SECURITY;

-- 6. b2b_partners テーブル（宿・交通機関スポンサー管理）
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
ALTER TABLE public.b2b_partners ENABLE ROW LEVEL SECURITY;

-- 7. distributor_stores テーブル（島内販売協力店・手数料還元管理）
CREATE TABLE IF NOT EXISTS public.distributor_stores (
  id                       UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  shop_name                TEXT          NOT NULL,
  island_id                TEXT          NOT NULL,
  referral_code            TEXT          NOT NULL UNIQUE,
  commission_rate          NUMERIC(5,2)  NOT NULL DEFAULT 15.00 CHECK (commission_rate >= 0 AND commission_rate <= 100),
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
ALTER TABLE public.distributor_stores ENABLE ROW LEVEL SECURITY;

-- 8. certificate_requests テーブル（公的証明書申請管理）
CREATE TABLE IF NOT EXISTS public.certificate_requests (
  id                    UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id               TEXT,
  island_id             TEXT          NOT NULL,
  applicant_name        TEXT          NOT NULL,
  address               TEXT,
  status                TEXT          NOT NULL DEFAULT 'pending',
  notes                 TEXT,
  requested_at          TIMESTAMPTZ   NOT NULL DEFAULT now(),
  updated_at            TIMESTAMPTZ   NOT NULL DEFAULT now()
);
ALTER TABLE public.certificate_requests ENABLE ROW LEVEL SECURITY;

-- 9. admin_grants テーブル（管理画面からの手動到達付与ログ）
CREATE TABLE IF NOT EXISTS public.admin_grants (
  id                    UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id               UUID          NOT NULL,
  island_id             TEXT          NOT NULL,
  status                TEXT          NOT NULL,
  visited_at            TIMESTAMPTZ,
  note                  TEXT,
  granted_at            TIMESTAMPTZ   NOT NULL DEFAULT now()
);
ALTER TABLE public.admin_grants ENABLE ROW LEVEL SECURITY;

-- 10. island_visit_logs テーブル（チェックイン履歴ログ）
CREATE TABLE IF NOT EXISTS public.island_visit_logs (
  id                    UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id               UUID          NOT NULL,
  island_id             TEXT          NOT NULL,
  visited_at            TIMESTAMPTZ   NOT NULL DEFAULT now(),
  is_verified           BOOLEAN       NOT NULL DEFAULT false,
  earned_xp             INTEGER       NOT NULL DEFAULT 0
);
ALTER TABLE public.island_visit_logs ENABLE ROW LEVEL SECURITY;

-- 11. tracking_events テーブル（施設クリック計測ログ）
CREATE TABLE IF NOT EXISTS public.tracking_events (
  id                    UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  facility_id           TEXT          NOT NULL,
  event_type            TEXT          NOT NULL,
  user_agent            TEXT,
  session_id            TEXT,
  created_at            TIMESTAMPTZ   NOT NULL DEFAULT now()
);
ALTER TABLE public.tracking_events ENABLE ROW LEVEL SECURITY;

-- 12. 管理系・内部テーブルのRLS強制有効化と過剰公開ポリシーの除去
ALTER TABLE IF EXISTS public.admin_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.admin_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.admin_organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.admin_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.app_promo_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.newsletters ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Contacts are viewable by service role only" ON public.contacts;
DROP POLICY IF EXISTS "Contacts are updatable by service role only" ON public.contacts;
DROP POLICY IF EXISTS "Service role can manage promo codes" ON public.app_promo_codes;
DROP POLICY IF EXISTS "Enable read access for all users" ON public.newsletters;

-- 13. user_profiles 自己更新時の特権昇格防止トリガー（service_role 以外の特権カラム書き換えを拒否）
CREATE OR REPLACE FUNCTION public.prevent_user_profile_privilege_escalation()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF COALESCE(current_setting('request.jwt.claim.role', true), '') <> 'service_role' THEN
    NEW.role := OLD.role;
    NEW.subscription_tier := OLD.subscription_tier;
    NEW.stripe_customer_id := OLD.stripe_customer_id;
    NEW.stripe_subscription_id := OLD.stripe_subscription_id;
    NEW.high_quality_tickets := OLD.high_quality_tickets;
    NEW.ultimate_started_at := OLD.ultimate_started_at;
    NEW.anniversary_cert_used := OLD.anniversary_cert_used;
    NEW.is_banned := OLD.is_banned;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_prevent_user_profile_privilege_escalation ON public.user_profiles;
CREATE TRIGGER trg_prevent_user_profile_privilege_escalation
  BEFORE UPDATE ON public.user_profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.prevent_user_profile_privilege_escalation();

