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
    sm: 'w-7 h-7',
    md: 'w-9 h-9 sm:w-10 sm:h-10',
    lg: 'w-11 h-11 sm:w-14 sm:h-14'
  };

  const textSizes = {
    sm: 'text-xs font-bold',
    md: 'text-sm font-bold sm:text-lg sm:font-black',
    lg: 'text-lg font-black sm:text-2xl'
  };

  return (
    <div 
      onClick={onClick}
      className={`inline-flex items-center gap-3 select-none ${onClick ? 'cursor-pointer hover:opacity-90 transition-opacity' : ''} ${className}`}
    >
      {/* Vector High-Tech Metallic Emblem */}
      <svg 
        className={`${iconDimensions[size]} shrink-0 drop-shadow-[0_4px_12px_rgba(0,0,0,0.5)]`}
        viewBox="0 0 100 100" 
        fill="none" 
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <linearGradient id="vc-bg" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#1e293b" />
            <stop offset="50%" stopColor="#0f172a" />
            <stop offset="100%" stopColor="#020617" />
          </linearGradient>

          <linearGradient id="vc-silver" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#FFFFFF" />
            <stop offset="35%" stopColor="#E2E8F0" />
            <stop offset="70%" stopColor="#94A3B8" />
            <stop offset="100%" stopColor="#64748B" />
          </linearGradient>

          <linearGradient id="vc-cyan" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#38BDF8" />
            <stop offset="100%" stopColor="#2563EB" />
          </linearGradient>

          <linearGradient id="vc-border" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#94A3B8" stopOpacity="0.8" />
            <stop offset="50%" stopColor="#38BDF8" stopOpacity="0.6" />
            <stop offset="100%" stopColor="#1E293B" stopOpacity="0.8" />
          </linearGradient>
        </defs>

        {/* Outer Shield / Badge Container */}
        <rect x="4" y="4" width="92" height="92" rx="24" fill="url(#vc-bg)" stroke="url(#vc-border)" strokeWidth="3" />
        <circle cx="50" cy="50" r="38" stroke="#38BDF8" strokeOpacity="0.12" strokeWidth="1" strokeDasharray="3 3" />

        {/* High-Tech Circuit Lines (Left Arm of V) */}
        <path d="M 22 26 L 38 68 L 50 82" stroke="url(#vc-silver)" strokeWidth="8" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M 15 32 L 25 26" stroke="#38BDF8" strokeWidth="2.5" strokeLinecap="round" />
        <circle cx="15" cy="32" r="2.5" fill="#38BDF8" />
        <path d="M 18 48 L 28 48" stroke="#38BDF8" strokeWidth="2" />
        <circle cx="18" cy="48" r="2" fill="#38BDF8" />

        {/* Candlestick Trading Bars */}
        <line x1="58" y1="46" x2="58" y2="70" stroke="#94A3B8" strokeWidth="2" />
        <rect x="56" y="52" width="4" height="12" rx="1" fill="url(#vc-cyan)" />

        <line x1="68" y1="32" x2="68" y2="60" stroke="#CBD5E1" strokeWidth="2" />
        <rect x="66" y="38" width="4" height="16" rx="1" fill="url(#vc-silver)" />

        {/* Right Arm Upward Momentum Arrow */}
        <path d="M 50 82 L 64 62 L 78 30 L 84 18" stroke="url(#vc-cyan)" strokeWidth="8" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M 70 18 L 86 16 L 84 32" fill="url(#vc-cyan)" />
      </svg>

      {showText && (
        <div className="flex flex-col leading-none">
          <div className="flex items-center gap-1.5">
            <span className={`font-black tracking-wider text-white uppercase ${textSizes[size]} font-sans`}>
              VINE<span className="text-blue-400">BOT</span>
            </span>
            <span className="hidden md:inline-block bg-gradient-to-r from-blue-500/30 to-indigo-500/30 text-blue-300 border border-blue-500/40 text-[9px] font-black px-1.5 py-0.5 rounded tracking-widest uppercase">
              EA
            </span>
          </div>
          <span className="hidden md:block text-[9px] font-bold text-gray-400 uppercase tracking-widest mt-1 font-mono">
            VIN-CORP AI TRADING
          </span>
        </div>
      )}
    </div>
  );
};

export default Logo;
