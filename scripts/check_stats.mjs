import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
async function run() {
  const { data } = await supabase.from('islands').select('name, is_uninhabited');
  const uninhabited = data.filter(d => d.is_uninhabited);
  console.log('Total islands:', data.length);
  console.log('Uninhabited count:', uninhabited.length);
  console.log('Inhabited count:', data.length - uninhabited.length);
  console.log('Sample uninhabited:', uninhabited.slice(0, 30).map(d => d.name).join(', '));
}
run();
