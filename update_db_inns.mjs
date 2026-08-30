import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import WebSocket from 'ws';

globalThis.WebSocket = WebSocket;
dotenv.config({ path: '.env.local' });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function updateDB() {
  // Update あおがしま屋 -> KIRATABI アイランドロッジ（架空）
  const { data, error } = await supabase
    .from('accommodations')
    .update({ name: 'KIRATABI アイランドロッジ（架空）' })
    .ilike('name', '%あおがしま屋%');
    
  if (error) {
    console.error("Update Error:", error);
  } else {
    console.log("Successfully updated inn names in database.");
  }
}

updateDB();
