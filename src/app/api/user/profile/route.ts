import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function GET(request: Request) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
    // Use service role key to bypass RLS
    const adminClient = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { autoRefreshToken: false, persistSession: false }
    });

    // Check authentication
    const authHeader = request.headers.get('Authorization');
    if (!authHeader) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await adminClient.auth.getUser(token);
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Fetch profile bypassing RLS
    const { data, error } = await adminClient
      .from('user_profiles')
      .select('nickname, subscription_tier, premium_until, ultimate_started_at, anniversary_cert_used')
      .eq('id', user.id)
      .single();

    if (error && error.code !== 'PGRST116') {
      console.error("DB Fetch Error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ profile: data || {} });
  } catch (err: any) {
    console.error("API Route Error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
