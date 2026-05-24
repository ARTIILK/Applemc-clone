import { Product, UnboxingReward, LiveEvent, LeaderboardEntry } from './types';

export const CATEGORIES = [
  { id: 'ranks', label: 'Ranks', icon: 'Shield' },
  { id: 'keys', label: 'Keys', icon: 'Key' },
  { id: 'bundles', label: 'Bundles', icon: 'Package' },
  { id: 'utilities', label: 'Utilities', icon: 'Settings' }
] as const;

export const PRODUCTS: Product[] = [
  {
    id: 'rank-vip',
    name: 'VIP Rank',
    description: 'Chat prefix, fly in lobby, kit access. Basic priority queue entry.',
    price: 9.99,
    category: 'ranks',
    perks: ['[VIP] Green Prefix', 'Flight Access in Lobby', 'Access to `/kit vip` weekly', 'Priority Queue Tier 1'],
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDRG4H0JzxXzG7x6lYx0fbq9WqZsrTsQLXTCA699C4H1IeS1JWcqvp5C7IO2c9oSSg8EgmmutghWoelLk5UAbHXACKa4hVXFcf_tvT8oeDZU7lzJxqiZxqQdrJeCxMstWxTXrR2xqZ5-MXe_-3Zn87pHFi728kYe02wEG2aq1zGqHHKPFnEY2-WL76_GbdzgyLjeagXGVpzavg68_T3TkxoP8xEMrKDALo3NWotYdISeWKRi8XPWSiI2VygqHlpoppHrDQ3JBHpKWbv'
  },
  {
    id: 'rank-champion',
    name: 'Champion',
    description: 'Priority queue, 5x homes, exclusive emojis. Fly command, kit access, and extra store keys.',
    price: 19.99,
    originalPrice: 29.99,
    category: 'ranks',
    perks: ['[Champion] Aqua Prefix', 'Flying in lobbies & wilderness hubs', '5x Maximum Set Homes', 'Priority Queue Tier 2', 'Monthly Premium Crate Item', 'Exclusive chat emojis'],
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuA6yuwbtkAEHHZq4EwxOvrmchTGfrKrgXcGPRWnylv0173RSgdZAYe9T1zhjexxvnNr2rDuuc0bIAHil6HWLkjCrm9Pk04j4-QDTn-1U_MDGglOhMzgXrHJgK31p_hKscNYJQp1sKYHRjiq1pQlBTccifJjLUaEJHtRdh39E_Bj6FCcD-RBAU81eyyAoZt33v6Jw3xZHi37z1EUly5INRzxOARNrMTPLSozn4Eh26vghcjQCwXU3r0P8P-xVMWZpBN_3VLGGCxjuPCH',
    isPopular: true
  },
  {
    id: 'rank-mvp',
    name: 'MVP+',
    description: 'All perks, custom tag, world edit lite. Premium particle effects, fly anywhere, massive claim bonus.',
    price: 34.99,
    category: 'ranks',
    perks: ['[MVP+] Light Mint Prefix', 'All previous VIP & Champion perks', 'Custom Nickname & Tags', 'World Edit Lite in Plots', 'Aura particle emitters around player', '10,000 bonus claim blocks on purchase'],
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuA6UdLTo21PqqcV1_NuZqYx2RnbrJszosQ9lYj5Bfnp66B82Sv4N-U7jnUh58r8LZGbA5CdpieB3m24zYmpMNUUP8QdWyiPfzelISTjtmPazxJO4I8bYeANj4yYZRYRhUHC3MniWN4pfzOsbYMCGL3wLcr8r9gB1dp7IB22Kow_TSX55bdhS-jNYxsU7LJaJobMVnnuJkZnBXgVqm7EYaiLJWHJbGP1DCJxlGghe4hLkA9oNg0NcQqEkQW3TNe2G75NEHhyL3MVPbqe',
    isBestValue: true
  },
  {
    id: 'keys-mythic',
    name: 'Mythic Keys (X5)',
    description: 'Unlock legendary loot crates containing top-tier items, coins, and legendary rank upgrades.',
    price: 4.50,
    originalPrice: 14.99,
    category: 'keys',
    perks: ['5x Mythic Crates keys', 'Contains rare armor, weapons, and tags', '0.5% chance for a permanent Rank Upgrade!', 'Claimable immediately in game via `/claims`'],
    iconName: 'Key'
  },
  {
    id: 'keys-ancient',
    name: 'Ancient Keys (X3)',
    description: 'Open mystical vaults in the server spawn to retrieve powerful relics and survival boosters.',
    price: 2.99,
    category: 'keys',
    perks: ['3x Ancient Crate Keys', 'Guaranteed premium enchantment books', 'Boosts active player coin multi for 1 hour'],
    iconName: 'Sparkles'
  },
  {
    id: 'keys-divine',
    name: 'Divine Key (X1)',
    description: 'Grant instant authorization code for the Cosmic Divine Chest. Only the best rewards spawn here.',
    price: 1.50,
    category: 'keys',
    perks: ['1x Divine Mystery Chest Key', 'Elite category vanity objects', 'Highest odds of custom visual aura effects'],
    iconName: 'Star'
  },
  {
    id: 'bundle-starter',
    name: 'Starter Bundle',
    description: 'Full high-tier netherite-infused iron set, 64 enchanted golden apples, and 1,000 coins.',
    price: 2.99,
    originalPrice: 19.99,
    category: 'bundles',
    perks: ['Full set of Protection 4 Iron Armor', '64x Golden Apples for survival longevity', '1,000 server coins deposited automatically', 'Perfect pack for starting builders on AppleMC'],
    iconName: 'Package'
  },
  {
    id: 'bundle-epic',
    name: 'Epic Survival Pack',
    description: 'Diamond armor set with custom stats, 15 Mythic Keys, 5,000 in-game coins, and a Custom Trail.',
    price: 12.50,
    category: 'bundles',
    perks: ['Diamond Protection V tool & weapon sets', '15x Mythic Loot Crate keys', '5,000 server coins', 'Exclusive "Forest Blossom" foot aura trail'],
    iconName: 'Gift'
  },
  {
    id: 'utility-unban',
    name: 'Unban Pass',
    description: 'Forgive one infraction immediately. Instant unban for minor rules infractions. Highly requested.',
    price: 15.00,
    originalPrice: 25.00,
    category: 'utilities',
    perks: ['Removes 1 historical warning or active ban', 'Works for chat offenses, grief claim, and building violations', 'Requires standard form submission via support portal in-app', 'Instant delivery within 5 minutes'],
    iconName: 'Gavel'
  },
  {
    id: 'utility-blocks',
    name: 'Claim Blocks (1,000)',
    description: 'Expand your land plot protection immediately to secure chests, buildings, and farms against griefers.',
    price: 2.50,
    category: 'utilities',
    perks: ['Adds 1,000 claim blocks to your profile', 'Share building permissions safely with friends via `/trust`', 'Protects crops, livestock, redstone machines, and storage'],
    iconName: 'Box'
  },
  {
    id: 'utility-nickname',
    name: 'Custom Nick Token',
    description: 'Grant authorization to change your chat nickname with hex colors, bold text, and specialized symbols.',
    price: 4.99,
    category: 'utilities',
    perks: ['1x Nickname Change Token on `/nick`', 'Allows hex gradient colors & custom symbols in chat', 'Lifetime badge on AppleMC Discord community'],
    iconName: 'Tag'
  }
];

