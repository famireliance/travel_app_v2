import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getAuthUser, isSuperAdmin } from '@/lib/adminAuth';
import { getFallbackJson, setFallbackJson } from '@/lib/adminConfigFallback';

export const maxDuration = 60;

function getSupabaseAdmin() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !supabaseKey || supabaseKey.startsWith('REPLACE')) {
    return null;
  }
  return createClient(supabaseUrl, supabaseKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

export async function GET(request: NextRequest) {
  try {
    const user = await getAuthUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    if (!isSuperAdmin(user)) {
      return NextResponse.json({ error: '最高管理者権限が必要です' }, { status: 403 });
    }

    const supabase = getSupabaseAdmin();
    if (!supabase) {
      return NextResponse.json({ error: 'SUPABASE_SERVICE_ROLE_KEY が未設定です' }, { status: 503 });
    }

    const [codesRes, historyRes] = await Promise.all([
      supabase.from('app_promo_codes').select('id, code, reward_amount').order('created_at', { ascending: false }),
      supabase.from('newsletters').select('*, app_promo_codes(code)').order('sent_at', { ascending: false }).limit(10),
    ]);

    let promoCodes = !codesRes.error && Array.isArray(codesRes.data) ? codesRes.data : null;
    if (!promoCodes) {
      const fbCodes = await getFallbackJson<any[]>('fallback_promo_codes', []);
      promoCodes = Array.isArray(fbCodes) ? fbCodes : [];
    }

    let history = !historyRes.error && Array.isArray(historyRes.data) ? historyRes.data : null;
    if (!history) {
      const fbHistory = await getFallbackJson<any[]>('fallback_newsletters', []);
      history = (Array.isArray(fbHistory) ? fbHistory : []).slice(0, 10);
    }

    return NextResponse.json({
      promoCodes,
      history,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    // 1. Verify admin session / password
    const user = await getAuthUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    if (user.role === 'viewer') {
      return NextResponse.json({ error: '閲覧専用アカウントのため変更操作はできません' }, { status: 403 });
    }
    if (!isSuperAdmin(user)) {
      return NextResponse.json({ error: '最高管理者権限が必要です' }, { status: 403 });
    }

    const supabase = getSupabaseAdmin();
    if (!supabase) {
      return NextResponse.json({ error: 'SUPABASE_SERVICE_ROLE_KEY が未設定です' }, { status: 503 });
    }

    let reqBody: any;
    try {
      reqBody = await request.json();
    } catch {
      return NextResponse.json({ error: '不正なリクエスト形式です' }, { status: 400 });
    }

    const { subject, body, targetTier, promoCodeId } = reqBody || {};

    if (!subject || !body || !targetTier) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const resendApiKey = process.env.RESEND_API_KEY;
    const fromEmail = process.env.RESEND_FROM_EMAIL || 'KIRATABI <noreply@kira-tabi.com>';

    if (!resendApiKey || resendApiKey.startsWith('REPLACE')) {
      return NextResponse.json({ error: 'RESEND_API_KEY が未設定のためメール配信できません' }, { status: 503 });
    }

    // 2. Fetch target users (auth.users + user_profiles, treating null/missing subscription_tier as 'free')
    const [{ data: authData, error: authError }, { data: profiles, error: profileError }] = await Promise.all([
      supabase.auth.admin.listUsers({ page: 1, perPage: 1000 }),
      supabase.from('user_profiles').select('id, subscription_tier'),
    ]);

    if (authError) {
      throw new Error(`Failed to fetch auth users: ${authError.message}`);
    }
    if (profileError) {
      throw new Error(`Failed to fetch profiles: ${profileError.message}`);
    }

    const tierByUserId = new Map<string, string>();
    for (const p of profiles || []) {
      tierByUserId.set(p.id, p.subscription_tier || 'free');
    }

    const targetUsers = (authData?.users || []).filter((u) => {
      if (!u.email) return false;
      const effectiveTier = tierByUserId.get(u.id) || 'free';
      if (targetTier === 'all') return true;
      return effectiveTier === targetTier;
    });

    const emails = targetUsers.map((u) => u.email as string);

    if (emails.length === 0) {
      return NextResponse.json({ message: 'No users found for this target.', sentCount: 0 });
    }

    // 3. Send emails in batches of 50 via Resend BCC
    const BATCH_SIZE = 50;
    let sentCount = 0;
    let lastResendError = '';

    for (let i = 0; i < emails.length; i += BATCH_SIZE) {
      const batch = emails.slice(i, i + BATCH_SIZE);

      try {
        const resendRes = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${resendApiKey}`,
          },
          body: JSON.stringify({
            from: fromEmail,
            to: fromEmail, // Send to self, BCC to users to protect privacy
            bcc: batch,
            subject,
            text: body,
          }),
          signal: AbortSignal.timeout(8000),
        });

        if (!resendRes.ok) {
          const errText = await resendRes.text().catch(() => resendRes.statusText);
          let parsedErr: any = null;
          try {
            parsedErr = JSON.parse(errText);
          } catch {}
          lastResendError = parsedErr?.message || parsedErr?.error || errText || `Resend HTTP ${resendRes.status}`;
          console.error(`Resend API Error on batch ${i}:`, lastResendError);
        } else {
          sentCount += batch.length;
        }
      } catch (fetchErr: any) {
        lastResendError = fetchErr?.message || 'Resend timeout';
        console.error(`Resend fetch timeout/error on batch ${i}:`, fetchErr);
      }
    }

    if (sentCount === 0) {
      return NextResponse.json(
        { error: `メール送信に失敗しました: ${lastResendError || 'Resend API Error'}`, sentCount: 0 },
        { status: 502 }
      );
    }

    // 4. Save delivery history (with admin_config fallback if newsletters table does not exist)
    const historyRecord = {
      id: crypto.randomUUID(),
      subject,
      body,
      target_tier: targetTier,
      sent_count: sentCount,
      promo_code_id: promoCodeId || null,
      sent_at: new Date().toISOString(),
    };

    const { error: insertError } = await supabase.from('newsletters').insert({
      subject,
      body,
      target_tier: targetTier,
      sent_count: sentCount,
      promo_code_id: promoCodeId || null,
    });

    if (insertError) {
      const fbHistory = await getFallbackJson<any[]>('fallback_newsletters', []);
      const nextHistory = [historyRecord, ...(Array.isArray(fbHistory) ? fbHistory : [])].slice(0, 50);
      await setFallbackJson('fallback_newsletters', nextHistory);
    }

    return NextResponse.json({
      message: 'Newsletter sent successfully',
      sentCount,
    });
  } catch (error: any) {
    console.error('Newsletter sending error:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
