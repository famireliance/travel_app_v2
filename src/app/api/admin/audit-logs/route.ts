import { NextRequest, NextResponse } from 'next/server';
import { getAdminPassword } from '@/lib/adminAuth';
import { getAuditLogs, extractClientInfo, logAuditEvent } from '@/lib/auditLogger';

async function verifyAuth(req: NextRequest) {
  const ADMIN_PASSWORD = await getAdminPassword();
  const auth = req.headers.get('x-admin-password');
  return auth && auth === ADMIN_PASSWORD;
}

export async function GET(req: NextRequest) {
  if (!await verifyAuth(req)) {
    return NextResponse.json({ error: '認証が必要です' }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(req.url);
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');
    const action = searchParams.get('action') || 'all';
    const island_id = searchParams.get('island_id') || undefined;
    const search = searchParams.get('search') || undefined;

    const result = await getAuditLogs({
      limit,
      offset,
      action,
      island_id,
      search
    });

    return NextResponse.json(result);
  } catch (err: any) {
    return NextResponse.json({ error: err.message || '監査ログ取得に失敗しました' }, { status: 500 });
  }
}

// 任意の管理イベント（手動記録またはログイン記録等）
export async function POST(req: NextRequest) {
  if (!await verifyAuth(req)) {
    return NextResponse.json({ error: '認証が必要です' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const client = extractClientInfo(req);

    const log = await logAuditEvent({
      actor: body.actor || { role: 'super_admin', name: 'Master Operator' },
      client,
      action: body.action || 'CUSTOM_ADMIN_ACTION',
      target: body.target,
      diff: body.diff
    });

    return NextResponse.json({ success: true, log });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'ログ記録に失敗しました' }, { status: 500 });
  }
}
