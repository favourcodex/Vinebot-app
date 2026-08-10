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
    sm: 'w-full max-w-[220px] xs:max-w-[260px] h-10 object-contain object-left lg:h-14 lg:w-auto lg:max-w-none',
    md: 'w-full max-w-[220px] xs:max-w-[260px] h-10 object-contain object-left lg:h-14 lg:w-auto lg:max-w-none',
    lg: 'w-full max-w-[220px] xs:max-w-[260px] h-10 object-contain object-left lg:h-14 lg:w-auto lg:max-w-none',
    xl: 'w-full max-w-[220px] xs:max-w-[260px] h-10 object-contain object-left lg:h-14 lg:w-auto lg:max-w-none',
    '2xl': 'w-full max-w-[220px] xs:max-w-[260px] h-10 object-contain object-left lg:h-14 lg:w-auto lg:max-w-none'
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
