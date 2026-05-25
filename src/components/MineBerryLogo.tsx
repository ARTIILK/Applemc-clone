import React from 'react';

interface MineBerryLogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showText?: boolean;
}

export default function MineBerryLogo({ className = '', size = 'md', showText = true }: MineBerryLogoProps) {
  // Determine scale dimensions
  const dimensions = {
    sm: { width: 32, height: 32, textClass: 'text-[9px]' },
    md: { width: 56, height: 56, textClass: 'text-[11px]' },
    lg: { width: 140, height: 140, textClass: 'text-lg md:text-xl' },
    xl: { width: 220, height: 220, textClass: 'text-2xl md:text-3xl' }
  }[size];

  return (
    <div className={`flex flex-col items-center justify-center select-none ${className}`}>
      <div className="relative flex flex-col items-center">
        {/* Glow behind the logo */}
        <div className={`absolute inset-0 bg-primary-mint-container/20 rounded-full blur-[30px] -z-10 transition-all duration-300 ${
          size === 'lg' || size === 'xl' ? 'scale-120 opacity-40' : 'scale-100 opacity-20'
        }`}></div>

        <svg 
          viewBox="0 0 320 260" 
          width={dimensions.width} 
          height={dimensions.height}
          className="transition-transform duration-300 hover:scale-105"
        >
          <defs>
            {/* Ice Cyan front gradients */}
            <linearGradient id="iceCyan" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#e0f2fe" />
              <stop offset="40%" stopColor="#38bdf8" />
              <stop offset="100%" stopColor="#0284c7" />
            </linearGradient>

            {/* 3D shadow depth for MB */}
            <linearGradient id="iceCyanDepth" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#0284c7" />
              <stop offset="100%" stopColor="#0c4a6e" />
            </linearGradient>

            {/* Gold crown gradients */}
            <linearGradient id="crownGold" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#fef08a" />
              <stop offset="50%" stopColor="#eab308" />
              <stop offset="100%" stopColor="#ca8a04" />
            </linearGradient>

            {/* Jewel Gradients */}
            <radialGradient id="rubyJewel" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#f87171" />
              <stop offset="100%" stopColor="#991b1b" />
            </radialGradient>
            <radialGradient id="sapphireJewel" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#60a5fa" />
              <stop offset="100%" stopColor="#1e40af" />
            </radialGradient>
            <radialGradient id="emeraldJewel" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#4ade80" />
              <stop offset="100%" stopColor="#166534" />
            </radialGradient>
          </defs>

          {/* --- 1. MOJANG CROWN (Tilted at -14deg resting on the 'M') --- */}
          <g transform="translate(45, 22) rotate(-14)">
            {/* Base of Crown */}
            <path d="M20,65 L105,65 L105,73 L20,73 Z" fill="#78350f" stroke="#090514" strokeWidth="4" />
            <path d="M23,65 L102,65 L102,70 L23,70 Z" fill="url(#crownGold)" />

            {/* Prongs */}
            <path d="M15,65 L15,35 L33,50 L50,15 L70,50 L88,35 L88,65 Z" fill="#78350f" stroke="#090514" strokeWidth="4" strokeLinejoin="miter" />
            <path d="M18,63 L18,39 L33,51 L51,21 L70,51 L85,39 L85,63 Z" fill="url(#crownGold)" />

            {/* Crown Jewels (Golden circles at tips) */}
            <circle cx="15" cy="35" r="5.5" fill="url(#crownGold)" stroke="#090514" strokeWidth="2.5" />
            <circle cx="51" cy="15" r="7" fill="url(#crownGold)" stroke="#090514" strokeWidth="2.5" />
            <circle cx="88" cy="35" r="5.5" fill="url(#crownGold)" stroke="#090514" strokeWidth="2.5" />

            {/* Red ruby on left prong */}
            <rect x="25" y="48" width="8" height="8" rx="1" transform="rotate(45 29 52)" fill="url(#rubyJewel)" stroke="#090514" strokeWidth="2" />
            {/* Blue sapphire in middle prong */}
            <rect x="47" y="42" width="10" height="10" rx="1.5" transform="rotate(45 52 47)" fill="url(#sapphireJewel)" stroke="#090514" strokeWidth="2" />
            {/* Green emerald on right prong */}
            <rect x="70" y="48" width="8" height="8" rx="1" transform="rotate(45 74 52)" fill="url(#emeraldJewel)" stroke="#090514" strokeWidth="2" />
          </g>

          {/* --- 2. 3D BLOCKY 'M' & 'B' LETTERS --- */}
          {/* Thick Dark stroke backdrop for 3D effect */}
          <g stroke="#050110" strokeWidth="18" strokeLinejoin="miter" fill="#050110">
            <path d="M 35,220 L 35,130 L 65,130 L 85,163 L 105,130 L 135,130 L 135,220 L 110,220 L 110,175 L 85,212 L 60,175 L 60,220 Z" />
            <path d="M 160,130 L 235,130 Q 265,130 265,155 Q 265,170 245,175 Q 275,182 275,200 Q 275,220 235,220 L 160,220 Z" />
          </g>

          {/* 3D Depth Shadow layer */}
          <g fill="url(#iceCyanDepth)">
            <path d="M 40,223 L 40,136 L 68,136 L 85,167 L 102,136 L 130,136 L 130,223 L 112,223 L 112,178 L 85,215 L 58,178 L 58,223 Z" />
            <path d="M 165,134 L 235,134 Q 261,134 261,157 Q 261,172 243,177 Q 271,184 271,202 Q 271,218 235,218 L 165,218 Z" />
          </g>

          {/* Front faces (Glow Ice Cyan) */}
          <g fill="url(#iceCyan)">
            <path d="M 35,214 L 35,130 L 65,130 L 85,163 L 105,130 L 135,130 L 135,214 L 110,214 L 110,170 L 85,207 L 60,170 L 60,214 Z" />
            <path d="M 160,130 L 232,130 Q 256,130 256,153 Q 256,168 238,173 Q 264,179 264,196 Q 264,214 232,214 L 160,214 Z" />
          </g>

          {/* Subtract Holes inside B letter */}
          <g fill="#080310">
            <rect x="182" y="145" width="22" height="15" rx="2" />
            <rect x="182" y="182" width="22" height="18" rx="2" />
          </g>

          {/* Highlight cracks and scratches (Minecraft aesthetic) */}
          <path d="M 45,150 L 52,150 M 115,145 L 122,145 M 210,140 L 220,140 M 115,195 L 122,195 M 240,195 L 246,195" stroke="#ffffff" strokeWidth="2.5" strokeLinecap="round" opacity="0.6" />
        </svg>

        {/* Dynamic Branded text below logo with glowing filter */}
        {showText && (
          <div className={`mt-1 flex items-center justify-center font-extrabold uppercase tracking-widest ${dimensions.textClass}`}>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-sky-400 to-cyan-300 drop-shadow-[0_0_8px_rgba(56,189,248,0.4)]">
              Mine
            </span>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-fuchsia-400 to-purple-400 drop-shadow-[0_0_8px_rgba(217,70,239,0.4)] ml-1">
              Berry
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
