import { NextRequest, NextResponse } from 'next/server';
import { getWifiSpots, getCellNoteForIsland } from '@/lib/wifiStore';

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const islandId = id.toLowerCase();
    const [allSpots, cellNote] = await Promise.all([
      getWifiSpots(islandId),
      getCellNoteForIsland(islandId),
    ]);

    const spots = allSpots.map((s) => ({
      name: s.name,
      location: s.location,
      ssid: s.ssid,
      hasPassword: s.has_password,
      password: s.has_password ? s.password : undefined,
      authMethod: s.auth_method,
      note: s.notes,
    }));

    return NextResponse.json(
      { island_id: islandId, spots, cellNote },
      { headers: { 'Cache-Control': 'no-store' } }
    );
  } catch (err: any) {
    return NextResponse.json({ error: err.message || '取得エラー' }, { status: 500 });
  }
}
