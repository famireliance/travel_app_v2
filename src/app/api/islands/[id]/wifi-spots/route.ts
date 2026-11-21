import { NextRequest, NextResponse } from 'next/server';
import { getWifiSpots, getCellNoteForIsland } from '@/lib/wifiStore';
import { verifyUserAuth } from '@/lib/userAuth';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const islandId = id.toLowerCase();
    const auth = await verifyUserAuth(req);
    const isAuthenticated = Boolean(auth.user);

    const [allSpots, cellNote] = await Promise.all([
      getWifiSpots(islandId),
      getCellNoteForIsland(islandId),
    ]);

    const spots = allSpots.map((s) => ({
      name: s.name,
      location: s.location,
      ssid: s.ssid,
      has_password: Boolean(s.has_password),
      hasPassword: Boolean(s.has_password),
      ...(isAuthenticated && s.has_password ? { password: s.password } : {}),
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
