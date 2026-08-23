
export interface RegionMasteryInfo {
  title: string;
  visited: number;
  total: number;
  isMaster: boolean;
}

export function getRegionMastery(islands: any[], visitCounts: Record<string, number>): Record<string, RegionMasteryInfo> {
  const regions: Record<string, { visited: number; total: number; title: string }> = {
    'okinawa': { visited: 0, total: 0, title: '沖縄諸島' },
    'yaeyama': { visited: 0, total: 0, title: '八重山諸島' },
    'amami': { visited: 0, total: 0, title: '奄美群島' },
    'tokara': { visited: 0, total: 0, title: 'トカラ列島' },
    'izu': { visited: 0, total: 0, title: '伊豆諸島' },
    'ogasawara': { visited: 0, total: 0, title: '小笠原諸島' },
    'setouchi': { visited: 0, total: 0, title: '瀬戸内海' },
    'other': { visited: 0, total: 0, title: 'その他' }
  };

  islands.forEach(island => {
    let region = 'other';
    if (island.region_id === 'okinawa') region = 'okinawa';
    else if (island.region_id === 'yaeyama' || island.region_id === 'miyakoyaeyama') region = 'yaeyama';
    else if (island.region_id === 'amami') region = 'amami';
    else if (island.region_id === 'tokara') region = 'tokara';
    else if (island.region_id === 'izu') region = 'izu';
    else if (island.region_id === 'ogasawara') region = 'ogasawara';
    else if (island.region_id === 'setouchi' || island.region_id === 'shikoku' || island.region_id === 'kinki' || island.region_id === 'chugoku') region = 'setouchi';

    if (regions[region]) {
      regions[region].total++;
      if (visitCounts[island.id] > 0) {
        regions[region].visited++;
      }
    }
  });

  const result: Record<string, RegionMasteryInfo> = {};
  for (const [key, data] of Object.entries(regions)) {
    if (data.total > 0) {
      result[key] = {
        title: data.title,
        visited: data.visited,
        total: data.total,
        isMaster: data.visited >= data.total
      };
    }
  }

  return result;
}
