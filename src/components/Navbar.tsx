import React from 'react';
import { ChevronRight } from 'lucide-react';
import navLogo from '../assets/vincorp_nav_logo.jpeg';
import { useAuth } from './AuthContext';

interface NavbarProps {
  onNavigate: (route: string) => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onNavigate }) => {
  let isAuthenticated = false;
  try {
    const auth = useAuth();
    isAuthenticated = auth.state.isAuthenticated;
  } catch (e) {
    isAuthenticated = !!localStorage.getItem('vinebot_token');
  }

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
    <header className="border-b border-[#262626] bg-[#050505]/90 backdrop-blur-md sticky top-0 z-40 relative w-full">
      <div className="flex items-center justify-between w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        
        {/* LEFT: VC Logo */}
        <div className="flex items-center space-x-3 shrink-0">
          <img
            src={navLogo}
            alt="VIN-CORP"
            referrerPolicy="no-referrer"
            onClick={() => handleNavClick('/')}
            className="h-10 sm:h-12 md:h-14 lg:h-16 w-auto object-contain cursor-pointer"
          />
        </div>

        {/* CENTER: NAV LINKS */}
        <nav className="hidden md:flex items-center space-x-8 text-sm font-medium text-gray-300">
          <a href="#features" onClick={(e) => { e.preventDefault(); handleNavClick('#features'); }} className="hover:text-white transition cursor-pointer">Features</a>
          <a href="#pricing" onClick={(e) => { e.preventDefault(); handleNavClick('#pricing'); }} className="hover:text-white transition cursor-pointer">Pricing</a>
          <a href="#faq" onClick={(e) => { e.preventDefault(); handleNavClick('#faq'); }} className="hover:text-white transition cursor-pointer">FAQ</a>
          <a href="#contact" onClick={(e) => { e.preventDefault(); handleNavClick('#contact'); }} className="hover:text-white transition cursor-pointer">Contact</a>
        </nav>

        {/* RIGHT: AUTH / CTA BUTTONS */}
        <div className="flex items-center space-x-4 shrink-0">
          {isAuthenticated ? (
            <button 
              id="nav-dashboard-btn"
              onClick={() => handleNavClick('/dashboard')}
              className="px-5 py-2.5 text-sm font-semibold bg-white text-black hover:bg-neutral-200 rounded-xl transition-all shadow-md cursor-pointer whitespace-nowrap"
            >
              Dashboard
            </button>
          ) : (
            <button 
              id="nav-login-btn"
              onClick={() => handleNavClick('/login')}
              className="px-4 py-1.5 text-xs sm:text-sm font-semibold text-neutral-200 hover:text-white bg-[#121212] hover:bg-[#1a1a1a] rounded-lg border border-[#262626] transition cursor-pointer whitespace-nowrap"
            >
              Sign In
            </button>
          )}

          {!isAuthenticated && (
            <button 
              id="nav-register-btn"
              onClick={() => handleNavClick('/register')}
              className="hidden lg:inline-flex px-4 py-1.5 text-xs font-bold sm:text-sm bg-white text-black hover:bg-neutral-200 rounded-lg transition-all shadow-md items-center gap-1 cursor-pointer uppercase tracking-wide whitespace-nowrap shrink-0"
            >
              <span>Get Started</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

      </div>
    </header>
  );
};

export default Navbar;
