import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getFallbackJson, setFallbackJson } from '@/lib/adminConfigFallback';

const CONTACT_EMAIL = process.env.CONTACT_EMAIL || 'support@kira-tabi.com';
const ADMIN_EMAILS = process.env.ADMIN_EMAILS;
const RESEND_API_KEY = process.env.RESEND_API_KEY;

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

function escapeHtml(str: string): string {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const RATE_LIMIT_WINDOW_MS = 10 * 60 * 1000; // 10 minutes
const RATE_LIMIT_MAX = 5;
const contactRateMap = new Map<string, number[]>();

function getClientIp(req: NextRequest): string {
  const forwarded = req.headers.get('x-forwarded-for');
  if (forwarded) return forwarded.split(',')[0].trim();
  return req.headers.get('x-real-ip') || '127.0.0.1';
}

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const timestamps = (contactRateMap.get(ip) || []).filter((ts) => now - ts < RATE_LIMIT_WINDOW_MS);
  if (timestamps.length >= RATE_LIMIT_MAX) {
    contactRateMap.set(ip, timestamps);
    return true;
  }
  timestamps.push(now);
  contactRateMap.set(ip, timestamps);
  if (contactRateMap.size > 1000) {
    for (const [k, v] of contactRateMap.entries()) {
      const active = v.filter((ts) => now - ts < RATE_LIMIT_WINDOW_MS);
      if (active.length === 0) contactRateMap.delete(k);
      else contactRateMap.set(k, active);
    }
  }
  return false;
}

export async function POST(req: NextRequest) {
  try {
    const clientIp = getClientIp(req);
    if (isRateLimited(clientIp)) {
      return NextResponse.json(
        { error: '送信回数が上限に達しました。しばらく時間をおいて再度お試しください。' },
        { status: 429 }
      );
    }

    let body: any;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ error: '不正なリクエスト形式です' }, { status: 400 });
    }

    const name = typeof body?.name === 'string' ? body.name.trim() : '';
    const email = typeof body?.email === 'string' ? body.email.trim() : '';
    const category = typeof body?.category === 'string' ? body.category.trim().slice(0, 50) : 'general';
    const message = typeof body?.message === 'string' ? body.message.trim() : '';

    if (!name || !email || !message) {
      return NextResponse.json({ error: '必須項目が未入力です' }, { status: 400 });
    }
    if (name.length > 100) {
      return NextResponse.json({ error: 'お名前は100文字以内で入力してください' }, { status: 400 });
    }
    if (email.length > 254 || !EMAIL_REGEX.test(email)) {
      return NextResponse.json({ error: '有効なメールアドレスを入力してください' }, { status: 400 });
    }
    if (message.length > 5000) {
      return NextResponse.json({ error: 'お問い合わせ内容は5000文字以内で入力してください' }, { status: 400 });
    }

    const categoryLabels: Record<string, string> = {
      general: '一般的なご質問',
      bug: '不具合・バグ報告',
      checkin: 'チェックイン・位置情報について',
      subscription: 'サブスクリプション・お支払いについて',
      certificate: '証明書・特典について',
      other: 'その他',
    };
    const categoryLabel = categoryLabels[category] || category;

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const resendApiKey = process.env.RESEND_API_KEY;

    let savedToDb = false;
    let sentViaResend = false;

    // 1. Save to Supabase DB (or fallback_contacts in admin_config if table not created yet)
    if (supabaseUrl && supabaseServiceKey && !supabaseServiceKey.startsWith('REPLACE')) {
      const supabase = createClient(supabaseUrl, supabaseServiceKey, {
        auth: { autoRefreshToken: false, persistSession: false },
      });
      const { error: dbError } = await supabase.from('contacts').insert({
        name,
        email,
        category,
        message,
        status: 'unread'
      });
      if (!dbError) {
        savedToDb = true;
      } else {
        const rawList = await getFallbackJson<any[]>('fallback_contacts', []);
        const list = Array.isArray(rawList) ? rawList : [];
        list.unshift({
          id: crypto.randomUUID(),
          name,
          email,
          category,
          message,
          status: 'unread',
          admin_note: '',
          reply_text: '',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        });
        savedToDb = await setFallbackJson('fallback_contacts', list);
      }
    }

    // 2. Send email via Resend
    if (resendApiKey && !resendApiKey.startsWith('REPLACE')) {
      // Determine recipients
      let toEmails = [CONTACT_EMAIL];
      if (ADMIN_EMAILS) {
        toEmails = ADMIN_EMAILS.split(',').map(e => e.trim()).filter(e => e.length > 0);
      }

      const safeName = escapeHtml(name);
      const safeEmail = escapeHtml(email);
      const safeCategoryLabel = escapeHtml(categoryLabel);
      const safeMessage = escapeHtml(message);

      const fromEmail = process.env.RESEND_FROM_EMAIL || 'KIRATABI <noreply@kira-tabi.com>';
      const emailBody = {
        from: fromEmail,
        to: toEmails,
        reply_to: email,
        subject: `[KIRATABI お問い合わせ] ${categoryLabel} - ${name}様より`,
        html: `
          <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #1e40af; border-bottom: 2px solid #1e40af; padding-bottom: 8px;">KIRATABI お問い合わせ</h2>
            <table style="width: 100%; border-collapse: collapse; margin-top: 16px;">
              <tr style="background: #f1f5f9;">
                <td style="padding: 10px; font-weight: bold; width: 30%;">お名前</td>
                <td style="padding: 10px;">${safeName}</td>
              </tr>
              <tr>
                <td style="padding: 10px; font-weight: bold;">メールアドレス</td>
                <td style="padding: 10px;"><a href="mailto:${safeEmail}">${safeEmail}</a></td>
              </tr>
              <tr style="background: #f1f5f9;">
                <td style="padding: 10px; font-weight: bold;">種類</td>
                <td style="padding: 10px;">${safeCategoryLabel}</td>
              </tr>
              <tr>
                <td style="padding: 10px; font-weight: bold;">内容</td>
                <td style="padding: 10px; white-space: pre-wrap;">${safeMessage}</td>
              </tr>
            </table>
            <p style="color: #94a3b8; font-size: 12px; margin-top: 24px;">このメールはKIRATABIのお問い合わせフォームより自動送信されました。</p>
          </div>
        `,
      };

      try {
        const resendRes = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${resendApiKey}`,
          },
          body: JSON.stringify(emailBody),
          signal: AbortSignal.timeout(8000),
        });

        if (!resendRes.ok) {
          const errText = await resendRes.text().catch(() => '');
          console.error('Resend error:', errText);
        } else {
          sentViaResend = true;
        }
      } catch (resendErr) {
        console.error('Resend request failed:', resendErr);
      }
    }

    if (!savedToDb && !sentViaResend) {
      return NextResponse.json(
        { error: '現在お問い合わせサービスが一時的に利用できません。時間をおいて再度お試しください。' },
        { status: 503 }
      );
    }

    return NextResponse.json({ success: true });

  } catch (err) {
    console.error('Contact form error:', err);
    return NextResponse.json({ error: '送信処理中にエラーが発生しました' }, { status: 500 });
  }
}
