import { NextRequest, NextResponse } from 'next/server';
import { getWifiStore } from '@/lib/wifiStore';

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const islandId = id.toLowerCase();
    const store = getWifiStore();
    // 管理画面で編集した内容（共通ストア）を単一の真実として返す。
    // 該当なしの島はクライアント側の地域プリセットにフォールバックさせる。
    const spots = store.spots
      .filter(s => s.island_id === islandId)
      .map(s => ({
        name: s.name,
        location: s.location,
        ssid: s.ssid,
        hasPassword: s.has_password,
        password: s.has_password ? s.password : undefined,
        authMethod: s.auth_method,
        note: s.notes,
      }));
    return NextResponse.json(
      { island_id: islandId, spots, cellNote: store.cellNotes[islandId] || null },
      { headers: { 'Cache-Control': 'no-store' } }
    );
  } catch (err: any) {
    return NextResponse.json({ error: err.message || '取得エラー' }, { status: 500 });
  }
}
