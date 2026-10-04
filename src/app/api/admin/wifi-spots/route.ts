import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getAdminPassword } from '@/lib/adminAuth';
import { logAuditEvent, extractClientInfo } from '@/lib/auditLogger';

const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;

async function verifyAuth(req: NextRequest) {
  const ADMIN_PASSWORD = await getAdminPassword();
  const auth = req.headers.get('x-admin-password');
  return auth && auth === ADMIN_PASSWORD;
}

export interface PublicWifiSpot {
  id: string;
  island_id: string;
  name: string;
  location: string;
  ssid: string;
  has_password: boolean;
  password?: string;
  auth_method: string;
  notes?: string;
  is_verified?: boolean;
  created_at: string;
  updated_at: string;
  updated_by?: string;
}

// 内部初期プリセット（DB初期化時およびフォールバック用）
export const DEFAULT_WIFI_SPOTS: PublicWifiSpot[] = [
  // 八丈島・伊豆諸島
  {
    id: 'spot_tokyo_01',
    island_id: 'hachijojima',
    name: '底土港 船客待合所',
    location: '1Fロビー・待合スペース',
    ssid: 'FREE_Wi-Fi_and_TOKYO',
    has_password: false,
    auth_method: 'ブラウザ利用規約同意（無料）',
    notes: '東海汽船の乗船前や到着直後の高速通信に利用可能。',
    is_verified: true,
    created_at: '2026-09-01T00:00:00Z',
    updated_at: '2026-09-01T00:00:00Z',
    updated_by: 'system_preset'
  },
  {
    id: 'spot_tokyo_02',
    island_id: 'hachijojima',
    name: '八丈町役場 本庁舎',
    location: '1F窓口ロビー',
    ssid: 'TOKYO_FREE_Wi-Fi',
    has_password: false,
    auth_method: 'メールアドレスまたはSNS認証',
    notes: '開庁時間中および正面玄関付近で接続可能。',
    is_verified: true,
    created_at: '2026-09-01T00:00:00Z',
    updated_at: '2026-09-01T00:00:00Z',
    updated_by: 'system_preset'
  },
  {
    id: 'spot_tokyo_03',
    island_id: 'hachijojima',
    name: '八丈島観光協会',
    location: '案内所内カウンター周辺',
    ssid: 'Shimapo_Free_WiFi',
    has_password: false,
    auth_method: 'ワンタップ接続',
    notes: '観光パンフレット取得やしまぽ通貨チャージに便利。',
    is_verified: true,
    created_at: '2026-09-01T00:00:00Z',
    updated_at: '2026-09-01T00:00:00Z',
    updated_by: 'system_preset'
  },
  // 石垣島・八重山
  {
    id: 'spot_yaeyama_01',
    island_id: 'ishigakijima',
    name: 'ユーグレナ離島ターミナル',
    location: 'フェリー乗り場メインロビー',
    ssid: 'Be_Okinawa_Free_Wi-Fi',
    has_password: false,
    auth_method: '多言語Web認証（無料・無制限）',
    notes: '竹富島・西表島など各離島への出航待ちに最適。',
    is_verified: true,
    created_at: '2026-09-01T00:00:00Z',
    updated_at: '2026-09-01T00:00:00Z',
    updated_by: 'system_preset'
  },
  {
    id: 'spot_yaeyama_02',
    island_id: 'ishigakijima',
    name: '石垣市役所',
    location: '1F市民ラウンジ',
    ssid: 'Yaeyama_Free_Wi-Fi',
    has_password: false,
    auth_method: 'ワンタップ接続',
    notes: '市街地散策時の通信確保に。',
    is_verified: true,
    created_at: '2026-09-01T00:00:00Z',
    updated_at: '2026-09-01T00:00:00Z',
    updated_by: 'system_preset'
  }
];

// 島ごとのキャリア電波メモ
export const DEFAULT_CELL_NOTES: Record<string, string> = {
  hachijojima: '集落内・港周辺は4G/5G快調。山間部・外海航路はdocomoが最も安定。',
  ishigakijima: '市街地・主要道路は全社5G/4G良好。山間部や北部海岸はdocomo・au推奨。',
  aogashima: '集落内（東台）はdocomo/au安定。カルデラ内（池之沢）は電波微弱エリアあり。',
  amami: '港・空港・名瀬市街は全社4G。マングローブ林や山間部・トンネルはdocomo推奨。'
};

