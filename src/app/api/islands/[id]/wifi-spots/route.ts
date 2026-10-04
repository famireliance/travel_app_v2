import { NextRequest, NextResponse } from 'next/server';
import { DEFAULT_WIFI_SPOTS, DEFAULT_CELL_NOTES } from '@/app/api/admin/wifi-spots/route';
import { createClient } from '@supabase/supabase-js';

const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const islandId = id.toLowerCase();

    // 1. Supabase DBから取得試行
    try {
      if (SERVICE_ROLE_KEY && !SERVICE_ROLE_KEY.startsWith('REPLACE')) {
        const client = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
          auth: { autoRefreshToken: false, persistSession: false }
        });
        const { data, error } = await client
          .from('island_public_wifi')
          .select('*')
          .eq('island_id', islandId);

        if (!error && data && data.length > 0) {
          const cellNote = DEFAULT_CELL_NOTES[islandId] || '港・集落周辺は電波良好。山間部はdocomo推奨。';
          return NextResponse.json({
            island_id: islandId,
            spots: data.map(s => ({
              name: s.name,
              location: s.location,
              ssid: s.ssid,
              hasPassword: Boolean(s.has_password),
              password: s.password || '',
              authMethod: s.auth_method,
              note: s.notes
            })),
            cellNote,
            source: 'db'
          });
        }
      }
    } catch (err) {
      console.warn('[PublicWifiAPI] DB fetch failed, fallback to defaults:', err);
    }

    // 2. 内部プリセットから該当島のスポットを検索
    const matchedSpots = DEFAULT_WIFI_SPOTS.filter(s => s.island_id === islandId);
    const cellNote = DEFAULT_CELL_NOTES[islandId] || '集落内・港周辺は4G/5G快調。山間部・外海航路はdocomo推奨。';

    return NextResponse.json({
      island_id: islandId,
      spots: matchedSpots.map(s => ({
        name: s.name,
        location: s.location,
        ssid: s.ssid,
        hasPassword: s.has_password,
        password: s.password,
        authMethod: s.auth_method,
        note: s.notes
      })),
      cellNote,
      source: 'preset'
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || '取得エラー' }, { status: 500 });
  }
}
