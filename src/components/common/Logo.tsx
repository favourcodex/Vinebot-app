/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';

interface LogoProps {
  className?: string;
  imageClassName?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
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
    sm: 'h-10 sm:h-12',
    md: 'h-12 sm:h-14 lg:h-16',
    lg: 'h-16 sm:h-20 lg:h-24',
    xl: 'h-24 sm:h-28 lg:h-32'
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
