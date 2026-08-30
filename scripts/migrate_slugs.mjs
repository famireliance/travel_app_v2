import fs from 'fs';
import KuroshiroModule from 'kuroshiro';
const Kuroshiro = KuroshiroModule.default || KuroshiroModule;
import KuromojiAnalyzerModule from 'kuroshiro-analyzer-kuromoji';
const KuromojiAnalyzer = KuromojiAnalyzerModule.default || KuromojiAnalyzerModule;
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import WebSocket from 'ws';

// Next.js polyfill for realtime WebSocket
globalThis.WebSocket = WebSocket;
dotenv.config({ path: '.env.local' });

// Read the master file
const masterFilePath = './src/data/allIslandsMaster.ts';
let masterContent = fs.readFileSync(masterFilePath, 'utf-8');

// Regex to extract ALL_ISLANDS_MASTER_DICTIONARY
const dictMatch = masterContent.match(/export const ALL_ISLANDS_MASTER_DICTIONARY: Record<string, any> = (\{[\s\S]*?\});/);

if (!dictMatch) {
  console.error("Could not find ALL_ISLANDS_MASTER_DICTIONARY in file.");
  process.exit(1);
}

// Evaluate the dictionary object (unsafe but fine for local script)
const dictStr = dictMatch[1];
const dict = eval('(' + dictStr + ')');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function main() {
  const kuroshiro = new Kuroshiro();
  await kuroshiro.init(new KuromojiAnalyzer());

  const slugMap = {};
  const dbUpdates = [];

  for (const [key, island] of Object.entries(dict)) {
    let slug = '';
    // If it's already a non-numeric string (like 'noumi'), use it
    if (isNaN(parseInt(key)) || key !== parseInt(key).toString()) {
      slug = key;
    } else {
      // Remove "島" for simpler slug if possible, but Kuromoji handles it well
      const romaji = await kuroshiro.convert(island.name, { to: 'romaji' });
      // Clean up romaji: lowercase, remove spaces, remove macrons (ā -> a)
      slug = romaji.toLowerCase()
        .replace(/ /g, '')
        .replace(/ā/g, 'a').replace(/ī/g, 'i').replace(/ū/g, 'u').replace(/ē/g, 'e').replace(/ō/g, 'o')
        .replace(/[^a-z0-9_]/g, ''); // keep only alphanum
      
      // Handle duplicates by appending _${key} or prefecture
      if (Object.values(slugMap).includes(slug)) {
        slug = `${slug}_${key}`;
      }
    }
    
    slugMap[key] = slug;
    
    // Update the JS object
    island.slug = slug;

    // Prepare DB update
    dbUpdates.push({ id: island.id, slug: slug });
  }

  // Rewrite the allIslandsMaster.ts
  const newDictStr = JSON.stringify(dict, null, 2);
  const newMasterContent = masterContent.replace(dictStr, newDictStr);
  fs.writeFileSync(masterFilePath, newMasterContent, 'utf-8');
  console.log("✅ Updated src/data/allIslandsMaster.ts");

  // Output a redirects map for next.config.ts
  const redirects = [];
  for (const [oldId, newSlug] of Object.entries(slugMap)) {
    if (oldId !== newSlug) {
      redirects.push(`{ source: '/island/${oldId}', destination: '/island/${newSlug}', permanent: true }`);
    }
  }
  fs.writeFileSync('./redirects.txt', redirects.join(',\n'), 'utf-8');
  console.log("✅ Generated redirects.txt");

  // Update Supabase DB
  console.log("Pushing updates to Supabase...");
  let successCount = 0;
  for (const update of dbUpdates) {
    const { error } = await supabase.from('islands').update({ slug: update.slug }).eq('id', update.id);
    if (error) {
      console.error(`Error updating island ${update.id}:`, error);
    } else {
      successCount++;
    }
  }
  console.log(`✅ Supabase updated (${successCount}/${dbUpdates.length})`);
  process.exit(0);
}

main().catch(console.error);
