const fs = require('fs');

// Read the TypeScript file and use regex to extract the FAIRIES_MASTER array
const fileContent = fs.readFileSync('src/lib/fairies.ts', 'utf8');

// Find all elements in FAIRIES_MASTER
// We will look for { id: '...', name: '...', visual: { imageUrl: '...' } }
const idRegex = /id:\s*'([^']+)'/g;
let match;
const fairies = [];
const lines = fileContent.split('\n');

let currentFairy = null;
let inFairiesMaster = false;

for (let i = 0; i < lines.length; i++) {
  const line = lines[i];
  if (line.includes('export const FAIRIES_MASTER: Fairy[] = [')) {
    inFairiesMaster = true;
    continue;
  }
  
  if (!inFairiesMaster) continue;
  
  const idMatch = line.match(/id:\s*'([^']+)'/);
  if (idMatch) {
    if (currentFairy) fairies.push(currentFairy);
    currentFairy = { id: idMatch[1], name: '', hasImage: false };
  }
  
  if (currentFairy) {
    const nameMatch = line.match(/name:\s*'([^']+)'/);
    if (nameMatch) currentFairy.name = nameMatch[1];
    
    if (line.includes('imageUrl:') && line.includes('/fairies/')) {
      currentFairy.hasImage = true;
    }
  }
}
if (currentFairy) fairies.push(currentFairy);

const unrevealed = fairies.filter(f => !f.hasImage);
console.log(`Unrevealed Count: ${unrevealed.length}`);
unrevealed.forEach(f => console.log(`${f.id}: ${f.name}`));

