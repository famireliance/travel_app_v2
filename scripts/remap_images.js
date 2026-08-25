const fs = require('fs');
const path = require('path');

const regionsPath = path.join(__dirname, '../src/data/regions.json');
let regionsData = JSON.parse(fs.readFileSync(regionsPath, 'utf-8'));

const mappings = {
  tropical: ['ogasawara', 'amami', 'tokara', 'daito', 'kerama', 'miyako', 'okinawa_main', 'yaeyama', 'kume'],
  setouchi: ['ieshima', 'pseudo_awaji', 'kasaoka', 'suo_oshima', 'kutsuna', 'kamijima', 'naoshima', 'shiwaku'],
  northern: ['pseudo_hokkaido', 'pseudo_sanriku', 'oshika'],
  volcanic: ['izu'],
  green: [
    'pseudo_kanto', 'pseudo_hokuriku', 'aichi_santo', 'pseudo_biwako', 'hagi', 'oki', 'pseudo_san_in',
    'uwakai', 'pseudo_tokushima', 'pseudo_tosa', 'amakusa', 'bungo', 'chikuzen', 'genkai', 'goto',
    'hirado', 'iki', 'minami_naka', 'tsushima', 'osumi', 'koshiki', 'pseudo_nagashima', 'pseudo_saikai', 'pseudo_satsuma'
  ]
};

regionsData = regionsData.map(region => {
  let mappedType = 'green'; // default
  for (const [type, ids] of Object.entries(mappings)) {
    if (ids.includes(region.id)) {
      mappedType = type;
      break;
    }
  }
  
  region.hero_image_url = `/regions/hero_region_${mappedType}.jpg`;
  return region;
});

fs.writeFileSync(regionsPath, JSON.stringify(regionsData, null, 2));
console.log('Successfully updated regions.json with new AI image mappings.');
