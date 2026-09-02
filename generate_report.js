const fs = require('fs');
const results = JSON.parse(fs.readFileSync('audit_results.json', 'utf8'));

let md = '# 🏝️ KIRATABI 全島データ 自動監査レポート\n\n';
md += '外部マップAPI（OpenStreetMap等）を用いた全419島の自動チェック結果です。\n';
md += 'このレポートは架空島の特定と、座標の大きなズレを検出するための目安です。\n\n';

md += '## 🚨 削除・再調査の疑い（Not Found: ' + results.notFound.length + '件）\n';
md += '> [!WARNING]\n> APIで日本国内に該当する地名や島が見つからなかったデータです。架空の島（ハルシネーション）、または非常にマイナーな岩礁の可能性があります。\n\n';
md += '| ID | 島名 | 地域エリア |\n|---|---|---|\n';
results.notFound.forEach(i => {
  md += `| ${i.id} | ${i.name} | ${i.region_id} |\n`;
});
md += '\n\n';

md += '## ⚠️ 座標ズレの疑い（Misaligned > 3km: ' + results.misaligned.length + '件）\n';
md += '> [!IMPORTANT]\n> 実在は確認できましたが、DBの座標と実際の地図の座標が3km以上離れているデータです。\n\n';
md += '| ID | 島名 | DB座標 | 正確な座標 | 誤差(km) |\n|---|---|---|---|---|\n';
results.misaligned.forEach(i => {
  const dbCoord = i.coordinates;
  const apiCoord = i.apiCoords ? (i.apiCoords.lat.toFixed(4) + ', ' + i.apiCoords.lon.toFixed(4)) : 'N/A';
  md += `| ${i.id} | ${i.name} | ${dbCoord} | ${apiCoord} | ${i.distKm} km |\n`;
});
md += '\n\n';

md += '## ✅ 正常と判定された島（OK: ' + results.ok.length + '件）\n';
md += '> 検索にヒットし、かつ座標の誤差が3km以内のデータです。\n\n';

fs.writeFileSync('/Users/masahito/.gemini/antigravity/brain/a7d0792b-4fa3-46d4-ae26-b7b7d3e287b4/all_registered_islands_audit.md', md, 'utf8');
console.log('Markdown report generated.');
