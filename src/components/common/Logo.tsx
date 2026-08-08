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
  imageClassName = '',
  size = 'md',
  onClick
}) => {
  const iconDimensions = {
    sm: 'h-8 sm:h-9',
    md: 'h-11 sm:h-12 lg:h-14',
    lg: 'h-16 sm:h-20 lg:h-24',
    xl: 'h-20 sm:h-24 lg:h-28'
  };

  return (
    <div 
      onClick={onClick}
      className={`inline-flex items-center gap-2 select-none shrink-0 bg-transparent ${onClick ? 'cursor-pointer hover:opacity-90 transition-opacity' : ''} ${className}`}
    >
      <img 
        src="/vincorp_logo.png"
        alt="VIN-CORP AI TRADING AUTOMATION" 
        referrerPolicy="no-referrer"
        className={`${iconDimensions[size]} w-auto object-contain shrink-0 filter brightness-100 mix-blend-screen bg-transparent ${imageClassName}`}
      />
    </div>
  );
};

export default Logo;
