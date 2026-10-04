import { NextRequest, NextResponse } from 'next/server';
import { getAdminPassword } from '@/lib/adminAuth';
import { logAuditEvent, extractClientInfo } from '@/lib/auditLogger';
import { getWifiStore, getDbClient, sanitizeText, PublicWifiSpot } from '@/lib/wifiStore';

// 監査ログの実行者はクライアント申告ではなくサーバー側で確定（なりすまし防止）
const ACTOR = { role: 'super_admin', name: 'Master Admin', org: 'プラットフォーム運営' };

async function verifyAuth(req: NextRequest) {
  const expected = await getAdminPassword();
  const auth = req.headers.get('x-admin-password');
  return Boolean(expected) && auth === expected;
}
const unauthorized = () => NextResponse.json({ error: '認証が必要です' }, { status: 401 });

export async function GET(req: NextRequest) {
  if (!(await verifyAuth(req))) return unauthorized();
  const island_id = new URL(req.url).searchParams.get('island_id');
  const store = getWifiStore();
  const spots = island_id ? store.spots.filter(s => s.island_id === island_id) : store.spots;
  return NextResponse.json({ spots, cell_notes: store.cellNotes });
}

export async function POST(req: NextRequest) {
  if (!(await verifyAuth(req))) return unauthorized();
  try {
    const body = await req.json();
    const island_id = sanitizeText(body.island_id, 80);
    const name = sanitizeText(body.name, 100);
    const ssid = sanitizeText(body.ssid, 64);
    if (!island_id || !name || !ssid) {
      return NextResponse.json({ error: 'island_id, name, ssid は必須です' }, { status: 400 });
    }
    const now = new Date().toISOString();
    const spot: PublicWifiSpot = {
      id: `spot_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      island_id, name, ssid,
      location: sanitizeText(body.location, 100) || '館内・待合スペース',
      has_password: Boolean(body.has_password),
      password: body.has_password ? sanitizeText(body.password, 64) : '',
      auth_method: sanitizeText(body.auth_method, 100) || 'ブラウザ認証 / 同意のみ',
      notes: sanitizeText(body.notes, 300),
      is_verified: true, created_at: now, updated_at: now, updated_by: ACTOR.name,
    };
    getWifiStore().spots.unshift(spot);
    const db = getDbClient();
    if (db) { const { error } = await db.from('island_public_wifi').insert([spot]); if (error) console.warn('[wifi] db insert:', error.message); }

    await logAuditEvent({
      actor: ACTOR, client: extractClientInfo(req), action: 'WIFI_SPOT_CREATE',
      target: { resource_type: 'wifi_spot', resource_id: spot.id, island_id, details: `公共Wi-Fi「${name}」(SSID: ${ssid}) を追加` },
      diff: { after: { ...spot, password: spot.password ? '***' : '' } },
    });
    return NextResponse.json({ success: true, spot });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || '作成エラー' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  if (!(await verifyAuth(req))) return unauthorized();
  try {
    const body = await req.json();
    const client = extractClientInfo(req);
    const store = getWifiStore();

    if (body.type === 'update_cell_note') {
      const island_id = sanitizeText(body.island_id, 80);
      if (!island_id) return NextResponse.json({ error: 'island_id は必須です' }, { status: 400 });
      const before = store.cellNotes[island_id] || '';
      const after = sanitizeText(body.cell_note, 300);
      store.cellNotes[island_id] = after;
      await logAuditEvent({
        actor: ACTOR, client, action: 'CELL_NOTE_UPDATE',
        target: { resource_type: 'carrier_cell_note', island_id, details: `島「${island_id}」のキャリア電波目安を更新` },
        diff: { before: { cell_note: before }, after: { cell_note: after } },
      });
      return NextResponse.json({ success: true, cell_note: after });
    }

    const idx = store.spots.findIndex(s => s.id === body.id);
    if (idx === -1) return NextResponse.json({ error: '指定されたスポットが見つかりません' }, { status: 404 });
    const old = store.spots[idx];
    const has_password = body.has_password !== undefined ? Boolean(body.has_password) : old.has_password;
    const updated: PublicWifiSpot = {
      ...old,
      name: sanitizeText(body.name, 100) || old.name,
      location: sanitizeText(body.location, 100) || old.location,
      ssid: sanitizeText(body.ssid, 64) || old.ssid,
      has_password,
      password: has_password ? (body.password !== undefined ? sanitizeText(body.password, 64) : old.password) : '',
      auth_method: sanitizeText(body.auth_method, 100) || old.auth_method,
      notes: body.notes !== undefined ? sanitizeText(body.notes, 300) : old.notes,
      updated_at: new Date().toISOString(), updated_by: ACTOR.name,
    };
    store.spots[idx] = updated;
    const db = getDbClient();
    if (db) { const { error } = await db.from('island_public_wifi').upsert([updated]); if (error) console.warn('[wifi] db upsert:', error.message); }

    const mask = (s: PublicWifiSpot) => ({ ...s, password: s.password ? '***' : '' });
    await logAuditEvent({
      actor: ACTOR, client, action: 'WIFI_SPOT_UPDATE',
      target: { resource_type: 'wifi_spot', resource_id: updated.id, island_id: updated.island_id, details: `公共Wi-Fi「${updated.name}」(SSID: ${updated.ssid}) を更新` },
      diff: { before: mask(old), after: mask(updated) },
    });
    return NextResponse.json({ success: true, spot: updated });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || '更新エラー' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  if (!(await verifyAuth(req))) return unauthorized();
  try {
    const id = new URL(req.url).searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'id は必須です' }, { status: 400 });
    const store = getWifiStore();
    const target = store.spots.find(s => s.id === id);
    if (!target) return NextResponse.json({ error: '指定されたスポットが見つかりません' }, { status: 404 });
    store.spots = store.spots.filter(s => s.id !== id);
    const db = getDbClient();
    if (db) { const { error } = await db.from('island_public_wifi').delete().eq('id', id); if (error) console.warn('[wifi] db delete:', error.message); }

    await logAuditEvent({
      actor: ACTOR, client: extractClientInfo(req), action: 'WIFI_SPOT_DELETE',
      target: { resource_type: 'wifi_spot', resource_id: id, island_id: target.island_id, details: `公共Wi-Fi「${target.name}」(SSID: ${target.ssid}) を削除` },
      diff: { before: { ...target, password: target.password ? '***' : '' } },
    });
    return NextResponse.json({ success: true, deleted_id: id });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || '削除エラー' }, { status: 500 });
  }
}
