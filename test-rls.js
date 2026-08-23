require('dotenv').config({ path: '.env.local' });
async function test() {
  const url = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/user_profiles?id=eq.211b2df1-161b-4a53-a8b6-bd84bee19cbc&select=id,subscription_tier`;
  const res = await fetch(url, {
    headers: {
      'apikey': process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      'Authorization': `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY}`
    }
  });
  console.log("Anon Fetch:", await res.json());
}
test();
