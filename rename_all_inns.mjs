import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import WebSocket from 'ws';

globalThis.WebSocket = WebSocket;
dotenv.config({ path: '.env.local' });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function rename() {
  const { data: accs } = await supabase.from('accommodations').select('id, name');
  for (const acc of accs) {
    if (!acc.name.includes('（架空）')) {
      const newName = acc.name + '（架空・テスト用）';
      await supabase.from('accommodations').update({ name: newName }).eq('id', acc.id);
      console.log(`Renamed: ${acc.name} -> ${newName}`);
    }
  }
}
rename();
