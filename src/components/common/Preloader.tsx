/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
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
            className="w-[280px] h-[280px] sm:w-[380px] sm:h-[380px] md:w-[480px] md:h-[480px] object-contain drop-shadow-[0_0_35px_rgba(168,85,247,0.35)]"
          />
        </motion.div>

        {/* Subtle animated progress bar indicator */}
        <div className="w-64 sm:w-80 h-2 bg-neutral-900/90 rounded-full overflow-hidden relative border border-neutral-800/80 shadow-inner">
          <motion.div
            className="h-full bg-white rounded-full shadow-[0_0_10px_rgba(255,255,255,0.85)]"
            animate={{ x: ['-100%', '100%'] }}
            transition={{ duration: 11, repeat: Infinity, ease: 'easeInOut' }}
          />
        </div>

        <div className="mt-4 flex items-center gap-2 text-[11px] uppercase tracking-[0.36em] text-neutral-300">
          <span className="w-3 h-3 rounded-full bg-purple-300 animate-pulse" />
          Preparing environment...
        </div>
      </div>
    </motion.div>
  );
};

export default Preloader;
