const fs = require('fs');
const https = require('https');

function fetchGeocodeDetailed(name) {
  return new Promise((resolve) => {
    const cleanName = name.replace(/（.*?）/g, '').replace(/・.*/g, '').trim();
    const query = encodeURIComponent(cleanName + ', 日本');
    const url = `https://nominatim.openstreetmap.org/search?q=${query}&format=json&limit=1`;
    
    https.get(url, { headers: { 'User-Agent': 'TravelAppAudit/1.1' } }, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          if (json && json.length > 0) {
            resolve(json[0].display_name);
          } else {
            resolve(null);
          }
        } catch(e) { resolve(null); }
      });
    }).on('error', () => resolve(null));
  });
}

function fetchGeocodeDetailedFallback(name) {
  return new Promise((resolve) => {
    const cleanName = name.replace(/（.*?）/g, '').replace(/・.*/g, '').trim();
    const query = encodeURIComponent(cleanName);
    const url = `https://nominatim.openstreetmap.org/search?q=${query}&format=json&limit=1`;
    
    https.get(url, { headers: { 'User-Agent': 'TravelAppAudit/1.1' } }, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          if (json && json.length > 0) {
            resolve(json[0].display_name);
          } else {
            resolve(null);
          }
        } catch(e) { resolve(null); }
      });
    }).on('error', () => resolve(null));
  });
}

async function runDetailedAudit() {
  const results = JSON.parse(fs.readFileSync('audit_results.json', 'utf8'));
  const misaligned = results.misaligned;
  
  let md = '# ⚠️ ズレ検出・同名島誤認 詳細レポート\n\n';
  md += 'APIが取得した「間違えた先の島の住所（名称）」と、元のDBの想定エリア、およびズレの距離（km）の詳細リストです。\n\n';
  md += '| ID | 島名（KIRATABI登録名） | 期待されるエリア | APIがヒットさせた場所（誤認先） | 誤差の距離 |\n';
  md += '|---|---|---|---|---|\n';

  console.log(`Fetching details for ${misaligned.length} islands...`);

  for (let i = 0; i < misaligned.length; i++) {
    const item = misaligned[i];
    if (i % 10 === 0) console.log(`Processing ${i}/${misaligned.length}...`);
    
    let displayName = await fetchGeocodeDetailed(item.name);
    if (!displayName) {
      await new Promise(r => setTimeout(r, 1100)); // Sleep before fallback
      displayName = await fetchGeocodeDetailedFallback(item.name);
    }
    
    if (!displayName) {
      displayName = '不明（API名取得失敗）';
    }
    
    md += `| ${item.id} | ${item.name} | ${item.region_id} | ${displayName} | **${item.distKm} km** |\n`;
    
    await new Promise(r => setTimeout(r, 1100));
  }
  
  fs.writeFileSync('/Users/masahito/.gemini/antigravity/brain/a7d0792b-4fa3-46d4-ae26-b7b7d3e287b4/misaligned_islands_detailed_report.md', md, 'utf8');
  console.log('Detailed report generated.');
}

runDetailedAudit();
