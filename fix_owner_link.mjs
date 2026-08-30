import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import WebSocket from 'ws';

globalThis.WebSocket = WebSocket;
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function fixOwner() {
  console.log('Fixing owner accommodation link...');
  
  // 1. Get owner ID
  let { data: usersData } = await supabase.auth.admin.listUsers();
  const ownerUser = usersData.users.find(u => u.email === 'owner@example.com');
  if (!ownerUser) {
    console.error("Owner not found");
    return;
  }
  const ownerId = ownerUser.id;
  
  // 2. Clear current ownership
  await supabase.from('accommodations').update({ owner_id: null }).eq('owner_id', ownerId);
  
  // 3. Find the KIRATABI アイランドロッジ accommodation
  const { data: accs } = await supabase.from('accommodations').select('id, name').ilike('name', '%KIRATABI アイランドロッジ%').limit(1);
  if (!accs || accs.length === 0) {
    console.error("KIRATABI アイランドロッジ not found in DB");
    return;
  }
  
  const targetAccId = accs[0].id;
  
  // 4. Link owner to it
  await supabase.from('accommodations').update({ owner_id: ownerId }).eq('id', targetAccId);
  
  console.log(`✅ Successfully linked owner to: ${accs[0].name}`);
}
fixOwner();
