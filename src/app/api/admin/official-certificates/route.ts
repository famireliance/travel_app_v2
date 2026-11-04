import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getAuthUser } from '@/lib/adminAuth';
import { getFallbackJson, setFallbackJson } from '@/lib/adminConfigFallback';

const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;

async function verifyAuth(req: NextRequest) {
  const user = await getAuthUser(req);
  return !!user;
}

// 公的証明書の設定を取得・更新・販売期間延長を行うAPI
export async function GET(req: NextRequest) {
  if (!await verifyAuth(req)) {
    return NextResponse.json({ error: '認証が必要です' }, { status: 401 });
  }

  const adminClient = createClient(SUPABASE_URL, SERVICE_ROLE_KEY!, {
    auth: { autoRefreshToken: false, persistSession: false }
  });

  const { searchParams } = new URL(req.url);
  const islandId = searchParams.get('islandId');

  try {
    let query = adminClient.from('islands').select('*');

    if (islandId) {
      query = query.eq('id', islandId);
    }

    const [{ data: rawIslands, error }, fbOverrides] = await Promise.all([
      query,
      getFallbackJson<Record<string, any>>('fallback_official_certs', {})
    ]);
    if (error) throw error;

    const islands = (rawIslands || []).map((i: any) => {
      const ov = fbOverrides[i.id] || {};
      return {
        id: i.id,
        name: i.name,
        prefecture: i.prefecture,
        official_cert_enabled: ov.official_cert_enabled ?? i.official_cert_enabled ?? false,
        official_org_name: ov.official_org_name ?? i.official_org_name ?? null,
        official_seal_url: ov.official_seal_url ?? i.official_seal_url ?? null,
        official_cert_price: ov.official_cert_price ?? i.official_cert_price ?? 3000,
        official_sales_start_at: ov.official_sales_start_at ?? i.official_sales_start_at ?? null,
        official_sales_end_at: ov.official_sales_end_at ?? i.official_sales_end_at ?? null,
        official_template_id: ov.official_template_id ?? i.official_template_id ?? 'standard',
      };
    });

    return NextResponse.json({ islands });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || '取得に失敗しました' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  const user = await getAuthUser(req);
  if (!user) {
    return NextResponse.json({ error: '認証が必要です' }, { status: 401 });
  }
  if (user.role === 'viewer') {
    return NextResponse.json({ error: '閲覧専用アカウントのため変更操作はできません' }, { status: 403 });
  }

  const adminClient = createClient(SUPABASE_URL, SERVICE_ROLE_KEY!, {
    auth: { autoRefreshToken: false, persistSession: false }
  });

  try {
    const body = await req.json();
    const {
      islandId,
      official_cert_enabled,
      official_org_name,
      official_seal_url,
      official_cert_price,
      official_sales_start_at,
      official_sales_end_at,
      official_template_id,
      extendDays
    } = body;

    if (!islandId) {
      return NextResponse.json({ error: 'islandId が必要です' }, { status: 400 });
    }

    const { data: currentIsland, error: findErr } = await adminClient
      .from('islands')
      .select('*')
      .eq('id', islandId)
      .single();

    if (findErr || !currentIsland) {
      return NextResponse.json({ error: '指定された島が見つかりません' }, { status: 404 });
    }

    const fbOverrides = await getFallbackJson<Record<string, any>>('fallback_official_certs', {});
    const existingOv = fbOverrides[islandId] || {};

    const updateData: Record<string, any> = {};

    if (official_cert_enabled !== undefined) updateData.official_cert_enabled = official_cert_enabled;
    if (official_org_name !== undefined) updateData.official_org_name = official_org_name;
    if (official_seal_url !== undefined) updateData.official_seal_url = official_seal_url;
    if (official_cert_price !== undefined) {
      const price = Number(official_cert_price);
      if (isNaN(price) || price < 0) {
        return NextResponse.json({ error: '無効な価格設定です' }, { status: 400 });
      }
      updateData.official_cert_price = price;
    }
    if (official_sales_start_at !== undefined) updateData.official_sales_start_at = official_sales_start_at;
    if (official_template_id !== undefined) updateData.official_template_id = official_template_id;

    // 期間延長処理
    if (extendDays && typeof extendDays === 'number' && extendDays > 0) {
      const rawEnd = existingOv.official_sales_end_at ?? currentIsland?.official_sales_end_at;
      const existingEnd = rawEnd ? new Date(rawEnd) : null;
      const baseDate = existingEnd && existingEnd.getTime() > Date.now() ? existingEnd : new Date();
      baseDate.setDate(baseDate.getDate() + extendDays);
      updateData.official_sales_end_at = baseDate.toISOString();
    } else if (official_sales_end_at !== undefined) {
      updateData.official_sales_end_at = official_sales_end_at;
    }

    const { data: updatedIsland, error } = await adminClient
      .from('islands')
      .update(updateData)
      .eq('id', islandId)
      .select()
      .single();

    let finalIsland = updatedIsland;
    if (error) {
      // Fallback: save in admin_config when official_* columns haven't been added to islands yet
      const mergedOv = { ...existingOv, ...updateData };
      fbOverrides[islandId] = mergedOv;
      await setFallbackJson('fallback_official_certs', fbOverrides);
      finalIsland = {
        ...currentIsland,
        official_cert_enabled: mergedOv.official_cert_enabled ?? false,
        official_org_name: mergedOv.official_org_name ?? null,
        official_seal_url: mergedOv.official_seal_url ?? null,
        official_cert_price: mergedOv.official_cert_price ?? 3000,
        official_sales_start_at: mergedOv.official_sales_start_at ?? null,
        official_sales_end_at: mergedOv.official_sales_end_at ?? null,
        official_template_id: mergedOv.official_template_id ?? 'standard',
      };
    }

    return NextResponse.json({
      success: true,
      message: `「${finalIsland.name}」の公的証明書設定を更新しました（販売終了: ${finalIsland.official_sales_end_at ? new Date(finalIsland.official_sales_end_at).toLocaleDateString('ja-JP') : '無制限'}）`,
      island: finalIsland
    });
  } catch (err: any) {
    console.error('[official-certificates PUT]', err);
    return NextResponse.json({ error: '証明書設定の更新に失敗しました' }, { status: 500 });
  }
}
