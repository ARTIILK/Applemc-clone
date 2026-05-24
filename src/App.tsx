import React, { useState, useEffect } from 'react';
import { 
  Shield, Key, Package, Settings, Sparkles, Star, Gift, Gavel, 
  Box, Tag, ShoppingBag, Gamepad2, X, Plus, Minus, Trash2, 
  Coins, MessageSquare, Ticket, Activity, Check, Trophy
} from 'lucide-react';

import { CartItem, PlayerStats, LiveEvent, Product } from './types';
import { PRODUCTS, CATEGORIES, LIVE_FEED_EVENTS } from './data';
import CartModal from './components/CartModal';
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

    showToast(`Purchase successful! Your in-game inventory on play.applemc.fun is updated.`);
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

      {/* --- HEADER --- */}
      <header className="fixed top-0 w-full z-50 bg-emerald-surface/85 backdrop-blur-xl border-b border-white/5 flex justify-between items-center px-6 h-16 transition-all">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 cursor-pointer">
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
            onClick={() => {
              setIsProfileLinked(false);
              showToast("Enter a new Minecraft Username in the store login form!");
            }}
            className="w-8 h-8 rounded-full bg-emerald-surface-high border border-primary-mint/40 flex items-center justify-center overflow-hidden cursor-pointer hover:border-primary-mint transition-all"
            title="Click to Switch Account Username"
          >
            <img 
              alt="Minecraft Skin Face" 
              className="w-6 h-6 object-contain image-rendering-pixelated" 
              src={`https://mc-heads.net/avatar/${stats.username}/32`}
              onError={(e) => {
                e.currentTarget.src = "https://lh3.googleusercontent.com/aida-public/AB6AXuAdNbLxcxMcRrSgTgoKSiCfqYQdRcQ51tuZz-sHLtb-TWP_TK9a4RIP1C2G6UfmfxG2mDCzTErDMYO4ZkA3dsrVcNkxT7CP4UHjN8w4pPi3GdDfKRaT8qrpvgOYsEo6WezviP8KXD4-W4x9DbiEnjcPljSBz8FBNOKbQoh7zZv1eVMsFR5oxQoC7sp_fmhvMH5F8YC2d3pglOHQWqTGJXCTTxTngJjD85n5KpSIt-8BA0wI4wO5Rl4XzR2ATTsmG6f-EuAN-osgKA1k";
              }}
              referrerPolicy="no-referrer"
            />
          </div>
        </div>
      </header>

      {/* --- MASTER MAIN CONTAINER --- */}
      <main className="relative z-10 pt-24 px-4 sm:px-6 md:px-8 max-w-7xl mx-auto flex flex-col gap-8 min-h-[calc(100vh-12rem)]">
        
        <div id="store-tab-screen" className="flex flex-col gap-8 animate-fade-in">
          {/* Hero Section */}
          <section id="store-hero" className="text-center relative py-8 max-w-2xl mx-auto">
            <div className="inline-block mb-3 px-4 py-1 rounded-full border border-primary-mint/15 bg-primary-mint/5 text-primary-mint text-[11px] font-bold tracking-widest uppercase">
              WELCOME TO THE OFFICIAL SERVER STORE
            </div>
            <h1 className="text-3xl md:text-5xl font-extrabold text-primary-mint tracking-tighter uppercase mb-2">
              APPLEMC STORE
            </h1>
            <p className="text-sm text-text-muted leading-relaxed">
              Enhance your survival journey with premium ranks, keys, and loot bundles. Join thousands of active players in the ultimate Minecraft sanctuary.
            </p>
          </section>

          {/* Layout Configuration with sidebar and main catalog */}
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            
            {/* Sidebar Columns */}
            <aside className="lg:col-span-1 flex flex-col gap-6">
              
              {/* Account Linking Block */}
              <div className="p-4 rounded-xl bg-emerald-surface-container border border-white/5 flex flex-col gap-3">
                <span className="block text-[10px] font-bold text-primary-mint uppercase tracking-wider">Store Account</span>
                {isProfileLinked ? (
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-emerald-bg border border-white/5 flex items-center justify-center p-1 relative">
                      <img 
                        src={`https://mc-heads.net/avatar/${stats.username}/32`} 
                        alt="Avatar" 
                        className="w-8 h-8 object-contain image-rendering-pixelated"
                        onError={(e) => {
                          e.currentTarget.src = "https://lh3.googleusercontent.com/aida-public/AB6AXuAdNbLxcxMcRrSgTgoKSiCfqYQdRcQ51tuZz-sHLtb-TWP_TK9a4RIP1C2G6UfmfxG2mDCzTErDMYO4ZkA3dsrVcNkxT7CP4UHjN8w4pPi3GdDfKRaT8qrpvgOYsEo6WezviP8KXD4-W4x9DbiEnjcPljSBz8FBNOKbQoh7zZv1eVMsFR5oxQoh7zZv1eVMsFR5oxQoC7sp_fmhvMH5F8YC2d3pglOHQWqTGJXCTTxTngJjD85n5KpSIt-8BA0wI4wO5Rl4XzR2ATTsmG6f-EuAN-osgKA1k";
                        }}
                        referrerPolicy="no-referrer"
                      />
                      <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-primary-mint border border-emerald-surface-container"></span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <span className="block text-xs font-bold text-text-primary truncate">{stats.username}</span>
                      <button 
                        onClick={() => {
                          setIsProfileLinked(false);
                          setUsernameInput('');
                        }}
                        className="text-[10px] text-primary-mint hover:underline text-left block font-semibold"
                      >
                        Change Username
                      </button>
                    </div>
                  </div>
                ) : (
                  <form onSubmit={handleLinkProfile} className="flex flex-col gap-2">
                    <input 
                      type="text"
                      required
                      value={usernameInput}
                      onChange={(e) => setUsernameInput(e.target.value)}
                      placeholder="Enter Minecraft Name..."
                      className="w-full px-3 py-1.5 bg-emerald-bg border border-white/10 rounded text-xs focus:outline-none focus:border-primary-mint text-text-primary"
                    />
                    <button 
                      type="submit"
                      className="w-full py-2 px-3 bg-primary-mint text-on-primary-mint font-bold text-[10px] rounded hover:shadow-[0_0_8px_rgba(184,238,214,0.3)] transition-all uppercase"
                    >
                      Continue to Shop
                    </button>
                  </form>
                )}
              </div>

              {/* Visual search bar */}
              <div className="p-4 rounded-xl bg-emerald-surface-container border border-white/5">
                <span className="block text-[10px] font-bold text-primary-mint uppercase tracking-wider mb-2">Search Catalog</span>
                <input 
                  type="text" 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search pack..."
                  className="w-full px-3 py-1.5 bg-emerald-bg border border-white/10 rounded text-xs focus:outline-none focus:border-primary-mint text-text-primary"
                />
              </div>

              {/* Server Donation Goal Tracker */}
              <div className="p-4 rounded-xl bg-emerald-surface-container border border-white/5 flex flex-col gap-2.5">
                <div className="flex justify-between items-center text-[10px] font-semibold uppercase">
                  <span className="text-primary-mint">MAY MAIN MAINTENANCES GOAL</span>
                  <span className="text-text-primary font-mono font-bold">84%</span>
                </div>
                <div className="w-full h-1.5 bg-emerald-bg rounded-full overflow-hidden border border-white/5">
                  <div className="h-full bg-gradient-to-r from-teal-400 to-primary-mint rounded-full" style={{ width: '84%' }}></div>
                </div>
                <div className="text-[10px] text-text-muted leading-relaxed">
                  Support server maintenance! Cost reset cycle occurs in 7 days.
                </div>
              </div>

              {/* Categories Container */}
              <div className="p-4 rounded-xl bg-emerald-surface-container border border-white/5 flex flex-col gap-2">
                <div className="px-2 mb-2 hidden lg:block">
                  <span className="block text-xs font-bold text-primary-mint uppercase tracking-wider">Item Categories</span>
                  <span className="text-[10px] text-text-muted">Browse items</span>
                </div>

                <div className="flex flex-row lg:flex-col gap-2 overflow-x-auto hide-scrollbar pb-2 lg:pb-0">
                  {CATEGORIES.map((cat) => {
                    const isActive = selectedCategory === cat.id;
                    return (
                      <button
                        key={cat.id}
                        onClick={() => setSelectedCategory(cat.id)}
                        className={`flex-none lg:flex-initial py-2 px-4 rounded-lg text-xs font-semibold flex items-center gap-3 transition-all ${
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

              {/* Recent Purchasers Stream Feed */}
              <div className="p-4 rounded-xl bg-emerald-surface-container border border-white/5 flex flex-col gap-3">
                <span className="block text-[10px] font-bold text-primary-mint uppercase tracking-wider">Recent Purchasers</span>
                <div className="flex flex-col gap-2 max-h-[170px] overflow-y-auto pr-1 hide-scrollbar">
                  {events.slice(0, 4).map((ev, i) => (
                    <div key={ev.id || i} className="flex items-center gap-2 text-[10px] justify-between border-b border-white/[0.02] pb-1">
                      <div className="flex items-center gap-1.5 truncate">
                        <img 
                          src={`https://mc-heads.net/avatar/${ev.player}/16`}
                          alt="face"
                          className="w-3.5 h-3.5 rounded-sm shrink-0"
                          onError={(e) => { e.currentTarget.style.display = 'none'; }}
                          referrerPolicy="no-referrer"
                        />
                        <span className="font-semibold text-white truncate max-w-[65px]">{ev.player}</span>
                        <span className="text-text-muted truncate max-w-[100px]">{ev.item}</span>
                      </div>
                      <span className="text-[8px] font-mono text-text-muted shrink-0">{ev.time}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Server Online Status Card */}
              <div className="p-4 rounded-xl glass-panel flex flex-col gap-1 hover:border-primary-mint/30 transition-all">
                <span className="text-[10px] font-bold tracking-wider text-text-muted uppercase">SERVER CONNECTION</span>
                <div className="flex items-center justify-between mt-1">
                  <span className="text-xs font-bold text-text-primary">play.applemc.fun</span>
                  <div className="flex items-center gap-1.5 bg-primary-mint/10 border border-primary-mint/20 rounded px-2 py-0.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-primary-mint animate-pulse"></span>
                    <span className="text-[9px] text-primary-mint font-bold uppercase">ONLINE</span>
                  </div>
                </div>
                <div className="mt-2.5 border-t border-white/5 pt-2.5">
                  <span className="block text-md font-mono font-bold text-primary-mint">2,481 Players Live</span>
                </div>
              </div>

              {/* Sidebar Supporter Leaderboards Column */}
              <div className="w-full">
                <Leaderboard currentUsername={stats.username} />
              </div>

            </aside>

            {/* Catalog Grid Column */}
            <section className="lg:col-span-3 flex flex-col gap-6">
              <div className="flex items-center justify-between border-b border-white/5 pb-3">
                <h2 className="text-lg font-bold text-primary-mint capitalize tracking-tight flex items-center gap-2">
                  <span>{selectedCategory}</span>
                </h2>
                <span className="text-[10px] font-bold tracking-wider text-text-muted bg-white/5 px-2.5 py-1 rounded-full uppercase">
                  Immediate Delivery
                </span>
              </div>

              {filteredProducts.length === 0 ? (
                <div className="p-12 text-center rounded-xl bg-white/5 border border-white/5">
                  <p className="text-sm font-medium text-text-primary">No results found</p>
                  <p className="text-xs text-text-muted mt-1">Try resetting search keywords or choose another store category bar above.</p>
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

                        {/* Product Emblem representation */}
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
                            <span className="block text-sm font-bold text-text-primary group-hover:text-primary-mint transition-colors">
                              {p.name}
                            </span>
                            <span className="block text-[11px] text-text-muted leading-relaxed mt-1">
                              {p.description}
                            </span>
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
                              onClick={() => {
                                handleAddToCart(p);
                                if (!isProfileLinked) {
                                  showToast("Please link your character in the store session sidebar!");
                                }
                              }}
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
                                  <span>ADD To Cart</span>
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

          {/* Support section help banner */}
          <section id="help-banner" className="py-8 px-6 glass-panel rounded-2xl text-center relative overflow-hidden mt-8 max-w-4xl mx-auto w-full">
            <div className="absolute top-0 right-0 w-32 h-32 ambient-glow rounded-full translate-x-1/2 opacity-25"></div>
            
            <h2 className="text-xl md:text-2xl font-black text-primary-mint tracking-tight uppercase mb-2">
              Still have questions?
            </h2>
            <p className="text-xs md:text-sm text-text-muted mb-6 max-w-md mx-auto leading-relaxed">
              Our support team is active 24/7. Ranks and key purchases deliver dynamically into play.applemc.fun server within 5 minutes of payment checkout.
            </p>
            <div className="grid grid-cols-2 gap-4 max-w-sm mx-auto">
              <button 
                onClick={() => {
                  setIsDiscordLinked(true);
                  showToast("Discord invite copied successfully!");
                }}
                className="flex items-center justify-center gap-2 bg-emerald-surface-highest/80 hover:bg-emerald-bright text-text-primary text-xs font-bold py-3 rounded-xl transition-all border border-white/5 animate-button"
              >
                <MessageSquare size={14} className="text-primary-mint" />
                <span>{isDiscordLinked ? 'DISCORD INVITED' : 'Discord Help Community'}</span>
              </button>
              <button 
                onClick={() => setShowTicketModal(true)}
                className="flex items-center justify-center gap-2 bg-emerald-surface-highest/80 hover:bg-emerald-bright text-text-primary text-xs font-bold py-3 rounded-xl transition-all border border-white/5 animate-button"
              >
                <Ticket size={14} className="text-primary-mint" />
                <span>Submit Support Ticket</span>
              </button>
            </div>
          </section>

        </div>

      </main>

      {/* --- FOOTER BANNER --- */}
      <footer className="mt-16 bg-emerald-surface border-t border-white/5 py-12 text-center text-xs text-text-muted">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="text-center md:text-left select-none animate-fade-in">
            <span className="block font-black text-sm tracking-tight text-primary-mint uppercase">AppleMC Store</span>
            <p className="mt-1 text-[11px] text-text-muted leading-relaxed">
              © 2026 AppleMC. All rights reserved. We are not associated or affiliated with Mojang Studios, Minecraft, or Microsoft Corporation.
            </p>
          </div>
          <div className="flex gap-4">
            <button onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} className="hover:text-primary-mint transition-colors">Catalog Products</button>
            <span>•</span>
            <button onClick={() => setShowTicketModal(true)} className="hover:text-primary-mint transition-colors">Submit Support Ticket</button>
          </div>
        </div>
      </footer>

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
