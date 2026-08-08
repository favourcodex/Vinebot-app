/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Shield, Cpu, Activity, CheckCircle2, ChevronRight, HelpCircle, ArrowRight, Layers, Loader2, Sparkles, Server } from 'lucide-react';
import chromeLiquidHero from '../assets/images/chrome_liquid_hero_1786178289443.jpg';
import { Logo } from './common/Logo';
import { Navbar } from './Navbar';
import { useAuth } from './AuthContext';

interface LandingPageProps {
  onNavigate: (route: string) => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onNavigate }) => {
  const { state, apiRequest } = useAuth();
  const [activeFaq, setActiveFaq] = useState<number | null>(null);
  const [contactForm, setContactForm] = useState({ name: '', email: '', message: '' });
  const [contactSuccess, setContactSuccess] = useState(false);
  const [showCookieConsent, setShowCookieConsent] = useState(() => !localStorage.getItem('vinebot_cookie_consent'));
  const [showCookieSettingsInfo, setShowCookieSettingsInfo] = useState(false);
  const [loadingPlanIndex, setLoadingPlanIndex] = useState<number | null>(null);

  const handleAcceptCookies = () => {
    localStorage.setItem('vinebot_cookie_consent', 'accepted');
    setShowCookieConsent(false);
  };

  const toggleFaq = (index: number) => {
    setActiveFaq(activeFaq === index ? null : index);
  };

  const handleContactSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!contactForm.name || !contactForm.email || !contactForm.message) return;
    setContactSuccess(true);
    setContactForm({ name: '', email: '', message: '' });
    setTimeout(() => setContactSuccess(false), 5000);
  };

  const features = [
    {
      icon: <Shield className="w-6 h-6 text-white" />,
      title: "AES-256-GCM Cryptographic Vault",
      description: "Your MetaTrader 5 login credentials are encrypted at the database layer. No cleartext credentials ever enter runtime logs or network caches."
    },
    {
      icon: <Cpu className="w-6 h-6 text-white" />,
      title: "Automated VPS Execution",
      description: "Dedicated low-latency Windows Server instances host and run your specialized expert advisor bot 24/5."
    },
    {
      icon: <Activity className="w-6 h-6 text-white" />,
      title: "Intelligent Risk Management",
      description: "Trading algorithms dynamically monitor drawdown levels and use tight trailing stops to secure equity without manual intervention."
    },
    {
      icon: <Layers className="w-6 h-6 text-white" />,
      title: "Enterprise Terminal Tracking",
      description: "Observe real-time activation updates through our step-by-step terminal progression timeline with live VPS state management."
    }
  ];

  const pricingPlans = [
    {
      id: "plan-premium-month",
      name: "Vinebot Pro Access",
      price: 100,
      subLabel: null,
      interval: "mo",
      badge: "AUTOMATED EA LICENSE",
      description: "Complete automated MetaTrader 5 (MT5) bot access. Includes low-latency server allocation, automated expert execution, and trailing risk management.",
      features: [
        "Up to 3 Linked MT5 Accounts",
        "Advanced Drawdown Safeguards",
        "Dedicated VPS Hosting Included",
        "Low-Latency Server Node Allocation",
        "24/7 Standard Support"
      ],
      popular: false,
      buttonText: "GET STARTED"
    },
    {
      id: "plan-vip-month",
      name: "Vinebot VIP Unlimited",
      price: 200,
      subLabel: "+ 20% Profit Share",
      interval: "mo",
      badge: "VIP UNLIMITED ACCESS",
      description: "Unlimited automated MetaTrader 5 bot access. Includes high-frequency trading strategies and priority VIP server infrastructure.",
      features: [
        "Unlimited Linked MT5 Accounts",
        "High-Frequency Bot Strategies",
        "Priority Dedicated VPS Instance",
        "20% Monthly Profit Share Agreement",
        "1-on-1 VIP Setup & Telegram Priority Support"
      ],
      popular: true,
      buttonText: "GET VIP ACCESS"
    }
  ];

  const handlePlanCheckout = async (planIndex: number) => {
    const plan = pricingPlans[planIndex];
    if (!state.isAuthenticated) {
      onNavigate('/register');
      return;
    }

    setLoadingPlanIndex(planIndex);
    try {
      const res = await apiRequest<{ url?: string; authorization_url?: string; checkoutUrl?: string }>('/api/payments/checkout', {
        method: 'POST',
        body: JSON.stringify({ planId: plan.id })
      });

      const redirectUrl = res.authorization_url || res.data?.authorization_url || res.url || res.data?.url || res.data?.checkoutUrl;
      if ((res.success || redirectUrl) && redirectUrl) {
        window.location.href = redirectUrl;
        return;
      } else {
        console.error('Checkout failed:', res.error || res.message);
      }
    } catch (err) {
      console.error('Checkout error:', err);
    } finally {
      setLoadingPlanIndex(null);
    }

    onNavigate('/dashboard');
  };

  const faqs = [
    {
      q: "What is Vinebot and how does it execute trades?",
      a: "Vinebot is an automated trading-as-a-service (TaaS) software platform. Once you register, purchase a subscription, and input your MT5 details, our expert server team hosts and configures a private Expert Advisor (EA) bot on low-latency virtual servers to run on your behalf."
    },
    {
      q: "Can I control the trading bot's parameters or pairs directly?",
      a: "No. Vinebot is fully automated and parameters are carefully structured, updated, and deployed by our team of quantitative developers to protect subscribers from excessive risk."
    },
    {
      q: "How secure are my MetaTrader 5 connection credentials?",
      a: "We prioritize security above all else. Your MT5 account passwords are encrypted using AES-256-GCM. The encryption key resides in a secure server vault."
    },
    {
      q: "Can I cancel my subscription or remove my MT5 account at any time?",
      a: "Yes. You can manage and schedule subscription cancellations directly from your Billing tab at any time."
    }
  ];

  return (
    <div className="bg-[#050505] text-neutral-200 min-h-screen font-sans relative overflow-hidden selection:bg-white selection:text-black" id="landing-page">
      {/* Navbar Header */}
      <Navbar onNavigate={onNavigate} />

      {/* HERO SECTION (MATCHING ATTACHED REFERENCE TEMPLATE) */}
      <section className="relative overflow-hidden pt-12 sm:pt-16 lg:pt-20 pb-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
          
          {/* LEFT COLUMN: BADGE, HEADLINE, DESCRIPTION, CTAS */}
          <motion.div 
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            className="lg:col-span-7 flex flex-col items-start text-left"
          >
            {/* Pill Badge */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#121212] border border-[#262626] text-neutral-300 text-xs font-semibold mb-6">
              <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
              <span>VIN-CORP AI TRADING SYSTEMS</span>
            </div>

            {/* Main High-Contrast Headline */}
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-white leading-[1.1]">
              AI-Driven Solutions for Automated Trading
            </h1>

            {/* Concise Subtext */}
            <p className="mt-6 text-base sm:text-lg text-neutral-400 max-w-2xl leading-relaxed">
              Vin-Corp is designed with precision to provide institutional-grade automated trading systems. Connect your MT5 accounts, sit back, and let high-frequency cloud algorithms execute on your behalf.
            </p>

            {/* Crisp CTA Buttons */}
            <div className="mt-8 flex flex-col sm:flex-row items-stretch sm:items-center gap-4 w-full sm:w-auto">
              <button 
                id="hero-start-btn"
                onClick={() => onNavigate('/register')}
                className="px-8 py-3.5 bg-white text-black font-bold text-sm rounded-lg hover:bg-neutral-200 transition-all shadow-xl flex items-center justify-center gap-2 cursor-pointer uppercase tracking-wider"
              >
                Get Started <ArrowRight className="w-4 h-4" />
              </button>
              <a 
                href="#features"
                onClick={(e) => { e.preventDefault(); const el = document.querySelector('#features'); if (el) el.scrollIntoView({ behavior: 'smooth' }); }}
                className="px-8 py-3.5 bg-[#121212] text-neutral-200 font-semibold text-sm rounded-lg border border-[#262626] hover:bg-[#1a1a1a] hover:text-white transition-all text-center cursor-pointer"
              >
                Explore Features
              </a>
            </div>
          </motion.div>

          {/* RIGHT COLUMN: 3D METALLIC LIQUID GRAPHIC (MATCHING REFERENCE TEMPLATE) */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.9, x: 30 }}
            animate={{ opacity: 1, scale: 1, x: 0 }}
            transition={{ duration: 0.7, ease: "easeOut", delay: 0.1 }}
            className="lg:col-span-5 relative flex justify-center items-center"
          >
            <div className="relative w-full max-w-md aspect-square rounded-3xl overflow-hidden border border-[#262626] bg-[#0a0a0a] p-2 shadow-2xl shadow-black">
              <img 
                src={chromeLiquidHero} 
                alt="3D Metallic Chrome Liquid Graphic" 
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover rounded-2xl filter brightness-105 contrast-110 transform hover:scale-105 transition-transform duration-700"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#050505] via-transparent to-transparent opacity-40 pointer-events-none" />
            </div>
          </motion.div>

        </div>

        {/* METRIC STAT BAR UNDERNEATH (MATCHING TEMPLATE) */}
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="mt-16 sm:mt-20 pt-8 border-t border-[#262626] grid grid-cols-1 sm:grid-cols-3 gap-6 sm:gap-0 text-center sm:text-left"
        >
          <div className="sm:pr-8 sm:border-r border-[#262626]">
            <p className="text-3xl sm:text-4xl font-extrabold text-white font-mono">380+</p>
            <p className="text-xs font-semibold text-neutral-400 mt-1 uppercase tracking-wider">Active Systems</p>
          </div>
          <div className="sm:px-8 sm:border-r border-[#262626]">
            <p className="text-3xl sm:text-4xl font-extrabold text-white font-mono">230+</p>
            <p className="text-xs font-semibold text-neutral-400 mt-1 uppercase tracking-wider">Institutional Clients</p>
          </div>
          <div className="sm:pl-8">
            <p className="text-3xl sm:text-4xl font-extrabold text-white font-mono">$230M+</p>
            <p className="text-xs font-semibold text-neutral-400 mt-1 uppercase tracking-wider">Executed Volume</p>
          </div>
        </motion.div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 bg-[#0a0a0a] border-y border-[#262626]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div 
            initial={{ opacity: 0, y: 25 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-50px" }}
            transition={{ duration: 0.5 }}
            className="text-center max-w-3xl mx-auto"
          >
            <h2 className="text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
              Engineered for absolute server safety & precision
            </h2>
            <p className="mt-4 text-neutral-400 text-base">
              Vin-Corp provides structured parameters deployed on dedicated containers, minimizing slippage and maximizing risk discipline.
            </p>
          </motion.div>

          <div className="mt-16 grid grid-cols-1 md:grid-cols-2 gap-8">
            {features.map((f, i) => (
              <motion.div 
                key={i} 
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-50px" }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
                className="bg-[#121212] border border-[#262626] rounded-2xl p-8 hover:border-neutral-600 transition-all duration-300 shadow-md"
              >
                <div className="w-12 h-12 bg-[#1a1a1a] rounded-xl flex items-center justify-center mb-6 border border-[#262626]">
                  {f.icon}
                </div>
                <h3 className="text-lg font-bold text-white mb-2">{f.title}</h3>
                <p className="text-neutral-400 text-sm leading-relaxed">{f.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <motion.div 
          initial={{ opacity: 0, y: 25 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-50px" }}
          transition={{ duration: 0.5 }}
          className="text-center max-w-3xl mx-auto mb-16"
        >
          <h2 className="text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
            Select an automated subscription package
          </h2>
          <p className="mt-4 text-neutral-400">
            No long contracts, cancel at any time. Bot activation processes within hours of subscription.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto">
          {pricingPlans.map((plan, i) => (
            <motion.div 
              key={i} 
              initial={{ opacity: 0, y: 35 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.5, delay: i * 0.15 }}
              className={`bg-[#121212] border rounded-2xl p-8 flex flex-col justify-between relative transition-all duration-300 w-full ${
                plan.popular 
                  ? 'border-white shadow-2xl bg-[#161616]' 
                  : 'border-[#262626] hover:border-neutral-600'
              }`}
            >
              <span className={`absolute -top-3.5 left-1/2 -translate-x-1/2 px-3.5 py-1 text-[10px] font-extrabold rounded-full tracking-wider uppercase whitespace-nowrap shadow-md ${
                plan.popular 
                  ? 'bg-white text-black font-extrabold' 
                  : 'bg-[#1a1a1a] border border-[#262626] text-neutral-300'
              }`}>
                {plan.badge}
              </span>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-xl font-bold text-white">{plan.name}</h3>
                  {plan.popular && (
                    <span className="text-black bg-white text-[10px] font-extrabold px-2 py-0.5 rounded uppercase">VIP</span>
                  )}
                </div>
                
                <p className="text-neutral-400 text-xs leading-relaxed mb-6 min-h-[40px]">{plan.description}</p>
                
                <div className="flex items-baseline flex-wrap gap-2 mb-6 bg-[#0a0a0a] p-4 rounded-xl border border-[#262626]">
                  <span className="text-4xl font-extrabold text-white">${plan.price}</span>
                  <span className="text-neutral-400 text-sm">/ {plan.interval}</span>
                  {plan.subLabel && (
                    <span className="ml-auto text-xs font-bold text-white bg-neutral-800 px-2.5 py-1 rounded-md border border-neutral-700">
                      {plan.subLabel}
                    </span>
                  )}
                </div>

                <ul className="space-y-3.5 border-t border-[#262626] pt-6">
                  {plan.features.map((feat, idx) => (
                    <li key={idx} className="flex items-start gap-2.5 text-xs text-neutral-300">
                      <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5 text-white" />
                      <span>{feat}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <button 
                id={`plan-subscribe-${i}`}
                onClick={() => handlePlanCheckout(i)}
                disabled={loadingPlanIndex === i}
                className={`mt-8 w-full py-3.5 rounded-lg text-xs font-bold tracking-wider uppercase transition-all flex items-center justify-center gap-2 cursor-pointer ${
                  plan.popular 
                    ? 'bg-white text-black hover:bg-neutral-200 font-extrabold shadow-lg' 
                    : 'bg-[#1a1a1a] text-white border border-[#262626] hover:bg-[#222222]'
                }`}
              >
                {loadingPlanIndex === i ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" /> Redirecting to Checkout...
                  </>
                ) : (
                  <>
                    {plan.buttonText} <ChevronRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </motion.div>
          ))}
        </div>
      </section>

      {/* FAQ Section */}
      <section id="faq" className="py-20 bg-[#0a0a0a] border-t border-[#262626]">
        <motion.div 
          initial={{ opacity: 0, y: 25 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-50px" }}
          transition={{ duration: 0.5 }}
          className="max-w-4xl mx-auto px-4 sm:px-6"
        >
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold tracking-tight text-white">Frequently Asked Questions</h2>
            <p className="text-neutral-400 text-sm mt-2">Find clarity on our billing, security protocols, and platform architecture.</p>
          </div>

          <div className="space-y-4">
            {faqs.map((faq, idx) => (
              <div 
                key={idx} 
                className="bg-[#121212] border border-[#262626] rounded-xl overflow-hidden transition-all"
              >
                <button 
                  onClick={() => toggleFaq(idx)}
                  className="w-full text-left p-5 flex items-center justify-between text-white font-medium hover:bg-[#1a1a1a] transition-colors gap-4"
                >
                  <span className="text-sm sm:text-base flex items-center gap-2.5">
                    <HelpCircle className="w-5 h-5 text-neutral-400 shrink-0" />
                    {faq.q}
                  </span>
                  <span className="text-white shrink-0 text-xl font-bold">
                    {activeFaq === idx ? '-' : '+'}
                  </span>
                </button>
                {activeFaq === idx && (
                  <div className="p-5 border-t border-[#262626] bg-[#0a0a0a] text-sm text-neutral-400 leading-relaxed">
                    {faq.a}
                  </div>
                )}
              </div>
            ))}
          </div>
        </motion.div>
      </section>

      {/* Contact Section */}
      <section id="contact" className="py-24 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto">
        <motion.div 
          initial={{ opacity: 0, y: 25 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-50px" }}
          transition={{ duration: 0.5 }}
          className="bg-[#121212] border border-[#262626] rounded-2xl p-8 sm:p-12 relative overflow-hidden"
        >
          <div className="text-center mb-8">
            <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">Need assistance?</h2>
            <p className="text-neutral-400 text-sm mt-2">Our technical operations division is on standby to resolve integration or billing queries.</p>
          </div>

          {contactSuccess && (
            <div className="mb-6 bg-neutral-900 border border-neutral-700 text-white p-4 rounded-xl text-xs flex items-center gap-2.5">
              <CheckCircle2 className="w-5 h-5" />
              <span>Your request has been received. Our operations team will respond to your registered email shortly.</span>
            </div>
          )}

          <form onSubmit={handleContactSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-neutral-400 mb-1.5">Full Name</label>
                <input 
                  type="text" 
                  value={contactForm.name}
                  onChange={e => setContactForm({...contactForm, name: e.target.value})}
                  placeholder="e.g. Alexis Carter" 
                  className="w-full bg-[#0a0a0a] border border-[#262626] rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-white transition-colors"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-neutral-400 mb-1.5">Email Address</label>
                <input 
                  type="email" 
                  value={contactForm.email}
                  onChange={e => setContactForm({...contactForm, email: e.target.value})}
                  placeholder="alexis@example.com" 
                  className="w-full bg-[#0a0a0a] border border-[#262626] rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-white transition-colors"
                  required
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-neutral-400 mb-1.5">Inquiry Details</label>
              <textarea 
                rows={4} 
                value={contactForm.message}
                onChange={e => setContactForm({...contactForm, message: e.target.value})}
                placeholder="How can we assist you with VPS node routing, EA activation, or enterprise billing?" 
                className="w-full bg-[#0a0a0a] border border-[#262626] rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-white transition-colors resize-none"
                required
              />
            </div>
            <button 
              type="submit"
              className="w-full py-3 bg-white text-black font-bold text-xs tracking-wider rounded-lg hover:bg-neutral-200 transition uppercase"
            >
              Submit Ticket Details
            </button>
          </form>
        </motion.div>
      </section>

      {/* Footer */}
      <footer className="border-t border-[#262626] bg-[#050505] py-12 text-center text-xs text-neutral-500 relative z-10">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2">
            <Logo size="sm" onClick={() => onNavigate('/')} />
          </div>
          <div>
            &copy; 2026 VIN-CORP Systems Inc. All rights reserved.
          </div>
          <div className="flex flex-wrap justify-center gap-4 text-[11px] text-neutral-400 font-mono">
            <span onClick={() => onNavigate('/terms')} className="hover:text-white transition cursor-pointer uppercase">Terms of Use</span>
            <span>&bull;</span>
            <span onClick={() => onNavigate('/privacy')} className="hover:text-white transition cursor-pointer uppercase">Privacy Policy</span>
            <span>&bull;</span>
            <span onClick={() => onNavigate('/cookie-policy')} className="hover:text-white transition cursor-pointer uppercase">Cookie Policy</span>
            <span>&bull;</span>
            <span onClick={() => onNavigate('/risk-disclosure')} className="hover:text-white transition cursor-pointer font-bold uppercase">MT5 Risk Statement</span>
          </div>
        </div>
      </footer>

      {/* Cookie Consent Banner */}
      {showCookieConsent && (
        <div className="fixed bottom-0 left-0 right-0 z-50 p-4 sm:p-6 bg-[#0a0a0a]/95 backdrop-blur-md border-t border-[#262626] shadow-2xl transition-all duration-300">
          <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="space-y-1 text-left md:max-w-3xl">
              <p className="text-xs text-neutral-300 leading-relaxed">
                We use cookies to secure sessions and analyze platform traffic. By using Vin-Corp, you consent to our security token cookies used for authentication protection. 
                <span onClick={() => onNavigate('/cookie-policy')} className="text-white hover:underline cursor-pointer ml-1 font-semibold">Cookie Policy</span>.
              </p>
              {showCookieSettingsInfo && (
                <div className="bg-[#050505] p-3 rounded-lg border border-[#262626] text-[10px] text-neutral-400 mt-2 space-y-1 font-mono">
                  <p className="font-bold text-neutral-300">Active Cookies on Vin-Corp:</p>
                  <p>&bull; <span className="text-white">token</span> (Secure JWT): Session authentication. Mandatory for security.</p>
                  <p>&bull; <span className="text-white">refreshToken</span> (Secure JWT): Extended persistence. Optional but recommended.</p>
                </div>
              )}
            </div>
            <div className="flex gap-3 shrink-0">
              <button 
                onClick={() => setShowCookieSettingsInfo(!showCookieSettingsInfo)} 
                className="px-4 py-2 bg-[#121212] hover:bg-[#1a1a1a] text-white font-semibold text-[10px] tracking-wider rounded-lg uppercase cursor-pointer border border-[#262626] transition"
              >
                Cookie Settings
              </button>
              <button 
                onClick={handleAcceptCookies} 
                className="px-5 py-2 bg-white text-black font-bold text-[10px] tracking-wider rounded-lg uppercase cursor-pointer transition hover:bg-neutral-200"
              >
                Accept All
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
