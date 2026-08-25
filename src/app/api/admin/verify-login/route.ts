import { NextRequest, NextResponse } from 'next/server';
import { getAdminPassword } from '@/lib/adminAuth';

export async function POST(req: NextRequest) {
  try {
    const { password } = await req.json();
    const ADMIN_PASSWORD = await getAdminPassword();

    if (!password || !ADMIN_PASSWORD || password !== ADMIN_PASSWORD) {
      return NextResponse.json({ error: 'パスワードが正しくありません' }, { status: 401 });
    }

    return NextResponse.json({ success: true, message: '認証成功' });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || '認証エラー' }, { status: 500 });
  }
}
