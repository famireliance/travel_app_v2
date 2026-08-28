const { ALL_ISLANDS_MASTER_DICTIONARY } = require('../src/data/allIslandsMaster.ts');

async function verifyLivePages() {
  console.log("==========================================");
  console.log("LIVE APPLICATION ROUTING VERIFICATION");
  console.log("==========================================\n");

  const islands = Object.values(ALL_ISLANDS_MASTER_DICTIONARY);
  let successCount = 0;
  let mismatchCount = 0;
  let errorCount = 0;

  console.log(`Starting live fetch for ${islands.length} islands on http://localhost:3000...`);
  
  // We will do this in batches to avoid overwhelming the local server
  const BATCH_SIZE = 20;
  for (let i = 0; i < islands.length; i += BATCH_SIZE) {
    const batch = islands.slice(i, i + BATCH_SIZE);
    
    const promises = batch.map(async (island) => {
      try {
        const res = await fetch(`http://localhost:3000/island/${island.id}`);
        if (!res.ok) {
          console.error(`[HTTP ERROR] ID ${island.id} (${island.name}) returned status ${res.status}`);
          errorCount++;
          return;
        }
        
        const html = await res.text();
        
        // We look for the island name in the page title or content
        // The title tag format is `<title>石垣島の観光・アクセス情報 | キラ旅</title>`
        const titleMatch = html.match(/<title>(.*?)<\/title>/);
        const titleText = titleMatch ? titleMatch[1] : '';
        
        if (titleText.includes(island.name)) {
          successCount++;
        } else {
          console.error(`[MISMATCH] ID ${island.id} expected "${island.name}" but page title was "${titleText}"`);
          mismatchCount++;
        }
      } catch (err) {
        console.error(`[NETWORK ERROR] Could not fetch ID ${island.id}: ${err.message}`);
        errorCount++;
      }
    });

    await Promise.all(promises);
    process.stdout.write(`\rProgress: ${Math.min(i + BATCH_SIZE, islands.length)} / ${islands.length}`);
  }

  console.log("\n\n==========================================");
  console.log(`VERIFICATION COMPLETE`);
  console.log(`- Total Islands Checked: ${islands.length}`);
  console.log(`- Perfectly Matched:     ${successCount}`);
  console.log(`- Content Mismatches:    ${mismatchCount}`);
  console.log(`- Connection Errors:     ${errorCount}`);
  console.log("==========================================");
  
  if (mismatchCount > 0) {
    console.log("⚠️ CRITICAL ROUTING BUG DETECTED ⚠️");
  } else {
    console.log("✅ ALL PAGES RENDERED CORRECTLY ACCORDING TO ID ✅");
  }
}

verifyLivePages();
