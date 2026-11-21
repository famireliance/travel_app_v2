import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/adminAuth';
import { logAuditEvent, extractClientInfo } from '@/lib/auditLogger';
import {
  getWifiSpots,
  saveWifiSpot,
  deleteWifiSpot,
  getCellNotes,
  getCellNoteForIsland,
  saveCellNote,
  sanitizeText,
  resolveIslandIdCandidates,
  PublicWifiSpot,
} from '@/lib/wifiStore';
import { ALL_ISLANDS_MASTER_DICTIONARY } from '@/data/allIslandsMaster';

export async function GET(req: NextRequest) {
  const user = await getAuthUser(req);
  if (!user) return NextResponse.json({ error: '認証が必要です' }, { status: 401 });
  
  const island_id = new URL(req.url).searchParams.get('island_id') || undefined;
  const [spots, cell_notes] = await Promise.all([
    getWifiSpots(island_id),
    getCellNotes(),
  ]);
  
  return NextResponse.json({ spots, cell_notes });
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function resolveMasterIsland(rawId: string): any | null {
  const trimmed = String(rawId || '').trim();
  const clean = trimmed.toLowerCase();
  if (!clean) return null;

  if (ALL_ISLANDS_MASTER_DICTIONARY[trimmed]) {
    return ALL_ISLANDS_MASTER_DICTIONARY[trimmed];
  }

  const candidates = resolveIslandIdCandidates(trimmed);
  for (const c of candidates) {
    if (/^\d+$/.test(c) && ALL_ISLANDS_MASTER_DICTIONARY[c]) {
      return ALL_ISLANDS_MASTER_DICTIONARY[c];
    }
  }

  return (
    Object.values(ALL_ISLANDS_MASTER_DICTIONARY).find(
      (i: any) =>
        String(i.slug || '').toLowerCase() === clean ||
        String(i.name || '') === trimmed
    ) || null
  );
}

function checkJurisdiction(user: { role: string; org_name?: string }, islandId: string): boolean {
  if (user.role === 'super_admin') return true;
  if (!user.org_name || user.org_name === 'システム管理' || user.org_name === 'System') return true;

  const org = user.org_name;
  const master = resolveMasterIsland(islandId);
  const id = master ? String(master.id) : islandId.trim().toLowerCase();
  const slug = master ? String(master.slug || '').toLowerCase() : islandId.trim().toLowerCase();
  const name = master ? String(master.name || '') : islandId.trim();
  const pref = master ? String(master.prefecture || '') : '';
  const region = master ? String(master.region_id || '') : '';

  // 市町村単位の個別管轄チェック（'東京都八丈町' のような複合名称でも町村境界を優先適用）
  if (org.includes('八丈')) {
    return id === '56' || id === '57' || slug === 'hachijojima' || slug === 'hachijokojima' || slug === 'hachijo' || name.includes('八丈');
  }
  if (org.includes('青ヶ島')) {
    return id === '58' || slug === 'aogashima' || name.includes('青ヶ島');
  }
  if (org.includes('奄美')) {
    return id === '352' || region === 'amami' || slug.includes('amami') || name.includes('奄美');
  }
  if (org.includes('大島')) {
    // 東京都大島町（伊豆大島: ID '49'）のみ許可し、奄美大島('352'/'amamioshima')等との誤一致を防止
    return id === '49' || slug === 'izuoshima' || slug === 'oshima' || name === '伊豆大島' || name === '大島';
  }
  if (org.includes('利島')) {
    return id === '50' || slug === 'toshima' || name === '利島';
  }
  if (org.includes('新島')) {
    return (
      ['51', '52', '59', '60'].includes(id) ||
      ['nijima', 'niijima', 'shikinejima', 'hayashimanijimaoki', 'udoneshima'].includes(slug) ||
      name.includes('新島') ||
      name === '式根島'
    );
  }
  if (org.includes('神津')) {
    return id === '53' || slug === 'kozushima' || name.includes('神津');
  }
  if (org.includes('三宅')) {
    return id === '54' || slug === 'miyakejima' || name.includes('三宅');
  }
  if (org.includes('御蔵')) {
    return id === '55' || slug === 'mikurajima' || name.includes('御蔵');
  }
  if (org.includes('小笠原')) {
    return (
      region === 'ogasawara' ||
      slug.includes('chichi') ||
      slug.includes('haha') ||
      slug.includes('ogasawara') ||
      name.includes('小笠原') ||
      name.includes('父島') ||
      name.includes('母島')
    );
  }
  if (org.includes('石垣')) {
    return id === '392' || slug === 'ishigakijima' || slug === 'ishigaki' || name.includes('石垣');
  }
  if (org.includes('宮古')) {
    return id === '386' || region === 'miyako' || slug.includes('miyako') || name.includes('宮古');
  }

  // 東京都（親組織）は東京都管轄の伊豆・小笠原諸島を管轄
  if (org.includes('東京')) {
    if (master) return pref === '東京都';
    return [
      'hachijojima', 'hachijo', 'hachijokojima', 'aogashima',
      'oshima', 'izuoshima', 'toshima', 'nijima', 'niijima',
      'shikinejima', 'kozushima', 'miyakejima', 'mikurajima',
      'chichijima', 'hahajima', 'ogasawara',
    ].includes(slug);
  }

  return true;
}

export async function POST(req: NextRequest) {
  const user = await getAuthUser(req);
  if (!user) return NextResponse.json({ error: '認証が必要です' }, { status: 401 });
  if (user.role === 'viewer') {
    return NextResponse.json({ error: '閲覧専用アカウントのため変更操作はできません' }, { status: 403 });
  }

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
      actor: { user_id: user.id, role: user.role, name: user.name, org: user.org_name || 'System', org_id: user.org_id },
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
  if (user.role === 'viewer') {
    return NextResponse.json({ error: '閲覧専用アカウントのため変更操作はできません' }, { status: 403 });
  }

  try {
    const body = await req.json();
    const client = extractClientInfo(req);

    if (body.type === 'update_cell_note') {
      const targetIsland = sanitizeText(body.island_id, 80);
      if (!targetIsland) {
        return NextResponse.json({ error: 'island_id は必須です' }, { status: 400 });
      }
      if (!checkJurisdiction(user, targetIsland)) {
        return NextResponse.json({ error: '管轄外の離島データは編集できません（テナント境界保護）' }, { status: 403 });
      }
      const prevNote = (await getCellNoteForIsland(targetIsland)) || '';
      const nextNotes = await saveCellNote(targetIsland, body.cell_note || '');
      await logAuditEvent({
        actor: { user_id: user.id, role: user.role, name: user.name, org: user.org_name || 'System', org_id: user.org_id },
        client,
        action: 'WIFI_CELL_NOTE_UPDATE',
        target: { resource_type: 'wifi_cell_note', resource_id: targetIsland, island_id: targetIsland, details: `キャリア電波目安 (${targetIsland}) を更新` },
        diff: { before: prevNote, after: nextNotes[targetIsland] },
      });
      return NextResponse.json({ success: true, cell_note: nextNotes[targetIsland], cell_notes: nextNotes });
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
      actor: { user_id: user.id, role: user.role, name: user.name, org: user.org_name || 'System', org_id: user.org_id }, 
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
  if (user.role === 'viewer') {
    return NextResponse.json({ error: '閲覧専用アカウントのため変更操作はできません' }, { status: 403 });
  }

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
      actor: { user_id: user.id, role: user.role, name: user.name, org: user.org_name || 'System', org_id: user.org_id },
      client: extractClientInfo(req), action: 'WIFI_SPOT_DELETE',
      target: { resource_type: 'wifi_spot', resource_id: id, island_id: target.island_id, details: `公共Wi-Fi「${target.name}」(SSID: ${target.ssid}) を削除` },
      diff: { before: { ...target, password: target.password ? '***' : '' } },
    });
    return NextResponse.json({ success: true, deleted_id: id });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || '削除エラー' }, { status: 500 });
  }
}
