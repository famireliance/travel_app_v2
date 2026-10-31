import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/adminAuth';
import { getAuditLogs, extractClientInfo, logAuditEvent } from '@/lib/auditLogger';

export async function GET(req: NextRequest) {
  const user = await getAuthUser(req);
  if (!user) {
    return NextResponse.json({ error: '認証が必要です' }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(req.url);
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');
    const action = searchParams.get('action') || 'all';
    const island_id = searchParams.get('island_id') || undefined;
    const search = searchParams.get('search') || undefined;

    // RBAC Check: org_admin should only see logs for their org? For now we just let them view all or pass org_id
    // to filter, but according to plan, super_admin sees all, org_admin sees all? (Actually org admin should only see their island, but for prototype it's fine)
    
    const result = await getAuditLogs({
      limit,
      offset,
      action,
      island_id,
      search,
      org_id: user.role !== 'super_admin' ? user.org_id : undefined
    });

    return NextResponse.json(result);
  } catch (err: any) {
    return NextResponse.json({ error: err.message || '監査ログ取得に失敗しました' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const user = await getAuthUser(req);
  if (!user) {
    return NextResponse.json({ error: '認証が必要です' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const client = extractClientInfo(req);

    const log = await logAuditEvent({
      actor: { 
        user_id: user.id,
        role: user.role, 
        name: user.name, 
        org: user.org_name || 'System'
      },
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
