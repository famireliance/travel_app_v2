import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import WebSocket from 'ws';

globalThis.WebSocket = WebSocket;
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: { autoRefreshToken: false, persistSession: false }
});

async function force() {
  const { data: users } = await supabase.auth.admin.listUsers();
  const user = users.users.find(u => u.email === 'owner@example.com');
  
  if (!user) return console.log("No user");
  
  console.log("Updating user:", user.id);
  const { error } = await supabase.from('user_profiles').update({ role: 'owner' }).eq('id', user.id);
  
  if (error) {
    console.error("Update failed:", error);
  } else {
    console.log("Updated to owner!");
  }
}
force();
