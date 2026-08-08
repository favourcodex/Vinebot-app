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
    sm: 'h-10 md:h-12 w-auto',
    md: 'h-12 md:h-16 w-auto',
    lg: 'h-16 md:h-20 w-auto',
    xl: 'h-24 md:h-32 w-auto'
  };

  return (
    <div 
      onClick={onClick}
      className={`inline-flex items-center gap-2 select-none shrink-0 bg-transparent ${onClick ? 'cursor-pointer hover:opacity-90 transition-opacity' : ''} ${className}`}
    >
      <div className={`relative inline-flex items-center justify-center bg-transparent shrink-0 ${iconDimensions[size]}`}>
        <img 
          src="/vincorp_logo.png"
          alt="VIN-CORP AI TRADING AUTOMATION" 
          referrerPolicy="no-referrer"
          className={`h-full w-auto object-contain bg-transparent filter brightness-100 mix-blend-screen ${imageClassName}`}
        />
      </div>
    </div>
  );
};

export default Logo;
