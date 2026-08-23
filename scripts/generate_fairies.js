const fs = require('fs');
const path = require('path');

const jsonPath = '/Users/masahito/Downloads/fairy_database_export.json';
const outPath = path.join(__dirname, '../src/lib/fairies.ts');
const originalPath = path.join(__dirname, 'original_fairies.ts');
const fairiesDir = path.join(__dirname, '../public/fairies');

const data = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
const existingFiles = fs.readdirSync(fairiesDir).filter(f => f.endsWith('.jpg') || f.endsWith('.png') || f.endsWith('.webp'));

function guessAttribute(text) {
  if (/[海波水氷雪青ブルー]/i.test(text)) return { attr: 'WATER', colorFrom: 'from-blue-400', colorTo: 'to-cyan-600', shadow: 'shadow-blue-500/50', sparkle: 'text-blue-200', icon: '💧' };
  if (/[火炎太陽サンセット赤オレンジ]/i.test(text)) return { attr: 'FIRE', colorFrom: 'from-orange-400', colorTo: 'to-red-600', shadow: 'shadow-orange-500/50', sparkle: 'text-orange-200', icon: '🔥' };
  if (/[森木草花植物緑エメラルド]/i.test(text)) return { attr: 'NATURE', colorFrom: 'from-green-400', colorTo: 'to-emerald-600', shadow: 'shadow-green-500/50', sparkle: 'text-green-200', icon: '🌿' };
  if (/[星空光雷白銀河]/i.test(text)) return { attr: 'LIGHT', colorFrom: 'from-yellow-300', colorTo: 'to-yellow-500', shadow: 'shadow-yellow-500/50', sparkle: 'text-yellow-200', icon: '✨' };
  if (/[風空鳥飛]/i.test(text)) return { attr: 'WIND', colorFrom: 'from-teal-300', colorTo: 'to-teal-500', shadow: 'shadow-teal-500/50', sparkle: 'text-teal-200', icon: '💨' };
  return { attr: 'EARTH', colorFrom: 'from-amber-600', colorTo: 'to-orange-900', shadow: 'shadow-amber-700/50', sparkle: 'text-amber-200', icon: '🪨' };
}

function findMatchingImage(nameEn) {
  let lowerName = nameEn.toLowerCase();
  
  // Try to find exact matches first
  const exactMatch = existingFiles.find(f => f === lowerName + '.jpg' || f === lowerName + '.png');
  if (exactMatch) return '/fairies/' + exactMatch;
  
  // Try to find a file that starts with the name, preferring _card
  const containsMatch = existingFiles.find(f => f.toLowerCase().includes(lowerName) && !f.includes('nobg') && !f.includes('bg_'));
  if (containsMatch) return '/fairies/' + containsMatch;
  
  // Try any match
  const anyMatch = existingFiles.find(f => f.toLowerCase().includes(lowerName));
  if (anyMatch) return '/fairies/' + anyMatch;

  return null;
}

// Read the original file
let originalContent = fs.readFileSync(originalPath, 'utf8');

// Replace "export const ORIGINAL_FAIRIES" with "export const FAIRIES_MASTER"
let content = originalContent.replace('export const ORIGINAL_FAIRIES: IslandFairy[] = [', 'export const FAIRIES_MASTER: IslandFairy[] = [');

// Remove the closing bracket and newline
content = content.trim().replace(/];$/, '');
content += ', // --- JSON Database Additions ---\n';

data.forEach((entry, index) => {
  const isLast = index === data.length - 1;
  const attrInfo = guessAttribute(entry.motif + entry.full_description);
  
  let rarity = 'NORMAL';
  if (entry.category && entry.category.includes('追加')) rarity = 'RARE';
  if (entry.motif.includes('神') || entry.motif.includes('龍')) rarity = 'EPIC';

  const matchedImage = findMatchingImage(entry.name_en);

  const fairyObj = {
    id: "fairy_json_" + entry.id, // Prefix to avoid any possible conflict with existing IDs
    name: entry.name_ja + " (" + entry.name_en + ")",
    theme: entry.motif,
    island_id: entry.target_island,
    rarity: rarity,
    attribute: attrInfo.attr,
    visual: {
      icon: attrInfo.icon,
      imageUrl: matchedImage ? matchedImage : "/fairies/fairy_json_" + entry.id + ".png",
      colorFrom: attrInfo.colorFrom,
      colorTo: attrInfo.colorTo,
      shadowColor: attrInfo.shadow,
      sparkleColor: attrInfo.sparkle
    },
    description: entry.full_description
  };
  
  content += '  ' + JSON.stringify(fairyObj, null, 2).replace(/\n/g, '\n  ') + (isLast ? '\n' : ',\n');
});

content += '];\n';

fs.writeFileSync(outPath, content);
console.log('Successfully generated src/lib/fairies.ts by appending JSON database to the original fairies.');
