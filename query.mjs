import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function check() {
  const { data } = await supabase.from('islands').select('id, name, coordinates').eq('coordinates', '');
  console.log('Empty coordinates:', data);
  const { data: data2 } = await supabase.from('islands').select('id, name, coordinates').is('coordinates', null);
  console.log('Null coordinates:', data2);
}
check();
