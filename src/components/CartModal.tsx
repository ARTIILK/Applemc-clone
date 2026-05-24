import React, { useState } from 'react';
import { X, Plus, Minus, Trash2, Package, CreditCard, ShieldCheck, Heart, MessageSquare } from 'lucide-react';
import { CartItem } from '../types';

interface CartModalProps {
  isOpen: boolean;
  onClose: () => void;
  cartItems: CartItem[];
  onUpdateQuantity: (productId: string, delta: number) => void;
  onRemoveItem: (productId: string) => void;
  onCheckoutSuccess: (username: string, items: CartItem[]) => void;
  defaultUsername: string;
  currency: 'INR' | 'USD';
}

export default function CartModal({
  isOpen,
  onClose,
  cartItems,
  onUpdateQuantity,
  onRemoveItem,
  onCheckoutSuccess,
  defaultUsername,
  currency
}: CartModalProps) {
  const [username, setUsername] = useState(defaultUsername || '');
  const [paymentMethod, setPaymentMethod] = useState<'upi' | 'ticket'>('upi');
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const isINR = currency === 'INR';

  // Calculate totals using accurate prices from JSON file
  const totalUSD = cartItems.reduce((sum, item) => sum + (item.product.priceUSD || 0) * item.quantity, 0);
  const totalINR = cartItems.reduce((sum, item) => sum + (item.product.priceINR || 0) * item.quantity, 0);

  const displayTotal = isINR ? `₹${totalINR}` : `$${totalUSD.toFixed(2)}`;

  const handlePay = (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim()) {
      setError('Please provide a valid Minecraft username.');
      return;
    }
    setError('');
    onCheckoutSuccess(username, cartItems);
  };

  return (
    <div id="cart-modal-backdrop" className="fixed inset-0 z-100 flex items-center justify-center p-4 bg-black/85 backdrop-blur-xl transition-all duration-300">
      <div 
        id="cart-modal-content"
        className="relative w-full max-w-4xl rounded-2xl bg-[#090e0c] border border-primary-mint/25 flex flex-col shadow-2xl overflow-hidden animate-fade-in text-gray-100"
      >
        {/* Ambient top glow */}
        <div className="absolute top-0 left-1/4 w-96 h-24 bg-primary-mint/20 blur-[130px] rounded-full -translate-y-1/2 opacity-50"></div>

        {/* Header */}
        <div className="p-5 border-b border-white/10 flex items-center justify-between relative z-10 bg-black/40">
          <div>
            <h2 className="text-base font-extrabold text-primary-mint tracking-tight uppercase">🛒 EliteMC Shopping Basket</h2>
            <p className="text-[11px] text-gray-400">Review items in your cart and choose checkout</p>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 rounded-full bg-white/5 hover:bg-white/10 text-gray-400 hover:text-primary-mint transition-colors cursor-pointer"
          >
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-6 hide-scrollbar relative z-10">
          {cartItems.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center text-gray-500 mb-4 border border-white/5">
                <Package size={32} className="text-primary-mint/45" />
              </div>
              <p className="text-gray-200 font-medium">Your cart is empty</p>
              <p className="text-xs text-text-muted max-w-sm mt-1">Browse our products catalog to select premium ranks, crate keys, bundles and utilities.</p>
              <button 
                onClick={onClose}
                className="mt-6 px-6 py-2.5 rounded-lg bg-primary-mint hover:bg-white text-emerald-bg font-bold text-xs transition-with-glow cursor-pointer shadow-[0_0_12px_rgba(184,238,214,0.3)]"
              >
                Return to Store
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
              {/* Product List */}
              <div className="md:col-span-7 flex flex-col gap-3">
                <span className="text-[10px] font-bold text-primary-mint tracking-wider uppercase">Order Items ({cartItems.length})</span>
                <div className="flex flex-col gap-3 max-h-[300px] overflow-y-auto pr-1 hide-scrollbar">
                  {cartItems.map((item) => {
                    const itemPrice = isINR ? item.product.priceINR : item.product.priceUSD;
                    const itemPriceDisplay = isINR ? `₹${itemPrice}` : `$${itemPrice.toFixed(2)}`;

                    return (
                      <div 
                        key={item.product.id}
                        className="p-3 rounded-xl bg-white/5 border border-white/5 flex items-center gap-3"
                      >
                        {/* Avatar/Icon representative */}
                        {item.product.image ? (
                          <img 
                            src={item.product.image} 
                            alt={item.product.name} 
                            className="w-12 h-12 rounded bg-black object-cover"
                            referrerPolicy="no-referrer"
                          />
                        ) : (
                          <div className="w-12 h-12 rounded bg-black flex items-center justify-center text-primary-mint">
                            <Package size={20} />
                          </div>
                        )}

                        <div className="flex-1 min-w-0">
                          <span className="block text-sm font-semibold text-gray-100 truncate">{item.product.name}</span>
                          <span className="block text-xs text-primary-mint font-mono">{itemPriceDisplay} <span className="text-gray-400 font-sans text-[10px]">each</span></span>
                        </div>

                        {/* Item Counters */}
                        <div className="flex items-center gap-2">
                          <button 
                            type="button"
                            onClick={() => onUpdateQuantity(item.product.id, -1)}
                            className="p-1.5 rounded bg-white/5 hover:bg-white/10 text-white transition-all active:scale-95 cursor-pointer"
                          >
                            <Minus size={12} />
                          </button>
                          <span className="text-xs font-bold w-4 text-center font-mono">{item.quantity}</span>
                          <button 
                            type="button"
                            onClick={() => onUpdateQuantity(item.product.id, 1)}
                            className="p-1.5 rounded bg-white/5 hover:bg-white/10 text-white transition-all active:scale-95 cursor-pointer"
                          >
                            <Plus size={12} />
                          </button>
                          <button 
                            type="button"
                            onClick={() => onRemoveItem(item.product.id)}
                            className="p-1.5 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded transition-all ml-1 cursor-pointer"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Simulated Order Summary Tally */}
                <div className="mt-4 p-4 rounded-xl bg-white/5 border border-white/5">
                  <div className="flex justify-between items-center text-xs text-gray-400 mb-2">
                    <span>Subtotal</span>
                    <span className="font-mono">{displayTotal}</span>
                  </div>
                  <div className="flex justify-between items-center text-xs text-gray-400 mb-2">
                    <span>Deliver Protocol Fee</span>
                    <span className="text-primary-mint text-[9px] font-extrabold px-1.5 py-0.5 rounded bg-primary-mint/10">FREE</span>
                  </div>
                  <div className="border-t border-white/10 my-2 pt-2 flex justify-between items-center font-sans">
                    <span className="text-xs font-bold text-white uppercase">Order Total</span>
                    <span className="text-base font-bold text-primary-mint font-mono">{displayTotal}</span>
                  </div>
                </div>
              </div>

              {/* Checkout Form */}
              <form onSubmit={handlePay} className="md:col-span-5 flex flex-col gap-4">
                <span className="text-[10px] font-bold text-primary-mint tracking-wider uppercase">Identity Verification</span>
                
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs text-gray-400 font-medium">Minecraft Username</label>
                  <div className="relative">
                    <input 
                      type="text"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      required
                      placeholder="e.g. ApplePlayer"
                      className="w-full px-3 py-2 bg-black border border-white/10 rounded-lg text-sm text-white focus:outline-none focus:border-primary-mint transition-all placeholder:text-[11px]"
                    />
                    {username.trim() && (
                      <div className="absolute right-3 top-2 flex items-center gap-1.5">
                        <img 
                          src={`https://mc-heads.net/avatar/${username}/16`} 
                          alt="skin-preview"
                          onError={(e) => {
                            (e.target as HTMLElement).style.display = 'none';
                          }}
                          className="w-4 h-4 rounded-sm"
                          referrerPolicy="no-referrer"
                        />
                        <span className="text-[9px] text-primary-mint font-extrabold bg-primary-mint/10 px-1 rounded uppercase">Linked</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs text-gray-400 font-medium font-sans">Verification Method</label>
                  <div className="grid grid-cols-2 gap-2">
                    <button 
                      type="button"
                      onClick={() => setPaymentMethod('upi')}
                      className={`p-2.5 rounded-lg border text-xs font-semibold flex flex-col items-center gap-1.5 transition-all cursor-pointer ${
                        paymentMethod === 'upi' 
                          ? 'bg-primary-mint/10 border-primary-mint text-primary-mint shadow-[0_0_8px_rgba(184,238,214,0.15)]' 
                          : 'bg-white/5 border-white/5 text-gray-400 hover:border-white/10'
                      }`}
                    >
                      <CreditCard size={16} />
                      <span className="text-[11px]">UPI Scan (INR)</span>
                    </button>
                    <button 
                      type="button"
                      onClick={() => setPaymentMethod('ticket')}
                      className={`p-2.5 rounded-lg border text-xs font-semibold flex flex-col items-center gap-1.5 transition-all cursor-pointer ${
                        paymentMethod === 'ticket' 
                          ? 'bg-primary-mint/10 border-primary-mint text-primary-mint shadow-[0_0_8px_rgba(184,238,214,0.15)]' 
                          : 'bg-white/5 border-white/5 text-gray-400 hover:border-white/10'
                      }`}
                    >
                      <MessageSquare size={16} />
                      <span className="text-[11px]">Discord Ticket</span>
                    </button>
                  </div>
                </div>

                {error && <span className="text-xs text-red-400">{error}</span>}

                <button 
                  type="submit"
                  className="w-full mt-2 py-3 bg-primary-mint text-emerald-bg font-bold rounded-xl hover:bg-white transition-all flex items-center justify-center gap-2 text-xs uppercase tracking-wider cursor-pointer shadow-[0_0_12px_rgba(184,238,214,0.3)]"
                >
                  <ShieldCheck size={18} />
                  <span>Settle Secure Purchase ({displayTotal})</span>
                </button>

                <div className="flex items-center gap-1.5 justify-center mt-1 text-[9px] text-gray-400">
                  <Heart size={10} className="text-primary-mint animate-pulse" />
                  <span>Directly keeps play.elitemc.net server active, online & premium.</span>
                </div>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
