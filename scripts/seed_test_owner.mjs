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

async function seedOwner() {
  console.log('Seeding test owner...');
  
  // 1. Create user in auth.users
  const { data: authData, error: authErr } = await supabase.auth.admin.createUser({
    email: 'owner@example.com',
    password: 'password123',
    email_confirm: true,
  });

  if (authErr) {
    if (authErr.code === 'email_exists' || authErr.message.includes('already been registered') || authErr.message.includes('already exists')) {
       console.log('User already exists, linking to an accommodation...');
    } else {
       console.error('Auth error:', authErr);
       process.exit(1);
    }
  }

  // Get user ID
  const { data: users } = await supabase.auth.admin.listUsers();
  const user = users.users.find(u => u.email === 'owner@example.com');
  const userId = user.id;

  // 2. Ensure user_profile exists and has role = 'owner'
  await supabase.from('user_profiles').upsert({
    id: userId,
    email: 'owner@example.com',
    name: 'テスト島宿 オーナー',
    role: 'owner',
    updated_at: new Date().toISOString()
  });

  // 3. Link this owner to the first accommodation in the DB
  const { data: accs } = await supabase.from('accommodations').select('id, name').limit(1);
  if (accs && accs.length > 0) {
    const acc = accs[0];
    await supabase.from('accommodations').update({ owner_id: userId }).eq('id', acc.id);
    console.log(`Linked owner ${userId} to accommodation: ${acc.name}`);
  } else {
    console.log('No accommodations found to link. Please run seed_accommodations first.');
  }

  console.log('Done!');
}
seedOwner();
