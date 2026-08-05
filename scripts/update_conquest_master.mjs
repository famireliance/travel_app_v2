import fs from 'fs';
import path from 'path';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing Supabase credentials in .env.local");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);
const masterFilePath = path.resolve(__dirname, '../src/data/allIslandsMaster.ts');

async function updateMaster() {
  console.log('Fetching island data from Supabase...');
  const { data: islands, error } = await supabase
    .from('islands')
    .select('id, is_uninhabited');

  if (error) {
    console.error('Error fetching islands:', error);
    process.exit(1);
  }

  const uninhabitedIds = new Set(
    islands.filter(i => i.is_uninhabited === true).map(i => String(i.id))
  );

  console.log(`Found ${uninhabitedIds.size} uninhabited islands.`);

  console.log('Updating src/data/allIslandsMaster.ts...');
  let masterContent = fs.readFileSync(masterFilePath, 'utf8');

  let matchCount = 0;
  
  // This is a naive but effective regex replacement for a localized change
  // We'll iterate over all keys in the dictionary and update is_conquest_target
  
  // Actually, a safer approach is to parse and stringify if it was JSON, 
  // but it's a TS file with export const. Let's use regex to find and replace.
  
  // For each uninhabited ID, we look for its block in the file and change is_conquest_target: true to false
  for (const id of uninhabitedIds) {
    // Find the block starting with `"id": {` or similar
    const blockRegex = new RegExp(`"${id}":\\s*{[^}]*?}`, 'g');
    const blockRegex2 = new RegExp(`"${id}":\\s*{[\\s\\S]*?(?:is_conquest_target.*?)}`, 'g'); // Just a hint

    // Let's just do a simple replacement: 
    // We'll split the file by top-level keys. But the file is huge.
    // Instead of parsing, we can just replace the flag globally within the chunk? No, too risky.
  }
  
  // A better way to modify allIslandsMaster.ts:
  console.log("Loading module to get current dictionary...");
  const { ALL_ISLANDS_MASTER_DICTIONARY } = await import(new URL('file://' + masterFilePath).href.replace('.ts', '.js')).catch(() => ({ALL_ISLANDS_MASTER_DICTIONARY: null}));
  
  // wait, we can't easily import a .ts file in Node without ts-node.
  
  // Let's just use string replacement on the raw text.
  const lines = masterContent.split('\n');
  let currentIslandId = null;
  let updatedCount = 0;

  for (let i = 0; i < lines.length; i++) {
    const idMatch = lines[i].match(/"id":\s*"([^"]+)"/);
    if (idMatch) {
      currentIslandId = idMatch[1];
    }
    
    if (currentIslandId && uninhabitedIds.has(currentIslandId)) {
      if (lines[i].includes('"is_conquest_target": true')) {
        lines[i] = lines[i].replace('"is_conquest_target": true', '"is_conquest_target": false');
        updatedCount++;
      }
    }
  }

  fs.writeFileSync(masterFilePath, lines.join('\n'));
  console.log(`Updated ${updatedCount} islands to is_conquest_target: false in allIslandsMaster.ts`);
}

updateMaster();
