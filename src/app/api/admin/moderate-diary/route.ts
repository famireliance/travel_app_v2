import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getAuthUser } from '@/lib/adminAuth';
import { getFallbackJson, setFallbackJson } from '@/lib/adminConfigFallback';

const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const HIDDEN_DIARIES_KEY = 'fallback_hidden_diaries';

export async function POST(req: NextRequest) {
  const user = await getAuthUser(req);
  if (!user) {
    return NextResponse.json({ error: '認証エラー' }, { status: 401 });
  }
  if (user.role === 'viewer') {
    return NextResponse.json({ error: '閲覧専用アカウントのため変更操作はできません' }, { status: 403 });
  }
  if (!SERVICE_ROLE_KEY || SERVICE_ROLE_KEY.startsWith('REPLACE')) {
    return NextResponse.json({ error: 'SERVICE_ROLE_KEY未設定' }, { status: 503 });
  }

  const { diaryId, action } = await req.json(); // action: 'hide' | 'show' | 'delete'
  if (!diaryId || !['hide', 'show', 'delete'].includes(action)) {
    return NextResponse.json({ error: '無効なパラメータです' }, { status: 400 });
  }

  const client = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false }
  });

  if (action === 'delete') {
    const { error } = await client.from('island_diaries').delete().eq('id', diaryId);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    const hiddenIds = await getFallbackJson<string[]>(HIDDEN_DIARIES_KEY, []);
    if (Array.isArray(hiddenIds) && hiddenIds.includes(String(diaryId))) {
      await setFallbackJson(
        HIDDEN_DIARIES_KEY,
        hiddenIds.filter((id) => id !== String(diaryId))
      );
    }

    return NextResponse.json({ success: true, message: '日記を削除しました' });
  }

  const shouldHide = action === 'hide';
  const { error } = await client
    .from('island_diaries')
    .update({ is_hidden: shouldHide })
    .eq('id', diaryId);

  if (error) {
    // Fallback when is_hidden column does not exist on island_diaries: persist hidden IDs in admin_config
    const hiddenIds = await getFallbackJson<string[]>(HIDDEN_DIARIES_KEY, []);
    const hiddenSet = new Set(Array.isArray(hiddenIds) ? hiddenIds.map(String) : []);
    if (shouldHide) {
      hiddenSet.add(String(diaryId));
    } else {
      hiddenSet.delete(String(diaryId));
    }
    const saved = await setFallbackJson(HIDDEN_DIARIES_KEY, Array.from(hiddenSet));
    if (!saved) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
  }

  return NextResponse.json({
    success: true,
    message: shouldHide ? '日記を非表示にしました' : '日記を表示に戻しました',
  });
}
