export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  originalPrice?: number;
  category: 'ranks' | 'keys' | 'bundles' | 'utilities';
  perks: string[];
  image?: string;         // Hotlinked image URL if available
  iconName?: string;      // Lucide icon name fallback
  isPopular?: boolean;    // "MOST POPULAR" banner
  isBestValue?: boolean;  // "BEST VALUE" tag
}

export interface CartItem {
  product: Product;
  quantity: number;
}

export type ActiveTab = 'store' | 'library' | 'social' | 'profile';

export interface UnboxingReward {
  id: string;
  name: string;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  color: string;
  description: string;
}

export interface PlayerStats {
  username: string;
  rank: string;
  keys: {
    mythic: number;
    ancient: number;
    divine: number;
  };
  balance: number;
  claimBlocks: number;
  unbanPasses: number;
  purchasedItemsCount: number;
}

export interface LiveEvent {
  id: string;
  player: string;
  action: string;
  item: string;
  time: string;
}

export interface LeaderboardEntry {
  rank: number;
  player: string;
  value: string;
  avatarUrl: string;
}