export const UNBOXING_REWARDS: UnboxingReward[] = [
  { id: 'rew-vip', name: 'VIP Permanent Rank Upgrade', rarity: 'legendary', color: 'from-emerald-400 to-green-600', description: 'Congratulations! You unlocked the full VIP membership tier.' },
  { id: 'rew-sword', name: 'Emerald Star Slayer [Sword]', rarity: 'epic', color: 'from-cyan-400 to-blue-600', description: 'A mystical Netherite Sword glowing with sharpness V and dynamic mint particle impacts.' },
  { id: 'rew-coins', name: '50,000 Server Coins', rarity: 'rare', color: 'from-yellow-400 to-amber-600', description: 'Enormous bank deposits to purchase blocks, spawners, and trade items with server players.' },
  { id: 'rew-key', name: '3x Divine Treasure Keys', rarity: 'rare', color: 'from-purple-400 to-indigo-600', description: 'Premium keys to open the supreme cosmic chest at spawn.' },
  { id: 'rew-blocks', name: '5,000 Claim Protection Blocks', rarity: 'common', color: 'from-teal-400 to-emerald-500', description: 'Generous land allocation expansion blocks to defend your build project.' },
  { id: 'rew-apple', name: '32x Enchanted Golden Apples', rarity: 'common', color: 'from-gray-400 to-gray-600', description: 'God apples granting supreme health regenerative auras in tough combat.' }
];

export const LIVE_FEED_EVENTS: LiveEvent[] = [
  { id: 'ev-1', player: 'AlexMine_99', action: 'purchased', item: 'VIP Rank', time: 'Just now' },
  { id: 'ev-2', player: 'DiamondCrafter', action: 'unboxed', item: 'Emerald Star Slayer', time: '2 min ago' },
  { id: 'ev-3', player: 'CraftyGreen', action: 'purchased', item: 'Starter Bundle', time: '5 min ago' },
  { id: 'ev-4', player: 'SolarFlame', action: 'purchased', item: 'Claim Blocks (1,000)', time: '12 min ago' },
  { id: 'ev-5', player: 'SteveMax', action: 'unboxed', item: 'VIP Permanent Rank Upgrade', time: '18 min ago' },
  { id: 'ev-6', player: 'AppleKing', action: 'opened', item: '5x Mythic Keys', time: '24 min ago' }
];

export const LEADERBOARD_ENTRIES: LeaderboardEntry[] = [
  { rank: 1, player: 'GigaChadCraft', value: '$245.00', avatarUrl: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80' },
  { rank: 2, player: 'Emerald_Ninja', value: '$180.50', avatarUrl: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&w=150&q=80' },
  { rank: 3, player: 'BlockMage', value: '$132.00', avatarUrl: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&w=150&q=80' },
  { rank: 4, player: 'AppleViper', value: '$95.00', avatarUrl: 'https://images.unsplash.com/photo-1628157582853-a796fa650a6a?auto=format&fit=crop&w=150&q=80' },
  { rank: 5, player: 'MiningQueen', value: '$84.50', avatarUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=150&q=80' }
];
