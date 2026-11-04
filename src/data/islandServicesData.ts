export interface ServicePlanItem {
  id: string;
  name: string;
  price: string;
  desc: string;
  badge?: string;
  duration?: string;
  included?: string[];
  requirements?: string[];
  maxCapacity?: string;
}

export interface IslandServiceItem {
  id: string;
  type: 'rental_car' | 'activity' | 'guide_tour' | 'bike_rental';
  islandId: string;
  islandName: string;
  name: string;
  category: string;
  catchphrase: string;
  description: string;
  priceRange: string;
  plans: ServicePlanItem[];
  photoUrls: string[];
  phone: string;
  email?: string;
  lineUrl?: string;
  instagramUrl?: string;
  instagramAccount?: string;
  websiteUrl?: string;
  locationAddress: string;
  businessHours: string;
  pickupInfo: string;
  depositPolicy: string;
  requirementsNotes: string;
  bookingMode: 'request_based' | 'instant_booking';
  features: string[];
  agentReview?: {
    author: string;
    authorTitle: string;
    avatarUrl: string;
    rating: number;
    title: string;
    comment: string;
    tags: string[];
    date: string;
  };
}

export const ISLAND_SERVICES_DICTIONARY: Record<string, IslandServiceItem> = {};

// 島のID（数値・slug・日本語名）の相互解決マップ
const ISLAND_ALIAS_MAP: Record<string, string[]> = {
  'aogashima': ['58', 'aogashima', '青ヶ島'],
  'chichijima': ['63', 'chichijima', 'chichijimaogasawarashoto', '父島', '父島（小笠原諸島）'],
  'ishigaki': ['392', 'ishigaki', 'ishigakijima', '石垣島'],
};

export function getIslandServicesByIslandId(islandIdOrSlugOrName: string): IslandServiceItem[] {
  if (!islandIdOrSlugOrName) return [];
  const target = islandIdOrSlugOrName.toLowerCase().trim();

  return Object.values(ISLAND_SERVICES_DICTIONARY).filter(s => {
    const sId = s.islandId.toLowerCase();
    if (sId === target || s.islandName === islandIdOrSlugOrName) return true;
    
    // エイリアスチェック（数値ID・slug・島名どれでも合致）
    const aliases = ISLAND_ALIAS_MAP[sId] || [];
    return aliases.some(alias => alias.toLowerCase() === target || target.includes(alias.toLowerCase()));
  });
}

export function getServiceById(id: string): IslandServiceItem | null {
  return ISLAND_SERVICES_DICTIONARY[id] || null;
}

