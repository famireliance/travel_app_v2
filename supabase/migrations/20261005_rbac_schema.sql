-- 20261005_rbac_schema.sql
-- 階層型権限管理（RBAC）のためのスキーマ定義

CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS admin_organizations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    parent_id UUID REFERENCES admin_organizations(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS admin_users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id UUID REFERENCES admin_organizations(id) ON DELETE CASCADE,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    name TEXT NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('super_admin', 'org_admin', 'editor', 'viewer')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    last_login_at TIMESTAMPTZ
);

-- モックデータの投入（初期セットアップ）
DO $$
DECLARE
    tokyo_org_id UUID;
    hachijo_org_id UUID;
    super_admin_pass TEXT := crypt('superadmin123', gen_salt('bf'));
    tokyo_admin_pass TEXT := crypt('tokyo123', gen_salt('bf'));
    hachijo_admin_pass TEXT := crypt('hachijo123', gen_salt('bf'));
BEGIN
    -- 組織の作成
    INSERT INTO admin_organizations (name, parent_id)
    VALUES ('東京都', NULL)
    RETURNING id INTO tokyo_org_id;

    INSERT INTO admin_organizations (name, parent_id)
    VALUES ('八丈町役場', tokyo_org_id)
    RETURNING id INTO hachijo_org_id;

    -- ユーザーの作成
    -- 1. 弊社（Super Admin）
    INSERT INTO admin_users (email, password_hash, name, role, org_id)
    VALUES ('admin@kira-tabi.com', super_admin_pass, 'Master Admin', 'super_admin', NULL);

    -- 2. 東京都（Org Admin）
    INSERT INTO admin_users (email, password_hash, name, role, org_id)
    VALUES ('tokyo@metro.tokyo.jp', tokyo_admin_pass, '東京都管理者', 'org_admin', tokyo_org_id);

    -- 3. 八丈町役場（Org Admin）
    INSERT INTO admin_users (email, password_hash, name, role, org_id)
    VALUES ('admin@hachijo.tokyo.jp', hachijo_admin_pass, '八丈町管理者', 'org_admin', hachijo_org_id);

    -- 4. 八丈町役場（一般スタッフ）
    INSERT INTO admin_users (email, password_hash, name, role, org_id)
    VALUES ('staff@hachijo.tokyo.jp', crypt('staff123', gen_salt('bf')), '八丈町スタッフA', 'editor', hachijo_org_id);
END $$;

-- 認証用RPC
CREATE OR REPLACE FUNCTION verify_admin_password(p_email TEXT, p_password TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_user RECORD;
    v_org RECORD;
BEGIN
    SELECT * INTO v_user FROM admin_users WHERE email = p_email;
    IF NOT FOUND THEN
        RETURN NULL;
    END IF;

    IF v_user.password_hash = crypt(p_password, v_user.password_hash) THEN
        IF v_user.org_id IS NOT NULL THEN
            SELECT * INTO v_org FROM admin_organizations WHERE id = v_user.org_id;
            RETURN jsonb_build_object(
                'id', v_user.id,
                'email', v_user.email,
                'name', v_user.name,
                'role', v_user.role,
                'org_id', v_user.org_id,
                'org_name', v_org.name
            );
        ELSE
            RETURN jsonb_build_object(
                'id', v_user.id,
                'email', v_user.email,
                'name', v_user.name,
                'role', v_user.role,
                'org_id', NULL,
                'org_name', 'System'
            );
        END IF;
    ELSE
        RETURN NULL;
    END IF;
END;
$$;
