import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import WebSocket from 'ws';

globalThis.WebSocket = WebSocket;
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function test() {
  console.log('Testing reservation insert...');
  
  // 1. Get an existing user (guest)
  // For anonymous key, we need to sign in. Since this is testing RLS, we should sign in.
  const { data: authData, error: authErr } = await supabase.auth.signInWithPassword({
    email: 'test1@example.com',
    password: 'password123'
  });
  
  if (authErr) {
    console.log("Could not login as test1:", authErr.message);
    return;
  }
  
  const guestId = authData.user.id;
  
  // 2. Get an accommodation
  const { data: accs } = await supabase.from('accommodations').select('id').limit(1);
  if (!accs || accs.length === 0) {
    console.log("No accommodations found");
    return;
  }
  const accId = accs[0].id;
  
  // 3. Try inserting
  const { error: insertErr } = await supabase.from('reservations').insert([{
    accommodation_id: accId,
    guest_id: guestId,
    check_in_date: '2026-10-01',
    check_out_date: '2026-10-05',
    guest_count: 2,
    status: 'pending',
    guest_notes: 'TEST'
  }]);
  
  if (insertErr) {
    console.error("Insert failed:", insertErr);
  } else {
    console.log("Insert SUCCESS!");
  }
}
test();