// メモリ内データストア（運用中のホットリロード・即時反映用）
let activeWifiSpots: PublicWifiSpot[] = [...DEFAULT_WIFI_SPOTS];
let activeCellNotes: Record<string, string> = { ...DEFAULT_CELL_NOTES };

/**
 * GET: 指定した島、または全島のWi-Fiスポットおよび電波メモを取得
 */
export async function GET(req: NextRequest) {
  if (!await verifyAuth(req)) {
    return NextResponse.json({ error: '認証が必要です' }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const island_id = searchParams.get('island_id');

  // Supabaseからの取得試行
  try {
    if (SERVICE_ROLE_KEY && !SERVICE_ROLE_KEY.startsWith('REPLACE')) {
      const client = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
        auth: { autoRefreshToken: false, persistSession: false }
      });
      let query = client.from('island_public_wifi').select('*').order('created_at', { ascending: false });
      if (island_id) {
        query = query.eq('island_id', island_id);
      }
      const { data, error } = await query;
      if (!error && data && data.length > 0) {
        return NextResponse.json({
          spots: data,
          cell_notes: activeCellNotes,
          source: 'database'
        });
      }
    }
  } catch (err) {
    console.warn('[AdminWifiAPI] DB query failed, fallback to memory:', err);
  }

  const filteredSpots = island_id 
    ? activeWifiSpots.filter(s => s.island_id === island_id)
    : activeWifiSpots;

  return NextResponse.json({
    spots: filteredSpots,
    cell_notes: activeCellNotes,
    source: 'memory_store'
  });
}

/**
 * POST: 新規Wi-Fiスポットの追加 ＆ 監査ログ記録
 */
