const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function main() {
  const { data: data1, error: err1 } = await supabase.from('audit_logs').select('id').limit(1);
  console.log('audit_logs:', err1 ? err1.message : 'exists');
  
  const { data: data2, error: err2 } = await supabase.from('island_public_wifi').select('id').limit(1);
  console.log('island_public_wifi:', err2 ? err2.message : 'exists');
}
main();
