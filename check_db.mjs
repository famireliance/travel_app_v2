import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkDb() {
  console.log("Checking total islands...");
  const { count, error: countErr } = await supabase.from('islands').select('*', { count: 'exact', head: true });
  console.log("Total islands:", count);

  console.log("Checking Kumejima...");
  const { data: kumejima, error: kErr } = await supabase.from('islands').select('id, name, region_id, coordinates').like('name', '%久米島%');
  console.log("Kumejima data:", kumejima);

  console.log("Checking Yaeyama...");
  const { data: yaeyama, error: yErr } = await supabase.from('islands').select('id, name').eq('region_id', 'yaeyama');
  console.log("Yaeyama islands count:", yaeyama?.length);
}

checkDb();
