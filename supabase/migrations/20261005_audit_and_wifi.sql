-- 20261005_audit_and_wifi.sql

CREATE TABLE IF NOT EXISTS island_public_wifi (
    id TEXT PRIMARY KEY,
    island_id TEXT NOT NULL,
    name TEXT NOT NULL,
    location TEXT NOT NULL,
    ssid TEXT NOT NULL,
    has_password BOOLEAN NOT NULL DEFAULT false,
    password TEXT,
    auth_method TEXT NOT NULL,
    notes TEXT,
    is_verified BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    updated_by TEXT
);

CREATE TABLE IF NOT EXISTS audit_logs (
    id TEXT PRIMARY KEY,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    actor JSONB NOT NULL,
    client JSONB NOT NULL,
    action TEXT NOT NULL,
    target JSONB,
    diff JSONB
);

-- RLSの有効化
ALTER TABLE island_public_wifi ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- island_public_wifi RLS policies
-- 誰でも読み取り可能
CREATE POLICY "Enable read access for all users on island_public_wifi"
ON island_public_wifi FOR SELECT USING (true);

-- audit_logs RLS policies
-- 追記（INSERT）とSELECTのみ可能とする。UPDATEとDELETEは許可しない。
-- ※SupabaseのサービスロールはRLSをバイパスするため、本テーブルはサービスロールからのアクセスを前提としつつ、
-- 念のためRLSを有効化しておく（誤った匿名アクセスを防ぐ）
