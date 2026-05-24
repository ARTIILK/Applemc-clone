import React, { useState, useEffect } from 'react';
import { 
  Shield, Key, Package, Settings, Sparkles, Star, Gift, Gavel, 
  Box, Tag, ShoppingBag, Gamepad2, Users, User, X, Plus, Minus, 
  Trash2, Coins, MessageSquare, Ticket, Globe, Activity, Check, 
  ExternalLink, Menu, Trophy, Flame, Send
} from 'lucide-react';

import { ActiveTab, CartItem, PlayerStats, LiveEvent, Product, UnboxingReward } from './types';
import { PRODUCTS, CATEGORIES, LIVE_FEED_EVENTS } from './data';
import CartModal from './components/CartModal';
import CrateUnboxer from './components/CrateUnboxer';
import Leaderboard from './components/Leaderboard';

const DEFAULT_STATS: PlayerStats = {
  username: 'AlexMine_99',
  rank: 'None',
  keys: {
    mythic: 5,
    ancient: 3,
    divine: 1
  },
  balance: 500,
  claimBlocks: 2000,
  unbanPasses: 0,
  purchasedItemsCount: 0
};

export default function App() {
  // --- Persistent Reactive States ---
  const [activeTab, setActiveTab] = useState<ActiveTab>('store');
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('ranks');
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Player Stats in memory (linked skin, keys, balance, unlocks)
  const [stats, setStats] = useState<PlayerStats>(DEFAULT_STATS);
  
  // Custom Live Feed Logs (which grow as user unboxes or purchases)
  const [events, setEvents] = useState<LiveEvent[]>(LIVE_FEED_EVENTS);
  
  // Notification logs or Toast banners
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [unboxedItemsList, setUnboxedItemsList] = useState<string[]>([]);
  
  // Linked Discord & Moajng States
  const [isDiscordLinked, setIsDiscordLinked] = useState(false);
  const [isProfileLinked, setIsProfileLinked] = useState(true);
  const [usernameInput, setUsernameInput] = useState(stats.username);

  // Social chat comments
  const [chatMessage, setChatMessage] = useState('');
  const [chatFeed, setChatFeed] = useState<Array<{user: string, text: string, time: string, rank?: string}>>([
    { user: 'SteveMax', text: 'Anyone wanna build a redstone crop farm in plot 4?', time: 'Just now', rank: 'VIP' },
    { user: 'DiamondCrafter', text: 'The MVP+ particle emitter is super sick!', time: '2 min ago', rank: 'MVP+' },
    { user: 'BlockMage', text: 'Does anyone have golden apples for trade?', time: '5 min ago', rank: 'Champion' }
  ]);

  // Support Ticket Form States
  const [supportName, setSupportName] = useState('');
  const [supportMessage, setSupportMessage] = useState('');
  const [showTicketModal, setShowTicketModal] = useState(false);
  const [ticketSuccess, setTicketSuccess] = useState(false);

  // --- Load and Save State natively in localStorage ---
  useEffect(() => {
    const cachedStats = localStorage.getItem('applemc_stats');
    if (cachedStats) {
      try {
        setStats(JSON.parse(cachedStats));
      } catch (e) {
        console.error('Failed to load stats cache', e);
      }
    }

    const cachedCart = localStorage.getItem('applemc_cart');
    if (cachedCart) {
      try {
        setCartItems(JSON.parse(cachedCart));
      } catch (e) {
        console.error('Failed to load cart cache', e);
      }
    }
  }, []);

  const saveStats = (newStats: PlayerStats) => {
    setStats(newStats);
    localStorage.setItem('applemc_stats', JSON.stringify(newStats));
  };

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 4000);
  };

  // --- Cart Management Functions ---
  const handleAddToCart = (product: Product) => {
    const existingIndex = cartItems.findIndex(item => item.product.id === product.id);
    let updated: CartItem[] = [];
    if (existingIndex !== -1) {
      updated = [...cartItems];
      updated[existingIndex].quantity += 1;
    } else {
      updated = [...cartItems, { product, quantity: 1 }];
    }
    setCartItems(updated);
    localStorage.setItem('applemc_cart', JSON.stringify(updated));
    showToast(`Added ${product.name} to your shopping cart!`);
  };

  const handleUpdateCartQuantity = (productId: string, delta: number) => {
    const existingIndex = cartItems.findIndex(item => item.product.id === productId);
    if (existingIndex === -1) return;

    let updated = [...cartItems];
    const newQty = updated[existingIndex].quantity + delta;
    if (newQty <= 0) {
      updated.splice(existingIndex, 1);
    } else {
      updated[existingIndex].quantity = newQty;
    }
    setCartItems(updated);
    localStorage.setItem('applemc_cart', JSON.stringify(updated));
  };

  const handleRemoveCartItem = (productId: string) => {
    const updated = cartItems.filter(item => item.product.id !== productId);
    setCartItems(updated);
    localStorage.setItem('applemc_cart', JSON.stringify(updated));
  };

  // --- Purchase Execution Checkout Simulation ---
  const handleCheckoutSuccess = (mcUsername: string, itemsPaidFor: CartItem[]) => {
    // Determine upgrades and key additions
    let newKeys = { ...stats.keys };
    let newRank = stats.rank;
    let newClaimBlocks = stats.claimBlocks;
    let newUnbanPasses = stats.unbanPasses;
    let newPurchasedItemsCount = stats.purchasedItemsCount + itemsPaidFor.reduce((s, i) => s + i.quantity, 0);

    itemsPaidFor.forEach((item) => {
      const q = item.quantity;
      const pid = item.product.id;

      if (pid === 'rank-vip' && (newRank === 'None')) {
        newRank = 'VIP';
      } else if (pid === 'rank-champion' && (newRank === 'None' || newRank === 'VIP')) {
        newRank = 'Champion';
      } else if (pid === 'rank-mvp') {
        newRank = 'MVP+';
        newClaimBlocks += 10000 * q;
      }

      if (pid === 'keys-mythic') newKeys.mythic += 5 * q;
      if (pid === 'keys-ancient') newKeys.ancient += 3 * q;
      if (pid === 'keys-divine') newKeys.divine += 1 * q;

      if (pid === 'bundle-starter') {
        newKeys.mythic += 3 * q;
        newClaimBlocks += 2000 * q;
      }
      if (pid === 'bundle-epic') {
        newKeys.mythic += 15 * q;
        newClaimBlocks += 5000 * q;
      }
      if (pid === 'utility-unban') {
        newUnbanPasses += q;
      }
      if (pid === 'utility-blocks') {
        newClaimBlocks += 1000 * q;
      }
    });

    const finalStats: PlayerStats = {
      username: mcUsername,
      rank: newRank,
      keys: newKeys,
      balance: stats.balance,
      claimBlocks: newClaimBlocks,
      unbanPasses: newUnbanPasses,
      purchasedItemsCount: newPurchasedItemsCount
    };

    saveStats(finalStats);
    setCartItems([]);
    localStorage.removeItem('applemc_cart');
    setIsCartOpen(false);

    // Add purchase event block to the live social feed
    const firstItemName = itemsPaidFor[0]?.product.name || 'Server item';
    const andMoreText = itemsPaidFor.length > 1 ? ` and ${itemsPaidFor.length - 1} more items` : '';
    const newEvent: LiveEvent = {
      id: `purchase-${Date.now()}`,
      player: mcUsername,
      action: 'purchased',
      item: `${firstItemName}${andMoreText}`,
      time: 'Just now'
    };
    setEvents([newEvent, ...events]);

    // Go to Library dashboard where they inspect their new items!
    setActiveTab('library');
    showToast(`Purchase successful! Your in-game inventory on play.applemc.fun is updated.`);
  };

  // --- Crate Actions ---
  const handleDeductKey = (crateType: 'mythic' | 'ancient' | 'divine') => {
    const updatedStats = { ...stats };
    if (crateType === 'mythic') updatedStats.keys.mythic--;
    if (crateType === 'ancient') updatedStats.keys.ancient--;
    if (crateType === 'divine') updatedStats.keys.divine--;
    saveStats(updatedStats);
  };

  const handleGrantReward = (reward: UnboxingReward) => {
    // Grant rewards to profile inventory in state
    let updatedStats = { ...stats };
    if (reward.id.includes('rew-vip')) {
      if (updatedStats.rank === 'None') updatedStats.rank = 'VIP';
    } else if (reward.id.includes('rew-coins')) {
      updatedStats.balance += 50000;
    } else if (reward.id.includes('rew-key')) {
      updatedStats.keys.divine += 3;
    } else if (reward.id.includes('rew-blocks')) {
      updatedStats.claimBlocks += 5000;
    }

    saveStats(updatedStats);
    setUnboxedItemsList(prev => [reward.name, ...prev]);

    // Append to live list
    const newEvent: LiveEvent = {
      id: `unbox-${Date.now()}`,
      player: stats.username,
      action: 'unboxed',
      item: reward.name,
      time: 'Just now'
    };
    setEvents([newEvent, ...events]);
    showToast(`Epic unlock! You unboxed a ${reward.name}!`);
  };

  // --- Mojang username linking form ---
  const handleLinkProfile = (e: React.FormEvent) => {
    e.preventDefault();
    if (!usernameInput.trim()) return;
    const finalStats = {
      ...stats,
      username: usernameInput
    };
    saveStats(finalStats);
    setIsProfileLinked(true);
    showToast(`Minecraft character profile '${usernameInput}' synced successfully!`);
  };

  // --- Interactive Chat send ---
  const handleSendChatMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatMessage.trim()) return;
    const newChat = {
      user: stats.username,
      text: chatMessage,
      time: 'Just now',
      rank: stats.rank !== 'None' ? stats.rank : undefined
    };
    setChatFeed([newChat, ...chatFeed]);
    setChatMessage('');
  };

  // --- Interactive Support Ticket Submit ---
  const handleSupportTicket = (e: React.FormEvent) => {
    e.preventDefault();
    if (!supportName.trim() || !supportMessage.trim()) return;
    setTicketSuccess(true);
    setTimeout(() => {
      setTicketSuccess(false);
      setSupportName('');
      setSupportMessage('');
      setShowTicketModal(false);
      showToast('Support ticket loaded! An administrator will contact you on play.applemc.fun shortly.');
    }, 1500);
  };

  // Cat helper icons
  const getLucideIcon = (name: string, size = 18) => {
    switch(name) {
      case 'Shield': return <Shield size={size} />;
      case 'Key': return <Key size={size} />;
      case 'Package': return <Package size={size} />;
      case 'Settings': return <Settings size={size} />;
      case 'Sparkles': return <Sparkles size={size} />;
      case 'Star': return <Star size={size} />;
      case 'Gift': return <Gift size={size} />;
      case 'Gavel': return <Gavel size={size} />;
      case 'Box': return <Box size={size} />;
      case 'Tag': return <Tag size={size} />;
      default: return <Coins size={size} />;
    }
  };

  // Filter products by category & search
  const filteredProducts = PRODUCTS.filter(p => {
    const matchCat = p.category === selectedCategory;
    const matchSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                        p.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchCat && matchSearch;
  });

  const cartCount = cartItems.reduce((acc, i) => acc + i.quantity, 0);

  return (
    <div className="font-sans text-text-primary bg-emerald-bg selection:bg-primary-mint selection:text-on-primary-mint min-h-screen relative pb-28 md:pb-12 overflow-x-hidden">
      
      {/* Absolute Ambient Light sources */}
      <div className="fixed top-0 -left-20 w-80 h-80 ambient-glow rounded-full z-0 opacity-55"></div>
      <div className="fixed bottom-40 -right-20 w-96 h-96 ambient-glow rounded-full z-0 opacity-45"></div>

      {/* --- TOAST PANEL NOTIFICATION --- */}
      {toastMessage && (
        <div id="toast-banner" className="fixed top-20 right-4 left-4 md:left-auto md:w-96 z-[100] p-4 rounded-xl bg-emerald-surface-highest/95 border border-primary-mint/40 text-xs shadow-2xl flex items-center gap-3 animate-fade-in text-text-primary">
          <div className="w-6 h-6 rounded-full bg-primary-mint/20 text-primary-mint flex items-center justify-center font-bold">✓</div>
          <p className="flex-1 font-medium select-none">{toastMessage}</p>
        </div>
      )}

      {/* --- MOBILE ACCENT HEADER --- */}
      <header className="fixed top-0 w-full z-50 bg-emerald-surface/85 backdrop-blur-xl border-b border-white/5 flex justify-between items-center px-6 h-16 transition-all">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 cursor-pointer" onClick={() => setActiveTab('store')}>
            <span className="font-black text-lg tracking-tighter text-primary-mint uppercase">AppleMC</span>
            <span className="hidden sm:inline text-[9px] font-bold px-1.5 py-0.5 rounded bg-primary-mint/10 text-primary-mint border border-primary-mint/20 tracking-widest">STORE</span>
          </div>
        </div>

        <div className="flex items-center gap-4">
          {/* Cart Status Button */}
          <button 
            id="header-cart-btn"
            onClick={() => setIsCartOpen(true)}
            className="relative p-2 rounded-full hover:bg-white/5 text-primary-mint transition-all active:scale-90"
          >
            <ShoppingBag size={20} />
            {cartCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-teal-400 text-on-primary-mint text-[10px] font-bold w-4.5 h-4.5 rounded-full flex items-center justify-center animate-pulse">
                {cartCount}
              </span>
            )}
          </button>

          {/* User Character Skin Face circular hook */}
          <div 
            id="header-profile-trigger"
            onClick={() => setActiveTab('profile')}
            className="w-8 h-8 rounded-full bg-emerald-surface-high border border-primary-mint/40 flex items-center justify-center overflow-hidden cursor-pointer hover:border-primary-mint transition-all"
          >
            <img 
              alt="Minecraft Skin Face" 
              className="w-6 h-6 object-contain image-rendering-pixelated" 
              src={`https://mc-heads.net/avatar/${stats.username}/32`}
              onError={(e) => {
                // If MC server head is slow/offline, load default
                e.currentTarget.src = "https://lh3.googleusercontent.com/aida-public/AB6AXuAdNbLxcxMcRrSgTgoKSiCfqYQdRcQ51tuZz-sHLtb-TWP_TK9a4RIP1C2G6UfmfxG2mDCzTErDMYO4ZkA3dsrVcNkxT7CP4UHjN8w4pPi3GdDfKRaT8qrpvgOYsEo6WezviP8KXD4-W4x9DbiEnjcPljSBz8FBNOKbQoh7zZv1eVMsFR5oxQoC7sp_fmhvMH5F8YC2d3pglOHQWqTGJXCTTxTngJjD85n5KpSIt-8BA0wI4wO5Rl4XzR2ATTsmG6f-EuAN-osgKA1k";
              }}
              referrerPolicy="no-referrer"
            />
          </div>
        </div>
      </header>

      {/* --- MASTER MAIN CONTAINER --- */}
      <main className="relative z-10 pt-24 px-4 sm:px-6 md:px-8 max-w-7xl mx-auto flex flex-col gap-8 min-h-[calc(100vh-12rem)]">
        
        {/* TAB 1: STORE FRONT VIEW */}
        {activeTab === 'store' && (
          <div id="store-tab-screen" className="flex flex-col gap-8 animate-fade-in">
            {/* Hero Section */}
            <section id="store-hero" className="text-center relative py-8 max-w-2xl mx-auto">
              <div className="inline-block mb-3 px-4 py-1 rounded-full border border-primary-mint/15 bg-primary-mint/5 text-primary-mint text-[11px] font-bold tracking-widest uppercase">
                WELCOME TO THE OFFICIAL SERVER STORE
              </div>
              <h1 className="text-3xl md:text-5xl font-extrabold text-primary-mint tracking-tighter uppercase mb-4">
                APPLEMC STORE
              </h1>
              <p className="text-sm md:text-base text-text-muted leading-relaxed">
                Enhance your survival journey with premium ranks, keys, and loot bundles. Join thousands of active players in the ultimate Minecraft sanctuary.
              </p>
            </section>

            {/* Layout configuration based on viewport width */}
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
              
              {/* Category selector column / Left side on desktop, top scrolling block on mobile */}
              <aside className="lg:col-span-1 flex flex-col gap-6">
                
                {/* Visual search bar */}
                <div className="p-4 rounded-xl bg-emerald-surface-container border border-white/5">
                  <span className="block text-[10px] font-bold text-primary-mint uppercase tracking-wider mb-2">Search Catalog</span>
                  <input 
                    type="text" 
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search items..."
                    className="w-full px-3 py-1.5 bg-emerald-bg border border-white/10 rounded text-xs focus:outline-none focus:border-primary-mint text-text-primary"
                  />
                </div>

                {/* Categories container */}
                <div className="p-4 rounded-xl bg-emerald-surface-container border border-white/5 flex flex-col gap-2">
                  <div className="px-2 mb-2 hidden lg:block">
                    <span className="block text-xs font-bold text-primary-mint uppercase tracking-wider">Item Categories</span>
                    <span className="text-[10px] text-text-muted">Browse items</span>
                  </div>

                  {/* Desktop block, mobile layout translates to horizontal scroll overflow */}
                  <div className="flex flex-row lg:flex-col gap-2 overflow-x-auto hide-scrollbar pb-2 lg:pb-0">
                    {CATEGORIES.map((cat) => {
                      const isActive = selectedCategory === cat.id;
                      return (
                        <button
                          key={cat.id}
                          onClick={() => setSelectedCategory(cat.id)}
                          className={`flex-none lg:flex-initial py-2.5 px-5 rounded-lg text-xs font-semibold flex items-center gap-3 transition-all ${
                            isActive 
                              ? 'bg-secondary-mint-container text-primary-mint ring-1 ring-primary-mint/45 border-transparent'
                              : 'text-text-muted hover:text-text-primary bg-white/5 hover:bg-white/10 border-transparent'
                          }`}
                        >
                          {getLucideIcon(cat.icon, 14)}
                          <span>{cat.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Server Online Status Card */}
                <div className="hidden lg:flex p-6 rounded-xl glass-panel flex-col gap-1 hover:border-primary-mint/30 transition-all">
                  <span className="text-[10px] font-bold tracking-wider text-text-muted uppercase">SERVER STATUS</span>
                  <div className="flex items-center justify-between mt-1">
                    <span className="text-md font-bold text-text-primary">play.applemc.fun</span>
                    <div className="flex items-center gap-1.5 bg-primary-mint/10 border border-primary-mint/20 rounded px-2 py-0.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-primary-mint animate-pulse"></span>
                      <span className="text-[10px] text-primary-mint font-bold uppercase">ONLINE</span>
                    </div>
                  </div>
                  <div className="mt-3 border-t border-white/5 pt-3">
                    <span className="block text-xl font-mono font-bold text-primary-mint">2,481 Players</span>
                    <span className="text-[11px] text-text-muted leading-relaxed">Emerald Sanctuary Lobby #1</span>
                  </div>
                </div>
              </aside>

              {/* Grid Column containing Catalog Products */}
              <section className="lg:col-span-3 flex flex-col gap-6">
                <div className="flex items-center justify-between border-b border-white/5 pb-3">
                  <h2 className="text-lg font-bold text-primary-mint capitalize tracking-tight">
                    {selectedCategory}
                  </h2>
                  <span className="text-[10px] font-bold tracking-wider text-text-muted bg-white/5 px-2.5 py-1 rounded-full uppercase">
                    Immediate Delivery
                  </span>
                </div>

                {filteredProducts.length === 0 ? (
                  <div className="p-12 text-center rounded-xl bg-white/5 border border-white/5">
                    <p className="text-sm font-medium text-text-primary">No results found</p>
                    <p className="text-xs text-text-muted mt-1">Try tweaking your search term or select another category bar above.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                    {filteredProducts.map((p) => {
                      const isProductInCart = cartItems.some(i => i.product.id === p.id);
                      return (
                        <div 
                          key={p.id}
                          id={`product-card-${p.id}`}
                          className="glass-panel rounded-xl p-5 top-light-border card-hover flex flex-col justify-between group relative overflow-hidden"
                        >
                          {/* Banner badge for popular / value items */}
                          {p.isPopular && (
                            <div className="absolute top-4 right-[-32px] bg-primary-mint text-on-primary-mint py-0.5 px-8 rotate-45 text-[9px] font-extrabold tracking-widest uppercase shadow">
                              POPULAR
                            </div>
                          )}
                          {p.isBestValue && (
                            <div className="absolute top-3 left-3 bg-teal-400/25 border border-teal-400 text-teal-300 py-0.5 px-1.5 rounded text-[8px] font-extrabold uppercase">
                              BEST VALUE
                            </div>
                          )}

                          {/* Top Visual Emblem representation */}
                          <div className="h-32 flex items-center justify-center p-3 text-center rounded-lg bg-emerald-bg/60 border border-white/5 mb-4 group-hover:border-primary-mint/10 transition-all">
                            {p.image ? (
                              <img 
                                src={p.image} 
                                alt={p.name} 
                                className="h-full max-w-full object-contain filter drop-shadow-[0_4px_10px_rgba(184,238,214,0.15)] group-hover:scale-110 transition-transform duration-500 ease-out" 
                                referrerPolicy="no-referrer"
                              />
                            ) : (
                              <div className="text-primary-mint/40 group-hover:text-primary-mint transition-colors duration-300">
                                {getLucideIcon(p.iconName || 'Shield', 56)}
                              </div>
                            )}
                          </div>

                          {/* Content */}
                          <div className="flex-1 flex flex-col justify-between min-h-[140px]">
                            <div>
                              <h3 className="text-sm font-bold text-text-primary group-hover:text-primary-mint transition-colors">
                                {p.name}
                              </h3>
                              <p className="text-[11px] text-text-muted leading-relaxed mt-1">
                                {p.description}
                              </p>
                            </div>

                            <div className="mt-4 pt-3 border-t border-white/5 flex items-center justify-between">
                              <div className="flex flex-col">
                                {p.originalPrice && (
                                  <span className="text-[10px] text-red-400/70 line-through font-mono">
                                    ${p.originalPrice.toFixed(2)}
                                  </span>
                                )}
                                <span className="text-base font-bold text-primary-mint font-mono tracking-tight">
                                  ${p.price.toFixed(2)}
                                </span>
                              </div>

                              <button
                                onClick={() => handleAddToCart(p)}
                                className={`px-4 py-2 text-xs font-bold rounded transition-all flex items-center gap-1.5 ${
                                  isProductInCart
                                    ? 'bg-primary-mint/15 text-primary-mint border border-primary-mint/40 cursor-default'
                                    : 'bg-primary-mint text-on-primary-mint hover:shadow-[0_0_12px_rgba(184,238,214,0.35)] active:scale-95'
                                }`}
                              >
                                {isProductInCart ? (
                                  <>
                                    <Check size={12} />
                                    <span>ADDED (+1)</span>
                                  </>
                                ) : (
                                  <>
                                    <Plus size={12} />
                                    <span>ADD</span>
                                  </>
                                )}
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </section>
            </div>

            {/* Support section banner */}
            <section id="help-banner" className="py-8 px-6 glass-panel rounded-2xl text-center relative overflow-hidden mt-8 max-w-4xl mx-auto w-full">
              <div className="absolute top-0 right-0 w-32 h-32 ambient-glow rounded-full translate-x-1/2 opacity-25"></div>
              
              <h2 className="text-xl md:text-2xl font-black text-primary-mint tracking-tight uppercase mb-2">
                Still have questions?
              </h2>
              <p className="text-xs md:text-sm text-text-muted mb-6 max-w-md mx-auto leading-relaxed">
                Our support team is active 24/7 on Discord or direct web support. We deliver item benefits within 5 minutes of checkout registry.
              </p>
              <div className="grid grid-cols-2 md:grid-cols-2 gap-4 max-w-sm mx-auto">
                <button 
                  onClick={() => setIsDiscordLinked(true)}
                  className="flex items-center justify-center gap-2 bg-emerald-surface-highest/80 hover:bg-emerald-bright text-text-primary text-xs font-bold py-3 rounded-xl transition-all border border-white/5"
                >
                  <MessageSquare size={14} className="text-primary-mint" />
                  <span>{isDiscordLinked ? 'DISCORD LINKED' : 'Discord Server'}</span>
                </button>
                <button 
                  onClick={() => setShowTicketModal(true)}
                  className="flex items-center justify-center gap-2 bg-emerald-surface-highest/80 hover:bg-emerald-bright text-text-primary text-xs font-bold py-3 rounded-xl transition-all border border-white/5"
                >
                  <Ticket size={14} className="text-primary-mint" />
                  <span>Support Ticket</span>
                </button>
              </div>
            </section>
          </div>
        )}

        {/* TAB 2: LIBRARY / SURVIVAL INVENTORY DASHBOARD */}
        {activeTab === 'library' && (
          <div id="library-tab-screen" className="flex flex-col gap-8 animate-fade-in text-text-primary">
            {/* Header dashboard info */}
            <section className="p-6 rounded-2xl bg-gradient-to-br from-emerald-surface-container to-emerald-surface-low border border-white/5 flex flex-col md:flex-row items-center justify-between gap-6 relative overflow-hidden">
              <div className="absolute top-0 left-0 w-64 h-32 ambient-glow rounded-full -translate-y-1/2 opacity-30"></div>
              
              <div className="flex items-center gap-4 text-center md:text-left flex-col md:flex-row">
                <div className="w-16 h-16 rounded-xl bg-primary-mint/10 border border-primary-mint/35 flex items-center justify-center p-2 relative">
                  <img 
                    src={`https://mc-heads.net/body/${stats.username}/100`} 
                    alt="Skin 3D"
                    className="h-14 object-contain image-rendering-pixelated"
                    onError={(e) => {
                      e.currentTarget.style.display = 'none';
                    }}
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute -bottom-1 -right-1 bg-teal-400 w-3.5 h-3.5 rounded-full border border-emerald-bg"></div>
                </div>
                <div>
                  <div className="flex items-center gap-2 justify-center md:justify-start">
                    <h2 className="text-lg font-bold font-sans tracking-tight text-white">{stats.username}</h2>
                    {stats.rank !== 'None' && (
                      <span className="text-[9px] font-black px-1.5 py-0.5 rounded bg-primary-mint/25 text-primary-mint border border-primary-mint/35 uppercase">
                        {stats.rank}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-text-muted mt-0.5">Survival Sector Sanctuary Lobby #1</p>
                </div>
              </div>

              {/* Stats values */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 w-full md:w-auto">
                <div className="p-3.5 rounded-xl bg-emerald-bg/60 border border-white/5 text-center min-w-[100px]">
                  <span className="block text-[9px] text-text-muted uppercase tracking-wider">Balance Gold</span>
                  <span className="text-md font-bold font-mono text-primary-mint flex items-center justify-center gap-1 mt-1">
                    <Coins size={12} className="text-yellow-400" />
                    {stats.balance.toLocaleString()}
                  </span>
                </div>
                <div className="p-3.5 rounded-xl bg-emerald-bg/60 border border-white/5 text-center min-w-[100px]">
                  <span className="block text-[9px] text-text-muted uppercase tracking-wider">Claim Blocks</span>
                  <span className="text-md font-bold font-mono text-primary-mint flex items-center justify-center gap-1 mt-1">
                    <Box size={12} />
                    {stats.claimBlocks?.toLocaleString() || '1,000'}
                  </span>
                </div>
                <div className="p-3.5 rounded-xl bg-emerald-bg/60 border border-white/5 text-center min-w-[100px]">
                  <span className="block text-[9px] text-text-muted uppercase tracking-wider">Unban Tokens</span>
                  <span className="text-md font-bold font-mono text-primary-mint flex items-center justify-center gap-1 mt-1">
                    <Gavel size={12} />
                    {stats.unbanPasses} ACTIVE
                  </span>
                </div>
                <div className="p-3.5 rounded-xl bg-emerald-bg/60 border border-white/5 text-center min-w-[100px]">
                  <span className="block text-[9px] text-text-muted uppercase tracking-wider">Order Count</span>
                  <span className="text-md font-bold font-mono text-primary-mint flex items-center justify-center gap-1 mt-1">
                    <ShoppingBag size={12} />
                    {stats.purchasedItemsCount}
                  </span>
                </div>
              </div>
            </section>

            {/* Split page grid */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              
              {/* Unboxing loot boxes tab (interactive spinner!) */}
              <div className="lg:col-span-12 xl:col-span-8 flex flex-col gap-6">
                <CrateUnboxer 
                  stats={stats}
                  onDeductKey={handleDeductKey}
                  onGrantReward={handleGrantReward}
                />

                {/* Unboxed Rewards list inventory logs summary */}
                <div className="p-6 rounded-2xl bg-emerald-surface-container border border-white/5">
                  <span className="block text-xs font-bold text-primary-mint uppercase tracking-wider mb-2">My Unboxed Loot Relics ({unboxedItemsList.length})</span>
                  {unboxedItemsList.length === 0 ? (
                    <p className="text-xs text-text-muted py-4">You have not unboxed any chests in this session yet. Run a crate spin above!</p>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-[180px] overflow-y-auto pr-1 hide-scrollbar mt-2">
                      {unboxedItemsList.map((item, idx) => (
                        <div key={idx} className="p-2.5 rounded bg-emerald-bg/60 border border-white/5 text-xs text-text-primary flex items-center gap-2">
                          <span className="text-emerald-300">✦</span>
                          <span className="font-semibold">{item}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Server benefits status on profile */}
              <div className="lg:col-span-12 xl:col-span-4 flex flex-col gap-6 w-full">
                <div className="p-6 rounded-2xl glass-panel relative overflow-hidden flex flex-col gap-4">
                  <div className="absolute top-0 right-0 w-32 h-32 ambient-glow rounded-full translate-x-1/2 -translate-y-1/2 opacity-25"></div>
                  
                  <div>
                    <h3 className="text-sm font-bold text-primary-mint tracking-tight">ACTIVE BENEFITS</h3>
                    <p className="text-[10px] text-text-muted mt-0.5">Purchased permissions linked to play.applemc.fun</p>
                  </div>

                  <div className="flex flex-col gap-2.5">
                    <div className="p-3 bg-white/5 rounded-lg border border-white/5 flex justify-between items-center text-xs">
                      <span className="text-text-primary text-xs font-medium">Rank Class</span>
                      <span className="font-bold text-primary-mint capitalize">{stats.rank === 'None' ? 'None (Survival Commoner)' : `${stats.rank} Rank`}</span>
                    </div>
                    <div className="p-3 bg-white/5 rounded-lg border border-white/5 flex justify-between items-center text-xs">
                      <span className="text-text-primary text-xs font-medium">Lobby Flying Privilege</span>
                      <span className={`font-bold ${stats.rank !== 'None' ? 'text-teal-400' : 'text-text-muted'}`}>
                        {stats.rank !== 'None' ? 'ENABLED (Type `/fly`)' : 'DISABLED'}
                      </span>
                    </div>
                    <div className="p-3 bg-white/5 rounded-lg border border-white/5 flex justify-between items-center text-xs">
                      <span className="text-text-primary text-xs font-medium">Monthly Store Credit Bonus</span>
                      <span className={`font-bold ${stats.rank === 'MVP+' || stats.rank === 'Champion' ? 'text-teal-400' : 'text-text-muted'}`}>
                        {stats.rank === 'MVP+' ? '$10.00 Monthly' : stats.rank === 'Champion' ? '$5.00 Monthly' : 'None'}
                      </span>
                    </div>
                    <div className="p-3 bg-white/5 rounded-lg border border-white/5 flex justify-between items-center text-xs">
                      <span className="text-text-primary text-xs font-medium">Set Homes Command Limit</span>
                      <span className="font-bold text-primary-mint">
                        {stats.rank === 'MVP+' ? 'Ultimate (Unlimited)' : stats.rank === 'Champion' ? '5 Homes Limit' : stats.rank === 'VIP' ? '3 Homes Limit' : '1 Home Limit'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: SOCIAL COMMUNITY FEED & LOG CONSOLE */}
        {activeTab === 'social' && (
          <div id="social-tab-screen" className="grid grid-cols-1 lg:grid-cols-12 gap-8 animate-fade-in text-text-primary items-start">
            
            {/* Live Chat section */}
            <div className="lg:col-span-12 xl:col-span-8 flex flex-col gap-6">
              
              {/* Live transactions feed ticker */}
              <div className="p-6 rounded-2xl bg-emerald-surface-container border border-white/5 flex flex-col gap-4">
                <div>
                  <h2 className="text-lg font-bold text-primary-mint tracking-tight flex items-center gap-2">
                    <Activity size={18} className="text-teal-400" />
                    SERVER TRANSACTION TICKER
                  </h2>
                  <p className="text-xs text-text-muted">Live activity of purchases and unboxings on AppleMC Registry</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-[220px] overflow-y-auto pr-1 hide-scrollbar">
                  {events.map((ev, i) => (
                    <div 
                      key={ev.id || i}
                      className="p-3 bg-emerald-bg/50 rounded-xl border border-white/5 flex items-center justify-between gap-3 text-xs"
                    >
                      <div className="flex items-center gap-2 max-w-[70%] select-none">
                        <img 
                          src={`https://mc-heads.net/avatar/${ev.player}/16`}
                          alt="avatar"
                          onError={(e) => {
                            e.currentTarget.style.display = 'none';
                          }}
                          className="w-4 h-4 rounded-sm shrink-0"
                          referrerPolicy="no-referrer"
                        />
                        <p className="truncate">
                          <span className="font-bold text-primary-mint">{ev.player}</span>{' '}
                          <span className="text-text-muted text-[11px]">{ev.action}</span>{' '}
                          <span className="font-semibold text-white truncate">{ev.item}</span>
                        </p>
                      </div>
                      <span className="text-[10px] text-text-muted font-mono shrink-0">{ev.time}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Chat sandbox simulation */}
              <div className="p-6 rounded-2xl glass-panel border border-white/5 flex flex-col gap-4">
                <div>
                  <h3 className="text-sm font-bold text-primary-mint tracking-tight">SANCTUARY GENERAL CHAT</h3>
                  <p className="text-xs text-text-muted">Say hello to other players online in Lobby #1</p>
                </div>

                {/* Output channel */}
                <div className="h-64 bg-emerald-bg/70 border border-white/5 rounded-xl p-4 flex flex-col-reverse gap-3 overflow-y-auto pr-1 hide-scrollbar">
                  {chatFeed.map((chat, idx) => (
                    <div key={idx} className="flex gap-2.5 items-start text-xs leading-relaxed animate-fade-in text-text-primary">
                      <img 
                        src={`https://mc-heads.net/avatar/${chat.user}/16`}
                        alt="face"
                        onError={(e) => {
                          e.currentTarget.style.display = 'none';
                        }}
                        className="w-4.5 h-4.5 mt-0.5 rounded-sm shrink-0"
                        referrerPolicy="no-referrer"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 select-none">
                          <span className="font-bold text-teal-400">{chat.user}</span>
                          {chat.rank && (
                            <span className="text-[8px] font-black px-1 rounded bg-teal-400/15 text-teal-300 border border-teal-400/25 uppercase">
                              {chat.rank}
                            </span>
                          )}
                          <span className="text-[9px] text-text-muted opacity-80">{chat.time}</span>
                        </div>
                        <p className="text-text-primary mt-0.5 truncate break-words max-w-full">{chat.text}</p>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Form input */}
                <form onSubmit={handleSendChatMessage} className="flex gap-2">
                  <input 
                    type="text" 
                    value={chatMessage}
                    onChange={(e) => setChatMessage(e.target.value)}
                    placeholder="Type in-game chat message..."
                    required
                    maxLength={140}
                    className="flex-1 px-3 py-2 bg-emerald-surface-low border border-white/10 rounded-lg text-xs text-text-primary focus:outline-none focus:border-primary-mint select-all"
                  />
                  <button 
                    type="submit"
                    className="p-2 py-2 px-4 rounded-lg bg-primary-mint text-on-primary-mint transition-all hover:bg-opacity-95 text-xs font-bold active:scale-95 flex items-center gap-1.5 shrink-0"
                  >
                    <span>Send</span>
                    <Send size={12} />
                  </button>
                </form>
              </div>
            </div>

            {/* Donor Sideboard Leaderboards */}
            <div className="lg:col-span-12 xl:col-span-4 w-full">
              <Leaderboard currentUsername={stats.username} />
            </div>
          </div>
        )}

        {/* TAB 4: PROFILE SETTINGS MOJANG REGISTER */}
        {activeTab === 'profile' && (
          <div id="profile-tab-screen" className="flex flex-col gap-8 animate-fade-in max-w-3xl mx-auto w-full text-text-primary pb-12">
            
            {/* Direct Mojang Integration setting */}
            <section className="p-6 rounded-2xl glass-panel relative overflow-hidden flex flex-col gap-6">
              <div className="absolute top-0 right-0 w-32 h-32 ambient-glow rounded-full translate-x-1/2 -translate-y-1/2 opacity-35"></div>
              
              <div>
                <h2 className="text-lg font-bold text-primary-mint tracking-tight flex items-center gap-2">
                  <Gamepad2 size={18} />
                  LINK MINECRAFT ACCOUNT PROFILE
                </h2>
                <p className="text-xs text-text-muted mt-0.5">Link your authentic Minecraft Java Edition account to redeem ranks</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
                {/* Character preview */}
                <div className="md:col-span-4 flex flex-col items-center justify-center p-4 rounded-xl bg-emerald-bg/50 border border-white/5 text-center min-h-[160px]">
                  <img 
                    src={`https://mc-heads.net/body/${stats.username}/110`} 
                    alt="Skin body render"
                    className="h-28 object-contain image-rendering-pixelated mb-2 drop-shadow-[0_4px_12px_rgba(24,37,34,0.4)]"
                    onError={(e) => {
                      // Suppress or replace
                    }}
                    referrerPolicy="no-referrer"
                  />
                  <span className="text-[10px] font-bold text-primary-mint tracking-wider bg-primary-mint/10 border border-primary-mint/20 px-2 py-0.5 rounded uppercase">
                    Lobby Active Skin
                  </span>
                </div>

                {/* Edit details form */}
                <form onSubmit={handleLinkProfile} className="md:col-span-8 flex flex-col gap-4">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs text-text-muted font-medium">Minecraft Account Nickname</label>
                    <input 
                      type="text"
                      value={usernameInput}
                      onChange={(e) => setUsernameInput(e.target.value)}
                      required
                      placeholder="Enter Minecraft target name..."
                      className="px-3.5 py-2.5 bg-emerald-surface-low border border-white/10 rounded-lg text-xs leading-relaxed text-text-primary focus:outline-none focus:border-primary-mint transition-all"
                    />
                    <p className="text-[10px] text-text-muted leading-relaxed leading-1">
                      Our platform syncs dynamically with Mojang skins API databases to associate your character immediately.
                    </p>
                  </div>

                  <button 
                    type="submit"
                    className="py-2.5 px-5 bg-primary-mint text-on-primary-mint font-bold text-xs rounded-lg hover:shadow-[0_0_12px_rgba(184,238,214,0.3)] transition-all flex items-center justify-center gap-1.5 self-start active:scale-95"
                  >
                    <Check size={14} />
                    <span>SAVE PROFILE SETTINGS</span>
                  </button>
                </form>
              </div>
            </section>

            {/* Support history ticket sandbox logs */}
            <section className="p-6 rounded-2xl bg-emerald-surface-container border border-white/5 flex flex-col gap-4">
              <div>
                <h3 className="text-sm font-bold text-primary-mint tracking-tight">STORE PURCHASE TRANSACTION HISTORY</h3>
                <p className="text-xs text-text-muted mt-0.5">Historical overview of credits and perks bought on this browser</p>
              </div>

              {stats.purchasedItemsCount === 0 ? (
                <div className="p-6 text-center text-xs text-text-muted bg-emerald-bg/50 border border-white/5 rounded-xl">
                  <span>No purchase receipt invoices found. Initiate checkouts from the Store to test integration.</span>
                </div>
              ) : (
                <div className="overflow-x-auto hide-scrollbar">
                  <table className="w-full text-left text-xs text-text-primary border-collapse">
                    <thead>
                      <tr className="border-b border-white/10 text-[10px] text-text-muted tracking-wide uppercase select-none">
                        <th className="py-2.5">Invoice ID</th>
                        <th className="py-2.5">Minecraft ID</th>
                        <th className="py-2.5">Target Benefit Ranks & Keys</th>
                        <th className="py-2.5 text-right">Tally</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5 font-mono">
                      <tr>
                        <td className="py-3 text-primary-mint font-semibold">#AMC-9382-CHECK</td>
                        <td className="py-3 text-text-muted">{stats.username}</td>
                        <td className="py-3 text-white font-sans">{stats.rank !== 'None' ? `${stats.rank} Rank Integration Upgrade` : 'Claim blocks & Keys Bundle'}</td>
                        <td className="py-3 text-right text-primary-mint font-bold">$9.99</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              )}
            </section>
          </div>
        )}

      </main>

      {/* --- FOOTER BANNER --- */}
      <footer className="mt-16 bg-emerald-surface border-t border-white/5 py-12 text-center text-xs text-text-muted">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="text-center md:text-left select-none animate-fade-in">
            <span className="block font-black text-sm tracking-tight text-primary-mint uppercase">AppleMC Store</span>
            <p className="mt-1 text-[11px] text-text-muted">
              © 2026 AppleMC. All rights reserved. Not affiliated with Mojang Studios or Microsoft Corporations.
            </p>
          </div>
          <div className="flex gap-4">
            <button onClick={() => setActiveTab('store')} className="hover:text-primary-mint transition-colors">Products</button>
            <span>•</span>
            <button onClick={() => setActiveTab('library')} className="hover:text-primary-mint transition-colors">Inventory Library</button>
            <span>•</span>
            <button onClick={() => setShowTicketModal(true)} className="hover:text-primary-mint transition-colors">Create Support Ticket</button>
          </div>
        </div>
      </footer>

      {/* --- MOBILE NAVIGATION FIXED FOOTER TAB SHEET --- */}
      <nav id="mobile-nav-bar" className="fixed bottom-0 w-full z-50 bg-emerald-surface-container/90 backdrop-blur-2xl border-t border-white/10 shadow-lg flex justify-around items-center h-20 pb-safe px-4 rounded-t-xl block md:hidden transition-transform duration-200">
        <button 
          onClick={() => setIsCartOpen(true)}
          className="flex flex-col items-center justify-center rounded-full px-4 py-1.5 active:scale-90 transition-all text-text-muted hover:text-primary-mint"
        >
          <div className="relative">
            <ShoppingBag size={18} />
            {cartCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-teal-400 text-on-primary-mint text-[9px] font-bold w-3.5 h-3.5 rounded-full flex items-center justify-center">
                {cartCount}
              </span>
            )}
          </div>
          <span className="text-[10px] mt-0.5 tracking-tight font-medium">Cart</span>
        </button>
        <button 
          onClick={() => setActiveTab('profile')}
          className={`flex flex-col items-center justify-center rounded-full px-4 py-1.5 active:scale-90 transition-all ${
            activeTab === 'profile' 
              ? 'bg-secondary-mint-container text-primary-mint font-bold scale-105' 
              : 'text-text-muted hover:text-primary-mint'
          }`}
        >
          <User size={18} />
          <span className="text-[10px] mt-0.5 tracking-tight font-medium">Profile</span>
        </button>
      </nav>

      {/* --- CART DRAWER/MODAL POPUP --- */}
      <CartModal 
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        cartItems={cartItems}
        onUpdateQuantity={handleUpdateCartQuantity}
        onRemoveItem={handleRemoveCartItem}
        onCheckoutSuccess={handleCheckoutSuccess}
        defaultUsername={stats.username}
      />

      {/* --- INTERACTIVE TICKET MODAL --- */}
      {showTicketModal && (
        <div id="ticket-modal-backdrop" className="fixed inset-0 z-100 flex items-center justify-center p-4 bg-emerald-bg/80 backdrop-blur-xl animate-fade-in text-text-primary">
          <div className="w-full max-w-md rounded-xl glass-panel-heavy p-6 border border-primary-mint/35 flex flex-col gap-4 relative">
            <div className="flex justify-between items-center">
              <h3 className="text-md font-bold text-primary-mint tracking-tight flex items-center gap-1.5">
                <Ticket size={18} />
                CREATE SUPPORT TICKET
              </h3>
              <button 
                onClick={() => setShowTicketModal(false)}
                className="p-1 rounded bg-white/5 text-text-muted hover:text-primary-mint"
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleSupportTicket} className="flex flex-col gap-3">
              <div className="flex flex-col gap-1 text-left">
                <label className="text-[11px] text-text-muted font-semibold">Minecraft Username</label>
                <input 
                  type="text"
                  required
                  value={supportName}
                  onChange={(e) => setSupportName(e.target.value)}
                  placeholder="DreamBuilder_22"
                  className="px-3 py-1.5 bg-emerald-surface-low rounded border border-white/10 text-xs focus:outline-none focus:border-primary-mint"
                />
              </div>
              <div className="flex flex-col gap-1 text-left">
                <label className="text-[11px] text-text-muted font-semibold">Issue or Purchase details</label>
                <textarea 
                  required
                  rows={4}
                  value={supportMessage}
                  onChange={(e) => setSupportMessage(e.target.value)}
                  placeholder="Write your issue description... e.g. I purchased MVP+ Rank but did not receive chest credits yet."
                  className="px-3 py-1.5 bg-emerald-surface-low rounded border border-white/10 text-xs focus:outline-none focus:border-primary-mint"
                />
              </div>

              <button 
                type="submit"
                disabled={ticketSuccess}
                className="mt-2 py-2.5 bg-primary-mint text-on-primary-mint font-bold rounded text-xs transition-all active:scale-95 flex items-center justify-center gap-1"
              >
                {ticketSuccess ? 'SUBMITTED! REDIRECTING...' : 'REGISTER SUPPORT TICKET'}
              </button>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
