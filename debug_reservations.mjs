import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import WebSocket from 'ws';

globalThis.WebSocket = WebSocket;
dotenv.config({ path: '.env.local' });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function debug() {
  const { data: ownerUsers } = await supabase.from('user_profiles').select('id').eq('email', 'owner@example.com').single();
  const ownerId = ownerUsers.id;
  
  const { data: acc } = await supabase.from('accommodations').select('id, name').eq('owner_id', ownerId).single();
  console.log("Owner Acc:", acc);
  
  const { data: res1, error: err1 } = await supabase.from('reservations').select('*').eq('accommodation_id', acc.id);
  console.log("Reservations (Simple):", res1, err1);
  
  const { data: res2, error: err2 } = await supabase.from('reservations').select('*, user_profiles!guest_id(name)').eq('accommodation_id', acc.id);
  console.log("Reservations (Joined):", res2, err2);
}
debug();
