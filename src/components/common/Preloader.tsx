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

      <div className="relative flex flex-col items-center max-w-sm px-6 text-center">
        {/* Animated Brand Logo */}
        <div className="relative mb-8 flex items-center justify-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.92 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4 }}
            className="flex items-center justify-center bg-transparent"
          >
            <Logo size="xl" imageClassName="h-20 sm:h-24 lg:h-28 max-w-[280px] sm:max-w-[340px] mix-blend-screen bg-transparent" />
          </motion.div>
        </div>

        {/* Dynamic Loading Message */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="text-sm font-semibold text-gray-200 tracking-wide mb-1"
        >
          {message}
        </motion.p>
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="text-xs text-neutral-400 max-w-xs leading-relaxed mb-6"
        >
          {subtext}
        </motion.p>

        {/* High-Precision Monochrome Loading Bar */}
        <div className="w-48 h-1 bg-neutral-900 rounded-full overflow-hidden relative border border-neutral-800">
          <motion.div
            className="h-full bg-white rounded-full"
            animate={{
              x: ['-100%', '100%']
            }}
            transition={{
              duration: 1.4,
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