export async function POST(req: NextRequest) {
  if (!await verifyAuth(req)) {
    return NextResponse.json({ error: '認証が必要です' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const client = extractClientInfo(req);

    if (!body.island_id || !body.name || !body.ssid) {
      return NextResponse.json({ error: 'island_id, name, ssid は必須です' }, { status: 400 });
    }

    const newSpot: PublicWifiSpot = {
      id: `spot_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      island_id: body.island_id,
      name: body.name.trim(),
      location: body.location?.trim() || '館内・待合スペース',
      ssid: body.ssid.trim(),
      has_password: Boolean(body.has_password),
      password: body.password?.trim() || '',
      auth_method: body.auth_method?.trim() || 'ブラウザ認証 / 同意のみ',
      notes: body.notes?.trim() || '',
      is_verified: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      updated_by: body.operator_name || '弊社運営管理者 (Master Admin)'
    };

    // メモリストアへ保存
    activeWifiSpots.unshift(newSpot);

    // Supabase DBへの保存試行
    try {
      if (SERVICE_ROLE_KEY && !SERVICE_ROLE_KEY.startsWith('REPLACE')) {
        const adminClient = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
          auth: { autoRefreshToken: false, persistSession: false }
        });
        await adminClient.from('island_public_wifi').insert([newSpot]);
      }
    } catch (err) {
      console.warn('[AdminWifiAPI] Supabase insert warning:', err);
    }

    // 📜 監査ログの自動記録
    await logAuditEvent({
      actor: {
        role: 'super_admin',
        name: body.operator_name || 'Master Admin',
        org: 'プラットフォーム運営（弊社）'
      },
      client,
      action: 'WIFI_SPOT_CREATE',
      target: {
        resource_type: 'wifi_spot',
        resource_id: newSpot.id,
        island_id: newSpot.island_id,
        details: `新規公共Wi-Fi「${newSpot.name}」(SSID: ${newSpot.ssid}) を追加`
      },
      diff: {
        after: newSpot
      }
    });

    return NextResponse.json({ success: true, spot: newSpot });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || '作成エラー' }, { status: 500 });
  }
}

/**
 * PUT: 既存スポットの更新 または 電波メモの更新 ＆ 監査ログ記録
 */
export async function PUT(req: NextRequest) {
  if (!await verifyAuth(req)) {
    return NextResponse.json({ error: '認証が必要です' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const client = extractClientInfo(req);

    // 電波メモ更新の場合
    if (body.type === 'update_cell_note' && body.island_id) {
      const oldNote = activeCellNotes[body.island_id] || '';
      activeCellNotes[body.island_id] = body.cell_note || '';

      await logAuditEvent({
        actor: {
          role: 'super_admin',
          name: body.operator_name || 'Master Admin',
          org: 'プラットフォーム運営（弊社）'
        },
        client,
        action: 'CELL_NOTE_UPDATE',
        target: {
          resource_type: 'carrier_cell_note',
          island_id: body.island_id,
          details: `島「${body.island_id}」のキャリア電波目安を更新`
        },
        diff: {
          before: { cell_note: oldNote },
          after: { cell_note: body.cell_note }
        }
      });

      return NextResponse.json({ success: true, cell_note: body.cell_note });
    }

    // 通常のスポット更新の場合
    if (!body.id) {
      return NextResponse.json({ error: 'spot id は必須です' }, { status: 400 });
    }

    const index = activeWifiSpots.findIndex(s => s.id === body.id);
    if (index === -1) {
      return NextResponse.json({ error: '指定されたスポットが見つかりません' }, { status: 404 });
    }

    const oldSpot = { ...activeWifiSpots[index] };
    const updatedSpot: PublicWifiSpot = {
      ...oldSpot,
      name: body.name?.trim() || oldSpot.name,
      location: body.location?.trim() || oldSpot.location,
      ssid: body.ssid?.trim() || oldSpot.ssid,
      has_password: body.has_password !== undefined ? Boolean(body.has_password) : oldSpot.has_password,
      password: body.password !== undefined ? body.password.trim() : oldSpot.password,
      auth_method: body.auth_method?.trim() || oldSpot.auth_method,
      notes: body.notes !== undefined ? body.notes.trim() : oldSpot.notes,
      updated_at: new Date().toISOString(),
      updated_by: body.operator_name || '弊社運営管理者 (Master Admin)'
    };

    activeWifiSpots[index] = updatedSpot;

    // Supabase DBへの更新試行
    try {
      if (SERVICE_ROLE_KEY && !SERVICE_ROLE_KEY.startsWith('REPLACE')) {
        const adminClient = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
          auth: { autoRefreshToken: false, persistSession: false }
        });
        await adminClient.from('island_public_wifi').update(updatedSpot).eq('id', body.id);
      }
    } catch (err) {
      console.warn('[AdminWifiAPI] Supabase update warning:', err);
    }

    // 📜 監査ログの自動記録
    await logAuditEvent({
      actor: {
        role: 'super_admin',
        name: body.operator_name || 'Master Admin',
        org: 'プラットフォーム運営（弊社）'
      },
      client,
      action: 'WIFI_SPOT_UPDATE',
      target: {
        resource_type: 'wifi_spot',
        resource_id: updatedSpot.id,
        island_id: updatedSpot.island_id,
        details: `公共Wi-Fi「${updatedSpot.name}」(SSID: ${updatedSpot.ssid}) を更新`
      },
      diff: {
        before: oldSpot,
        after: updatedSpot
      }
    });

    return NextResponse.json({ success: true, spot: updatedSpot });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || '更新エラー' }, { status: 500 });
  }
}

/**
 * DELETE: スポットの削除 ＆ 監査ログ記録
 */
export async function DELETE(req: NextRequest) {
  if (!await verifyAuth(req)) {
    return NextResponse.json({ error: '認証が必要です' }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    const operator_name = searchParams.get('operator_name') || 'Master Admin';
    const client = extractClientInfo(req);

    if (!id) {
      return NextResponse.json({ error: 'id は必須です' }, { status: 400 });
    }

    const targetSpot = activeWifiSpots.find(s => s.id === id);
    if (!targetSpot) {
      return NextResponse.json({ error: '指定されたスポットが見つかりません' }, { status: 404 });
    }

    activeWifiSpots = activeWifiSpots.filter(s => s.id !== id);

    // Supabase DBからの削除試行
    try {
      if (SERVICE_ROLE_KEY && !SERVICE_ROLE_KEY.startsWith('REPLACE')) {
        const adminClient = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
          auth: { autoRefreshToken: false, persistSession: false }
        });
        await adminClient.from('island_public_wifi').delete().eq('id', id);
      }
    } catch (err) {
      console.warn('[AdminWifiAPI] Supabase delete warning:', err);
    }

    // 📜 監査ログの自動記録
    await logAuditEvent({
      actor: {
        role: 'super_admin',
        name: operator_name,
        org: 'プラットフォーム運営（弊社）'
      },
      client,
      action: 'WIFI_SPOT_DELETE',
      target: {
        resource_type: 'wifi_spot',
        resource_id: targetSpot.id,
        island_id: targetSpot.island_id,
        details: `公共Wi-Fi「${targetSpot.name}」(SSID: ${targetSpot.ssid}) を削除`
      },
      diff: {
        before: targetSpot
      }
    });

    return NextResponse.json({ success: true, deleted_id: id });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || '削除エラー' }, { status: 500 });
  }
}
