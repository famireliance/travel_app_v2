import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import WebSocket from 'ws';

globalThis.WebSocket = WebSocket;
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY; // I'll use ANON key instead to simulate UI

const supabase = createClient(supabaseUrl, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY, {
  auth: { autoRefreshToken: false, persistSession: false }
});

async function testFetch() {
  const { data: auth, error: loginErr } = await supabase.auth.signInWithPassword({
    email: 'owner@example.com',
    password: 'password123'
  });
  
  if (loginErr) return console.error('Login err:', loginErr);
  
  const userId = auth.user.id;
  console.log('Logged in as:', userId);
  
  const { data, error } = await supabase
    .from('accommodations')
    .select('*, islands(name)')
    .eq('owner_id', userId)
    .single();
    
  console.log('Result data:', data);
  console.log('Result err:', error);
}
testFetch();
