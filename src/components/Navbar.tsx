import React from 'react';
import { ChevronRight } from 'lucide-react';
import { Logo } from './common/Logo';

interface NavbarProps {
  onNavigate: (route: string) => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onNavigate }) => {
  const handleNavClick = (href: string) => {
    if (href.startsWith('#')) {
      const element = document.querySelector(href);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth' });
      } else {
        onNavigate('/');
      }
    } else {
      onNavigate(href);
    }
  };

  return (
    <header className="border-b border-[#1b202e]/80 bg-[#0c0f17]/90 backdrop-blur-md sticky top-0 z-40 relative w-full">
      <div className="max-w-7xl mx-auto px-2 sm:px-4 lg:px-8 h-14 sm:h-16 flex items-center justify-between w-full">
        
        {/* LEFT: VC Logo + VINEBOT text */}
        <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
          <Logo size="md" showText={true} onClick={() => handleNavClick('/')} />
        </div>

        {/* DESKTOP NAV LINKS (hidden on small screens < 768px, shown on >= 768px) */}
        <nav className="hidden md:flex items-center gap-6 lg:gap-8 text-sm text-gray-400 font-medium">
          <a href="#features" onClick={(e) => { e.preventDefault(); handleNavClick('#features'); }} className="hover:text-white transition cursor-pointer">Features</a>
          <a href="#pricing" onClick={(e) => { e.preventDefault(); handleNavClick('#pricing'); }} className="hover:text-white transition cursor-pointer">Pricing</a>
          <a href="#faq" onClick={(e) => { e.preventDefault(); handleNavClick('#faq'); }} className="hover:text-white transition cursor-pointer">FAQ</a>
          <a href="#contact" onClick={(e) => { e.preventDefault(); handleNavClick('#contact'); }} className="hover:text-white transition cursor-pointer">Contact</a>
        </nav>

        {/* RIGHT: AUTH / CTA BUTTONS (Inline on ALL screens, compact on mobile) */}
        <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
          <button 
            id="nav-login-btn"
            onClick={() => handleNavClick('/login')}
            className="text-xs sm:text-sm px-2 py-1 font-semibold text-gray-300 hover:text-white transition cursor-pointer whitespace-nowrap"
          >
            Log In
          </button>
          <button 
            id="nav-register-btn"
            onClick={() => handleNavClick('/register')}
            className="px-2.5 py-1 text-xs font-medium sm:text-sm sm:font-bold sm:px-4 sm:py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-500 transition-all shadow-md shadow-indigo-600/20 flex items-center gap-1 cursor-pointer uppercase tracking-wide whitespace-nowrap shrink-0"
          >
            <span>Get Started</span>
            <ChevronRight className="w-3 h-3 sm:w-4 sm:h-4" />
          </button>
        </div>

      </div>
    </header>
  );
};

export default Navbar;
