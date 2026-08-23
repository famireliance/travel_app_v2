import { FALLBACK_ISLANDS } from './src/data/islandsData';
import fs from 'fs';
const islandIds = FALLBACK_ISLANDS.map(i => ({ id: i.id, name: i.name, region: i.region_id }));
fs.writeFileSync('islands_dump.json', JSON.stringify(islandIds, null, 2));
