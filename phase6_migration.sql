-- ========================================================
-- Phase 6: アドサーバー (広告キャンペーン)
-- ========================================================

CREATE TABLE IF NOT EXISTS public.ad_campaigns (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    banner_url TEXT NOT NULL,
    target_url TEXT,
    target_type TEXT NOT NULL, -- 'global', 'region', 'island'
    target_id TEXT, -- e.g., 'okinawa' (region), 'rishiri' (island). null for global
    is_active BOOLEAN DEFAULT true,
    weight INTEGER DEFAULT 1, -- 表示確率や優先度の重み付け用
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS（Row Level Security）の有効化
ALTER TABLE public.ad_campaigns ENABLE ROW LEVEL SECURITY;

-- 誰でも広告の読み取りは可能
CREATE POLICY "Ad campaigns viewable by everyone" ON public.ad_campaigns FOR SELECT USING (true);

-- 管理者のみ広告の作成・更新・削除が可能
CREATE POLICY "Ad campaigns modifiable by admins" ON public.ad_campaigns 
  FOR ALL USING (auth.uid() IN (SELECT id FROM public.admins));
