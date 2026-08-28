
const { ALL_ISLANDS_MASTER_DICTIONARY } = require('../src/data/allIslandsMaster.ts');
const fs = require('fs');
const dotenv = require('dotenv');

async function runDiagnostics() {
  console.log("==========================================");
  console.log("KIRATABI ISLAND MASTER DIAGNOSTIC AUDIT");
  console.log("==========================================\n");

  const islands = Object.values(ALL_ISLANDS_MASTER_DICTIONARY);
  const totalCount = islands.length;
  console.log(`[INFO] Total Islands in Master Dictionary: ${totalCount}`);

  let errors = 0;
  let warnings = 0;

  // 1. Check ID Consistency
  const seenIds = new Set();
  const seenNames = new Set();
  
  for (const [key, island] of Object.entries(ALL_ISLANDS_MASTER_DICTIONARY)) {
    if (key !== String(island.id)) {
      console.error(`[ERROR] Key mismatch! Key: "${key}", but island.id: "${island.id}" (${island.name})`);
      errors++;
    }
    
    if (seenIds.has(island.id)) {
      console.error(`[ERROR] Duplicate ID found! ID: ${island.id} (${island.name})`);
      errors++;
    }
    seenIds.add(island.id);

    if (seenNames.has(island.name)) {
      console.warn(`[WARNING] Duplicate Name found (could be same name different prefecture): ${island.name} (ID: ${island.id})`);
      warnings++;
    }
    seenNames.add(island.name);
  }

  console.log(`[INFO] Master Dictionary Integrity Check Completed. Errors: ${errors}, Warnings: ${warnings}\n`);

  // 2. Cross-check with Supabase Database
  console.log("------------------------------------------");
  console.log("Cross-checking with Supabase Database...");
  const env = dotenv.parse(fs.readFileSync('.env.local'));
  const url = env.NEXT_PUBLIC_SUPABASE_URL;
  const key = env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !key) {
    console.log("[SKIP] Supabase credentials not found in .env.local");
    return;
  }

  try {
    const res = await fetch(`${url}/rest/v1/islands?select=id,name`, {
      headers: { apikey: key, authorization: `Bearer ${key}` }
    });
    
    if (!res.ok) {
      console.error(`[ERROR] Failed to fetch from Supabase. Status: ${res.status}`);
      return;
    }

    const dbIslands = await res.json();
    console.log(`[INFO] Total Islands in Supabase DB: ${dbIslands.length}`);

    let dbErrors = 0;
    const dbDict = {};
    for (const row of dbIslands) {
      dbDict[row.id] = row.name;
    }

    for (const island of islands) {
      if (island.is_conquest_target && island.coordinates) { // Normally published islands
        const dbName = dbDict[island.id];
        if (!dbName) {
          // It's ok if some are not in DB if DB wasn't fully seeded, but we should note it
          // console.warn(`[WARNING] ID ${island.id} (${island.name}) is in Master but not in DB`);
        } else if (dbName !== island.name) {
          console.error(`[CRITICAL ERROR] ID COLLISION OR MISMATCH! ID ${island.id} is "${island.name}" in Master, but "${dbName}" in Supabase DB!`);
          dbErrors++;
        }
      }
    }

    // Check specific islands discussed
    console.log("\n[INFO] Specific Island Verifications:");
    console.log(`  - ID 392 Master: ${ALL_ISLANDS_MASTER_DICTIONARY['392']?.name}, DB: ${dbDict['392']}`);
    console.log(`  - ID 372 Master: ${ALL_ISLANDS_MASTER_DICTIONARY['372']?.name}, DB: ${dbDict['372']}`);
    console.log(`  - ID 198 Master: ${ALL_ISLANDS_MASTER_DICTIONARY['198']?.name}, DB: ${dbDict['198']}`);

    console.log(`\n[INFO] Cross-check Completed. Critical DB Mismatches: ${dbErrors}`);

  } catch (err) {
    console.error("[ERROR] Exception during DB cross-check:", err.message);
  }
}

runDiagnostics();
