import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

export async function POST(request: Request) {
  try {
    const { islandId, userId, type = 'high_quality' } = await request.json();

    if (!islandId || !userId) {
      return NextResponse.json({ error: 'Missing islandId or userId' }, { status: 400 });
    }

    // Check user tier and tickets
    const profileRes = await supabase.from('user_profiles').select('subscription_tier, high_quality_tickets').eq('id', userId).single();
    const tier = profileRes.data?.subscription_tier || 'free';
    const tickets = profileRes.data?.high_quality_tickets || 0;

    let useTicket = false;

    // Apply limits for high_quality
    if (type === 'high_quality') {
      const startOfMonth = new Date();
      startOfMonth.setDate(1);
      startOfMonth.setHours(0, 0, 0, 0);

      const { count } = await supabase.from('certificates')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', userId)
        .eq('type', 'high_quality')
        .gte('created_at', startOfMonth.toISOString());
      
      const monthlyCount = count || 0;

      if (tier === 'free' && monthlyCount >= 1) {
        if (tickets > 0) {
          useTicket = true;
        } else {
          return NextResponse.json({ error: 'FREE_LIMIT_REACHED', message: '無料プランの今月の高画質発行枠（1枚）を使い切りました。Premiumプランへご登録いただくか、来月までお待ちください。' }, { status: 403 });
        }
      } else if (tier === 'premium' && monthlyCount >= 5) {
        if (tickets > 0) {
          useTicket = true;
        } else {
          return NextResponse.json({ error: 'PREMIUM_LIMIT_REACHED', message: '今月のPremium高画質発行枠（5枚）を使い切りました。チケットを利用するか、Ultimateプランへの変更をご検討ください。' }, { status: 403 });
        }
      }
      // Ultimate is unlimited
    }

    // Check if certificate already exists for this user and island (same type)
    const { data: existingCert, error: existingError } = await supabase
      .from('certificates')
      .select('*')
      .eq('island_id', islandId)
      .eq('user_id', userId)
      .eq('type', type)
      .single();

    if (existingCert) {
      return NextResponse.json({ certificate: existingCert, message: 'Already issued' });
    }

    if (existingError && existingError.code !== 'PGRST116') {
      console.error('Error checking existing certificate:', existingError);
      return NextResponse.json({ error: 'Database error checking certificate' }, { status: 500 });
    }

    // Get the max serial number for this island (regardless of type to keep serials unique per island)
    const { data: maxSerialData, error: maxSerialError } = await supabase
      .from('certificates')
      .select('serial_number')
      .eq('island_id', islandId)
      .order('serial_number', { ascending: false })
      .limit(1);

    if (maxSerialError) {
      console.error('Error getting max serial:', maxSerialError);
      return NextResponse.json({ error: 'Failed to get serial number' }, { status: 500 });
    }

    let nextSerial = 1;
    if (maxSerialData && maxSerialData.length > 0) {
      nextSerial = maxSerialData[0].serial_number + 1;
    }

    // Use transaction-like approach: decrement ticket then insert
    if (useTicket) {
      const { error: ticketError } = await supabase.rpc('decrement_ticket', { user_id_param: userId });
      // If RPC is not available, do standard update (may have race conditions but acceptable for MVP)
      if (ticketError) {
        await supabase.from('user_profiles').update({ high_quality_tickets: tickets - 1 }).eq('id', userId);
      }
    }

    // Insert new certificate
    const { data: newCert, error: insertError } = await supabase
      .from('certificates')
      .insert({
        user_id: userId,
        island_id: islandId,
        serial_number: nextSerial,
        payment_status: 'pending',
        type: type
      })
      .select()
      .single();

    if (insertError) {
      console.error('Error inserting certificate:', insertError);
      // rollback ticket if failed (best effort)
      if (useTicket) {
        await supabase.from('user_profiles').update({ high_quality_tickets: tickets }).eq('id', userId);
      }
      return NextResponse.json({ error: 'Failed to issue certificate' }, { status: 500 });
    }

    return NextResponse.json({ certificate: newCert, usedTicket: useTicket });

  } catch (error) {
    console.error('Certificate issue error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
