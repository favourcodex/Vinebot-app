/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';

interface LogoProps {
  className?: string;
  imageClassName?: string;
  size?: 'sm' | 'md' | 'lg';
  showText?: boolean;
  onClick?: () => void;
}

export const Logo: React.FC<LogoProps> = ({
  className = '',
  size = 'md',
  showText = true,
  onClick
}) => {
  const iconDimensions = {
    sm: 'w-6 h-6 sm:w-7 sm:h-7',
    md: 'w-8 h-8 sm:w-9 sm:h-9 lg:w-10 lg:h-10',
    lg: 'w-10 h-10 sm:w-12 sm:h-12 lg:w-14 lg:h-14'
  };

  const textSizes = {
    sm: 'text-[11px] font-black',
    md: 'text-xs sm:text-sm lg:text-base font-black',
    lg: 'text-base sm:text-xl lg:text-2xl font-black'
  };

  return (
    <div 
      onClick={onClick}
      className={`inline-flex items-center gap-2 sm:gap-2.5 select-none shrink-0 ${onClick ? 'cursor-pointer hover:opacity-90 transition-opacity' : ''} ${className}`}
    >
      {/* Precision High-Tech Vector Metallic VIN-CORP 'V' Emblem */}
      <svg 
        className={`${iconDimensions[size]} shrink-0 drop-shadow-[0_4px_16px_rgba(0,0,0,0.6)]`}
        viewBox="0 0 100 100" 
        fill="none" 
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <linearGradient id="vc-badge-bg" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#1e293b" />
            <stop offset="50%" stopColor="#0f172a" />
            <stop offset="100%" stopColor="#020617" />
          </linearGradient>

          <linearGradient id="vc-silver-metallic" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#FFFFFF" />
            <stop offset="30%" stopColor="#E2E8F0" />
            <stop offset="65%" stopColor="#94A3B8" />
            <stop offset="100%" stopColor="#475569" />
          </linearGradient>

          <linearGradient id="vc-cyan-glow" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#38BDF8" />
            <stop offset="50%" stopColor="#60A5FA" />
            <stop offset="100%" stopColor="#2563EB" />
          </linearGradient>

          <linearGradient id="vc-silver-border" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#CBD5E1" stopOpacity="0.9" />
            <stop offset="50%" stopColor="#38BDF8" stopOpacity="0.7" />
            <stop offset="100%" stopColor="#334155" stopOpacity="0.9" />
          </linearGradient>
        </defs>

        {/* Outer Shield Container */}
        <rect x="4" y="4" width="92" height="92" rx="22" fill="url(#vc-badge-bg)" stroke="url(#vc-silver-border)" strokeWidth="2.5" />
        <circle cx="50" cy="50" r="38" stroke="#38BDF8" strokeOpacity="0.15" strokeWidth="1" strokeDasharray="3 3" />

        {/* LEFT ARM OF V: High-Tech Circuit Board Traces & Node Dots */}
        <path d="M 22 24 L 38 66 L 50 82" stroke="url(#vc-silver-metallic)" strokeWidth="8" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M 14 30 L 25 24" stroke="#38BDF8" strokeWidth="2" strokeLinecap="round" />
        <circle cx="14" cy="30" r="2.5" fill="#38BDF8" />
        <path d="M 16 46 L 27 46" stroke="#38BDF8" strokeWidth="2" strokeLinecap="round" />
        <circle cx="16" cy="46" r="2" fill="#38BDF8" />
        <circle cx="28" cy="40" r="1.5" fill="#60A5FA" />

        {/* RIGHT ARM OF V: Candlestick Chart Bars & Upward Arrow */}
        <line x1="57" y1="44" x2="57" y2="70" stroke="#94A3B8" strokeWidth="1.8" />
        <rect x="55" y="50" width="4" height="14" rx="1" fill="url(#vc-cyan-glow)" />

        <line x1="68" y1="30" x2="68" y2="60" stroke="#E2E8F0" strokeWidth="1.8" />
        <rect x="66" y="36" width="4" height="18" rx="1" fill="url(#vc-silver-metallic)" />

        {/* Upward Momentum Arrow Pointing Skyward */}
        <path d="M 50 82 L 64 60 L 78 28 L 84 16" stroke="url(#vc-cyan-glow)" strokeWidth="8" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M 68 16 L 86 14 L 84 32" fill="url(#vc-cyan-glow)" />
      </svg>

      {showText && (
        <div className="flex flex-col leading-none">
          <div className="flex items-center gap-1.5">
            <span className={`font-black tracking-wider text-white uppercase font-sans ${textSizes[size]}`}>
              VIN<span className="text-blue-400">-CORP</span>
            </span>
            <span className="bg-gradient-to-r from-blue-500/20 to-indigo-500/20 text-blue-300 border border-blue-500/30 text-[9px] font-black px-1.5 py-0.5 rounded tracking-widest uppercase">
              EA
            </span>
          </div>
          <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mt-1 font-mono">
            AI TRADING AUTOMATION
          </span>
        </div>
      )}
    </div>
  );
};

export default Logo;
