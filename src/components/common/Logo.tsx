/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import fullLogo from '../../assets/vincorp_full_logo.png';

interface LogoProps {
  className?: string;
  imageClassName?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  onClick?: () => void;
}

export const Logo: React.FC<LogoProps> = ({
  className = '',
  imageClassName = '',
  size = 'md',
  onClick
}) => {
  const iconDimensions = {
    sm: 'h-12 sm:h-16 md:h-20 max-h-[80px] w-auto object-contain',
    md: 'h-12 sm:h-16 md:h-20 max-h-[80px] w-auto object-contain',
    lg: 'h-12 sm:h-16 md:h-20 max-h-[80px] w-auto object-contain',
    xl: 'h-12 sm:h-16 md:h-20 max-h-[80px] w-auto object-contain',
    '2xl': 'h-12 sm:h-16 md:h-20 max-h-[80px] w-auto object-contain'
  };

  return (
    <div 
      onClick={onClick}
      className={`inline-flex items-center gap-2 select-none shrink-0 bg-transparent ${onClick ? 'cursor-pointer hover:opacity-90 transition-opacity' : ''} ${className}`}
    >
      <div className={`relative inline-flex items-center justify-center bg-transparent shrink-0 ${iconDimensions[size] || iconDimensions.md}`}>
        <img 
          src={fullLogo}
          alt="VIN-CORP AI TRADING AUTOMATION" 
          referrerPolicy="no-referrer"
          className={`h-full w-auto object-contain bg-transparent filter brightness-100 mix-blend-screen ${imageClassName}`}
        />
      </div>
    </div>
  );
};

export default Logo;
