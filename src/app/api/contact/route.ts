import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const CONTACT_EMAIL = process.env.CONTACT_EMAIL || 'support@kira-tabi.com';
const ADMIN_EMAILS = process.env.ADMIN_EMAILS;
const RESEND_API_KEY = process.env.RESEND_API_KEY;

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export async function POST(req: NextRequest) {
  try {
    const { name, email, category, message } = await req.json();

    if (!name || !email || !message) {
      return NextResponse.json({ error: '必須項目が未入力です' }, { status: 400 });
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

    // 1. Save to Supabase DB
    if (SUPABASE_URL && SUPABASE_SERVICE_KEY && SUPABASE_SERVICE_KEY !== 'REPLACE_WITH_YOUR_SERVICE_ROLE_KEY') {
      const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
      const { error: dbError } = await supabase.from('contacts').insert({
        name,
        email,
        category,
        message,
        status: 'unread'
      });
      if (dbError) {
        console.error('Failed to save contact to DB:', dbError);
      }
    }

    // 2. Send email via Resend
    if (RESEND_API_KEY) {
      // Determine recipients
      let toEmails = [CONTACT_EMAIL];
      if (ADMIN_EMAILS) {
        toEmails = ADMIN_EMAILS.split(',').map(e => e.trim()).filter(e => e.length > 0);
      }

      const emailBody = {
        from: 'KIRATABI <noreply@kira-tabi.com>',
        to: toEmails,
        reply_to: email,
        subject: `[KIRATABI お問い合わせ] ${categoryLabel} - ${name}様より`,
        html: `
          <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #1e40af; border-bottom: 2px solid #1e40af; padding-bottom: 8px;">KIRATABI お問い合わせ</h2>
            <table style="width: 100%; border-collapse: collapse; margin-top: 16px;">
              <tr style="background: #f1f5f9;">
                <td style="padding: 10px; font-weight: bold; width: 30%;">お名前</td>
                <td style="padding: 10px;">${name}</td>
              </tr>
              <tr>
                <td style="padding: 10px; font-weight: bold;">メールアドレス</td>
                <td style="padding: 10px;"><a href="mailto:${email}">${email}</a></td>
              </tr>
              <tr style="background: #f1f5f9;">
                <td style="padding: 10px; font-weight: bold;">種類</td>
                <td style="padding: 10px;">${categoryLabel}</td>
              </tr>
              <tr>
                <td style="padding: 10px; font-weight: bold;">内容</td>
                <td style="padding: 10px; white-space: pre-wrap;">${message}</td>
              </tr>
            </table>
            <p style="color: #94a3b8; font-size: 12px; margin-top: 24px;">このメールはKIRATABIのお問い合わせフォームより自動送信されました。</p>
          </div>
        `,
      };

      const resendRes = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${RESEND_API_KEY}`,
        },
        body: JSON.stringify(emailBody),
      });

      if (!resendRes.ok) {
        const err = await resendRes.json();
        console.error('Resend error:', err);
      }
    } else {
      console.log('[CONTACT FORM SUBMISSION (No Resend API Key)]', { name, email, category: categoryLabel, message });
    }

    return NextResponse.json({ success: true });

  } catch (err) {
    console.error('Contact form error:', err);
    return NextResponse.json({ error: '送信処理中にエラーが発生しました' }, { status: 500 });
  }
}
