import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import WebSocket from 'ws';

globalThis.WebSocket = WebSocket;
dotenv.config({ path: '.env.local' });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function check() {
  const { data: acc } = await supabase.from('accommodations').select('*').limit(1);
  console.log("Accommodations Schema Keys:", acc ? Object.keys(acc[0]) : "No data");
  
  const { data: res } = await supabase.from('reservations').select('*').limit(1);
  console.log("Reservations Schema Keys:", res ? Object.keys(res[0]) : "No data");
}
check();
