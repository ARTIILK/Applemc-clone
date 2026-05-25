import React, { useState, useEffect } from 'react';
import { 
  X, Plus, Minus, Trash2, Package, ShieldCheck, Heart, 
  CheckCircle2, User, Mail, Phone, Gamepad, RefreshCw, Layers,
  Download, Calendar, Hash, Globe, CreditCard, MessageSquare, Laptop, Camera
} from 'lucide-react';
import { CartItem } from '../types';

interface UnifiedCheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  cartItems: CartItem[];
  onUpdateQuantity: (productId: string, delta: number) => void;
  onRemoveItem: (productId: string) => void;
  onCheckoutSuccess: (username: string, items: CartItem[]) => void;
  currency: 'INR' | 'USD';
}

export default function UnifiedCheckoutModal({
  isOpen,
  onClose,
  cartItems,
  onUpdateQuantity,
  onRemoveItem,
  onCheckoutSuccess,
  currency
}: UnifiedCheckoutModalProps) {
  // --- Form Inputs ---
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [mobileNo, setMobileNo] = useState('');
  const [ign, setIgn] = useState('');
  const [playerType, setPlayerType] = useState<'Java' | 'Bedrock'>('Java');
  const [discordUsername, setDiscordUsername] = useState('');

  // --- Checkout Flow Control ---
  const [isPlacingOrder, setIsPlacingOrder] = useState(false);
  const [orderCompleted, setOrderCompleted] = useState(false);
  const [generatedCartId, setGeneratedCartId] = useState('');
  const [generatedTimestamp, setGeneratedTimestamp] = useState('');
  const [formErrors, setFormErrors] = useState<{ [key: string]: string }>({});
  const [submissionError, setSubmissionError] = useState<string | null>(null);

  // Keep copy for the static downloaded file in case the cart gets cleared by onCheckoutSuccess
  const [frozenCartItems, setFrozenCartItems] = useState<CartItem[]>([]);

  // Reset order state when modal closes/opens
  useEffect(() => {
    if (isOpen) {
      setOrderCompleted(false);
      setIsPlacingOrder(false);
      setSubmissionError(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const isINR = currency === 'INR';
  const totalUSD = cartItems.reduce((sum, item) => sum + (item.product.priceUSD || 0) * item.quantity, 0);
  const totalINR = cartItems.reduce((sum, item) => sum + (item.product.priceINR || 0) * item.quantity, 0);
  const displayTotal = isINR ? `₹${totalINR}` : `$${totalUSD.toFixed(2)}`;

  // Form Validations
  const validateForm = () => {
    const errors: { [key: string]: string } = {};
    if (!name.trim()) errors.name = 'Full identity name is required.';
    if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errors.email = 'Provide a valid email address.';
    if (!mobileNo.trim() || mobileNo.length < 8) errors.mobileNo = 'Provide an active mobile number.';
    if (!ign.trim()) errors.ign = 'Mojang/In-Game Name is required.';
    if (!discordUsername.trim()) {
      errors.discordUsername = 'Discord handle is required.';
    } else if (
      discordUsername.includes('<@') || 
      discordUsername.includes('&') || 
      discordUsername.includes('@everyone') || 
      discordUsername.includes('@here') ||
      discordUsername.startsWith('@')
    ) {
      errors.discordUsername = 'Mentions, pings (@), and special formatting characters are not permitted.';
    }
    return errors;
  };

  // Download official receipt logic
  const handleDownloadInvoiceJson = () => {
    const invoicePayload = {
      developerCredit: "Engine Built & Maintained by aurtx | Discord: aurtx_99102 (<@1459859699624186053>) | Contact: prince2020me1@gmail.com",
      checkoutReceipt: {
        cartId: generatedCartId,
        timestamp: generatedTimestamp,
        currency: currency,
        subtotalPayable: displayTotal,
        hostNode: "play.mineberry.net"
      },
      clientDetails: {
        fullname: name.trim(),
        email: email.trim(),
        mobile: mobileNo.trim(),
        ign: ign.trim(),
        platformEdition: playerType,
        discordUsername: discordUsername.trim()
      },
      purchasedItems: frozenCartItems.map(item => ({
        itemId: item.product.id,
        itemName: item.product.name,
        quantity: item.quantity,
        priceEach: isINR ? `₹${item.product.priceINR}` : `$${item.product.priceUSD.toFixed(2)}`,
        totalPrice: isINR ? `₹${item.product.priceINR * item.quantity}` : `$${(item.product.priceUSD * item.quantity).toFixed(2)}`
      }))
    };

    // Correct valid JSON string formatting
    const jsonString = JSON.stringify(invoicePayload, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const downloadAnchor = document.createElement('a');
    downloadAnchor.href = url;
    downloadAnchor.download = `${generatedCartId}.json`;
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    document.body.removeChild(downloadAnchor);
    URL.revokeObjectURL(url);
  };

  // Dispatch Order to Secure Server Endpoints
  const handlePlaceOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmissionError(null);
    
    const errors = validateForm();
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }
    setFormErrors({});

    if (cartItems.length === 0) {
      setSubmissionError('Your cart contains zero products.');
      return;
    }

    setIsPlacingOrder(true);

    // Freeze active cart items so they carry over to the receipt screen beautifully
    setFrozenCartItems([...cartItems]);

    // Generate cart metadata safely
    const cartIdStr = Math.floor(10000000 + Math.random() * 90000000).toString();
    const timestampStr = new Date().toISOString();

    try {
      // Secure network transmission directly back to our serverless endpoint
      const response = await fetch('/api/send-order', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim(),
          mobileNo: mobileNo.trim(),
          ign: ign.trim(),
          playerType,
          discordUsername: discordUsername.trim(),
          cartItems,
          currency,
          cartId: cartIdStr,
          timestamp: timestampStr
        })
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setGeneratedCartId(cartIdStr);
        setGeneratedTimestamp(timestampStr);
        setOrderCompleted(true);
        // Clear top level context cart state via callback
        onCheckoutSuccess(ign, cartItems);
      } else {
        setSubmissionError(data.error || 'Failed to dispatch order. Ensure credentials meet quality limits.');
      }
    } catch (err) {
      console.error('Unified backend checkout transmission failed:', err);
      setSubmissionError('Server Connection Blocked. Ensure backend services are running.');
    } finally {
      setIsPlacingOrder(false);
    }
  };

  return (
    <div id="unified-checkout-backdrop" className="fixed inset-0 z-110 flex items-center justify-center p-4 bg-black/85 backdrop-blur-2xl transition-all duration-300">
      <div 
        id="unified-checkout-container"
        className="relative w-full max-w-5xl rounded-2xl bg-[#091515] border border-emerald-500/10 flex flex-col shadow-2xl overflow-hidden animate-fade-in text-gray-100 max-h-[92vh]"
      >
        {/* Ambient background glow */}
        <div className="absolute top-0 right-1/4 w-96 h-36 bg-emerald-500/5 blur-[130px] rounded-full -translate-y-1/2 opacity-30 pointer-events-none"></div>

        {/* Header Block */}
        <div className="p-5 border-b border-white/5 flex items-center justify-between relative z-10 bg-black/40">
          <div>
            <h2 className="text-base font-black text-[#38bdf8] drop-shadow-[0_0_8px_rgba(56,189,248,0.4)] tracking-tight flex items-center gap-2 font-sans">
              <Layers className="text-emerald-400 animate-pulse" size={20} />
              MINEBERRY SECURE UNIFIED CHECKOUT
            </h2>
            <p className="text-xs text-gray-400">Instant combined digital basket validation and secure discord gateway dispatch</p>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 rounded-full bg-white/5 hover:bg-white/10 text-gray-400 hover:text-emerald-400 transition-colors cursor-pointer"
          >
            <X size={20} />
          </button>
        </div>

        {/* Modal Core Content */}
        {!orderCompleted ? (
          <div className="flex-1 overflow-y-auto p-6 flex flex-col lg:flex-row gap-6 hover:scrollbar-visible relative z-10 max-h-[calc(92vh-100px)]">
            {cartItems.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center py-16 text-center">
                <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center text-gray-500 mb-4 border border-white/5">
                  <Package size={32} className="text-emerald-400/40" />
                </div>
                <p className="text-gray-200 font-bold">Checkout is locked: Empty Basket</p>
                <p className="text-xs text-gray-400 max-w-sm mt-1 mb-6">Explore premium ranks, keys packages, cosmetics, and server goods. Add items to basket before accessing unified settlement.</p>
                <button 
                  onClick={onClose}
                  className="px-6 py-2.5 rounded-lg bg-emerald-400 text-[#091515] font-extrabold text-xs uppercase tracking-wider transition-all cursor-pointer shadow-[0_0_12px_rgba(52,211,153,0.3)] hover:bg-white"
                >
                  Return to Store Categories
                </button>
              </div>
            ) : (
              <div className="w-full grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                
                {/* Column A: Cart Details Summary (5 Cols) */}
                <div className="lg:col-span-5 flex flex-col gap-4 p-5 bg-black/40 border border-white/5 rounded-2xl">
                  <div className="flex justify-between items-center border-b border-white/5 pb-2">
                    <span className="text-xs font-black text-emerald-400 tracking-wider uppercase flex items-center gap-1.5">
                      <Layers size={14} /> Shopping Cart List ({cartItems.length})
                    </span>
                    <span className="text-[10px] text-gray-400 font-bold uppercase">Store Currency: {currency}</span>
                  </div>

                  {/* Scroller Area */}
                  <div className="flex flex-col gap-2.5 max-h-[290px] overflow-y-auto pr-1">
                    {cartItems.map((item) => {
                      const itemPrice = isINR ? item.product.priceINR : item.product.priceUSD;
                      const itemPriceDisplay = isINR ? `₹${itemPrice}` : `$${itemPrice.toFixed(2)}`;

                      return (
                        <div 
                          key={item.product.id}
                          className="p-3 rounded-xl bg-white/5 border border-white/5 flex items-center gap-3 relative overflow-hidden"
                        >
                          {item.product.image ? (
                            <img 
                              src={item.product.image} 
                              alt={item.product.name} 
                              className="w-12 h-12 rounded bg-black/50 object-cover border border-white/5"
                              referrerPolicy="no-referrer"
                            />
                          ) : (
                            <div className="w-12 h-12 rounded bg-black/50 border border-white/5 flex items-center justify-center text-emerald-400">
                              <Package size={20} />
                            </div>
                          )}

                          <div className="flex-1 min-w-0">
                            <span className="block text-xs font-bold text-gray-100 truncate">{item.product.name}</span>
                            <span className="block text-[10px] text-emerald-400 font-mono">{itemPriceDisplay} <span className="text-gray-400 font-sans text-[9px]">each</span></span>
                          </div>

                          {/* Incrementor Buttons */}
                          <div className="flex items-center gap-2">
                            <button 
                              type="button"
                              onClick={() => onUpdateQuantity(item.product.id, -1)}
                              className="p-1 rounded bg-white/5 hover:bg-white/10 text-white transition-all active:scale-95 cursor-pointer border border-white/5"
                            >
                              <Minus size={10} />
                            </button>
                            <span className="text-xs font-extrabold w-4 text-center font-mono">{item.quantity}</span>
                            <button 
                              type="button"
                              onClick={() => onUpdateQuantity(item.product.id, 1)}
                              className="p-1 rounded bg-white/5 hover:bg-white/10 text-white transition-all active:scale-95 cursor-pointer border border-white/5"
                            >
                              <Plus size={10} />
                            </button>
                            <button 
                              type="button"
                              onClick={() => onRemoveItem(item.product.id)}
                              className="p-1 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded transition-all ml-1 cursor-pointer"
                              title="Delete Item"
                            >
                              <Trash2 size={12} />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Financial Total Section */}
                  <div className="p-3.5 bg-white/5 border border-white/5 rounded-xl flex flex-col gap-2 mt-2">
                    <div className="flex justify-between items-center text-[11px] text-gray-400">
                      <span>Order Items Value</span>
                      <span className="font-mono text-gray-200">{displayTotal}</span>
                    </div>
                    <div className="flex justify-between items-center text-[11px] text-gray-400">
                      <span>Instant Voucher Dispatch Fee</span>
                      <span className="text-[#38bdf8] text-[9px] font-black px-1.5 py-0.5 rounded bg-[#38bdf8]/10 tracking-wider">FREE DELIVERY</span>
                    </div>
                    <div className="border-t border-white/10 my-1 pt-2 flex justify-between items-center font-sans">
                      <span className="text-xs font-black text-white uppercase tracking-wider">Gross Payable Total</span>
                      <span className="text-lg font-black text-emerald-400 font-mono drop-shadow-[0_0_8px_rgba(52,211,153,0.3)]">{displayTotal}</span>
                    </div>
                  </div>

                  {/* Trust Badge */}
                  <div className="flex items-center gap-2 px-3 py-2 bg-emerald-400/5 border border-emerald-400/10 rounded-lg text-[10px] text-gray-400">
                    <ShieldCheck size={14} className="text-emerald-400" />
                    <span>Cryptographic token delivery active on play.mineberry.net within minutes.</span>
                  </div>
                </div>

                {/* Column B: Checkout Secure Inputs Form (7 Cols) */}
                <form onSubmit={handlePlaceOrder} className="lg:col-span-7 flex flex-col gap-4">
                  <div className="border-b border-white/5 pb-2">
                    <span className="text-xs font-black text-[#38bdf8] tracking-wider uppercase flex items-center gap-1.5">
                      <User size={14} /> Required Checkout Credentials
                    </span>
                  </div>

                  {submissionError && (
                    <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-xs font-bold animate-pulse">
                      ⚠️ {submissionError}
                    </div>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Full Name */}
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[10px] text-gray-400 font-bold uppercase tracking-wider flex items-center gap-1">
                        Full Name <span className="text-red-400">*</span>
                      </label>
                      <input 
                        type="text"
                        required
                        value={name}
                        onChange={(e) => {
                          setName(e.target.value);
                          if (formErrors.name) setFormErrors({ ...formErrors, name: '' });
                        }}
                        placeholder="e.g. Liam Henderson"
                        className="w-full px-3 py-2 bg-black border border-white/10 rounded-lg text-xs text-white focus:outline-none focus:border-emerald-400 transition-all shadow-inner"
                      />
                      {formErrors.name && (
                        <p className="text-[10px] text-red-400">{formErrors.name}</p>
                      )}
                    </div>

                    {/* Email */}
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[10px] text-gray-400 font-bold uppercase tracking-wider flex items-center gap-1">
                        Email Address <span className="text-red-400">*</span>
                      </label>
                      <input 
                        type="email"
                        required
                        value={email}
                        onChange={(e) => {
                          setEmail(e.target.value);
                          if (formErrors.email) setFormErrors({ ...formErrors, email: '' });
                        }}
                        placeholder="e.g. liam@mineberry.net"
                        className="w-full px-3 py-2 bg-black border border-white/10 rounded-lg text-xs text-white focus:outline-none focus:border-emerald-400 transition-all shadow-inner"
                      />
                      {formErrors.email && (
                        <p className="text-[10px] text-red-400">{formErrors.email}</p>
                      )}
                    </div>

                    {/* Mobile-no */}
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[10px] text-gray-400 font-bold uppercase tracking-wider flex items-center gap-1">
                        Mobile Number <span className="text-red-400">*</span>
                      </label>
                      <input 
                        type="tel"
                        required
                        value={mobileNo}
                        onChange={(e) => {
                          setMobileNo(e.target.value);
                          if (formErrors.mobileNo) setFormErrors({ ...formErrors, mobileNo: '' });
                        }}
                        placeholder="e.g. +91 98765 43210"
                        className="w-full px-3 py-2 bg-black border border-white/10 rounded-lg text-xs text-white focus:outline-none focus:border-emerald-400 transition-all shadow-inner"
                      />
                      {formErrors.mobileNo && (
                        <p className="text-[10px] text-red-400">{formErrors.mobileNo}</p>
                      )}
                    </div>

                    {/* In-game IGN Name */}
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[10px] text-gray-400 font-bold uppercase tracking-wider flex items-center gap-1">
                        Minecraft IGN (In-Game Name) <span className="text-red-400">*</span>
                      </label>
                      <div className="relative">
                        <input 
                          type="text"
                          required
                          value={ign}
                          onChange={(e) => {
                            setIgn(e.target.value);
                            if (formErrors.ign) setFormErrors({ ...formErrors, ign: '' });
                          }}
                          placeholder="e.g. BerryPlayer"
                          className="w-full pl-9 pr-3 py-2 bg-black border border-white/10 rounded-lg text-xs text-white focus:outline-none focus:border-emerald-400 transition-all font-mono shadow-inner"
                        />
                        <div className="absolute left-2.5 top-1.5 w-5 h-5 rounded-sm bg-white/5 border border-white/10 flex items-center justify-center p-0.5 overflow-hidden">
                          <img 
                            src={`https://mc-heads.net/avatar/${ign || 'MHF_Alex'}/16`}
                            alt="Skin face placeholder" 
                            className="w-4 h-4 object-contain"
                            onError={(e) => {
                              e.currentTarget.src = "https://mc-heads.net/avatar/MHF_Alex/16";
                            }}
                            referrerPolicy="no-referrer"
                          />
                        </div>
                      </div>
                      {formErrors.ign && (
                        <p className="text-[10px] text-red-400">{formErrors.ign}</p>
                      )}
                    </div>
                  </div>

                  {/* Player Type (Bedrock/Java Toggle) */}
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">
                      Minecraft Platform Edition
                    </label>
                    <div className="grid grid-cols-2 gap-3">
                      <button 
                        type="button"
                        onClick={() => setPlayerType('Java')}
                        className={`py-3 px-4 rounded-xl border text-xs font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                          playerType === 'Java' 
                            ? 'bg-[#38bdf8]/10 border-[#38bdf8] text-[#38bdf8] shadow-[0_0_12px_rgba(56,189,248,0.2)]'
                            : 'bg-white/5 border-white/10 text-gray-400 hover:border-white/20'
                        }`}
                      >
                        <Gamepad size={14} />
                        Java Edition (PC / Standard)
                      </button>
                      <button 
                        type="button"
                        onClick={() => setPlayerType('Bedrock')}
                        className={`py-3 px-4 rounded-xl border text-xs font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                          playerType === 'Bedrock' 
                            ? 'bg-[#d946ef]/10 border-[#d946ef] text-[#d946ef] shadow-[0_0_12px_rgba(217,70,239,0.25)]'
                            : 'bg-white/5 border-white/10 text-gray-400 hover:border-white/20'
                        }`}
                      >
                        <Layers size={14} />
                        Bedrock Edition (Mobile / PE / Consoles)
                      </button>
                    </div>
                  </div>

                  {/* Discord Username */}
                  <div className="flex flex-col gap-1.5">
                    <div className="flex justify-between items-baseline">
                      <label className="text-[10px] text-gray-400 font-bold uppercase tracking-wider flex items-center gap-1">
                        Discord Username (Plain Text Only) <span className="text-red-400">*</span>
                      </label>
                      <span className="text-[9px] text-gray-500 font-bold">Absolutely No Pings or Live Mentions (@)</span>
                    </div>
                    <input 
                      type="text"
                      required
                      value={discordUsername}
                      onChange={(e) => {
                        setDiscordUsername(e.target.value);
                        if (formErrors.discordUsername) setFormErrors({ ...formErrors, discordUsername: '' });
                      }}
                      placeholder="e.g. spark_ignite (Format strictly as plain text)"
                      className="w-full px-3 py-2.5 bg-black border border-white/10 rounded-lg text-xs text-white focus:outline-none focus:border-emerald-400 transition-all placeholder:text-gray-600 shadow-inner"
                    />
                    {formErrors.discordUsername && (
                      <p className="text-[10px] text-red-400">{formErrors.discordUsername}</p>
                    )}
                  </div>

                  {/* Submit Button */}
                  <button 
                    type="submit"
                    disabled={isPlacingOrder}
                    className="w-full py-4 mt-2 bg-emerald-400 text-[#091515] font-extrabold rounded-xl hover:bg-white transition-all flex items-center justify-center gap-2 text-xs uppercase tracking-widest cursor-pointer shadow-[0_0_20px_rgba(52,211,153,0.3)] disabled:opacity-50"
                  >
                    {isPlacingOrder ? (
                      <>
                        <RefreshCw className="animate-spin text-[#091515]" size={16} />
                        <span>Sending secure verification ticket...</span>
                      </>
                    ) : (
                      <>
                        <ShieldCheck size={16} />
                        <span>Place Secure Order Now ({displayTotal})</span>
                      </>
                    )}
                  </button>

                  <div className="flex items-center gap-1 px-2.5 py-1 justify-center text-[9px] text-gray-500 leading-none">
                    <Heart size={8} className="text-emerald-400 animate-pulse" />
                    <span>MineBerry premium hub uses automated secure order receipts. All keys deliver instantly.</span>
                  </div>
                </form>

              </div>
            )}
          </div>
        ) : (
          /* Success Ticket Pane - Features High-Performance screenshot-ready Web UI Invoice */
          <div className="flex-1 overflow-y-auto p-6 flex flex-col items-center justify-start gap-6 relative z-10 max-h-[calc(92vh-100px)] animate-fade-in hover:scrollbar-visible">
            
            {/* Elegant Success banner */}
            <div className="text-center flex flex-col items-center gap-1.5 mt-2">
              <div className="w-14 h-14 rounded-full bg-emerald-500/10 border border-emerald-400 flex items-center justify-center text-emerald-400 animate-bounce mb-1">
                <CheckCircle2 size={32} />
              </div>
              <h3 className="text-base font-black text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-[#38bdf8] to-emerald-400 uppercase tracking-widest">
                ORDER SECURED AND VERIFIED
              </h3>
              <p className="text-xs text-gray-400 max-w-md">Your payload has been synchronized with the Discord admin backend. Instant in-game delivery is active.</p>
            </div>

            {/* SCREENSHOT ACTION HEADERS */}
            <div className="w-full max-w-2xl flex flex-col sm:flex-row items-center justify-between gap-3 px-4 py-2 bg-white/5 border border-white/10 rounded-xl relative">
              <span className="text-[11px] text-gray-300 font-sans flex items-center gap-2">
                <Camera className="text-[#38bdf8]" size={15} />
                <span><strong>FRAME SAFE ZONE:</strong> Perfect size for screen-capturing of digital receipts.</span>
              </span>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={handleDownloadInvoiceJson}
                  className="px-4 py-2 bg-emerald-400 text-[#091515] font-black text-[11px] rounded-lg cursor-pointer transition-all hover:bg-white flex items-center gap-1.5 uppercase shadow-[0_0_10px_rgba(52,211,153,0.3)]"
                >
                  <Download size={13} />
                  Download JSON Receipt
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 bg-white/5 border border-white/10 hover:bg-white/10 text-white font-bold text-[11px] rounded-lg cursor-pointer transition-colors"
                >
                  Close Console
                </button>
              </div>
            </div>

            {/* --- SCREENSHOT SAFE-ZONE / HIGH-PERFORMANCE WEB INVOICE --- */}
            <div 
              id="screenshot-invoice-frame"
              className="w-full max-w-2xl bg-[#0f1d1d] border border-emerald-400/20 rounded-2xl overflow-hidden shadow-2xl relative select-all flex flex-col"
            >
              {/* Discord colored left accent strip (matches embeds perfectly) */}
              <div className={`absolute top-0 bottom-0 left-0 w-1.5 ${playerType === 'Java' ? 'bg-[#38bdf8]' : 'bg-[#d946ef]'}`}></div>

              {/* Invoice Body Container */}
              <div className="pl-6 pr-6 pt-5 pb-5 flex flex-col gap-5">
                
                {/* Embedded Header Block */}
                <div className="flex justify-between items-start border-b border-white/5 pb-4">
                  <div className="flex flex-col gap-1">
                    <span className="text-[10px] font-black tracking-widest text-[#38bdf8] uppercase flex items-center gap-1">
                      <ShieldCheck size={12} className="text-emerald-400" />
                      MINEBERRY STORE TRANSACTION LEDGER
                    </span>
                    <h4 className="text-sm font-black text-white uppercase tracking-tight">Receipt Certificate of Goods</h4>
                  </div>
                  <div className="flex flex-col items-end text-right font-mono text-[9px] text-gray-400 leading-tight">
                    <span>Host Node: play.mineberry.net</span>
                    <span>Region: Global Gateway</span>
                  </div>
                </div>

                {/* Grid Fields Layout (Exactly matching image_0.png fields hierarchy with Icons) */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  
                  {/* Order / Cart ID */}
                  <div className="p-3 bg-black/40 border border-white/5 rounded-xl flex items-center gap-3">
                    <div className="p-2 bg-[#38bdf8]/10 rounded-lg text-[#38bdf8]">
                      <Hash size={16} />
                    </div>
                    <div className="min-w-0">
                      <span className="block text-[10px] text-gray-400 font-sans uppercase font-bold tracking-wider">Order / Cart ID</span>
                      <span className="block text-xs font-mono font-black text-white">{generatedCartId}</span>
                    </div>
                  </div>

                  {/* Date & Time */}
                  <div className="p-3 bg-black/40 border border-white/5 rounded-xl flex items-center gap-3">
                    <div className="p-2 bg-[#38bdf8]/10 rounded-lg text-[#38bdf8]">
                      <Calendar size={16} />
                    </div>
                    <div className="min-w-0">
                      <span className="block text-[10px] text-gray-400 font-sans uppercase font-bold tracking-wider">Timestamp</span>
                      <span className="block text-xs font-mono text-gray-100 truncate">{generatedTimestamp}</span>
                    </div>
                  </div>

                  {/* Client Name */}
                  <div className="p-3 bg-black/40 border border-white/5 rounded-xl flex items-center gap-3">
                    <div className="p-2 bg-[#38bdf8]/10 rounded-lg text-[#38bdf8]">
                      <User size={16} />
                    </div>
                    <div className="min-w-0">
                      <span className="block text-[10px] text-gray-400 font-sans uppercase font-bold tracking-wider">Client Name</span>
                      <span className="block text-xs font-bold text-white">{name}</span>
                    </div>
                  </div>

                  {/* Character IGN */}
                  <div className="p-3 bg-black/40 border border-white/5 rounded-xl flex items-center gap-3">
                    <div className="relative w-8 h-8 rounded bg-white/5 border border-white/10 flex items-center justify-center overflow-hidden p-0.5">
                      <img 
                        src={`https://mc-heads.net/avatar/${ign}/32`}
                        alt="Skin face" 
                        className="w-7 h-7 object-contain"
                        onError={(e) => {
                          e.currentTarget.src = "https://mc-heads.net/avatar/MHF_Alex/32";
                        }}
                        referrerPolicy="no-referrer"
                      />
                    </div>
                    <div className="min-w-0">
                      <span className="block text-[10px] text-gray-400 font-sans uppercase font-bold tracking-wider">Character IGN</span>
                      <span className="block text-xs font-mono font-black text-emerald-400">{ign}</span>
                    </div>
                  </div>

                  {/* Email */}
                  <div className="p-3 bg-black/40 border border-white/5 rounded-xl flex items-center gap-3">
                    <div className="p-2 bg-[#38bdf8]/10 rounded-lg text-[#38bdf8]">
                      <Mail size={16} />
                    </div>
                    <div className="min-w-0 flex-1 truncate">
                      <span className="block text-[10px] text-gray-400 font-sans uppercase font-bold tracking-wider">Email Address</span>
                      <span className="block text-xs text-white truncate">{email}</span>
                    </div>
                  </div>

                  {/* Platform / Player Type */}
                  <div className="p-3 bg-black/40 border border-white/5 rounded-xl flex items-center gap-3">
                    <div className="p-2 bg-[#38bdf8]/10 rounded-lg text-[#38bdf8]">
                      {playerType === 'Java' ? <Laptop size={16} /> : <Gamepad size={16} />}
                    </div>
                    <div className="min-w-0">
                      <span className="block text-[10px] text-gray-400 font-sans uppercase font-bold tracking-wider">Player Type</span>
                      <span className={`block text-xs font-bold ${playerType === 'Java' ? 'text-[#38bdf8]' : 'text-[#d946ef]'}`}>{playerType} Edition</span>
                    </div>
                  </div>

                  {/* Mobile No */}
                  <div className="p-3 bg-black/40 border border-white/5 rounded-xl flex items-center gap-3 col-span-1 md:col-span-2">
                    <div className="p-2 bg-[#38bdf8]/10 rounded-lg text-[#38bdf8]">
                      <Phone size={16} />
                    </div>
                    <div className="min-w-0">
                      <span className="block text-[10px] text-gray-400 font-sans uppercase font-bold tracking-wider">Mobile Number</span>
                      <span className="block text-xs font-mono text-gray-200">{mobileNo}</span>
                    </div>
                  </div>

                  {/* Discord Handle */}
                  <div className="p-3 bg-black/40 border border-white/5 rounded-xl flex items-center gap-3 col-span-1 md:col-span-2">
                    <div className="p-2 bg-[#38bdf8]/10 rounded-lg text-[#38bdf8]">
                      <MessageSquare size={16} />
                    </div>
                    <div className="min-w-0">
                      <span className="block text-[10px] text-gray-400 font-sans uppercase font-bold tracking-wider">Discord Handle (Strict Plaintext)</span>
                      <span className="block text-xs font-bold text-gray-100 font-mono">{discordUsername.trim()}</span>
                    </div>
                  </div>

                </div>

                {/* Items Checkout list (Wide Section) */}
                <div className="p-4 bg-black/40 border border-white/5 rounded-xl flex flex-col gap-2">
                  <span className="text-[10px] text-gray-400 uppercase font-bold tracking-wider flex items-center gap-1.5 pb-1 border-b border-white/5">
                    <Package size={12} className="text-emerald-400" /> Order Basket Items
                  </span>

                  <div className="flex flex-col gap-1.5 pt-1">
                    {frozenCartItems.map((item) => {
                      const priceEach = isINR ? item.product.priceINR : item.product.priceUSD;
                      const priceEachDisplay = isINR ? `₹${priceEach}` : `$${priceEach.toFixed(2)}`;
                      const totalSumItem = isINR ? `₹${priceEach * item.quantity}` : `$${(priceEach * item.quantity).toFixed(2)}`;

                      return (
                        <div key={item.product.id} className="flex justify-between items-center text-xs">
                          <span className="text-gray-200 font-sans">
                            • <strong className="text-white">{item.product.name}</strong> <span className="text-gray-400">x{item.quantity}</span>
                          </span>
                          <span className="font-mono text-gray-300">
                            {priceEachDisplay} <span className="text-gray-500 font-sans text-[10px]">each</span> ({totalSumItem})
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Subtotal Checkout Footer block inside frame */}
                <div className="p-4 bg-emerald-500/5 border border-emerald-400/20 rounded-xl flex justify-between items-center">
                  <div className="flex flex-col gap-0.5">
                    <span className="text-[10px] text-gray-400 font-sans uppercase font-bold tracking-wider">Subtotal Checkout Sum</span>
                    <span className="text-[9px] text-[#38bdf8] uppercase font-bold tracking-wider">Active Currency: {currency}</span>
                  </div>
                  <span className="text-lg font-black text-emerald-400 font-mono drop-shadow-[0_0_8px_rgba(52,211,153,0.3)]">
                    {displayTotal}
                  </span>
                </div>

              </div>
              
              {/* Footer Stamp */}
              <div className="bg-black/60 px-6 py-2.5 flex justify-between items-center border-t border-white/5 font-mono text-[9px] text-gray-500">
                <span>MineBerry Dynamic Sanctuary Store Engine v2.4</span>
                <span>Active Ledger ID Verified</span>
              </div>

            </div>

            <div className="flex items-center gap-1 px-2.5 py-1 justify-center text-[10px] text-gray-500 leading-none">
              <Heart size={10} className="text-emerald-400 animate-pulse" />
              <span>We advise keeping a screenshot of this secure code certificate reference frame.</span>
            </div>

          </div>
        )}
        <div className="bg-black/60 border-t border-white/10 py-3.5 px-6 text-center z-10 select-all">
          <span className="text-[9px] sm:text-[10px] text-gray-400 font-bold leading-normal">
            Engine Built & Maintained by aurtx | Discord: aurtx_99102 (&lt;@1459859699624186053&gt;) | Contact: prince2020me1@gmail.com
          </span>
        </div>
      </div>
    </div>
  );
}
