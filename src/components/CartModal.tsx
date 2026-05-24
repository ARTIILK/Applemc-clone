import React, { useState } from 'react';
import { X, Plus, Minus, Trash2, Coins, CreditCard, ShieldCheck, Heart } from 'lucide-react';
import { CartItem, PlayerStats } from '../types';

interface CartModalProps {
  isOpen: boolean;
  onClose: () => void;
  cartItems: CartItem[];
  onUpdateQuantity: (productId: string, delta: number) => void;
  onRemoveItem: (productId: string) => void;
  onCheckoutSuccess: (username: string, items: CartItem[]) => void;
  defaultUsername: string;
}

export default function CartModal({
  isOpen,
  onClose,
  cartItems,
  onUpdateQuantity,
  onRemoveItem,
  onCheckoutSuccess,
  defaultUsername
}: CartModalProps) {
  const [username, setUsername] = useState(defaultUsername || '');
  const [paymentMethod, setPaymentMethod] = useState<'card' | 'coins' | 'paypal'>('card');
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const total = cartItems.reduce((sum, item) => sum + item.product.price * item.quantity, 0);

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
    <div id="cart-modal-backdrop" className="fixed inset-0 z-100 flex items-center justify-center p-4 bg-emerald-bg/85 backdrop-blur-xl transition-all duration-300">
      <div 
        id="cart-modal-content"
        className="relative w-full max-w-2xl max-h-[90vh] overflow-hidden rounded-2xl glass-panel-heavy border border-primary-mint/30 flex flex-col shadow-2xl animate-fade-in"
      >
        {/* Glow Effects */}
        <div className="absolute top-0 left-1/4 w-80 h-32 ambient-glow rounded-full -translate-y-1/2 opacity-65"></div>

        {/* Header */}
        <div className="p-6 border-b border-white/10 flex items-center justify-between relative z-10">
          <div>
            <h2 className="text-xl font-bold font-sans text-primary-mint tracking-tight">SHOPPING CART</h2>
            <p className="text-xs text-text-muted">Review items and associate your Minecraft account</p>
          </div>
          <button 
            onClick={onClose}
            className="p-2 rounded-full bg-white/5 hover:bg-white/10 text-text-muted hover:text-primary-mint transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-6 hide-scrollbar relative z-10">
          {cartItems.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="w-16 h-16 rounded-full glass-panel flex items-center justify-center text-text-muted mb-4">
                <Coins size={32} className="text-primary-mint/40" />
              </div>
              <p className="text-text-primary font-medium">Your cart is empty</p>
              <p className="text-sm text-text-muted max-w-sm mt-1">Browse the store categories to select some exclusive server ranks or items.</p>
              <button 
                onClick={onClose}
                className="mt-6 px-6 py-2.5 rounded-lg bg-primary-mint text-on-primary-mint font-semibold text-sm hover:shadow-[0_0_15px_rgba(184,238,214,0.4)] transition-all"
              >
                Return to Store
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
              {/* Product List */}
              <div className="md:col-span-7 flex flex-col gap-3">
                <span className="text-xs font-bold text-primary-mint tracking-wider uppercase">Order Items ({cartItems.length})</span>
                <div className="flex flex-col gap-3 max-h-[300px] overflow-y-auto pr-1 hide-scrollbar">
                  {cartItems.map((item) => (
                    <div 
                      key={item.product.id}
                      className="p-3 rounded-xl bg-white/5 border border-white/5 flex items-center gap-3"
                    >
                      {/* Avatar/Icon representative */}
                      {item.product.image ? (
                        <img 
                          src={item.product.image} 
                          alt={item.product.name} 
                          className="w-12 h-12 rounded bg-emerald-surface-container object-cover"
                          referrerPolicy="no-referrer"
                        />
                      ) : (
                        <div className="w-12 h-12 rounded bg-emerald-surface-container flex items-center justify-center text-primary-mint">
                          <Coins size={20} />
                        </div>
                      )}

                      <div className="flex-1 min-w-0">
                        <span className="block text-sm font-semibold text-text-primary truncate">{item.product.name}</span>
                        <span className="block text-xs text-primary-mint">${item.product.price} <span className="text-text-muted">each</span></span>
                      </div>

                      {/* Item Counters */}
                      <div className="flex items-center gap-2">
                        <button 
                          onClick={() => onUpdateQuantity(item.product.id, -1)}
                          className="p-1 rounded bg-white/5 hover:bg-white/10 text-text-primary transition-all active:scale-95"
                        >
                          <Minus size={12} />
                        </button>
                        <span className="text-xs font-bold w-4 text-center font-mono">{item.quantity}</span>
                        <button 
                          onClick={() => onUpdateQuantity(item.product.id, 1)}
                          className="p-1 rounded bg-white/5 hover:bg-white/10 text-text-primary transition-all active:scale-95"
                        >
                          <Plus size={12} />
                        </button>

                        <button 
                          onClick={() => onRemoveItem(item.product.id)}
                          className="p-1 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded transition-all ml-1"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Simulated Order Summary Tally */}
                <div className="mt-4 p-4 rounded-xl bg-emerald-surface-container/50 border border-white/5">
                  <div className="flex justify-between items-center text-sm text-text-muted mb-2">
                    <span>Subtotal</span>
                    <span>${total.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between items-center text-sm text-text-muted mb-2">
                    <span>Server Delivery Fee</span>
                    <span className="text-primary-mint text-xs font-semibold px-2 py-0.5 rounded bg-primary-mint/10">FREE</span>
                  </div>
                  <div className="border-t border-white/10 my-2 pt-2 flex justify-between items-center">
                    <span className="text-sm font-bold text-text-primary">Order Total</span>
                    <span className="text-lg font-bold text-primary-mint font-mono">${total.toFixed(2)}</span>
                  </div>
                </div>
              </div>

              {/* Checkout Form */}
              <form onSubmit={handlePay} className="md:col-span-5 flex flex-col gap-4">
                <span className="text-xs font-bold text-primary-mint tracking-wider uppercase">Minecraft ID Verification</span>
                
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs text-text-muted font-medium">Minecraft Username</label>
                  <div className="relative">
                    <input 
                      type="text"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      required
                      placeholder="e.g. DreamCrafter_01"
                      className="w-full px-3 py-2 bg-emerald-surface-low border border-white/10 rounded-lg text-sm text-text-primary font-sans focus:outline-none focus:border-primary-mint transition-all"
                    />
                    {username.trim() && (
                      <div className="absolute right-3 top-2.5 flex items-center gap-1.5">
                        <img 
                          src={`https://mc-heads.net/avatar/${username}/16`} 
                          alt="skin-preview"
                          onError={(e) => {
                            // Suppress broken image link warning
                            (e.target as HTMLElement).style.display = 'none';
                          }}
                          className="w-4 h-4 rounded-sm"
                          referrerPolicy="no-referrer"
                        />
                        <span className="text-[10px] text-teal-400 font-bold bg-teal-400/10 px-1 rounded">Linked</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs text-text-muted font-medium">Payment Gate Options</label>
                  <div className="grid grid-cols-2 gap-2">
                    <button 
                      type="button"
                      onClick={() => setPaymentMethod('card')}
                      className={`p-2.5 rounded-lg border text-xs font-medium flex flex-col items-center gap-1.5 transition-all ${
                        paymentMethod === 'card' 
                          ? 'bg-primary-mint/10 border-primary-mint text-primary-mint' 
                          : 'bg-white/5 border-white/5 text-text-muted hover:border-white/10'
                      }`}
                    >
                      <CreditCard size={16} />
                      <span>Card / GPay</span>
                    </button>
                    <button 
                      type="button"
                      onClick={() => setPaymentMethod('coins')}
                      className={`p-2.5 rounded-lg border text-xs font-medium flex flex-col items-center gap-1.5 transition-all ${
                        paymentMethod === 'coins' 
                          ? 'bg-primary-mint/10 border-primary-mint text-primary-mint' 
                          : 'bg-white/5 border-white/5 text-text-muted hover:border-white/10'
                      }`}
                    >
                      <Coins size={16} />
                      <span>In-Game Gold</span>
                    </button>
                  </div>
                </div>

                {error && <span className="text-xs text-red-400">{error}</span>}

                <button 
                  type="submit"
                  className="w-full mt-2 py-3 bg-primary-mint text-on-primary-mint font-bold rounded-xl btn-glow transition-all flex items-center justify-center gap-2 text-sm"
                >
                  <ShieldCheck size={18} />
                  <span>PROCEED TO SECURE CHECKOUT (${total.toFixed(2)})</span>
                </button>

                <div className="flex items-center gap-1.5 justify-center mt-1 text-[10px] text-text-muted">
                  <Heart size={10} className="text-primary-mint" />
                  <span>Your purchase directly funds server development, storage & event builders!</span>
                </div>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
