import { ALL_ISLANDS_MASTER_DICTIONARY } from './allIslandsMaster';

export interface LocalIsland {
  id: string;
  name: string;
  region_id: string;
  prefecture: string;
  difficulty: number;
  coordinates: string;
  description: string;
  access?: string;
  tags?: string[];
  spots?: { name: string; desc: string }[];
}

export const FALLBACK_ISLANDS: LocalIsland[] = Object.values(ALL_ISLANDS_MASTER_DICTIONARY)
  .filter((island: any) => island.is_conquest_target === true && island.coordinates)
  .map((island: any) => ({
    id: island.id,
    name: island.name,
    region_id: island.region_id || 'other',
    prefecture: island.prefecture || '',
    difficulty: island.difficulty === '未設定' ? 2 : (typeof island.difficulty === 'number' ? island.difficulty : 2),
    coordinates: island.coordinates,
    description: island.description || '',
    access: island.access || '',
    tags: island.tags || [],
    spots: island.spots || []
  }));
