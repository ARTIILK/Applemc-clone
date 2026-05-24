import React, { useState, useEffect } from 'react';
import { 
  X, Coins, Copy, Check, ExternalLink, QrCode, Settings, 
  Flame, CreditCard, Wallet, RefreshCw, Sliders, CheckCircle2 
} from 'lucide-react';
import { CartItem } from '../types';

interface CheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  cartItems: CartItem[];
  username: string;
  onCheckoutSuccess: (username: string, items: CartItem[]) => void;
}

export default function CheckoutModal({
  isOpen,
  onClose,
  cartItems,
  username,
  onCheckoutSuccess
}: CheckoutModalProps) {
  // --- Checkout Modes ---
  // 'cart' for normal checkout items, 'coins' for India coin slider engine
  const [activeTab, setActiveTab] = useState<'cart' | 'coins'>('cart');
  
  // Coin Engine state (20 Coins = ₹1 INR)
  const [coinAmount, setCoinAmount] = useState<number>(1000);
  const presets = [1000, 2000, 5000, 10000];

  // Manual payment states
  const [utrRef, setUtrRef] = useState('');
  const [copied, setCopied] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [verifyStep, setVerifyStep] = useState(0);
  const [webhookUrl, setWebhookUrl] = useState(() => {
    return localStorage.getItem('woodmc_discord_webhook') || '';
  });
  const [isConfiguringWebhook, setIsConfiguringWebhook] = useState(false);
  const [testSent, setTestSent] = useState(false);

  // Close tracker
  if (!isOpen) return null;

  const usdToInrRate = 83;
  const isCoinMode = activeTab === 'coins';
  const totalCartPrice = cartItems.reduce((sum, item) => sum + item.product.price * item.quantity, 0);

  // Calculations
  const calculatedPayableINR = isCoinMode 
    ? Math.round(coinAmount / 20)
    : Math.round(totalCartPrice * usdToInrRate);

  // UPI URL Format
  const upiId = 'pay.woodmc@upi';
  const upiUrl = `upi://pay?pa=${upiId}&pn=WoodMC%20Network&am=${calculatedPayableINR}&cu=INR&tn=Invoice-${username || 'Guest'}`;
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&color=091a14&bgcolor=f8fbf9&data=${encodeURIComponent(upiUrl)}`;

  // Save webhook configuration
  const handleSaveWebhook = () => {
    localStorage.setItem('woodmc_discord_webhook', webhookUrl);
    setIsConfiguringWebhook(false);
  };

  // Dispatch discord webhook notification
  const sendDiscordWebhookNotification = async (utrString: string, successState: boolean) => {
    if (!webhookUrl) return;

    const itemsText = isCoinMode 
      ? `• **${coinAmount} WoodCoins** (₹${calculatedPayableINR})`
      : cartItems.map(item => `• **${item.product.name}** x${item.quantity} ($${item.product.price})`).join('\n');

    const totalDisplay = isCoinMode 
      ? `₹${calculatedPayableINR}` 
      : `$${totalCartPrice.toFixed(2)} (₹${calculatedPayableINR})`;

    const titleStr = successState ? '✅ Store Order Approved & Credited!' : '🚀 New Store Manual Payment Pending';

    const embed = {
      title: titleStr,
      description: `User **${username || 'N/A'}** has requested checkout verification on play.applemc.fun.`,
      color: successState ? 3823709 : 15844367, // Green or Amber
      fields: [
        { name: 'Minecraft Username', value: `\`${username || 'Guest'}\``, inline: true },
        { name: 'Gateway Type', value: 'UPI (QR Code Scan)', inline: true },
        { name: 'Transaction UTR ID', value: `\`${utrString || 'PENDING'}\``, inline: true },
        { name: 'Items', value: itemsText, inline: false },
        { name: 'Total Price', value: `**${totalDisplay}**`, inline: true },
        { name: 'Server Registry Node', value: '`play.applemc.fun:3000`', inline: true }
      ],
      thumbnail: { url: `https://mc-heads.net/avatar/${username || 'Alex'}/128` },
      footer: { text: 'WoodMC Dynamic Store Engine (V2) • Instant Webhook Link' },
      timestamp: new Date().toISOString()
    };

    try {
      await fetch(webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          username: 'WoodMC Notification Engine',
          avatar_url: 'https://lh3.googleusercontent.com/ref=aida-web-store-bot',
          embeds: [embed]
        })
      });
    } catch (e) {
      console.error('Webhook dispatch failure', e);
    }
  };

  // Test webhook endpoint
  const handleTestWebhook = async () => {
    if (!webhookUrl) return;
    setTestSent(true);

    const embed = {
      title: '🔌 Discord Webhook Test Connection',
      description: 'Your WoodMC Store Webhook integration is working perfectly!',
      color: 65280,
      fields: [
        { name: 'Status', value: 'Active / Connected', inline: true },
        { name: 'Time', value: new Date().toLocaleTimeString(), inline: true }
      ],
      footer: { text: 'WoodMC Manual Webhook Verification' }
    };

    try {
      await fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ embeds: [embed] })
      });
      setTimeout(() => setTestSent(false), 2000);
    } catch {
      setTestSent(false);
    }
  };

  // Copy Bill Summary
  const handleCopyBill = () => {
    const itemList = isCoinMode 
      ? `- ${coinAmount} WoodCoins (₹${calculatedPayableINR})`
      : cartItems.map(item => `- ${item.product.name} x${item.quantity} ($${item.product.price})`).join('\n');

    const amountUSD = isCoinMode ? `N/A (Special Currency)` : `$${totalCartPrice.toFixed(2)}`;

    const billText = `
========= WOODMC STORE TRANSACTION BILL =========
Account Minecraft Username: ${username || 'Guest'}
Billing Date: ${new Date().toLocaleString()}
Checkout Mode: ${isCoinMode ? 'Coins Engine Slider (INR)' : 'Direct Cart Items'}
-------------------------------------------------
Items Selected:
${itemList}
-------------------------------------------------
Store Total (USD): ${amountUSD}
Payable Subtotal (INR): ₹${calculatedPayableINR}
UPI Gateway Reference: pay.woodmc@upi (Manual)
Transaction Token: WOOD-${Date.now().toString().slice(-6)}
-------------------------------------------------
Please scan UPI QR to Pay, send a screenshot of your successful payout page to our Discord Server (/verify channel), or copy/paste this bill directly. Our staff approves manually in 5 minutes!
`;

    navigator.clipboard.writeText(billText.trim());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Step-by-step checkout execution simulation
  const handleVerifyCheckout = (e: React.FormEvent) => {
    e.preventDefault();
    if (!utrRef.trim()) return;

    setIsVerifying(true);
    setVerifyStep(1);

    // Trigger initial Webhook message
    sendDiscordWebhookNotification(utrRef, false);

    // Simulate real steps
    setTimeout(() => {
      setVerifyStep(2);
      setTimeout(() => {
        setVerifyStep(3);
        setTimeout(() => {
          setIsVerifying(false);
          sendDiscordWebhookNotification(utrRef, true);
          onCheckoutSuccess(username || 'Guest', cartItems);
          onClose();
        }, 2000);
      }, 1500);
    }, 1500);
  };

  return (
    <div id="checkout-drawer-backdrop" className="fixed inset-0 z-110 flex items-center justify-center p-4 bg-emerald-bg/85 backdrop-blur-2xl transition-all duration-300">
      <div 
        id="checkout-drawer-content"
        className="relative w-full max-w-4xl rounded-2xl glass-panel-heavy border border-primary-mint/25 flex flex-col shadow-2xl overflow-hidden animate-fade-in text-text-primary"
      >
        {/* Glow Element */}
        <div className="absolute top-0 right-1/4 w-96 h-36 ambient-glow rounded-full -translate-y-1/2 opacity-50"></div>

        {/* Modal Header */}
        <div className="p-5 border-b border-white/10 flex items-center justify-between relative z-10 bg-emerald-surface-low">
          <div>
            <h2 className="text-lg font-extrabold text-primary-mint tracking-tight flex items-center gap-2">
              <Flame className="text-amber-400 animate-pulse" size={20} />
              WOODMC CENTRAL CHECKOUT & PAYMENT
            </h2>
            <p className="text-xs text-text-muted">High-performance dual-pane manual payment module</p>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 rounded-full bg-white/5 hover:bg-white/10 text-text-muted hover:text-primary-mint transition-all"
          >
            <X size={18} />
          </button>
        </div>

        {/* Dynamic Route/Tabs Option */}
        <div className="flex bg-emerald-surface-low border-b border-white/10 relative z-10">
          <button 
            onClick={() => { if (!isVerifying) setActiveTab('cart'); }}
            className={`flex-1 py-3 text-xs font-bold uppercase tracking-wider transition-all border-b-2 ${
              activeTab === 'cart' 
                ? 'border-primary-mint text-primary-mint bg-white/5' 
                : 'border-transparent text-text-muted hover:text-text-primary'
            }`}
          >
            🛒 Cart Checkout ({cartItems.length} items)
          </button>
          <button 
            onClick={() => { if (!isVerifying) setActiveTab('coins'); }}
            className={`flex-1 py-3 text-xs font-bold uppercase tracking-wider transition-all border-b-2 ${
              activeTab === 'coins' 
                ? 'border-primary-mint text-primary-mint bg-white/5' 
                : 'border-transparent text-text-muted hover:text-text-primary'
            }`}
          >
            🪙 Buy WoodCoins Engine
          </button>
        </div>

        {/* Main Content Area */}
        <div className="flex-1 overflow-y-auto p-6 md:grid md:grid-cols-12 md:gap-8 min-h-[440px] max-h-[80vh] relative z-10">
          
          {/* Left Pane (Manual UPI QR scan and code verification) */}
          <div className="md:col-span-7 flex flex-col gap-5 relative">
            {isVerifying ? (
              // Verification Progress view
              <div className="flex flex-col items-center justify-center py-16 text-center h-full">
                <div className="relative mb-6">
                  <div className="w-16 h-16 rounded-full border-4 border-primary-mint/20 border-t-primary-mint animate-spin flex items-center justify-center"></div>
                  <Coins className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-primary-mint animate-pulse" size={24} />
                </div>
                
                {verifyStep === 1 && (
                  <div className="animate-fade-in">
                    <h3 className="text-base font-bold text-primary-mint">VERIFYING DIGITAL LEDGER</h3>
                    <p className="text-xs text-text-muted mt-1 max-w-xs mx-auto">Connecting manual UPI registers to node server play.applemc.fun...</p>
                    <div className="w-48 h-1 bg-white/10 rounded-full mx-auto mt-4 overflow-hidden">
                      <div className="w-1/3 h-full bg-primary-mint rounded-full"></div>
                    </div>
                  </div>
                )}
                {verifyStep === 2 && (
                  <div className="animate-fade-in">
                    <h3 className="text-base font-bold text-primary-mint">MOJANG LINK REGISTERS</h3>
                    <p className="text-xs text-text-muted mt-1 max-w-xs mx-auto">Mapping inventory code to player UUID for skin username <span className="text-teal-400 font-mono">{username}</span>...</p>
                    <div className="w-48 h-1 bg-white/10 rounded-full mx-auto mt-4 overflow-hidden">
                      <div className="w-2/3 h-full bg-primary-mint rounded-full"></div>
                    </div>
                  </div>
                )}
                {verifyStep === 3 && (
                  <div className="animate-fade-in">
                    <h3 className="text-base font-bold text-primary-mint">TRIGGERING DISCORD WEBHOOKS</h3>
                    <p className="text-xs text-text-muted mt-1 max-w-xs mx-auto">Updating channel embeds, issuing automated server commands...</p>
                    <div className="w-48 h-1 bg-white/10 rounded-full mx-auto mt-4 overflow-hidden">
                      <div className="w-[95%] h-full bg-primary-mint rounded-full"></div>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              // Standard Checkout view
              <div className="flex flex-col gap-4">
                <div className="p-3 bg-white/5 border border-white/5 rounded-xl flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <img 
                      src={`https://mc-heads.net/avatar/${username || 'Alex'}/32`} 
                      alt="mojang-linked" 
                      className="w-8 h-8 rounded bg-emerald-surface-container"
                    />
                    <div>
                      <span className="block text-xs text-text-muted font-semibold uppercase">Account Identity</span>
                      <span className="text-sm font-extrabold text-primary-mint font-mono">{username || 'Guest'}</span>
                    </div>
                  </div>
                  <span className="px-2 py-0.5 rounded bg-emerald-bg text-[10px] text-teal-400 font-extrabold uppercase border border-teal-500/20">UUID Linked</span>
                </div>

                {isCoinMode && (
                  // Custom Interactive Coin Slider
                  <div className="p-4 rounded-xl glass-panel bg-primary-mint/5 border border-primary-mint/20">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-xs font-bold text-primary-mint flex items-center gap-1.5 uppercase">
                        <Sliders size={14} />
                        WoodCoins Slider Engine
                      </span>
                      <span className="text-xs font-bold text-text-muted">Rate: ₹1 = 20 Coins</span>
                    </div>

                    {/* Premium Current Amount */}
                    <div className="flex justify-between items-baseline py-2 border-b border-primary-mint/10 mb-4">
                      <span className="text-2xl font-black text-primary-mint font-mono flex items-center gap-1">
                        {coinAmount.toLocaleString()} <span className="text-xs text-text-muted uppercase">WoodCoins</span>
                      </span>
                      <span className="text-sm text-text-primary font-bold">
                        Payable: <span className="text-primary-mint">₹{calculatedPayableINR} INR</span>
                      </span>
                    </div>

                    {/* Slider input */}
                    <input 
                      type="range"
                      min="200"
                      max="10000"
                      step="200"
                      value={coinAmount}
                      onChange={(e) => setCoinAmount(parseInt(e.target.value))}
                      className="w-full accent-primary-mint h-2 bg-emerald-surface rounded-lg appearance-none cursor-pointer mb-4"
                    />

                    {/* Presets and Buttons */}
                    <div className="flex gap-2 justify-between">
                      {presets.map((p) => (
                        <button
                          key={p}
                          type="button"
                          onClick={() => setCoinAmount(p)}
                          className={`flex-1 py-1.5 text-xs font-semibold rounded-lg border transition-all ${
                            coinAmount === p 
                              ? 'bg-primary-mint text-on-primary-mint border-primary-mint'
                              : 'bg-white/5 border-white/5 text-text-muted hover:border-white/10 hover:text-text-primary'
                          }`}
                        >
                          +{p}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Manual Scan to Pay UPI */}
                <div>
                  <h3 className="text-xs font-extrabold text-primary-mint tracking-wider uppercase mb-3 flex items-center gap-2">
                    <QrCode size={14} />
                    Scan UPI QR To Settle Payout
                  </h3>

                  <div className="grid grid-cols-1 sm:grid-cols-12 gap-5 p-4 rounded-xl bg-white/5 border border-white/5 items-center">
                    
                    {/* Visual QR Render */}
                    <div className="sm:col-span-5 flex flex-col items-center justify-center gap-1.5">
                      <div className="p-2 b rounded-xl bg-white border border-white/10 flex items-center justify-center shadow-lg">
                        <img 
                          src={qrCodeUrl} 
                          alt="upi-invoice-payment" 
                          className="w-36 h-36"
                        />
                      </div>
                      <span className="text-[10px] text-text-muted tracking-wide flex items-center gap-1">
                        🔒 Secure UPI Protocol
                      </span>
                    </div>

                    {/* QR Payment details description */}
                    <div className="sm:col-span-7 flex flex-col gap-2 text-xs">
                      <div className="flex justify-between border-b border-white/5 pb-1">
                        <span className="text-text-muted">UPI Identifier:</span>
                        <span className="font-mono text-primary-mint font-bold">{upiId}</span>
                      </div>
                      <div className="flex justify-between border-b border-white/5 pb-1">
                        <span className="text-text-muted">Beneficiary Merchant:</span>
                        <span className="text-text-primary font-bold">WoodMC Network</span>
                      </div>
                      <div className="flex justify-between border-b border-white/5 pb-1">
                        <span className="text-text-muted">Converted Payable:</span>
                        <span className="font-extrabold text-teal-400 font-mono">₹{calculatedPayableINR} INR</span>
                      </div>

                      <p className="text-[10px] text-text-muted leading-relaxed mt-2 bg-emerald-surface-low/50 p-2.5 rounded border border-white/5">
                        💡 Pay using any standard mobile checkout app like <span className="text-text-primary font-medium">PhonePe</span>, <span className="text-text-primary font-medium">GPay</span>, or <span className="text-text-primary font-medium">Paytm</span>. 
                      </p>
                    </div>

                  </div>
                </div>

                {/* Verification ID fields and submission */}
                <form onSubmit={handleVerifyCheckout} className="flex flex-col gap-3">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[11px] text-text-muted font-bold uppercase tracking-wider">UPI / Banking Transaction UTR Reference</label>
                    <div className="flex gap-2">
                      <input 
                        type="text"
                        required
                        placeholder="Enter the 12-digit UTR ID (e.g. 4156XXXXXXXX)"
                        value={utrRef}
                        onChange={(e) => setUtrRef(e.target.value)}
                        className="flex-1 px-3 py-2 bg-emerald-surface border border-white/10 rounded-lg text-sm text-text-primary font-mono focus:outline-none focus:border-primary-mint transition-all placeholder:text-xs"
                      />
                      <button 
                        type="button"
                        onClick={handleCopyBill}
                        className={`px-3 py-2 border rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 active:scale-95 whitespace-nowrap ${
                          copied 
                            ? 'bg-teal-400/20 border-teal-400 text-teal-400' 
                            : 'bg-white/5 border-white/10 text-text-muted hover:text-primary-mint hover:border-primary-mint/30'
                        }`}
                      >
                        {copied ? <Check size={14} /> : <Copy size={14} />}
                        <span>{copied ? 'Copied Bill' : 'Copy Bill'}</span>
                      </button>
                    </div>
                  </div>

                  <button 
                    type="submit"
                    className="w-full mt-1.5 py-3 rounded-xl bg-primary-mint text-on-primary-mint text-xs font-extrabold uppercase tracking-wider btn-glow transition-all flex items-center justify-center gap-2"
                  >
                    <CheckCircle2 size={16} />
                    <span>Submit & Confirm Reference (₹{calculatedPayableINR})</span>
                  </button>
                </form>
              </div>
            )}
          </div>

          {/* Right Pane (Summary of Items & Webhook Config) */}
          <div className="md:col-span-1 border-t md:border-t-0 md:border-l border-white/10 my-4 md:my-0 md:pl-8 flex flex-col justify-between md:col-span-5 relative gap-5">
            
            {/* Real-time Order summary */}
            <div className="flex flex-col gap-4">
              <span className="text-xs font-extrabold text-primary-mint tracking-wider uppercase">Order Invoice Ledger</span>
              
              <div className="flex flex-col gap-2.5 max-h-[160px] overflow-y-auto pr-1 hide-scrollbar">
                {isCoinMode ? (
                  <div className="p-2.5 rounded-lg bg-white/5 border border-white/5 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded bg-primary-mint/10 flex items-center justify-center text-primary-mint">
                        <Coins size={16} />
                      </div>
                      <span className="text-xs font-bold font-mono">WoodCoins Block Deposit</span>
                    </div>
                    <span className="text-xs font-medium font-mono">Qty: {coinAmount}</span>
                  </div>
                ) : (
                  cartItems.map((item) => (
                    <div 
                      key={item.product.id}
                      className="p-2.5 rounded-lg bg-white/5 border border-white/5 flex items-center justify-between text-xs"
                    >
                      <div className="flex items-center gap-2 max-w-[70%]">
                        <span className="w-1.5 h-1.5 rounded-full bg-primary-mint"></span>
                        <span className="font-semibold text-text-primary truncate">{item.product.name}</span>
                      </div>
                      <div className="flex items-center gap-2 text-text-muted">
                        <span>x{item.quantity}</span>
                        <span>•</span>
                        <span className="text-primary-mint font-semibold">${(item.product.price * item.quantity).toFixed(2)}</span>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Converted and Original Sum */}
              <div className="p-4 rounded-xl bg-emerald-surface-container/30 border border-white/5 flex flex-col gap-2.5">
                <div className="flex justify-between text-xs">
                  <span className="text-text-muted">Subtotal (USD):</span>
                  <span className="font-semibold font-mono text-text-primary">{isCoinMode ? 'N/A' : `$${totalCartPrice.toFixed(2)}`}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-text-muted">Invoice Node Fee:</span>
                  <span className="text-xs text-primary-mint font-bold px-1.5 py-0.5 rounded bg-primary-mint/10 uppercase tracking-widest leading-none">Free</span>
                </div>
                <div className="border-t border-white/10 pt-2.5 flex justify-between items-baseline">
                  <span className="text-xs font-black text-text-primary uppercase">Payable Total:</span>
                  <div className="text-right">
                    <span className="block text-base font-extrabold text-primary-mint font-mono">₹{calculatedPayableINR} INR</span>
                    {!isCoinMode && <span className="block text-[10px] text-text-muted">Converts from ${totalCartPrice.toFixed(2)}</span>}
                  </div>
                </div>
              </div>
            </div>

            {/* Configurable Discord Webhook integration banner */}
            <div className="p-3.5 rounded-xl bg-white/5 border border-white/5 text-xs flex flex-col gap-2">
              <div className="flex justify-between items-center">
                <span className="text-xs font-bold text-indigo-400 flex items-center gap-1">
                  <Settings size={13} />
                  DEVELOPER OPTIONS
                </span>
                <button 
                  type="button"
                  onClick={() => setIsConfiguringWebhook(!isConfiguringWebhook)}
                  className="text-[10px] text-primary-mint hover:underline font-bold"
                >
                  {isConfiguringWebhook ? 'Cancel' : 'Edit Webhook'}
                </button>
              </div>

              <p className="text-[10px] text-text-muted leading-relaxed">
                Send real-time instant notifications (rich embeds) on order activity using a custom Discord Webhook!
              </p>

              {isConfiguringWebhook ? (
                <div className="flex flex-col gap-2 mt-1 animate-fade-in">
                  <input 
                    type="text"
                    placeholder="Discord Webhook URL"
                    value={webhookUrl}
                    onChange={(e) => setWebhookUrl(e.target.value)}
                    className="w-full px-2.5 py-1.5 bg-emerald-surface border border-white/10 rounded text-xs text-text-primary font-sans focus:outline-none focus:border-indigo-400"
                  />
                  <div className="flex gap-2">
                    <button 
                      type="button"
                      onClick={handleSaveWebhook}
                      className="flex-1 py-1 bg-indigo-500 hover:bg-indigo-600 text-white font-bold rounded text-[10px]"
                    >
                      Save Webhook
                    </button>
                    {webhookUrl && (
                      <button 
                        type="button"
                        onClick={handleTestWebhook}
                        disabled={testSent}
                        className="px-2.5 py-1 bg-white/5 hover:bg-white/10 text-text-primary border border-white/10 font-medium rounded text-[10px]"
                      >
                        {testSent ? 'Sent!' : 'Test'}
                      </button>
                    )}
                  </div>
                </div>
              ) : (
                <div className="flex justify-between items-center bg-emerald-surface-low/50 p-2.5 rounded border border-white/5 text-[10px]">
                  <span className="text-text-muted truncate max-w-[150px]">
                    Webhook: {webhookUrl ? '✅ Configured' : '❌ Not Configured'}
                  </span>
                  {webhookUrl && (
                    <button 
                      type="button"
                      onClick={handleTestWebhook}
                      className="text-[10px] text-teal-400 font-bold hover:underline"
                    >
                      Test Webhook Dispatch
                    </button>
                  )}
                </div>
              )}
            </div>

          </div>

        </div>
      </div>
    </div>
  );
}
