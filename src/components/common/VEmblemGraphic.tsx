import React from 'react';

interface VEmblemGraphicProps {
  className?: string;
  imageClassName?: string;
}

export const VEmblemGraphic: React.FC<VEmblemGraphicProps> = ({
  className = '',
  imageClassName = 'w-full h-full object-contain'
}) => {
  return (
    <div className={`relative overflow-hidden flex items-center justify-center pointer-events-none select-none ${className}`}>
      {/* Background Subtle Circuit Trace Lines (matching screenshot) */}
      <svg 
        className="absolute inset-0 w-full h-full opacity-25 pointer-events-none" 
        viewBox="0 0 500 350" 
        fill="none" 
        xmlns="http://www.w3.org/2000/svg"
      >
        <path d="M0 120 H140 L190 70 H320 L380 130 H500" stroke="white" strokeWidth="1" strokeDasharray="3 3" />
        <path d="M0 220 H180 L230 270 H360 L410 210 H500" stroke="white" strokeWidth="1.5" />
        <path d="M80 350 V240 L130 190 V80 H220" stroke="white" strokeWidth="1" />
        <path d="M280 -10 V90 L340 150 V280" stroke="white" strokeWidth="1" />
        <path d="M120 40 H200 L250 90 V180" stroke="white" strokeWidth="1" strokeDasharray="2 4" />
        <circle cx="190" cy="70" r="3.5" fill="white" />
        <circle cx="230" cy="270" r="3.5" fill="white" />
        <circle cx="340" cy="150" r="3.5" fill="white" />
        <circle cx="130" cy="190" r="3.5" fill="white" />
        <circle cx="250" cy="90" r="3" fill="white" />
      </svg>

      {/* Crisp White Standalone V Emblem Image (NO TEXT) */}
      <div className="relative z-10 w-full h-full flex items-center justify-center">
        <img 
          src="/vincorp_v_emblem.png" 
          alt="VIN-CORP V Emblem" 
          referrerPolicy="no-referrer"
          className={`filter brightness-125 contrast-125 mix-blend-screen bg-transparent ${imageClassName}`}
        />
      </div>
    </div>
  );
};

export default VEmblemGraphic;
