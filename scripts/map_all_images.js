const fs = require('fs');
const path = require('path');

const fairiesPath = path.join(__dirname, '../src/lib/fairies.ts');
const fairiesDir = path.join(__dirname, '../public/fairies');

let content = fs.readFileSync(fairiesPath, 'utf8');
const existingFiles = fs.readdirSync(fairiesDir).filter(f => f.endsWith('.jpg') || f.endsWith('.png') || f.endsWith('.webp'));

// We need to parse the FAIRIES_MASTER array. We can use regex or eval, but eval is easier since it's a TS object.
// Wait, eval might fail with TS types. We'll strip the TS types and export to parse it.
let tsArrayString = content.substring(content.indexOf('export const FAIRIES_MASTER: IslandFairy[] = [') + 'export const FAIRIES_MASTER: IslandFairy[] = ['.length - 1);
tsArrayString = tsArrayString.substring(0, tsArrayString.lastIndexOf('];') + 1);

// A simple eval might fail due to trailing commas or comments, but let's try safely:
const fairies = eval('(' + tsArrayString + ')');

// Track which files have been used so we don't map the same image to multiple fairies
const usedFiles = new Set();

function getBestMatch(fairy) {
  // Extract keywords
  const keywords = [];
  
  // 1. English name (lowercase)
  const nameMatch = fairy.name.match(/\(([a-zA-Z]+)\)/);
  if (nameMatch) keywords.push(nameMatch[1].toLowerCase());
  
  // 2. ID parts (e.g., fairy_niigata_sado -> sado)
  const idParts = fairy.id.replace('fairy_json_', '').replace('fairy_', '').split('_');
  keywords.push(...idParts.filter(p => p.length > 2));
  
  // 3. island_id and region_id
  if (fairy.island_id) {
    keywords.push(fairy.island_id.toLowerCase().replace('shima', ''));
    keywords.push(fairy.island_id.toLowerCase());
  }
  if (fairy.region_id) keywords.push(fairy.region_id.toLowerCase());
  
  // Clean up keywords
  const cleanKeywords = [...new Set(keywords)].filter(k => k.length > 1);

  // Score each file
  let bestFile = null;
  let bestScore = -1;

  for (const file of existingFiles) {
    if (usedFiles.has(file)) continue;
    if (file.includes('nobg') || file.includes('bg_')) continue; // Skip no-background images for cards
    
    const lowerFile = file.toLowerCase();
    let score = 0;

    for (const keyword of cleanKeywords) {
      if (lowerFile === keyword + '.jpg' || lowerFile === keyword + '.png') {
        score += 100; // Exact match
      } else if (lowerFile.startsWith(keyword + '_card')) {
        score += 50; // High confidence card match
      } else if (lowerFile.includes(keyword)) {
        score += 10;
      }
    }
    
    // Legacy hardcodes for problematic ones based on user's list
    if (fairy.id === 'fairy_okinawa_manza' && lowerFile.includes('zou')) score += 100;
    if (fairy.id === 'fairy_yaeyama' && lowerFile.includes('tida')) score += 100;
    if (fairy.id === 'fairy_amami' && lowerFile.includes('shida')) score += 100;
    if (fairy.id.includes('hateruma_cross') && lowerFile.includes('hateruma_cross')) score += 100;
    
    if (score > bestScore && score > 0) {
      bestScore = score;
      bestFile = file;
    }
  }

  if (bestFile) {
    usedFiles.add(bestFile);
    return '/fairies/' + bestFile;
  }
  return null;
}

// Map the images
fairies.forEach(fairy => {
  const bestImage = getBestMatch(fairy);
  if (bestImage) {
    fairy.visual.imageUrl = bestImage;
  }
});

// Re-stringify the array
const header = `export type FairyRarity = 'NORMAL' | 'RARE' | 'EPIC' | 'SPOT_EXCLUSIVE';
export type FairyAttribute = 'WATER' | 'NATURE' | 'FIRE' | 'LIGHT' | 'EARTH' | 'WIND' | 'ICE';

export interface FairyVisual {
  icon: string;
  imageUrl?: string;
  colorFrom: string;
  colorTo: string;
  shadowColor: string;
  sparkleColor: string;
}

export interface IslandFairy {
  id: string;
  baseFairyId?: string;
  name: string;
  theme: string;
  region_id?: string;
  island_id?: string;
  rarity: FairyRarity;
  attribute: FairyAttribute;
  collabSponsor?: string;
  visual: FairyVisual;
  description: string;
}

export const FAIRIES_MASTER: IslandFairy[] = `;

let newContent = header + JSON.stringify(fairies, null, 2) + ';\n';
fs.writeFileSync(fairiesPath, newContent);

console.log(`Successfully remapped fairies. Mapped ${usedFiles.size} images out of ${existingFiles.length} available.`);
