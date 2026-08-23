import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!; // Must use service role to read auth.users
const supabase = createClient(supabaseUrl, supabaseKey);

const RESEND_API_KEY = process.env.RESEND_API_KEY!;
const FROM_EMAIL = process.env.RESEND_FROM_EMAIL || 'KIRATABI Admin <onboarding@resend.dev>';

export async function POST(request: Request) {
  try {
    // 1. Verify admin password
    const adminPassword = request.headers.get('x-admin-password');
    if (adminPassword !== process.env.ADMIN_PASSWORD) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { subject, body, targetTier, promoCodeId } = await request.json();

    if (!subject || !body || !targetTier) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    if (!RESEND_API_KEY) {
      return NextResponse.json({ error: 'RESEND_API_KEY is not configured' }, { status: 500 });
    }

    // 2. Fetch target users
    // auth.users holds emails, but subscription_tier is in user_profiles.
    // We fetch user_profiles first to filter by tier.
    let profilesQuery = supabase.from('user_profiles').select('id, subscription_tier');
    
    if (targetTier !== 'all') {
      profilesQuery = profilesQuery.eq('subscription_tier', targetTier);
    }
    
    const { data: profiles, error: profileError } = await profilesQuery;
    if (profileError) {
      throw new Error(`Failed to fetch profiles: ${profileError.message}`);
    }

    if (!profiles || profiles.length === 0) {
      return NextResponse.json({ message: 'No users found for this target.', sentCount: 0 });
    }

    const targetUserIds = profiles.map(p => p.id);

    // Fetch emails from auth.users (requires service_role)
    const { data: authData, error: authError } = await supabase.auth.admin.listUsers({
      perPage: 10000 // Adjust if app scales significantly
    });

    if (authError) {
      throw new Error(`Failed to fetch auth users: ${authError.message}`);
    }

    const targetUsers = authData.users.filter(u => targetUserIds.includes(u.id) && u.email);
    const emails = targetUsers.map(u => u.email as string);

    if (emails.length === 0) {
      return NextResponse.json({ message: 'No valid email addresses found.', sentCount: 0 });
    }

    // 3. Send emails in batches of 50 via Resend BCC
    const BATCH_SIZE = 50;
    let sentCount = 0;

    for (let i = 0; i < emails.length; i += BATCH_SIZE) {
      const batch = emails.slice(i, i + BATCH_SIZE);
      
      const resendRes = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${RESEND_API_KEY}`
        },
        body: JSON.stringify({
          from: FROM_EMAIL,
          to: FROM_EMAIL, // Send to self, BCC to users to protect privacy
          bcc: batch,
          subject: subject,
          text: body,
          // Optional: HTML version could be added here
        })
      });

      if (!resendRes.ok) {
        const err = await resendRes.json();
        console.error(`Resend API Error on batch ${i}:`, err);
        // Continue to next batch even if one fails, or choose to abort.
      } else {
        sentCount += batch.length;
      }
    }

    // 4. Save delivery history
    const { error: insertError } = await supabase.from('newsletters').insert({
      subject,
      body,
      target_tier: targetTier,
      sent_count: sentCount,
      promo_code_id: promoCodeId || null
    });

    if (insertError) {
      console.error('Failed to save newsletter history:', insertError);
    }

    return NextResponse.json({ 
      message: 'Newsletter sent successfully', 
      sentCount: sentCount 
    });

  } catch (error: any) {
    console.error('Newsletter sending error:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
