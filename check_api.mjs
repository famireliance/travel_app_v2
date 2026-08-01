const url = process.env.NEXT_PUBLIC_SUPABASE_URL + '/rest/v1/islands?is_published=eq.true&select=id,name,region_id';
const headers = {
  'apikey': process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  'Authorization': 'Bearer ' + process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
};

async function check() {
  const res = await fetch(url, { headers });
  const data = await res.json();
  console.log("Total published islands returned by API:", data.length);
  
  const kumejima = data.find(i => i.name.includes("久米島"));
  console.log("Kumejima in data?", kumejima ? kumejima : "NO");

  const yaeyama = data.filter(i => i.region_id === 'yaeyama');
  console.log("Yaeyama islands count:", yaeyama.length);
}

check();
