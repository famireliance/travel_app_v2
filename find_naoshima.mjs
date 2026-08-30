import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import WebSocket from 'ws';
globalThis.WebSocket = WebSocket;
dotenv.config({ path: '.env.local' });
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY, { global: { fetch: fetch } });
async function check() {
  const { data } = await supabase.from('islands').select('id, name').ilike('name', '%直島%');
  console.log(data);
}
check();
