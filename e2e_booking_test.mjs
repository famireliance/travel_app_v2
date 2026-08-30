import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import WebSocket from 'ws';

globalThis.WebSocket = WebSocket;
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// Admin client for setup
const adminClient = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { autoRefreshToken: false, persistSession: false }
});

async function runE2E() {
  console.log('--- E2E Booking Test Started ---');

  // 1. Find or create a test guest
  let { data: usersData } = await adminClient.auth.admin.listUsers();
  let guestUser = usersData.users.find(u => u.email === 'guest_e2e@example.com');
  
  if (!guestUser) {
    console.log('Creating guest user...');
    const { data: newGuest, error: err } = await adminClient.auth.admin.createUser({
      email: 'guest_e2e@example.com',
      password: 'password123',
      email_confirm: true
    });
    if (err) throw err;
    guestUser = newGuest.user;
    
    await adminClient.from('user_profiles').upsert({
      id: guestUser.id,
      email: 'guest_e2e@example.com',
      name: 'E2E Guest',
      role: 'user'
    });
  }
  
  // 2. Get the test owner and their accommodation
  const ownerUser = usersData.users.find(u => u.email === 'owner@example.com');
  if (!ownerUser) throw new Error("Owner not found");
  
  const { data: accs } = await adminClient.from('accommodations').select('id, name').eq('owner_id', ownerUser.id).limit(1);
  if (!accs || accs.length === 0) throw new Error("Owner accommodation not found");
  const accId = accs[0].id;
  const accName = accs[0].name;
  console.log(`Target Accommodation: ${accName}`);

  // 3. Guest Client - Insert reservation
  const guestClient = createClient(supabaseUrl, supabaseAnonKey, { auth: { persistSession: false } });
  await guestClient.auth.signInWithPassword({ email: 'guest_e2e@example.com', password: 'password123' });
  
  console.log('Guest is requesting booking...');
  const checkIn = '2026-12-01';
  const checkOut = '2026-12-05';
  
  const { data: resData, error: resErr } = await guestClient.from('reservations').insert([{
    accommodation_id: accId,
    guest_id: guestUser.id,
    check_in_date: checkIn,
    check_out_date: checkOut,
    guest_count: 2,
    status: 'pending',
    guest_notes: 'E2E Test Booking Request'
  }]).select().single();
  
  if (resErr) {
    console.error("❌ Guest Booking Failed (RLS issue?):", resErr);
    return;
  }
  console.log(`✅ Booking created! Reservation ID: ${resData.id}, Status: ${resData.status}`);
  
  // 4. Owner Client - Approve reservation
  const ownerClient = createClient(supabaseUrl, supabaseAnonKey, { auth: { persistSession: false } });
  await ownerClient.auth.signInWithPassword({ email: 'owner@example.com', password: 'password123' });
  
  console.log('Owner is reviewing booking...');
  // The owner should be able to fetch the reservation since they own the accommodation
  const { data: fetchRes, error: fetchErr } = await ownerClient.from('reservations').select('*').eq('id', resData.id).single();
  
  if (fetchErr || !fetchRes) {
    console.error("❌ Owner could not fetch reservation:", fetchErr);
    return;
  }
  
  console.log('Owner approves the booking...');
  const { data: updateRes, error: updateErr } = await ownerClient.from('reservations').update({ status: 'confirmed' }).eq('id', resData.id).select().single();
  
  if (updateErr) {
    console.error("❌ Owner could not update reservation:", updateErr);
    return;
  }
  
  console.log(`✅ Booking confirmed! Reservation ID: ${updateRes.id}, Status: ${updateRes.status}`);
  console.log('--- E2E Booking Test Passed ---');
}

runE2E().catch(console.error);
