import { NextRequest, NextResponse } from 'next/server';
import { getAdminPassword, validateTokenString } from '@/lib/adminAuth';
import { createClient } from '@supabase/supabase-js';
import bcrypt from 'bcryptjs';

const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;

// ブルートフォース対策: IPごとの失敗試行回数を記録 (15分間で最大10回失敗まで)
const MAX_FAILED_ATTEMPTS = 10;
const LOCKOUT_WINDOW_MS = 15 * 60 * 1000;
const failedLoginMap = new Map<string, { count: number; firstFailedAt: number }>();

function getClientIp(req: NextRequest): string {
  const xff = req.headers.get('x-forwarded-for');
  if (xff) return xff.split(',')[0].trim();
  return req.headers.get('x-real-ip') || 'unknown';
}

function isRateLimited(ip: string): boolean {
  const entry = failedLoginMap.get(ip);
  if (!entry) return false;
  if (Date.now() - entry.firstFailedAt > LOCKOUT_WINDOW_MS) {
    failedLoginMap.delete(ip);
    return false;
  }
  return entry.count >= MAX_FAILED_ATTEMPTS;
}

function recordFailedAttempt(ip: string) {
  const now = Date.now();
  const entry = failedLoginMap.get(ip);
  if (!entry || now - entry.firstFailedAt > LOCKOUT_WINDOW_MS) {
    failedLoginMap.set(ip, { count: 1, firstFailedAt: now });
  } else {
    entry.count += 1;
  }
}

function clearFailedAttempts(ip: string) {
  failedLoginMap.delete(ip);
}

export async function POST(req: NextRequest) {
  const clientIp = getClientIp(req);
  if (isRateLimited(clientIp)) {
    return NextResponse.json(
      { error: 'ログイン試行回数が上限に達しました。15分後に再度お試しください。' },
      { status: 429 }
    );
  }

  try {
    const { email, password } = await req.json();

    // 0. 既存のUUIDセッショントークンの有効性確認（画面リロード時のセッション維持）
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (!email && password && uuidRegex.test(password)) {
      const sessionUser = await validateTokenString(password);
      if (sessionUser) {
        clearFailedAttempts(clientIp);
        return NextResponse.json({ success: true, token: password, user: sessionUser });
      }
      return NextResponse.json({ error: 'セッションの有効期限が切れました' }, { status: 401 });
    }

    const ADMIN_PASSWORD = await getAdminPassword();
    const envMasterPw = process.env.ADMIN_PASSWORD || '';

    // 1. Master password login (works whether email is empty or entered)
    if (password && (password === ADMIN_PASSWORD || (envMasterPw && password === envMasterPw))) {
      clearFailedAttempts(clientIp);
      const masterUser = {
        id: 'master-admin-id',
        email: 'admin@kira-tabi.com',
        role: 'super_admin',
        name: 'Master Admin',
        org_name: 'システム管理'
      };

      // マスターパスワード自体をブラウザに保持させないため、DBセッション(UUID)を発行する
      if (SERVICE_ROLE_KEY && !SERVICE_ROLE_KEY.startsWith('REPLACE')) {
        try {
          const client = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
            auth: { autoRefreshToken: false, persistSession: false }
          });
          const { data: session } = await client
            .from('admin_sessions')
            .insert([{ user_id: null }])
            .select('id')
            .single();
          if (session?.id) {
            return NextResponse.json({ success: true, token: session.id, user: masterUser });
          }
        } catch {
          // DB未接続時はフォールバック
        }
      }

      return NextResponse.json({ success: true, token: password, user: masterUser });
    }

    if (!email || !password) {
      recordFailedAttempt(clientIp);
      return NextResponse.json({ error: 'メールアドレスとパスワードが必要です' }, { status: 401 });
    }

    if (!SERVICE_ROLE_KEY || SERVICE_ROLE_KEY.startsWith('REPLACE')) {
      return NextResponse.json({ error: 'データベース接続エラー' }, { status: 500 });
    }

    const client = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
      auth: { autoRefreshToken: false, persistSession: false }
    });

    let verifiedUser: any = null;

    // 2. verify_admin_password RPC call (try Postgres crypt() first)
    try {
      const { data: rpcUser } = await client.rpc('verify_admin_password', {
        p_email: email.trim().toLowerCase(),
        p_password: password
      });
      if (rpcUser) {
        verifiedUser = rpcUser;
      }
    } catch {
      // RPC error or undefined
    }

    // 3. Direct bcrypt comparison fallback (supports bcryptjs hashed accounts)
    if (!verifiedUser) {
      const { data: dbUser } = await client
        .from('admin_users')
        .select('id, email, password_hash, name, role, org_id')
        .eq('email', email.trim().toLowerCase())
        .maybeSingle();

      if (dbUser && dbUser.password_hash) {
        const isMatch = bcrypt.compareSync(password, dbUser.password_hash);
        if (isMatch) {
          verifiedUser = {
            id: dbUser.id,
            email: dbUser.email,
            name: dbUser.name,
            role: dbUser.role,
            org_id: dbUser.org_id
          };
        }
      }
    }

    if (!verifiedUser) {
      recordFailedAttempt(clientIp);
      return NextResponse.json({ error: '認証に失敗しました' }, { status: 401 });
    }

    clearFailedAttempts(clientIp);

    // 4. create session
    const { data: session, error: sessionErr } = await client
      .from('admin_sessions')
      .insert([{ user_id: verifiedUser.id }])
      .select('id')
      .single();

    if (sessionErr || !session) {
      return NextResponse.json({ error: 'セッション作成に失敗しました' }, { status: 500 });
    }

    return NextResponse.json({ success: true, token: session.id, user: verifiedUser });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || '認証エラー' }, { status: 500 });
  }
}
