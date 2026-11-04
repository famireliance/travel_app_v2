import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getAuthUser } from '@/lib/adminAuth';
import { getFallbackJson } from '@/lib/adminConfigFallback';

const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;

export async function GET(req: NextRequest) {
  const user = await getAuthUser(req);
  if (!user) {
    return NextResponse.json({ error: '認証が必要です' }, { status: 401 });
  }

  if (!SERVICE_ROLE_KEY || SERVICE_ROLE_KEY === 'REPLACE_WITH_YOUR_SERVICE_ROLE_KEY') {
    return NextResponse.json({ error: 'SUPABASE_SERVICE_ROLE_KEY が未設定です' }, { status: 503 });
  }

  const adminClient = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false }
  });

  try {
    // 1. 全ユーザー情報 & プラン取得
    const { data: authData } = await adminClient.auth.admin.listUsers();
    const totalUsers = authData?.users?.length || 0;

    const { data: profiles } = await adminClient
      .from('user_profiles')
      .select('*');

    const premiumUsers = profiles?.filter((p: any) => p.subscription_tier === 'premium').length || 0;
    const ultimateUsers = profiles?.filter((p: any) => p.subscription_tier === 'ultimate').length || 0;
    const paidUsers = premiumUsers + ultimateUsers;
    const freeUsers = Math.max(0, totalUsers - paidUsers);
    const paidPlanRatio = totalUsers > 0 ? ((paidUsers / totalUsers) * 100).toFixed(1) : '0';

    // 2. 物理証明書オーダー集計
    let orders: any[] = [];
    try {
      const [{ data: physOrders }, { data: dbOrders }, shippingOv] = await Promise.all([
        adminClient.from('physical_orders').select('*').order('ordered_at', { ascending: false }),
        adminClient.from('orders').select('*').order('created_at', { ascending: false }),
        getFallbackJson<Record<string, any>>('fallback_order_shipping', {})
      ]);
      const combined = [...(physOrders || []), ...(dbOrders || [])];
      const seen = new Set<string>();
      orders = combined.filter(o => {
        if (seen.has(o.id)) return false;
        seen.add(o.id);
        return true;
      }).map(o => {
        const ov = shippingOv[o.id] || {};
        const rawStatus = ov.status ?? o.status ?? 'ordered';
        return {
          ...o,
          type: o.type || o.plan || 'standard',
          shipping_name: ov.shipping_name ?? o.shipping_name ?? o.recipient_name ?? o.traveler_name ?? '',
          ordered_at: o.ordered_at || o.created_at,
          status: (rawStatus === 'paid' || rawStatus === 'received') ? 'ordered' : rawStatus,
        };
      });
    } catch {
      orders = [];
    }

    const totalOrders = orders.length;
    const unshippedOrders = orders.filter(o => o.status === 'ordered' || o.status === 'processing').length;
    const pendingPaymentOrders = orders.filter(o => o.status === 'pending_payment').length;
    const shippedOrders = orders.filter(o => o.status === 'shipped' || o.status === 'delivered').length;

    // 価格定義マップ（概算用）
    const planPrices: Record<string, number> = {
      standard: 1500,
      frame_simple: 3000,
      frame_wood: 6000,
      frame_acrylic: 10000,
    };

    let physicalOrderRevenue = 0;
    orders.forEach(o => {
      if (o.status !== 'cancelled' && o.status !== 'pending_payment') {
        const planKey = o.type || o.plan || 'standard';
        physicalOrderRevenue += planPrices[planKey] || 1500;
      }
    });

    // 月額サブスクリプション概算 (Premium: ¥480, Ultimate: ¥980)
    const monthlySubscriptionRevenue = (premiumUsers * 480) + (ultimateUsers * 980);

    // 3. 島マスター数 & 投稿日記数 & お問い合わせ未読数
    const { count: islandCount } = await adminClient
      .from('islands')
      .select('*', { count: 'exact', head: true });

    const { count: diaryCount } = await adminClient
      .from('island_diaries')
      .select('*', { count: 'exact', head: true });

    let unhandledContacts = 0;
    try {
      const { count, error: contactErr } = await adminClient
        .from('contacts')
        .select('*', { count: 'exact', head: true })
        .neq('status', 'resolved');
      if (contactErr) {
        const fbContacts = await getFallbackJson<any[]>('fallback_contacts', []);
        unhandledContacts = fbContacts.filter((c: any) => c.status !== 'resolved').length;
      } else {
        unhandledContacts = count || 0;
      }
    } catch {
      unhandledContacts = 0;
    }

    // 直近5件の注文
    const recentOrders = (orders || []).slice(0, 5);

    // 直近5件の登録ユーザー
    const recentUsers = (authData?.users || [])
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .slice(0, 5)
      .map(u => {
        const prof: any = profiles?.find((p: any) => p.id === u.id);
        return {
          id: u.id,
          email: u.email,
          created_at: u.created_at,
          last_sign_in_at: u.last_sign_in_at,
          tier: prof?.subscription_tier || 'free',
          nickname: prof?.nickname || '名無し',
        };
      });

    return NextResponse.json({
      summary: {
        totalUsers,
        paidUsers,
        premiumUsers,
        ultimateUsers,
        freeUsers,
        paidPlanRatio,
        totalOrders,
        unshippedOrders,
        pendingPaymentOrders,
        shippedOrders,
        physicalOrderRevenue,
        monthlySubscriptionRevenue,
        islandCount: islandCount || 0,
        diaryCount: diaryCount || 0,
        unhandledContacts: unhandledContacts || 0,
      },
      recentOrders,
      recentUsers,
    });
  } catch (err: any) {
    console.error('Dashboard stats error:', err);
    return NextResponse.json({ error: err.message || 'ダッシュボードデータの取得に失敗しました' }, { status: 500 });
  }
}
