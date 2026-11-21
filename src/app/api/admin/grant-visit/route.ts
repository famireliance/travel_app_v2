import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getAuthUser } from '@/lib/adminAuth';
import { ALL_ISLANDS_MASTER_DICTIONARY } from '@/data/allIslandsMaster';

const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;

const GRANT_ISLAND_ALIASES: Record<string, string> = {
  ishigaki: '392',
  ishigakijima: '392',
  miyako: '386',
  miyakojima: '386',
  hachijo: '56',
  hachijojima: '56',
  aogashima: '58',
  chichijima: '63',
  chichijimaogasawarashoto: '63',
  hahajima: '64',
  hahajimaogasawarashoto: '64',
  oshima: '49',
  izuoshima: '49',
  toshima: '50',
  nijima: '51',
  niijima: '51',
  shikine: '52',
  shikinejima: '52',
  kozushima: '53',
  miyake: '54',
  miyakejima: '54',
  mikura: '55',
  mikurajima: '55',
  amami: '352',
  amamioshima: '352',
  taketomi: '393',
  taketomijima: '393',
  kohama: '394',
  kohamajima: '394',
  iriomote: '396',
  iriomotejima: '396',
  hateruma: '400',
  haterumajima: '400',
  yonaguni: '401',
  yonagunijima: '401',
  kume: '380',
  kumejima: '380',
  yakushima: '340',
  tanegashima: '339',
  yoron: '359',
  yoronto: '359',
  tokunoshima: '357',
  shodoshima: '197',
  naoshima: '195',
  sado: '76',
  sadoto: '76',
  iki: '258',
  ikishima: '258',
  tsushima: '252',
  rebun: '1',
  rebunto: '1',
  rishiri: '2',
  rishirito: '2',
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function resolveCanonicalIsland(rawIslandId: string): { id: string; name: string } | null {
  const trimmed = String(rawIslandId || '').trim();
  const lower = trimmed.toLowerCase();
  if (!trimmed) return null;

  if (ALL_ISLANDS_MASTER_DICTIONARY[trimmed]) {
    const entry = ALL_ISLANDS_MASTER_DICTIONARY[trimmed];
    return { id: String(entry.id), name: entry.name };
  }

  const aliasId = GRANT_ISLAND_ALIASES[lower];
  if (aliasId && ALL_ISLANDS_MASTER_DICTIONARY[aliasId]) {
    const entry = ALL_ISLANDS_MASTER_DICTIONARY[aliasId];
    return { id: String(entry.id), name: entry.name };
  }

  const exact = Object.values(ALL_ISLANDS_MASTER_DICTIONARY).find(
    (i: any) =>
      String(i.slug || '').toLowerCase() === lower ||
      String(i.name || '') === trimmed ||
      String(i.name || '').startsWith(`${trimmed}（`)
  );
  if (exact) {
    return { id: String(exact.id), name: exact.name };
  }

  if (lower.length >= 2) {
    const partial = Object.values(ALL_ISLANDS_MASTER_DICTIONARY).find(
      (i: any) => String(i.slug || '').toLowerCase().startsWith(lower) || String(i.name || '').includes(trimmed)
    );
    if (partial) {
      return { id: String(partial.id), name: partial.name };
    }
  }

  return null;
}

export async function POST(req: NextRequest) {
  const user = await getAuthUser(req);
  if (!user) {
    return NextResponse.json({ error: '認証が必要です' }, { status: 401 });
  }
  if (user.role === 'viewer') {
    return NextResponse.json({ error: '閲覧専用アカウントのため変更操作はできません' }, { status: 403 });
  }
  if (!SERVICE_ROLE_KEY || SERVICE_ROLE_KEY === 'REPLACE_WITH_YOUR_SERVICE_ROLE_KEY') {
    return NextResponse.json({ error: 'SUPABASE_SERVICE_ROLE_KEY が未設定です' }, { status: 503 });
  }

  const body = await req.json();
  const { userId, islandId, status, visitedAt, note } = body;

  if (!userId || !islandId || !status) {
    return NextResponse.json({ error: 'userId, islandId, status は必須です' }, { status: 400 });
  }

  const validStatuses = ['visited', 'verified_visited', 'planning'];
  if (!validStatuses.includes(status)) {
    return NextResponse.json({ error: '無効なステータスです' }, { status: 400 });
  }

  const adminClient = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false }
  });

  let resolved = resolveCanonicalIsland(islandId);
  if (!resolved) {
    const cleanInput = String(islandId).replace(/[,()*%\\'"]/g, '').trim();
    if (cleanInput) {
      const { data: dbMatch } = await adminClient
        .from('islands')
        .select('id, name')
        .or(`id.eq.${cleanInput},slug.eq.${cleanInput},name.eq.${cleanInput}`)
        .maybeSingle();
      if (dbMatch) {
        resolved = { id: String(dbMatch.id), name: dbMatch.name || String(dbMatch.id) };
      }
    }
  }

  if (!resolved) {
    return NextResponse.json({ error: `指定された島「${islandId}」が見つかりません` }, { status: 400 });
  }

  const canonicalIslandId = resolved.id;

  const { error } = await adminClient
    .from('island_visits')
    .upsert({
      user_id: userId,
      island_id: canonicalIslandId,
      status,
      visited_at: visitedAt || new Date().toISOString(),
    }, { onConflict: 'user_id,island_id' });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // 付与ログを admin_grants テーブルに記録（テーブルがなければスキップ）
  try {
    await adminClient.from('admin_grants').insert({
      user_id: userId,
      island_id: canonicalIslandId,
      status,
      visited_at: visitedAt || new Date().toISOString(),
      note: note || '',
      granted_at: new Date().toISOString(),
    });
  } catch {
    // admin_grants テーブルが存在しない場合は無視
  }

  return NextResponse.json({
    success: true,
    islandId: canonicalIslandId,
    message: `${resolved.name} (ID: ${canonicalIslandId}) の到達記録を付与しました`,
  });
}
