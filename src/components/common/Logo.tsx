import React, { useState } from 'react';
import { Cpu, Zap, Shield, Sparkles } from 'lucide-react';
import vcLogoAsset from '../../assets/images/vincorp_logo.png';

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
  const [imgError, setImgError] = useState(false);

  // Height configurations based on size
  const heightClasses = {
    sm: 'h-6 sm:h-7',
    md: 'h-7 sm:h-10',
    lg: 'h-9 sm:h-14'
  };

  const iconSizes = {
    sm: 'w-3.5 h-3.5',
    md: 'w-4 h-4 sm:w-5 sm:h-5',
    lg: 'w-6 h-6 sm:w-7 sm:h-7'
  };

  const textSizes = {
    sm: 'text-xs font-bold',
    md: 'text-sm font-bold sm:text-lg sm:font-black',
    lg: 'text-xl font-black sm:text-2xl'
  };

  // Absolute path for deployment consistency + direct bundler import fallback
  const primarySrc = "/assets/vc-logo.png";
  const fallbackSrc = vcLogoAsset || "/logo.png";

  return (
    <div 
      onClick={onClick}
      className={`inline-flex items-center gap-2.5 select-none ${onClick ? 'cursor-pointer hover:opacity-95 transition-opacity' : ''} ${className}`}
    >
      {!imgError ? (
        <div className="inline-flex items-center gap-2.5">
          <img
            src={primarySrc}
            alt="VC / VIN-CORP Vinebot EA"
            className={`${heightClasses[size]} object-contain max-w-full drop-shadow-[0_2px_12px_rgba(59,130,246,0.3)] ${imageClassName}`}
            style={{ mixBlendMode: 'multiply' }}
            onError={(e) => {
              // Try secondary source before switching to text fallback
              const target = e.currentTarget;
              if (target.src !== fallbackSrc && !target.dataset.failedOnce) {
                target.dataset.failedOnce = "true";
                target.src = fallbackSrc;
              } else {
                setImgError(true);
              }
            }}
            referrerPolicy="no-referrer"
          />
          {showText && (
            <div className="flex flex-col leading-none">
              <div className="flex items-center gap-1.5">
                <span className={`font-black tracking-wider text-white uppercase ${textSizes[size]} font-sans`}>
                  VINE<span className="text-indigo-400">BOT</span>
                </span>
                <span className="hidden md:inline-block bg-gradient-to-r from-indigo-500/30 to-blue-500/30 text-indigo-300 border border-indigo-500/40 text-[9px] font-black px-1.5 py-0.5 rounded tracking-widest uppercase">
                  EA
                </span>
              </div>
              <span className="hidden md:block text-[9px] font-bold text-gray-400 uppercase tracking-widest mt-1">
                VIN-CORP Automated MT5
              </span>
            </div>
          )}
        </div>
      ) : (
        /* Unified Fallback Emblem displaying VINEBOT EA */
        <div className="inline-flex items-center gap-2.5">
          <div className="relative flex items-center justify-center">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-700 p-0.5 shadow-lg shadow-indigo-600/30 flex items-center justify-center border border-indigo-400/40">
              <div className="w-full h-full bg-[#080b12] rounded-[10px] flex items-center justify-center font-black text-indigo-400 text-xs tracking-tighter font-mono">
                VC
              </div>
            </div>
            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-emerald-400 rounded-full border-2 border-[#07090d] animate-pulse" />
          </div>

          {showText && (
            <div className="flex flex-col leading-none">
              <div className="flex items-center gap-1.5">
                <span className={`font-black tracking-wider text-white uppercase ${textSizes[size]} font-sans`}>
                  VINE<span className="text-indigo-400">BOT</span>
                </span>
                <span className="hidden md:inline-block bg-gradient-to-r from-indigo-500/30 to-blue-500/30 text-indigo-300 border border-indigo-500/40 text-[9px] font-black px-1.5 py-0.5 rounded tracking-widest uppercase">
                  EA
                </span>
              </div>
              <span className="hidden md:block text-[9px] font-bold text-gray-400 uppercase tracking-widest mt-1">
                VIN-CORP Automated MT5
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Logo;
