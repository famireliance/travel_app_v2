-- ========================================================
-- Phase 5: Agency (行政・フェリー会社等) アクセス権限制御
-- ========================================================

-- 機関（Agency）ユーザーテーブル
CREATE TABLE IF NOT EXISTS public.agency_users (
    id UUID PRIMARY KEY, -- Supabase AuthのUID
    email TEXT NOT NULL,
    organization_name TEXT, -- 組織名（例: 〇〇海運、〇〇村役場）
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 機関ユーザーと管理可能島を紐付ける中間テーブル
CREATE TABLE IF NOT EXISTS public.agency_island_access (
    user_id UUID REFERENCES public.agency_users(id) ON DELETE CASCADE,
    island_id TEXT REFERENCES public.islands(id) ON DELETE CASCADE,
    PRIMARY KEY (user_id, island_id)
);

-- RLS（Row Level Security）の有効化
ALTER TABLE public.agency_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agency_island_access ENABLE ROW LEVEL SECURITY;

-- ポリシー設定: 誰でも読み取りは可能（ログインチェック等に必要）
CREATE POLICY "Agency users viewable by everyone" ON public.agency_users FOR SELECT USING (true);
CREATE POLICY "Access mappings viewable by everyone" ON public.agency_island_access FOR SELECT USING (true);

-- ========================================================
-- 既存の islands テーブルへのAgency用更新ポリシー追加
-- ========================================================
-- ※既に存在する "Islands are updatable by admins only" はそのまま残し、追加でAgencyに権限を与えます。

CREATE POLICY "Islands are updatable by assigned agencies" ON public.islands
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.agency_island_access 
      WHERE user_id = auth.uid() AND island_id = islands.id
    )
  );
