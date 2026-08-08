/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { motion } from 'motion/react';
import { Logo } from './Logo';

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
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4 }}
          className="mb-8 flex items-center justify-center bg-transparent"
        >
          <div className="relative inline-flex items-center justify-center bg-transparent h-24 md:h-32 w-auto shrink-0">
            <Logo size="xl" imageClassName="h-full w-auto object-contain mix-blend-screen bg-transparent filter brightness-110" />
          </div>
        </motion.div>

        {/* High-Precision Monochrome Minimalist Progress Bar */}
        <div className="w-56 sm:w-64 h-1 bg-neutral-900/90 rounded-full overflow-hidden relative border border-neutral-800/80 shadow-inner">
          <motion.div
            className="h-full bg-white rounded-full shadow-[0_0_8px_rgba(255,255,255,0.8)]"
            animate={{
              x: ['-100%', '100%']
            }}
            transition={{
              duration: 1.3,
              repeat: Infinity,
              ease: 'easeInOut'
            }}
          />
        </div>
      </div>
    </motion.div>
  );
};

export default Preloader;
