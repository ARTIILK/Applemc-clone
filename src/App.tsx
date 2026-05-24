import React, { useState, useEffect } from 'react';
import { 
  Shield, Key, Package, Settings, Sparkles, Star, Gift, Gavel, 
  Box, Tag, ShoppingBag, Gamepad2, X, Plus, Minus, Trash2, 
  MessageSquare, Ticket, Activity, Check, Trophy, Heart, ExternalLink, RefreshCw
} from 'lucide-react';

import { CartItem, PlayerStats, LiveEvent, Product } from './types';
import { PRODUCTS, CATEGORIES, LIVE_FEED_EVENTS, SITE_CONFIG } from './data';
import CartModal from './components/CartModal';
import CheckoutModal from './components/CheckoutModal';

const DEFAULT_STATS: PlayerStats = {
  username: 'NobleGuest',
  rank: 'None',
  keys: {
    mythic: 2,
    ancient: 1,
    divine: 0
  },
  balance: 1500,
  claimBlocks: 500,
  unbanPasses: 0,
  purchasedItemsCount: 0
};

export default function App() {
  // --- Persistent Reactive States ---
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  
  // Set default category select to 'all' to show merged items list!
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [checkoutUsername, setCheckoutUsername] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Currency Toggle selection defaults to INR as configured inside store.json
  const [currency, setCurrency] = useState<'INR' | 'USD'>(() => {
    return (SITE_CONFIG.defaultCurrency as 'INR' | 'USD') || 'INR';
  });

  // Player Stats in memory (linked skin, keys, balance, unlocks)
  const [stats, setStats] = useState<PlayerStats>(DEFAULT_STATS);
  
  // Custom Live Feed Logs (which grow as user unboxes or purchases)
  const [events, setEvents] = useState<LiveEvent[]>(LIVE_FEED_EVENTS);
  
  // Notification logs or Toast banners
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  
  // Linked Discord & Mojang States
  const [isDiscordLinked, setIsDiscordLinked] = useState(false);
  const [isProfileLinked, setIsProfileLinked] = useState(true);
  const [usernameInput, setUsernameInput] = useState(stats.username);

  // Social chat comments
  const [chatMessage, setChatMessage] = useState('');
  const [chatFeed, setChatFeed] = useState<Array<{user: string, text: string, time: string, rank?: string}>>([
    { user: 'EliteGlow', text: 'EliteMC ranks deliver instantly inside the play.elitemc.net server, love it!', time: 'Just now', rank: 'MVP' },
    { user: 'EliteSupporter', text: 'Just unboxed 5 Divine keys, got awesome custom cosmetics! ⭐', time: '2 min ago', rank: 'ELITE' },
    { user: 'SanctuaryPlayer', text: 'Does anyone want to team up on the skyblock or factions realm?', time: '5 min ago', rank: 'None' }
  ]);

  // Support Ticket Form States
  const [supportName, setSupportName] = useState('');
  const [supportMessage, setSupportMessage] = useState('');
  const [showTicketModal, setShowTicketModal] = useState(false);
  const [ticketSuccess, setTicketSuccess] = useState(false);

  // --- Load and Save State natively in localStorage ---
  useEffect(() => {
    const cachedStats = localStorage.getItem('elitemc_stats');
    if (cachedStats) {
      try {
        setStats(JSON.parse(cachedStats));
      } catch (e) {
        console.error('Failed to load stats cache', e);
      }
    }

    const cachedCart = localStorage.getItem('elitemc_cart');
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
    localStorage.setItem('elitemc_stats', JSON.stringify(newStats));
  };

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 4050);
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
    localStorage.setItem('elitemc_cart', JSON.stringify(updated));
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
    localStorage.setItem('elitemc_cart', JSON.stringify(updated));
  };

  const handleRemoveCartItem = (productId: string) => {
    const updated = cartItems.filter(item => item.product.id !== productId);
    setCartItems(updated);
    localStorage.setItem('elitemc_cart', JSON.stringify(updated));
  };

  // --- Purchase Execution Checkout Simulation ---
  const handleCheckoutSuccess = (mcUsername: string, itemsPaidFor: CartItem[]) => {
    // Increment items count
    let newKeys = { ...stats.keys };
    let newClaimBlocks = stats.claimBlocks;
    let newUnbanPasses = stats.unbanPasses;
    let newPurchasedItemsCount = stats.purchasedItemsCount + itemsPaidFor.reduce((s, i) => s + i.quantity, 0);

    itemsPaidFor.forEach((item) => {
      const q = item.quantity;
      const pid = item.product.id;

      if (pid === 'keys-mythic' || pid === 'keys-package') newKeys.mythic += 5 * q;
      if (pid === 'keys-ancient') newKeys.ancient += 3 * q;
      if (pid === 'keys-divine') newKeys.divine += 1 * q;

      if (pid === 'bundle-starter' || pid === 'celestial-pack') {
        newKeys.mythic += 5 * q;
        newClaimBlocks += 1000 * q;
      }
      if (pid === 'unban-pass' || pid === 'utility-unban') {
        newUnbanPasses += q;
      }
    });

    const finalStats: PlayerStats = {
      username: mcUsername,
      rank: stats.rank !== 'None' ? stats.rank : 'MVP',
      keys: newKeys,
      balance: stats.balance + 1000,
      claimBlocks: newClaimBlocks + 500,
      unbanPasses: newUnbanPasses,
      purchasedItemsCount: newPurchasedItemsCount
    };

    saveStats(finalStats);
    setCartItems([]);
    localStorage.removeItem('elitemc_cart');
    setIsCartOpen(false);

    // Add purchase event block to the live social feed
    const firstItemName = itemsPaidFor[0]?.product.name || 'Premium Service';
    const andMoreText = itemsPaidFor.length > 1 ? ` and ${itemsPaidFor.length - 1} more items` : '';
    const newEvent: LiveEvent = {
      id: `purchase-${Date.now()}`,
      player: mcUsername,
      action: 'purchased',
      item: `${firstItemName}${andMoreText}`,
      time: 'Just now'
    };

    setEvents([newEvent, ...events]);
    showToast(`Purchase dynamic dispatch logs updated! Your in-game inventory on play.elitemc.net was synced.`);
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
    showToast(`Minecraft character profile '${usernameInput}' synced with play.elitemc.net successfully!`);
  };

  // --- Interactive Chat send ---
  const handleSendChatMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatMessage.trim()) return;
    const newChat = {
      user: stats.username,
      text: chatMessage,
      time: 'Just now',
      rank: stats.rank !== 'None' ? stats.rank : 'Player'
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
      showToast('Support ticket loaded! An administrator will contact you on play.elitemc.net shortly.');
    }, 2000);
  };

  // --- Helper Calculations ---
  const cartCount = cartItems.reduce((acc, item) => acc + item.quantity, 0);

  // Filter Catalog Products based on selected Category and Search query
  const filteredProducts = PRODUCTS.filter((p) => {
    const matchCat = selectedCategory === 'all' || p.category === selectedCategory || p.categoryId === selectedCategory;
    const matchSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                        p.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchCat && matchSearch;
  });

  // Dynamic icon picker
  const renderCategoryIcon = (iconName: string, size = 18) => {
    switch (iconName?.toLowerCase()) {
      case 'shield': return <Shield size={size} className="text-primary-mint" />;
      case 'key': return <Key size={size} className="text-primary-mint" />;
      case 'package': return <Package size={size} className="text-primary-mint" />;
      case 'settings': return <Settings size={size} className="text-primary-mint" />;
      case 'sparkles': return <Sparkles size={size} className="text-primary-mint" />;
      case 'star': return <Star size={size} className="text-primary-mint" />;
      case 'gift': return <Gift size={size} className="text-primary-mint" />;
      case 'gavel': return <Gavel size={size} className="text-primary-mint" />;
      case 'tag': return <Tag size={size} className="text-primary-mint" />;
      default: return <Package size={size} className="text-primary-mint" />;
    }
  };

  return (
    <div className="min-h-screen bg-emerald-bg font-sans selection:bg-primary-mint selection:text-emerald-bg transition-all duration-300">
      
      {/* Toast Notification */}
      {toastMessage && (
        <div id="app-dynamic-toast" className="fixed top-6 right-6 z-120 animate-fade-in bg-emerald-bg border border-primary-mint/40 text-xs px-4 py-3 rounded-xl shadow-2xl flex items-center gap-2.5">
          <div className="w-2 h-2 rounded-full bg-primary-mint animate-ping"></div>
          <span className="text-gray-100 font-medium">{toastMessage}</span>
        </div>
      )}

      {/* --- MASTER HEADER NAVBAR --- */}
      <header className="fixed top-0 left-0 right-0 z-50 border-b border-white/5 bg-black/80 backdrop-blur-md px-4 sm:px-6 md:px-8 py-3.5 flex items-center justify-between">
        
        {/* Logo and Server status indicator */}
        <div className="flex items-center gap-4 select-none">
          <div className="flex items-baseline gap-2">
            <span className="font-extrabold text-lg tracking-wider text-primary-mint uppercase">
              {SITE_CONFIG.serverName || 'EliteMC'}
            </span>
            <span className="text-[10px] text-gray-500 font-bold uppercase tracking-widest hidden sm:inline">Sanctuary Store</span>
          </div>
          
          <div className="hidden md:flex items-center gap-1.5 px-2 py-0.5 rounded bg-primary-mint/10 border border-primary-mint/20 text-[9px] text-primary-mint font-extrabold tracking-wide uppercase">
            <span className="w-1.5 h-1.5 rounded-full bg-primary-mint animate-pulse"></span>
            {SITE_CONFIG.serverIP || 'play.elitemc.net'}
          </div>
        </div>

        {/* Dynamic Navigation Tabs and Currency Selector */}
        <div className="flex items-center gap-5">
          
          {/* Dynamic Selector of Currency Options */}
          <div className="flex bg-white/5 p-1 rounded-lg border border-white/5 items-center gap-1">
            <button 
              onClick={() => setCurrency('INR')}
              className={`px-2.5 py-1 rounded text-[10px] font-black tracking-wide transition-all cursor-pointer ${
                currency === 'INR' 
                  ? 'bg-primary-mint text-emerald-bg shadow-lg font-bold' 
                  : 'text-gray-400 hover:text-white'
              }`}
              title="Show prices in Indian Rupees"
            >
              INR (₹)
            </button>
            <button 
              onClick={() => setCurrency('USD')}
              className={`px-2.5 py-1 rounded text-[10px] font-black tracking-wide transition-all cursor-pointer ${
                currency === 'USD' 
                  ? 'bg-primary-mint text-emerald-bg shadow-lg font-bold' 
                  : 'text-gray-400 hover:text-white'
              }`}
              title="Show prices in US Dollar"
            >
              USD ($)
            </button>
          </div>

          {/* Social connection links */}
          <a 
            href={SITE_CONFIG.discord || 'https://discord.gg/elitemc'} 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-gray-400 hover:text-primary-mint transition-colors text-xs font-semibold flex items-center gap-1"
          >
            <MessageSquare size={16} />
            <span className="hidden sm:inline">Discord</span>
          </a>

          {/* Cart triggers */}
          <button 
            id="header-cart-btn"
            onClick={() => setIsCartOpen(true)}
            className="relative p-2 rounded-full hover:bg-white/5 text-primary-mint transition-all active:scale-90 cursor-pointer"
          >
            <ShoppingBag size={20} />
            {cartCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-primary-mint text-emerald-bg text-[9px] font-extrabold w-4.5 h-4.5 rounded-full flex items-center justify-center animate-pulse">
                {cartCount}
              </span>
            )}
          </button>

          {/* User Character Skin Face circular hook */}
          <div 
            id="header-profile-trigger"
            onClick={() => {
              setIsProfileLinked(false);
              showToast("Enter your Minecraft username in the sidebar profile box!");
            }}
            className="w-8 h-8 rounded-full bg-black border border-primary-mint/20 flex items-center justify-center overflow-hidden cursor-pointer hover:border-primary-mint/50 transition-all"
            title="Switch Account Profile"
          >
            <img 
              alt="Skin face" 
              className="w-6 h-6 object-contain" 
              src={`https://mc-heads.net/avatar/${stats.username}/32`}
              onError={(e) => {
                e.currentTarget.src = "https://mc-heads.net/avatar/MHF_Alex/32";
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
          <section id="store-hero" className="text-center relative py-6 max-w-2xl mx-auto flex flex-col items-center">
            <div className="inline-block mb-3 px-3 py-1 rounded-full border border-primary-mint/15 bg-primary-mint/5 text-primary-mint text-[10px] font-black tracking-widest uppercase">
              🛡️ Official Minecraft Server Sanctuary Store
            </div>
            <h1 className="text-3xl md:text-5xl font-black text-primary-mint tracking-tighter uppercase mb-2 font-sans text-transparent bg-clip-text bg-gradient-to-r from-primary-mint via-primary-mint to-teal-300">
              {SITE_CONFIG.serverName || 'EliteMC'}
            </h1>
            <p className="text-xs md:text-sm text-text-muted leading-relaxed max-w-lg">
              Enhance your sanctuary experience with server ranks, crate keys, value bundles, cosmetics, and claim blocks directly delivered inside {SITE_CONFIG.serverIP || 'play.elitemc.net'}.
            </p>
          </section>

          {/* Layout Configuration with sidebar and main catalog */}
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            
            {/* Sidebar Columns */}
            <aside className="lg:col-span-1 flex flex-col gap-6">
              
              {/* Account Linking Block */}
              <div className="p-4 rounded-xl bg-white/5 border border-white/5 flex flex-col gap-3">
                <span className="block text-[10px] font-bold text-primary-mint uppercase tracking-wider font-sans">Mojang Account Identity</span>
                {isProfileLinked ? (
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-black border border-white/10 flex items-center justify-center p-1 relative">
                      <img 
                        src={`https://mc-heads.net/avatar/${stats.username}/32`} 
                        alt="Linked Avatar face" 
                        className="w-8 h-8 object-contain"
                        onError={(e) => {
                          e.currentTarget.src = "https://mc-heads.net/avatar/MHF_Alex/32";
                        }}
                        referrerPolicy="no-referrer"
                      />
                      <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-primary-mint border border-black"></span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <span className="block text-xs font-black text-gray-100 truncate font-mono">{stats.username}</span>
                      <button 
                        onClick={() => {
                          setIsProfileLinked(false);
                          setUsernameInput('');
                        }}
                        className="text-[10px] text-primary-mint hover:underline text-left block font-bold cursor-pointer font-sans"
                      >
                        Disconnect Stats
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
                      placeholder="Username (e.g. HeroPlayer)"
                      className="w-full px-3 py-1.5 bg-black border border-white/10 rounded text-xs focus:outline-none focus:border-primary-mint text-white placeholder:text-[11px]"
                    />
                    <button 
                      type="submit"
                      className="w-full py-2 px-3 bg-primary-mint text-emerald-bg font-bold text-[10px] rounded hover:shadow-[0_0_8px_rgba(184,238,214,0.3)] transition-all uppercase cursor-pointer"
                    >
                      Authenticate Account
                    </button>
                  </form>
                )}
              </div>

              {/* Visual search bar */}
              <div className="p-4 rounded-xl bg-white/5 border border-white/5">
                <span className="block text-[10px] font-bold text-primary-mint uppercase tracking-wider mb-2">Search Catalog</span>
                <input 
                  type="text" 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Filter store items..."
                  className="w-full px-3 py-1.5 bg-black border border-white/10 rounded text-xs focus:outline-none focus:border-primary-mint text-white"
                />
              </div>

              {/* Categories Navigation Selection Side Menu */}
              <div className="p-4 rounded-xl bg-white/5 border border-white/5 flex flex-col gap-2">
                <span className="block text-[10px] font-bold text-primary-mint uppercase tracking-wider mb-2">Departments</span>
                
                {/* Merged Items Tab */}
                <button 
                  onClick={() => setSelectedCategory('all')}
                  className={`w-full p-2.5 rounded-lg text-left text-xs font-bold transition-all flex items-center justify-between border cursor-pointer ${
                    selectedCategory === 'all' 
                      ? 'bg-primary-mint/10 border-primary-mint/40 text-primary-mint shadow-[0_0_8px_rgba(184,238,214,0.1)]' 
                      : 'bg-transparent border-transparent text-gray-400 hover:text-white border-white/5'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <Package size={18} className="text-secondary-mint" />
                    <span>All Products (Merged)</span>
                  </div>
                  <span className="text-[10px] text-gray-400 px-1 rounded bg-black border border-white/5 font-mono">
                    {PRODUCTS.length}
                  </span>
                </button>

                {CATEGORIES.map((cat) => {
                  const isActive = selectedCategory === cat.id;
                  return (
                    <button 
                      key={cat.id}
                      onClick={() => setSelectedCategory(cat.id)}
                      className={`w-full p-2.5 rounded-lg text-left text-xs font-bold transition-all flex items-center justify-between border cursor-pointer ${
                        isActive 
                          ? 'bg-primary-mint/10 border-primary-mint/40 text-primary-mint shadow-[0_0_8px_rgba(184,238,214,0.1)]' 
                          : 'bg-transparent border-transparent text-gray-400 hover:text-white border-white/5'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        {renderCategoryIcon(cat.icon)}
                        <span>{cat.label}</span>
                      </div>
                      <span className="text-[10px] text-gray-400 px-1 rounded bg-black border border-white/5 font-mono">
                        {PRODUCTS.filter(p => (p.category === cat.id || p.categoryId === cat.id)).length}
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* Server Social Chat Feed Box */}
              <div className="p-4 rounded-xl bg-white/5 border border-white/5 flex flex-col gap-3">
                <span className="block text-[10px] font-bold text-primary-mint uppercase tracking-wider">Lobby Chat Stream</span>
                
                <div className="flex flex-col gap-2 max-h-[160px] overflow-y-auto hide-scrollbar text-[11px] pr-1">
                  {chatFeed.map((ch, i) => (
                    <div key={i} className="flex flex-col gap-0.5 border-b border-white/5 pb-1.5 last:border-0">
                      <div className="flex justify-between items-baseline">
                        <span className="font-mono font-bold text-gray-300 flex items-center gap-1">
                          {ch.rank && ch.rank !== 'None' && (
                            <span className="text-[8px] px-1 bg-primary-mint/15 text-primary-mint rounded font-semibold uppercase">{ch.rank}</span>
                          )}
                          {ch.user}
                        </span>
                        <span className="text-[9px] text-gray-500 font-mono">{ch.time}</span>
                      </div>
                      <p className="text-gray-400 leading-snug">{ch.text}</p>
                    </div>
                  ))}
                </div>

                <form onSubmit={handleSendChatMessage} className="flex gap-1.5 mt-1">
                  <input 
                    type="text"
                    value={chatMessage}
                    onChange={(e) => setChatMessage(e.target.value)}
                    placeholder="Type in chat..."
                    className="flex-1 px-2.5 py-1 bg-black rounded border border-white/10 text-xs text-white focus:outline-none focus:border-primary-mint"
                  />
                  <button 
                    type="submit"
                    className="px-2.5 py-1 bg-primary-mint text-emerald-bg font-bold rounded text-xs hover:bg-white transition-all cursor-pointer"
                  >
                    Send
                  </button>
                </form>
              </div>

            </aside>

            {/* Main Products Grid Catalog */}
            <section className="lg:col-span-3 flex flex-col gap-6">
              
              <div className="flex items-center justify-between border-b border-white/5 pb-3">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-primary-mint font-black uppercase tracking-wider">Department Display</span>
                  <span className="text-[10px] text-gray-400 font-mono">/</span>
                  <span className="text-xs text-gray-100 font-bold capitalize">
                    {selectedCategory === 'all' ? 'All Merged Products' : (CATEGORIES.find(c => c.id === selectedCategory)?.label || selectedCategory)}
                  </span>
                </div>

                <span className="text-[10px] text-gray-400 font-mono">
                  Showing {filteredProducts.length} entries in catalog
                </span>
              </div>

              {filteredProducts.length === 0 ? (
                <div className="py-20 text-center rounded-2xl bg-white/5 border border-white/5 flex flex-col items-center justify-center p-6">
                  <Package className="text-gray-600 animate-pulse mb-3" size={32} />
                  <p className="text-sm font-semibold text-gray-200">No matching pack found</p>
                  <p className="text-xs text-gray-400 mt-1">Try toggling another department or clear your query filter.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                  {filteredProducts.map((p) => {
                    const isProductInCart = cartItems.some(item => item.product.id === p.id);
                    const isINR = currency === 'INR';
                    const activePrice = isINR ? p.priceINR : p.priceUSD;
                    const priceDisplay = isINR ? `₹${activePrice}` : `$${activePrice.toFixed(2)}`;

                    return (
                      <div 
                        key={p.id}
                        id={`product-card-${p.id}`}
                        className="bg-[#111c1a]/60 rounded-2xl border border-white/5 p-4 flex flex-col justify-between card-hover relative overflow-hidden group hover:border-primary-mint/20 transition-all"
                      >
                        {/* Featured Tag Indicator */}
                        {p.featured && (
                          <span className="absolute top-3 right-3 bg-primary-mint text-emerald-bg font-black text-[8px] tracking-widest uppercase px-1.5 py-0.5 rounded shadow z-10">
                            POPULAR
                          </span>
                        )}

                        <div className="flex flex-col gap-3">
                          {/* Image Render */}
                          <div className="w-full h-36 rounded-xl bg-black border border-white/5 overflow-hidden flex items-center justify-center relative">
                            {p.image ? (
                              <img 
                                src={p.image} 
                                alt={p.name} 
                                className="w-full h-full object-cover group-hover:scale-105 transition-all duration-500"
                                referrerPolicy="no-referrer"
                              />
                            ) : (
                              <div className="text-primary-mint opacity-60">
                                {renderCategoryIcon('package', 44)}
                              </div>
                            )}
                          </div>

                          {/* Product Details */}
                          <div>
                            <span className="block text-sm font-black text-gray-100 group-hover:text-primary-mint transition-colors uppercase font-mono">
                              {p.name}
                            </span>
                            
                            {/* Stock Indicator */}
                            {p.stock && (
                              <span className={`inline-block text-[9px] font-bold uppercase rounded px-1.5 py-0.5 mt-1.5 ${
                                p.stock.toLowerCase().includes('low') || p.stock.toLowerCase().includes('left')
                                  ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                                  : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                              }`}>
                                {p.stock}
                              </span>
                            )}

                            <span className="block text-[11px] text-text-muted leading-relaxed mt-2 line-clamp-3 h-12">
                              {p.description}
                            </span>
                          </div>
                        </div>

                        <div className="mt-4 pt-3 border-t border-white/5 flex items-center justify-between">
                          <div className="flex flex-col">
                            <span className="text-xs text-gray-400 font-sans uppercase text-[10px]">Price Tag</span>
                            <span className="text-sm md:text-base font-extrabold text-primary-mint font-mono tracking-tight leading-none mt-0.5">
                              {priceDisplay}
                            </span>
                          </div>

                          <button
                            onClick={() => {
                              handleAddToCart(p);
                              if (!isProfileLinked) {
                                showToast("Connect your username in the sidebar profile block!");
                              }
                            }}
                            className={`px-3 py-1.5 text-[10px] font-black uppercase rounded tracking-wider transition-all flex items-center gap-1.5 cursor-pointer ${
                              isProductInCart
                                ? 'bg-primary-mint/15 text-primary-mint border border-primary-mint/40 cursor-default'
                                : 'bg-primary-mint hover:bg-white text-emerald-bg hover:shadow-[0_0_12px_rgba(184,238,214,0.35)] active:scale-95 font-bold'
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
                                <span>Add to Cart</span>
                              </>
                            )}
                          </button>
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
            <div className="absolute top-0 right-0 w-32 h-32 bg-primary-mint/20 rounded-full translate-x-1/2 opacity-25 blur-3xl"></div>
            
            <h2 className="text-xl md:text-2xl font-black text-primary-mint tracking-tight uppercase mb-2">
              Need Billing Support?
            </h2>
            <p className="text-xs md:text-sm text-text-muted mb-6 max-w-sm mx-auto leading-relaxed">
              Our support team is active 24/7. Ranks and key purchases deliver dynamically into play.elitemc.net server within 5 minutes of payment checkout.
            </p>
            <div className="grid grid-cols-2 gap-4 max-w-sm mx-auto">
              <a 
                href={SITE_CONFIG.discord || 'https://discord.gg/elitemc'}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 bg-white/5 hover:bg-white/10 text-white text-xs font-extrabold py-3 rounded-xl transition-all border border-white/5 cursor-pointer"
              >
                <MessageSquare size={14} className="text-primary-mint" />
                <span>Discord Server</span>
              </a>
              <button 
                onClick={() => setShowTicketModal(true)}
                className="flex items-center justify-center gap-2 bg-white/5 hover:bg-white/10 text-white text-xs font-extrabold py-3 rounded-xl transition-all border border-white/5 cursor-pointer"
              >
                <Ticket size={14} className="text-primary-mint" />
                <span>Submit Ticket</span>
              </button>
            </div>
          </section>

        </div>

      </main>

      {/* --- FOOTER BANNER --- */}
      <footer className="mt-16 bg-black border-t border-white/5 py-10 text-center text-xs text-gray-500">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="text-center md:text-left select-none animate-fade-in">
            <span className="block font-black text-sm tracking-tight text-primary-mint uppercase">
              {SITE_CONFIG.serverName || 'EliteMC'} Store
            </span>
            <p className="mt-1 text-[11px] text-gray-400 leading-relaxed">
              © 2026 EliteMC. All rights reserved. Server IP: {SITE_CONFIG.serverIP || 'play.elitemc.net'}. We are not associated or affiliated with Mojang Studios, Minecraft, or Microsoft Corporation.
            </p>
          </div>
          <div className="flex gap-4 font-semibold">
            <button onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} className="hover:text-primary-mint transition-colors cursor-pointer">Catalog Products</button>
            <span>•</span>
            <button onClick={() => setShowTicketModal(true)} className="hover:text-primary-mint transition-colors cursor-pointer">Submit Support Ticket</button>
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
        onCheckoutSuccess={(usr) => {
          setCheckoutUsername(usr);
          setIsCartOpen(false);
          setIsCheckoutOpen(true);
        }}
        defaultUsername={stats.username}
        currency={currency}
      />

      {/* --- ADVANCED UPI DUAL-PANE CHECKOUT MODAL --- */}
      <CheckoutModal 
        isOpen={isCheckoutOpen}
        onClose={() => setIsCheckoutOpen(false)}
        cartItems={cartItems}
        username={checkoutUsername || stats.username}
        onCheckoutSuccess={handleCheckoutSuccess}
      />

      {/* --- INTERACTIVE TICKET MODAL --- */}
      {showTicketModal && (
        <div id="ticket-modal-backdrop" className="fixed inset-0 z-100 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xl animate-fade-in text-gray-100">
          <div className="w-full max-w-md rounded-xl bg-[#090e0c] p-6 border border-primary-mint/25 flex flex-col gap-4 relative">
            <div className="flex justify-between items-center">
              <h3 className="text-sm font-bold text-primary-mint tracking-tight flex items-center gap-1.5 uppercase font-sans">
                <Ticket size={18} />
                Create Support Ticket
              </h3>
              <button 
                onClick={() => setShowTicketModal(false)}
                className="p-1 rounded bg-white/5 text-gray-400 hover:text-primary-mint"
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleSupportTicket} className="flex flex-col gap-3">
              <div className="flex flex-col gap-1 text-left">
                <label className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Minecraft Account Username</label>
                <input 
                  type="text"
                  required
                  value={supportName}
                  onChange={(e) => setSupportName(e.target.value)}
                  placeholder="e.g. ElitePlayer"
                  className="px-3 py-1.5 bg-black rounded border border-white/10 text-xs focus:outline-none focus:border-primary-mint text-white"
                />
              </div>
              <div className="flex flex-col gap-1 text-left">
                <label className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Describe your Invoice or Issue</label>
                <textarea 
                  required
                  rows={4}
                  value={supportMessage}
                  onChange={(e) => setSupportMessage(e.target.value)}
                  placeholder="e.g. I scan and paid the UPI fee for MVP rank but did not see automated delivery..."
                  className="px-3 py-1.5 bg-black rounded border border-white/10 text-xs focus:outline-none focus:border-primary-mint text-white"
                />
              </div>

              <button 
                type="submit"
                disabled={ticketSuccess}
                className="mt-2 py-2.5 bg-primary-mint hover:bg-white text-emerald-bg font-bold rounded text-xs transition-all active:scale-95 flex items-center justify-center gap-1 uppercase cursor-pointer shadow-[0_0_12px_rgba(184,238,214,0.3)]"
              >
                {ticketSuccess ? 'SUBMITTED! REDIRECTING...' : 'Submit Support Ticket'}
              </button>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
