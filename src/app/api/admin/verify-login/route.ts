import { NextRequest, NextResponse } from 'next/server';
import { getAdminPassword } from '@/lib/adminAuth';
import { createClient } from '@supabase/supabase-js';
import bcrypt from 'bcryptjs';

const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json();
    const ADMIN_PASSWORD = await getAdminPassword();

    // 1. Master password login (works whether email is empty or entered)
    if (password === ADMIN_PASSWORD) {
      return NextResponse.json({ success: true, token: ADMIN_PASSWORD, user: { role: 'super_admin', name: 'Master Admin' } });
    }

    if (!email || !password) {
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
      return NextResponse.json({ error: '認証に失敗しました' }, { status: 401 });
    }

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
