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
        variant === 'overlay' ? 'bg-[#070a11]/90 backdrop-blur-md' : 'bg-[#070a11]'
      } text-white selection:bg-blue-500/30`}
    >
      {/* Background Subtle Gradient Blobs */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl pointer-events-none animate-pulse" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-indigo-600/10 rounded-full blur-2xl pointer-events-none" />

      <div className="relative flex flex-col items-center max-w-sm px-6 text-center">
        {/* Animated Brand Emblem & Ring */}
        <div className="relative mb-6 flex items-center justify-center">
          <motion.div
            className="absolute inset-0 rounded-2xl bg-gradient-to-r from-blue-500/20 via-indigo-500/20 to-purple-500/20 blur-xl"
            animate={{ scale: [0.9, 1.1, 0.9], opacity: [0.4, 0.8, 0.4] }}
            transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4 }}
            className="relative p-4 rounded-2xl bg-[#0d121f] border border-blue-500/30 shadow-2xl shadow-blue-500/10"
          >
            <Logo size="lg" showText={false} />
          </motion.div>
        </div>

        {/* Brand Name Header */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="flex items-center gap-1.5 mb-3"
        >
          <span className="text-lg font-black tracking-widest text-white uppercase font-sans">
            VIN<span className="text-blue-400">-CORP</span>
          </span>
          <span className="bg-blue-500/20 text-blue-300 border border-blue-500/40 text-[9px] font-black px-1.5 py-0.5 rounded tracking-widest uppercase">
            AI TRADING
          </span>
        </motion.div>

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
          className="text-xs text-gray-400 max-w-xs leading-relaxed mb-6"
        >
          {subtext}
        </motion.p>

        {/* High-Precision Loading Bar */}
        <div className="w-48 h-1.5 bg-gray-800/80 rounded-full overflow-hidden relative border border-white/5">
          <motion.div
            className="h-full bg-gradient-to-r from-blue-500 via-indigo-500 to-emerald-400 rounded-full"
            animate={{
              x: ['-100%', '100%']
            }}
            transition={{
              duration: 1.5,
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
