import React, { useState } from 'react';
import { 
  X, Copy, Check, ExternalLink, QrCode, Settings, 
  Flame, CreditCard, RefreshCw, CheckCircle2, MessageSquare, ShieldCheck, Mail
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
  // 'upi' for Instant UPI Verification, 'ticket' for Discord Ticket manual trade
  const [activeTab, setActiveTab] = useState<'upi' | 'ticket'>('upi');

  // Manual payment states
  const [utrRef, setUtrRef] = useState('');
  const [copied, setCopied] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [verifyStep, setVerifyStep] = useState(0);
  const [webhookUrl, setWebhookUrl] = useState(() => {
    return localStorage.getItem('elitemc_discord_webhook') || '';
  });
  const [isConfiguringWebhook, setIsConfiguringWebhook] = useState(false);
  const [testSent, setTestSent] = useState(false);

  // Close tracker
  if (!isOpen) return null;

  // Real prices calculated from JSON product list fields
  const totalCartPriceUSD = cartItems.reduce((sum, item) => sum + (item.product.priceUSD || 0) * item.quantity, 0);
  const totalCartPriceINR = cartItems.reduce((sum, item) => sum + (item.product.priceINR || 0) * item.quantity, 0);

  // UPI URL Format
  const upiId = 'pay.elitemc@upi';
  const upiUrl = `upi://pay?pa=${upiId}&pn=EliteMC%20Store&am=${totalCartPriceINR}&cu=INR&tn=Invoice-${username || 'Guest'}`;
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&color=b8eed6&bgcolor=0a1514&data=${encodeURIComponent(upiUrl)}`;

  // Save webhook configuration
  const handleSaveWebhook = () => {
    localStorage.setItem('elitemc_discord_webhook', webhookUrl);
    setIsConfiguringWebhook(false);
  };

  // Dispatch discord webhook notification
  const sendDiscordWebhookNotification = async (utrString: string, successState: boolean) => {
    if (!webhookUrl) return;

    const itemsText = cartItems.map(item => `• **${item.product.name}** x${item.quantity} (₹${item.product.priceINR} / $${item.product.priceUSD})`).join('\n');

    const totalDisplay = `₹${totalCartPriceINR} INR / $${totalCartPriceUSD.toFixed(2)} USD`;

    const titleStr = successState ? '✅ EliteMC Order Approved & Credited!' : '🚀 New EliteMC Manual Payment Pending';

    const embed = {
      title: titleStr,
      description: `User **${username || 'N/A'}** has requested manual checkout verification on EliteMC Store.`,
      color: successState ? 12119766 : 16502570, // Mint green (#b8eed6 -> 12119766 decimal) or yellow-orange
      fields: [
        { name: 'Username', value: `\`${username || 'Guest'}\``, inline: true },
        { name: 'Checkout Mode', value: activeTab === 'upi' ? 'UPI Manual QR Settle' : 'Direct Discord Ticket Invoice', inline: true },
        { name: 'Transaction UTR ID', value: `\`${utrString || 'PENDING_STAFF_CONTACT'}\``, inline: true },
        { name: 'Items', value: itemsText, inline: false },
        { name: 'Invoice Sum', value: `**${totalDisplay}**`, inline: true },
        { name: 'Staff Support Handler', value: '`Discord Support`', inline: true }
      ],
      thumbnail: { url: `https://mc-heads.net/avatar/${username || 'Alex'}/128` },
      footer: { text: 'EliteMC Dynamic Sanctuary Store Engine • Instant Webhook Link' },
      timestamp: new Date().toISOString()
    };

    try {
      await fetch(webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          username: 'EliteMC Notification Engine',
          avatar_url: 'https://mc-heads.net/avatar/Elite/128',
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
      title: '🔌 EliteMC Webhook Test Connection',
      description: 'Your EliteMC Store Webhook integration is working perfectly!',
      color: 12119766,
      fields: [
        { name: 'Status', value: 'Active / Connected', inline: true },
        { name: 'Time', value: new Date().toLocaleTimeString(), inline: true }
      ],
      footer: { text: 'EliteMC Developer Webhook Verification' }
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
    const itemList = cartItems.map(item => `- ${item.product.name} x${item.quantity} (₹${item.product.priceINR} / $${item.product.priceUSD})`).join('\n');

    const amountUSD = `$${totalCartPriceUSD.toFixed(2)}`;
    const invoiceToken = `ELITE-${Date.now().toString().slice(-6)}`;

    const billText = `
========= ELITEMC STORE INVOICE =========
Account Username: ${username || 'Guest'}
Billing Date: ${new Date().toLocaleString()}
Checkout Flow Chosen: ${activeTab === 'upi' ? 'UPI Scanner Real-time (INR)' : 'Discord Support DM Gateway'}
-------------------------------------------------
Items Selected:
${itemList}
-------------------------------------------------
Store Total (USD): ${amountUSD}
Payable Subtotal (INR): ₹${totalCartPriceINR}
Merchant Identifier: play.elitemc.net
Unique Invoice Token: ${invoiceToken}
-------------------------------------------------
Please submit payout via UPI QR, or ping custom support with this Token to activate items on your account within minutes!
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

  const handleDiscordTicketCheckout = () => {
    handleCopyBill();
    // Pre-send Webhook
    sendDiscordWebhookNotification('DISCORD_TICKET_INVOICE', true);
    // Direct link to support
    window.open('https://discord.gg/elitemc', '_blank');
    onCheckoutSuccess(username || 'Guest', cartItems);
    onClose();
  };

  return (
    <div id="checkout-drawer-backdrop" className="fixed inset-0 z-110 flex items-center justify-center p-4 bg-black/85 backdrop-blur-2xl transition-all duration-300">
      <div 
        id="checkout-drawer-content"
        className="relative w-full max-w-4xl rounded-2xl bg-[#090e0c] border border-primary-mint/25 flex flex-col shadow-2xl overflow-hidden animate-fade-in text-gray-100"
      >
        {/* Glow Element */}
        <div className="absolute top-0 right-1/4 w-96 h-36 bg-primary-mint/20 blur-[130px] rounded-full -translate-y-1/2 opacity-40"></div>

        {/* Modal Header */}
        <div className="p-5 border-b border-white/10 flex items-center justify-between relative z-10 bg-black/40">
          <div>
            <h2 className="text-lg font-black text-primary-mint tracking-tight flex items-center gap-2 font-sans">
              <Flame className="text-primary-mint animate-pulse" size={20} />
              ELITEMC SANCTUARY PREMIUM CHECKOUT
            </h2>
            <p className="text-xs text-text-muted">High-performance dual-pane manual payment module</p>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 rounded-full bg-white/5 hover:bg-white/10 text-gray-400 hover:text-primary-mint transition-all cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Dynamic Dual Checkout Tabs Route */}
        <div className="flex bg-black/20 border-b border-white/10 relative z-10">
          <button 
            type="button"
            onClick={() => { if (!isVerifying) setActiveTab('upi'); }}
            className={`flex-1 py-3 text-xs font-bold uppercase tracking-wider transition-all border-b-2 cursor-pointer ${
              activeTab === 'upi' 
                ? 'border-primary-mint text-primary-mint bg-white/5' 
                : 'border-transparent text-gray-400 hover:text-white'
            }`}
          >
            🇮🇳 Direct UPI Scan (Instant QR Codes)
          </button>
          <button 
            type="button"
            onClick={() => { if (!isVerifying) setActiveTab('ticket'); }}
            className={`flex-1 py-3 text-xs font-bold uppercase tracking-wider transition-all border-b-2 cursor-pointer ${
              activeTab === 'ticket' 
                ? 'border-primary-mint text-primary-mint bg-white/5' 
                : 'border-transparent text-gray-400 hover:text-white'
            }`}
          >
            🌐 Discord Support DM / Invoice Ticket
          </button>
        </div>

        {/* Main Content Area */}
        <div className="flex-1 overflow-y-auto p-6 md:grid md:grid-cols-12 md:gap-8 min-h-[440px] max-h-[80vh] relative z-10">
          
          {/* Left Pane (Manual UPI QR scan / Direct Discord Ticket choice) */}
          <div className="md:col-span-7 flex flex-col gap-5 relative">
            {isVerifying ? (
              // Verification Progress view
              <div className="flex flex-col items-center justify-center py-16 text-center h-full">
                <div className="relative mb-6">
                  <div className="w-16 h-16 rounded-full border-4 border-primary-mint/20 border-t-primary-mint animate-spin flex items-center justify-center"></div>
                  <ShieldCheck className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-primary-mint animate-pulse" size={24} />
                </div>
                
                {verifyStep === 1 && (
                  <div className="animate-fade-in">
                    <h3 className="text-base font-bold text-primary-mint">VERIFYING DIGITAL LEDGER</h3>
                    <p className="text-xs text-gray-400 mt-1 max-w-xs mx-auto">Connecting manual UPI registers to EliteMC Sanctuary node...</p>
                    <div className="w-48 h-1 bg-white/10 rounded-full mx-auto mt-4 overflow-hidden">
                      <div className="w-1/3 h-full bg-primary-mint rounded-full animate-pulse"></div>
                    </div>
                  </div>
                )}
                {verifyStep === 2 && (
                  <div className="animate-fade-in">
                    <h3 className="text-base font-bold text-primary-mint">CONNECTING CUSTOMER IDENTITY</h3>
                    <p className="text-xs text-gray-400 mt-1 max-w-xs mx-auto">Mapping payment tokens to player handle <span className="text-primary-mint font-mono">{username}</span>...</p>
                    <div className="w-48 h-1 bg-white/10 rounded-full mx-auto mt-4 overflow-hidden">
                      <div className="w-2/3 h-full bg-primary-mint rounded-full animate-pulse"></div>
                    </div>
                  </div>
                )}
                {verifyStep === 3 && (
                  <div className="animate-fade-in">
                    <h3 className="text-base font-bold text-primary-mint">TRIGGERING DISCORD NOTIFICATIONS</h3>
                    <p className="text-xs text-gray-400 mt-1 max-w-xs mx-auto">Dispatching webhook embeds to Discord channels for staff validation...</p>
                    <div className="w-48 h-1 bg-white/10 rounded-full mx-auto mt-4 overflow-hidden">
                      <div className="w-[95%] h-full bg-primary-mint rounded-full animate-pulse"></div>
                    </div>
                  </div>
                )}
              </div>
            ) : activeTab === 'upi' ? (
              // Standard UPI Manual Checkout view
              <div className="flex flex-col gap-4">
                <div className="p-3 bg-white/5 border border-white/5 rounded-xl flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <img 
                      src={`https://mc-heads.net/avatar/${username || 'Alex'}/32`} 
                      alt="mojang-linked" 
                      className="w-8 h-8 rounded bg-black"
                    />
                    <div>
                      <span className="block text-[10px] text-gray-400 font-bold uppercase">Customer Identity</span>
                      <span className="text-sm font-extrabold text-primary-mint font-mono">{username || 'Guest'}</span>
                    </div>
                  </div>
                  <span className="px-2 py-0.5 rounded bg-primary-mint/10 text-[10px] text-primary-mint font-extrabold uppercase border border-primary-mint/20">UUID Linked</span>
                </div>

                {/* Manual Scan to Pay UPI */}
                <div>
                  <h3 className="text-xs font-extrabold text-primary-mint tracking-wider uppercase mb-3 flex items-center gap-2">
                    <QrCode size={14} />
                    Scan UPI QR To Settle Payout
                  </h3>

                  <div className="grid grid-cols-1 sm:grid-cols-12 gap-5 p-4 rounded-xl bg-white/5 border border-white/5 items-center">
                    
                    {/* Visual QR Render */}
                    <div className="sm:col-span-5 flex flex-col items-center justify-center gap-1.5">
                      <div className="p-2 rounded-xl bg-white border border-white/10 flex items-center justify-center shadow-lg">
                        <img 
                          src={qrCodeUrl} 
                          alt="upi-invoice-payment" 
                          className="w-36 h-36"
                        />
                      </div>
                      <span className="text-[10px] text-gray-400 tracking-wide flex items-center gap-1">
                        🔒 Secure UPI Protocol
                      </span>
                    </div>

                    {/* QR Payment details description */}
                    <div className="sm:col-span-7 flex flex-col gap-2 text-xs">
                      <div className="flex justify-between border-b border-white/5 pb-1">
                        <span className="text-gray-400">UPI ID Reference:</span>
                        <span className="font-mono text-primary-mint font-bold">{upiId}</span>
                      </div>
                      <div className="flex justify-between border-b border-white/5 pb-1">
                        <span className="text-gray-400">Beneficiary Merchant:</span>
                        <span className="text-gray-100 font-bold">EliteMC Sanctuary</span>
                      </div>
                      <div className="flex justify-between border-b border-white/5 pb-1">
                        <span className="text-gray-400">Payable Amount:</span>
                        <span className="font-extrabold text-primary-mint font-mono">₹{totalCartPriceINR} INR</span>
                      </div>

                      <p className="text-[10px] text-gray-400 leading-relaxed mt-2 bg-black p-2.5 rounded border border-white/5">
                        💡 Pay using <span className="text-primary-mint font-bold">PhonePe</span>, <span className="text-primary-mint font-bold">GPay</span>, or <span className="text-primary-mint font-bold">Paytm</span>. Ensure your transaction generates a 12-digit UTR Code!
                      </p>
                    </div>

                  </div>
                </div>

                {/* Verification ID fields and submission */}
                <form onSubmit={handleVerifyCheckout} className="flex flex-col gap-3">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[11px] text-gray-400 font-bold uppercase tracking-wider">UPI / Banking Transaction UTR Reference</label>
                    <div className="flex gap-2">
                      <input 
                        type="text"
                        required
                        placeholder="Enter the 12-digit UTR ID (e.g. 4156XXXXXXXX)"
                        value={utrRef}
                        onChange={(e) => setUtrRef(e.target.value)}
                        className="flex-1 px-3 py-2 bg-black border border-white/10 rounded-lg text-sm text-white font-mono focus:outline-none focus:border-primary-mint transition-all placeholder:text-xs"
                      />
                      <button 
                        type="button"
                        onClick={handleCopyBill}
                        className={`px-3 py-2 border rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 active:scale-95 whitespace-nowrap cursor-pointer ${
                          copied 
                            ? 'bg-primary-mint/20 border-primary-mint text-primary-mint' 
                            : 'bg-white/5 border-white/15 text-gray-400 hover:text-primary-mint hover:border-primary-mint/30'
                        }`}
                      >
                        {copied ? <Check size={14} /> : <Copy size={14} />}
                        <span>{copied ? 'Copied' : 'Copy Invoice'}</span>
                      </button>
                    </div>
                  </div>

                  <button 
                    type="submit"
                    className="w-full mt-1.5 py-3 rounded-xl bg-primary-mint text-emerald-bg text-xs font-extrabold uppercase tracking-wider hover:bg-white transition-all flex items-center justify-center gap-2 cursor-pointer shadow-[0_0_15px_rgba(184,238,214,0.3)]"
                  >
                    <CheckCircle2 size={16} />
                    <span>Submit & Confirm Reference (₹{totalCartPriceINR})</span>
                  </button>
                </form>
              </div>
            ) : (
              // Discord Support Ticket Checkout view (USD, PayPal, Crypto manual handler)
              <div className="flex flex-col gap-4 animate-fade-in h-full justify-between">
                <div className="flex flex-col gap-3">
                  <div className="p-4 bg-primary-mint/5 border border-primary-mint/20 rounded-xl">
                    <h3 className="text-sm font-bold text-primary-mint flex items-center gap-2">
                      <MessageSquare size={16} />
                      Global & Alternative Payment Gateway
                    </h3>
                    <p className="text-xs text-text-muted mt-1 leading-relaxed">
                      If you are an international user without access to UPI, or prefer using <span className="text-white font-semibold">PayPal, Credit Card, Crypto, or Discord trades</span>, choose this lane! Our staff is ready to assist you directly in private support tickets.
                    </p>
                  </div>

                  {/* Copyable code and credentials instruction card */}
                  <div className="p-4 bg-white/5 border border-white/5 rounded-xl flex flex-col gap-3">
                    <span className="text-xs font-bold text-gray-300 uppercase block tracking-wide">Automatic Ticket Invoice</span>
                    
                    <div className="bg-black/80 rounded p-3 text-xs font-mono text-gray-300 border border-white/5 select-all leading-relaxed whitespace-pre-line">
                      🎟️ Invoice Code: ELITE-{Date.now().toString().slice(-6)}{'\n'}
                      👤 Client Account: {username || 'Guest'}{'\n'}
                      💰 Subtotal Payable: ${totalCartPriceUSD.toFixed(2)} USD / ₹{totalCartPriceINR} INR{'\n'}
                      📦 Items selected: {cartItems.map(i => `${i.product.name} (x${i.quantity})`).join(', ')}
                    </div>

                    <p className="text-[11px] text-gray-400 leading-relaxed">
                      Clicking below automatically copies this invoice parameters to your clipboard and routes you to EliteMC's secure Discord communication channel. Paste this block to EliteMC's Discord Support channel to settle.
                    </p>
                  </div>
                </div>

                <div className="flex flex-col gap-2">
                  <button
                    type="button"
                    onClick={handleDiscordTicketCheckout}
                    className="w-full py-4 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-extrabold uppercase tracking-wider transition-all flex items-center justify-center gap-2 cursor-pointer shadow-[0_0_15px_rgba(13,148,136,0.3)]"
                  >
                    <ExternalLink size={16} />
                    <span>Copy Invoice & Open Discord support (Chat Now)</span>
                  </button>

                  <div className="flex items-center justify-center gap-2 text-[10px] text-gray-400 hover:text-white transition-colors">
                    <Mail size={12} />
                    <span>Server IP Address: <span className="font-mono text-primary-mint font-bold">play.elitemc.net</span></span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Right Pane (Summary of Items & Webhook Config) */}
          <div className="md:col-span-5 border-t md:border-t-0 md:border-l border-white/10 my-4 md:my-0 md:pl-8 flex flex-col justify-between relative gap-5">
            
            {/* Real-time Order summary */}
            <div className="flex flex-col gap-4">
              <span className="text-xs font-extrabold text-primary-mint tracking-wider uppercase">Order Invoice Ledger</span>
              
              <div className="flex flex-col gap-2.5 max-h-[160px] overflow-y-auto pr-1 hide-scrollbar">
                {cartItems.map((item) => (
                  <div 
                    key={item.product.id}
                    className="p-2.5 rounded-lg bg-white/5 border border-white/5 flex items-center justify-between text-xs"
                  >
                    <div className="flex items-center gap-2 max-w-[70%]">
                      <span className="w-1.5 h-1.5 rounded-full bg-primary-mint"></span>
                      <span className="font-semibold text-gray-100 truncate">{item.product.name}</span>
                    </div>
                    <div className="flex items-center gap-2 text-gray-400">
                      <span>x{item.quantity}</span>
                      <span>•</span>
                      <span className="text-primary-mint font-semibold font-mono">₹{item.product.priceINR * item.quantity}</span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Converted and Original Sum */}
              <div className="p-4 rounded-xl bg-white/5 border border-white/5 flex flex-col gap-2.5">
                <div className="flex justify-between text-xs">
                  <span className="text-gray-400">Subtotal (USD):</span>
                  <span className="font-semibold font-mono text-gray-100">${totalCartPriceUSD.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-gray-400">Invoice Node Fee:</span>
                  <span className="text-xs text-primary-mint font-bold px-1.5 py-0.5 rounded bg-primary-mint/10 uppercase tracking-widest leading-none">Free</span>
                </div>
                <div className="border-t border-white/10 pt-2.5 flex justify-between items-baseline">
                  <span className="text-xs font-black text-white uppercase">Payable Total:</span>
                  <div className="text-right">
                    <span className="block text-base font-extrabold text-primary-mint font-mono">₹{totalCartPriceINR} INR</span>
                    <span className="block text-[10px] text-gray-400">Equivalent to ${totalCartPriceUSD.toFixed(2)} USD</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Configurable Discord Webhook integration banner */}
            <div className="p-3.5 rounded-xl bg-white/5 border border-white/5 text-xs flex flex-col gap-2">
              <div className="flex justify-between items-center">
                <span className="text-[10px] font-bold text-primary-mint flex items-center gap-1">
                  <Settings size={13} />
                  DEVELOPER DISCORD WEBHOOK
                </span>
                <button 
                  type="button"
                  onClick={() => setIsConfiguringWebhook(!isConfiguringWebhook)}
                  className="text-[10px] text-primary-mint hover:underline font-bold cursor-pointer"
                >
                  {isConfiguringWebhook ? 'Cancel' : 'Edit Webhook'}
                </button>
              </div>

              <p className="text-[10px] text-gray-400 leading-relaxed">
                Connect and post real-time rich-embed invoices automatically on purchase submit to your staff channel!
              </p>

              {isConfiguringWebhook ? (
                <div className="flex flex-col gap-2 mt-1 animate-fade-in">
                  <input 
                    type="text"
                    placeholder="Discord Webhook URL"
                    value={webhookUrl}
                    onChange={(e) => setWebhookUrl(e.target.value)}
                    className="w-full px-2.5 py-1.5 bg-black border border-white/10 rounded text-xs text-white font-sans focus:outline-none focus:border-primary-mint"
                  />
                  <div className="flex gap-2">
                    <button 
                      type="button"
                      onClick={handleSaveWebhook}
                      className="flex-1 py-1 bg-primary-mint hover:bg-white text-emerald-bg font-extrabold rounded text-[10px] cursor-pointer"
                    >
                      Save Webhook
                    </button>
                    {webhookUrl && (
                      <button 
                        type="button"
                        onClick={handleTestWebhook}
                        disabled={testSent}
                        className="px-2.5 py-1 bg-white/5 hover:bg-white/10 text-white border border-white/10 font-medium rounded text-[10px] cursor-pointer"
                      >
                        {testSent ? 'Sent!' : 'Test'}
                      </button>
                    )}
                  </div>
                </div>
              ) : (
                <div className="flex justify-between items-center bg-black/60 p-2.5 rounded border border-white/5 text-[10px]">
                  <span className="text-gray-400 truncate max-w-[150px]">
                    Webhook: {webhookUrl ? '✅ Configured' : '❌ Not Configured'}
                  </span>
                  {webhookUrl && (
                    <button 
                      type="button"
                      onClick={handleTestWebhook}
                      className="text-[10px] text-primary-mint font-bold hover:underline cursor-pointer"
                    >
                      Test Dispatch
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
