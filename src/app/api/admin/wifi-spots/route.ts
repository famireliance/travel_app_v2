import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/adminAuth';
import { logAuditEvent, extractClientInfo } from '@/lib/auditLogger';
import { getWifiSpots, saveWifiSpot, deleteWifiSpot, getDbClient, sanitizeText, PublicWifiSpot } from '@/lib/wifiStore';

export async function GET(req: NextRequest) {
  const user = await getAuthUser(req);
  if (!user) return NextResponse.json({ error: '認証が必要です' }, { status: 401 });
  
  const island_id = new URL(req.url).searchParams.get('island_id') || undefined;
  const spots = await getWifiSpots(island_id);
  
  // For cell notes, we would ideally fetch from a DB table, but keeping it simple for now if they aren't in DB yet.
  // Actually, we can fetch DEFAULT_CELL_NOTES if cellNotes table doesn't exist.
  // We'll skip cell notes here or just return empty for now, as DB migration didn't include it. 
  return NextResponse.json({ spots, cell_notes: {} });
}

function checkJurisdiction(user: { role: string; org_name?: string }, islandId: string): boolean {
  if (user.role === 'super_admin') return true;
  if (!user.org_name) return true;

  const org = user.org_name;
  const island = islandId.toLowerCase();

  // 東京都（親組織）は傘下の全島（伊豆・小笠原）を管轄
  if (org.includes('東京')) return true;

  // 自治体名と島IDのマッピング
  if (org.includes('八丈') && !island.includes('hachijo') && !island.includes('kojima')) {
    return false;
  }
  if (org.includes('青ヶ島') && !island.includes('aogashima')) {
    return false;
  }
  if (org.includes('大島') && !island.includes('oshima')) {
    return false;
  }
  if (org.includes('新島') && !island.includes('niijima') && !island.includes('shikine')) {
    return false;
  }
  if (org.includes('神津') && !island.includes('kozushima')) {
    return false;
  }
  if (org.includes('三宅') && !island.includes('miyake')) {
    return false;
  }
  if (org.includes('御蔵') && !island.includes('mikura')) {
    return false;
  }
  if (org.includes('小笠原') && !island.includes('chichi') && !island.includes('haha') && !island.includes('ogasawara')) {
    return false;
  }

  return true;
}

export async function POST(req: NextRequest) {
  const user = await getAuthUser(req);
  if (!user) return NextResponse.json({ error: '認証が必要です' }, { status: 401 });

  try {
    const body = await req.json();
    const island_id = sanitizeText(body.island_id, 80);
    const name = sanitizeText(body.name, 100);
    const ssid = sanitizeText(body.ssid, 64);
    if (!island_id || !name || !ssid) {
      return NextResponse.json({ error: 'island_id, name, ssid は必須です' }, { status: 400 });
    }

    if (!checkJurisdiction(user, island_id)) {
      return NextResponse.json({ error: '管轄外の離島データは追加・編集できません（テナント境界保護）' }, { status: 403 });
    }
    
    const spot: Partial<PublicWifiSpot> = {
      island_id, name, ssid,
      location: sanitizeText(body.location, 100) || '館内・待合スペース',
      has_password: Boolean(body.has_password),
      password: body.has_password ? sanitizeText(body.password, 64) : '',
      auth_method: sanitizeText(body.auth_method, 100) || 'ブラウザ認証 / 同意のみ',
      notes: sanitizeText(body.notes, 300),
      is_verified: true, 
      updated_by: user.name,
    };
    
    const saved = await saveWifiSpot(spot);

    await logAuditEvent({
      actor: { user_id: user.id, role: user.role, name: user.name, org: user.org_name || 'System' },
      client: extractClientInfo(req), action: 'WIFI_SPOT_CREATE',
      target: { resource_type: 'wifi_spot', resource_id: saved?.id, island_id, details: `公共Wi-Fi「${name}」(SSID: ${ssid}) を追加` },
      diff: { after: { ...saved, password: saved?.password ? '***' : '' } },
    });
    return NextResponse.json({ success: true, spot: saved });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || '作成エラー' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  const user = await getAuthUser(req);
  if (!user) return NextResponse.json({ error: '認証が必要です' }, { status: 401 });

  try {
    const body = await req.json();
    const client = extractClientInfo(req);

    if (body.type === 'update_cell_note') {
       // Mock for cell note update since it wasn't migrated to DB
       return NextResponse.json({ success: true, cell_note: body.cell_note });
    }

    const spots = await getWifiSpots();
    const old = spots.find(s => s.id === body.id);
    if (!old) return NextResponse.json({ error: '指定されたスポットが見つかりません' }, { status: 404 });
    
    if (!checkJurisdiction(user, old.island_id)) {
      return NextResponse.json({ error: '管轄外の離島データは編集できません（テナント境界保護）' }, { status: 403 });
    }
    
    const has_password = body.has_password !== undefined ? Boolean(body.has_password) : old.has_password;
    const updated: Partial<PublicWifiSpot> = {
      ...old,
      name: sanitizeText(body.name, 100) || old.name,
      location: sanitizeText(body.location, 100) || old.location,
      ssid: sanitizeText(body.ssid, 64) || old.ssid,
      has_password,
      password: has_password ? (body.password !== undefined ? sanitizeText(body.password, 64) : old.password) : '',
      auth_method: sanitizeText(body.auth_method, 100) || old.auth_method,
      notes: body.notes !== undefined ? sanitizeText(body.notes, 300) : old.notes,
      updated_by: user.name,
    };
    
    const saved = await saveWifiSpot(updated);

    const mask = (s: any) => ({ ...s, password: s.password ? '***' : '' });
    await logAuditEvent({
      actor: { user_id: user.id, role: user.role, name: user.name, org: user.org_name || 'System' }, 
      client, action: 'WIFI_SPOT_UPDATE',
      target: { resource_type: 'wifi_spot', resource_id: saved?.id, island_id: saved?.island_id, details: `公共Wi-Fi「${saved?.name}」(SSID: ${saved?.ssid}) を更新` },
      diff: { before: mask(old), after: mask(saved) },
    });
    return NextResponse.json({ success: true, spot: saved });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || '更新エラー' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  const user = await getAuthUser(req);
  if (!user) return NextResponse.json({ error: '認証が必要です' }, { status: 401 });

  try {
    const id = new URL(req.url).searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'id は必須です' }, { status: 400 });
    
    const spots = await getWifiSpots();
    const target = spots.find(s => s.id === id);
    if (!target) return NextResponse.json({ error: '指定されたスポットが見つかりません' }, { status: 404 });
    
    if (!checkJurisdiction(user, target.island_id)) {
      return NextResponse.json({ error: '管轄外の離島データは削除できません（テナント境界保護）' }, { status: 403 });
    }
    
    await deleteWifiSpot(id);

    await logAuditEvent({
      actor: { user_id: user.id, role: user.role, name: user.name, org: user.org_name || 'System' },
      client: extractClientInfo(req), action: 'WIFI_SPOT_DELETE',
      target: { resource_type: 'wifi_spot', resource_id: id, island_id: target.island_id, details: `公共Wi-Fi「${target.name}」(SSID: ${target.ssid}) を削除` },
      diff: { before: { ...target, password: target.password ? '***' : '' } },
    });
    return NextResponse.json({ success: true, deleted_id: id });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || '削除エラー' }, { status: 500 });
  }
}
