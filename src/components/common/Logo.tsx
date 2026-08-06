/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import vincorpLogo from '../../assets/images/vincorp_logo.png';

interface LogoProps {
  className?: string;
  imageClassName?: string;
  size?: 'sm' | 'md' | 'lg';
  showText?: boolean;
  onClick?: () => void;
}

export const Logo: React.FC<LogoProps> = ({
  className = '',
  imageClassName = '',
  size = 'md',
  showText = true,
  onClick
}) => {
  // Height configurations based on size
  const heightClasses = {
    sm: 'h-7 sm:h-8',
    md: 'h-9 sm:h-11',
    lg: 'h-11 sm:h-16'
  };

  const textSizes = {
    sm: 'text-xs font-bold',
    md: 'text-sm font-bold sm:text-lg sm:font-black',
    lg: 'text-xl font-black sm:text-2xl'
  };

  const primarySrc = vincorpLogo || "/vincorp_logo.png";

  return (
    <div 
      onClick={onClick}
      className={`inline-flex items-center gap-3 select-none ${onClick ? 'cursor-pointer hover:opacity-90 transition-opacity' : ''} ${className}`}
    >
      <img
        src={primarySrc}
        alt="VIN-CORP AI Trading Logo"
        className={`${heightClasses[size]} object-contain max-w-full rounded-md shadow-md shadow-black/40 border border-white/10 ${imageClassName}`}
        referrerPolicy="no-referrer"
        onError={(e) => {
          const target = e.currentTarget;
          if (target.src !== "/logo.png") {
            target.src = "/logo.png";
          }
        }}
      />
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
