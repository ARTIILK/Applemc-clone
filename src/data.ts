import { Product, LiveEvent } from './types';
import storeData from './data/store.json';

export const SITE_CONFIG = storeData.siteConfig;

export const CATEGORIES = storeData.categories.map(cat => ({
  id: cat.id,
  label: cat.name,
  icon: cat.id === 'ranks' 
    ? 'Shield' 
    : cat.id === 'keys' 
      ? 'Key' 
      : cat.id === 'bundles' 
        ? 'Gift' 
        : cat.id === 'cosmetics'
          ? 'Sparkles'
          : cat.id === 'tags'
            ? 'Tag'
            : cat.id === 'claims'
              ? 'Package'
              : 'Gavel'
}));

export const PRODUCTS: Product[] = storeData.products.map(p => ({
  id: p.id,
  name: p.name,
  description: p.description,
  priceINR: p.priceINR,
  priceUSD: p.priceUSD,
  categoryId: p.categoryId,
  image: p.image,
  featured: p.featured,
  stock: p.stock,
  checkoutURL: p.checkoutURL,
  // Compatibility fallbacks with existing structures
  price: p.priceINR, // Default currency is INR
  category: p.categoryId,
  isPopular: p.featured,
  perks: p.categoryId === 'ranks' 
    ? ['High priority delivery in-game', 'Prefix and chat custom formats', 'Dedicated support warranty']
    : ['Dynamic keys integration', 'Interactive visual crate spawn animations', 'Immediate activation key logs']
}));

export const LIVE_FEED_EVENTS: LiveEvent[] = [];
