/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import preloaderLogo from '../../assets/vincorp_preloader_logo.png';

interface PreloaderProps {
  message?: string;
  subtext?: string;
  variant?: 'fullscreen' | 'overlay';
}

export const Preloader: React.FC<PreloaderProps> = ({
  message = 'Loading VIN-CORP Systems...',
  subtext = 'Connecting to high-frequency trading & session nodes',
  variant = 'fullscreen'
}) => {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const totalDuration = 11000;
    const stepInterval = 100;
    const increment = 100 / (totalDuration / stepInterval);
    const timer = window.setInterval(() => {
      setProgress((current) => {
        const next = Math.min(100, current + increment);
        if (next >= 100) {
          window.clearInterval(timer);
        }
        return next;
      });
    }, stepInterval);

    return () => window.clearInterval(timer);
  }, []);

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.25 }}
      className={`fixed inset-0 z-50 flex flex-col items-center justify-center ${
        variant === 'overlay' ? 'bg-[#050505]/95 backdrop-blur-md' : 'bg-[#050505]'
      } text-white selection:bg-white/20`}
    >
      {/* Background Subtle Monochrome Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-white/5 rounded-full blur-3xl pointer-events-none animate-pulse" />

      <div className="relative flex flex-col items-center max-w-md px-6 text-center">
        {/* Animated Brand Logo Container */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4 }}
          className="mb-8 flex items-center justify-center bg-transparent"
        >
          <img
            src={preloaderLogo}
            alt="VIN-CORP AI TRADING AUTOMATION"
            referrerPolicy="no-referrer"
            className="w-72 h-72 sm:w-96 sm:h-96 object-contain animate-pulse"
          />
        </motion.div>

        <div className="w-64 md:w-80 h-1.5 bg-white/10 rounded-full overflow-hidden">
          <div
            className="h-full bg-white rounded-full shadow-[0_0_12px_rgba(255,255,255,0.8)] transition-all duration-300 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>
    </motion.div>
  );
};

export default Preloader;
