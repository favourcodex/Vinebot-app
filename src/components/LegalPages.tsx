import React from 'react';
import { ArrowLeft, ShieldAlert, Scale, HelpCircle, FileText, CheckCircle2 } from 'lucide-react';

interface LegalLayoutProps {
  title: string;
  icon: React.ReactNode;
  onBack: () => void;
  children: React.ReactNode;
}

const LegalLayout: React.FC<LegalLayoutProps> = ({ title, icon, onBack, children }) => {
  return (
    <div className="bg-[#07090d] min-h-screen text-gray-200 py-12 px-4 sm:px-6 lg:px-8 font-sans relative">
      <div className="absolute top-0 left-0 right-0 h-96 bg-gradient-to-b from-indigo-500/5 via-transparent to-transparent pointer-events-none" />
      <div className="max-w-4xl mx-auto relative">
        <button
          onClick={onBack}
          className="inline-flex items-center gap-1.5 text-xs text-gray-400 hover:text-white mb-8 transition cursor-pointer"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Return to Vinebot
        </button>

        <div className="flex items-center gap-3 border-b border-[#1b202e] pb-6 mb-8">
          <div className="p-2.5 bg-indigo-500/10 border border-indigo-500/20 rounded-xl text-indigo-400">
            {icon}
          </div>
          <div>
            <h1 className="text-2xl font-extrabold text-white tracking-tight uppercase">{title}</h1>
            <p className="text-[10px] text-gray-500 tracking-wider uppercase font-mono mt-0.5">Official Platform Policy</p>
          </div>
        </div>

        <div className="bg-[#0e1118] border border-[#1b202e] rounded-2xl p-6 sm:p-10 shadow-xl space-y-6 text-sm leading-relaxed text-gray-300">
          {children}
        </div>

        <div className="text-center mt-12 text-[10px] text-gray-600 uppercase font-mono tracking-wider">
          Vinebot Compliance Console &bull; Security Operations Guard
        </div>
      </div>
    </div>
  );
};

export const TermsPage: React.FC<{ onBack: () => void }> = ({ onBack }) => {
  return (
    <LegalLayout title="Terms & Conditions" icon={<Scale className="w-6 h-6" />} onBack={onBack}>
      <div className="space-y-6">
        <div className="border-b border-[#1b202e] pb-4 mb-4">
          <h2 className="text-lg font-bold text-white uppercase font-mono">TERMS AND CONDITIONS OF USE: VINEBOT</h2>
          <p className="text-xs text-indigo-400 mt-1">Effective Date: July 20, 2026</p>
        </div>

        <div className="space-y-4">
          <h3 className="font-bold text-white text-sm uppercase tracking-wide">1. NO FINANCIAL OR INVESTMENT ADVICE: Informational Tool Only</h3>
          <p className="text-gray-300">
            Vinebot is a software development and algorithmic technology provider. Vinebot is not a registered broker-dealer, financial advisor, investment analyst, or tax planner. All software, tools, signals, parameters, and documentation provided are strictly for informational and educational purposes. Vinebot does not solicit, recommend, or provide investment advice. Any automated trading settings, indicators, or strategies you configure are executed solely at your own discretion and risk.
          </p>
        </div>

        <div className="space-y-4">
          <h3 className="font-bold text-white text-sm uppercase tracking-wide">2. ACKNOWLEDGMENT OF HIGH-RISK TRADING</h3>
          <p className="text-gray-300">
            Trading financial instruments, including but not limited to foreign exchange (Forex), contracts for difference (CFDs), commodities, indices, and cryptocurrencies, involves extreme risk of capital loss. High-frequency or automated trading executes positions rapidly, which can exacerbate losses under volatile market conditions. You acknowledge that you may lose all of your deposited capital and potentially incur liabilities exceeding your account balance. Past performance is no guarantee of future results.
          </p>
        </div>

        <div className="space-y-4">
          <h3 className="font-bold text-white text-sm uppercase tracking-wide">3. ASSUMPTION OF OPERATIONAL AND TECHNICAL RISK</h3>
          <p className="text-gray-300">
            By utilizing Vinebot's cloud hosting, VPS, or MetaTrader 5 (MT5) execution bridging technology, you assume all operational and technical risks. This includes, but is not limited to, API connection latency, internet connection failures, VPS downtime, third-party software bugs, server crashes, execution slippage, broker-side rejection of orders, and algorithmic errors. Vinebot is not responsible for trade execution failures resulting from technical anomalies.
          </p>
        </div>

        <div className="space-y-4">
          <h3 className="font-bold text-white text-sm uppercase tracking-wide">4. LIMITATION OF LIABILITY</h3>
          <p className="text-gray-300">
            To the maximum extent permitted by applicable law, in no event shall Vinebot, its affiliates, directors, employees, or technology providers be liable for any direct, indirect, incidental, special, exemplary, punitive, or consequential damages (including, but not limited to, loss of trading capital, trading losses, loss of profits, data corruption, or system outages) arising out of or in connection with the use, performance, or inability to use the Vinebot platform, regardless of the legal theory.
          </p>
        </div>

        <div className="space-y-4">
          <h3 className="font-bold text-white text-sm uppercase tracking-wide">5. INDEMNIFICATION</h3>
          <p className="text-gray-300">
            You agree to defend, indemnify, and hold harmless Vinebot and its officers, directors, employees, and agents from and against any and all claims, liabilities, damages, losses, expenses, or legal fees (including reasonable attorneys' fees) arising out of your violation of these Terms, your use of the automated trading bot, or your MT5 account operations.
          </p>
        </div>

        <div className="space-y-4">
          <h3 className="font-bold text-white text-sm uppercase tracking-wide">6. "AS IS" AND "AS AVAILABLE" WARRANTY</h3>
          <p className="text-gray-300">
            The Vinebot platform, including all algorithms, VPS hosting configurations, templates, and execution scripts, is provided on an "AS IS" and "AS AVAILABLE" basis without warranties of any kind, either express or implied. Vinebot disclaims all warranties, including but not limited to, implied warranties of merchantability, fitness for a particular purpose, non-infringement, or uninterrupted, bug-free operation.
          </p>
        </div>

        <div className="space-y-4">
          <h3 className="font-bold text-white text-sm uppercase tracking-wide">7. GOVERNING LAW AND DISPUTE RESOLUTION</h3>
          <p className="text-gray-300">
            These Terms of Use shall be governed by and construed in accordance with the laws of the jurisdiction of incorporation, without regard to conflicts of law principles. Any dispute, controversy, or claim arising out of or relating to these terms, including their formation or breach, shall be settled by binding arbitration in accordance with the rules of the local arbitration association, and you waive any right to participate in class actions or jury trials.
          </p>
        </div>
      </div>
    </LegalLayout>
  );
};

export const PrivacyPage: React.FC<{ onBack: () => void }> = ({ onBack }) => {
  return (
    <LegalLayout title="Privacy Policy" icon={<FileText className="w-6 h-6" />} onBack={onBack}>
      <div className="space-y-6">
        <div className="border-b border-[#1b202e] pb-4 mb-4">
          <h2 className="text-lg font-bold text-white uppercase font-mono">PRIVACY POLICY Summary</h2>
          <p className="text-xs text-indigo-400 mt-1">Effective Date: July 20, 2026</p>
        </div>

        <div className="space-y-4">
          <h3 className="font-bold text-white text-sm uppercase">1. Information We Collect</h3>
          <p>
            We collect user emails, encrypted MetaTrader 5 login credentials, and session telemetry IP logs. These are collected strictly to host the automated execution containers and ensure security logging for compliance audits.
          </p>
        </div>

        <div className="space-y-4">
          <h3 className="font-bold text-white text-sm uppercase">2. Encryption & Data Safety</h3>
          <p>
            Your MetaTrader 5 passwords are never stored in plain-text. They are encrypted using Advanced Encryption Standard (AES-256-GCM) with unique cryptographic Initialization Vectors (IVs) and cryptographically secure hardware secrets before being saved.
          </p>
        </div>

        <div className="space-y-4">
          <h3 className="font-bold text-white text-sm uppercase">3. Third-Party Sharing</h3>
          <p>
            Vinebot does not sell or distribute personal information. We proxy payment details through Stripe's certified PCI-compliant gateway. No payment card numbers are ever processed or stored on our servers.
          </p>
        </div>
      </div>
    </LegalLayout>
  );
};

export const CookiePolicyPage: React.FC<{ onBack: () => void }> = ({ onBack }) => {
  return (
    <LegalLayout title="Cookie Policy" icon={<HelpCircle className="w-6 h-6" />} onBack={onBack}>
      <div className="space-y-6">
        <div className="border-b border-[#1b202e] pb-4 mb-4">
          <h2 className="text-lg font-bold text-white uppercase font-mono">COOKIE POLICY Summary</h2>
          <p className="text-xs text-indigo-400 mt-1">Effective Date: July 20, 2026</p>
        </div>

        <p>
          This policy details how Vinebot utilizes cookies to maintain secure authenticated user sessions and verify portal integrity.
        </p>

        <div className="space-y-4">
          <h3 className="font-bold text-white text-sm uppercase">1. Strictly Necessary Cookies</h3>
          <p>
            We store secure JSON Web Tokens (JWT) inside HTTPOnly browser cookies. These are strictly required to protect your account session against Cross-Site Request Forgery (CSRF) and keep you authenticated inside the dashboard.
          </p>
        </div>

        <div className="space-y-4">
          <h3 className="font-bold text-white text-sm uppercase">2. Analytics & Telemetry</h3>
          <p>
            We collect basic performance metrics and routing times locally to ensure high-frequency trade triggers operate inside optimal latency thresholds.
          </p>
        </div>
      </div>
    </LegalLayout>
  );
};

export const RiskDisclosurePage: React.FC<{ onBack: () => void }> = ({ onBack }) => {
  return (
    <LegalLayout title="Risk Disclosure" icon={<ShieldAlert className="w-6 h-6" />} onBack={onBack}>
      <div className="space-y-6">
        <div className="border-[#ef4444]/20 border bg-[#ef4444]/5 p-5 rounded-xl flex items-start gap-3 text-sm text-[#f87171]">
          <ShieldAlert className="w-5 h-5 mt-0.5 shrink-0 text-[#ef4444]" />
          <div>
            <h4 className="font-bold text-white uppercase tracking-wider text-xs">CRITICAL WARNING: HIGH-FREQUENCY EXECUTION RISKS</h4>
            <p className="text-xs mt-1 text-gray-300">
              By connecting your MT5 broker account to Vinebot's automated algorithms, you expose your capital to active market conditions that can result in sudden, complete depletion of capital.
            </p>
          </div>
        </div>

        <div className="space-y-4">
          <h3 className="font-bold text-white text-sm uppercase">1. Leveraged Trading Risks</h3>
          <p>
            Leverage allows traders to open larger positions than their actual margin balance. While leverage multiplies profit potential, it equally multiplies losses. Minor price fluctuations against your positions can trigger margin calls or automatic liquidation of your trading portfolio.
          </p>
        </div>

        <div className="space-y-4">
          <h3 className="font-bold text-white text-sm uppercase">2. VPS and Connection Latency</h3>
          <p>
            Algorithmic trading is highly dependent on sub-millisecond connection times. Slippage, latency, broker-side system locks, and server updates can delay trade execution. These delays may result in entry or exit prices deviating from expected calculations, incurring substantial unforeseen losses.
          </p>
        </div>

        <div className="space-y-4">
          <h3 className="font-bold text-white text-sm uppercase">3. No Guarantees</h3>
          <p>
            Vinebot provides no guarantees of profitability. Historical back-tested statistics or demo simulation returns do not project real future returns. Under volatile, abnormal, or illiquid market environments, risk metrics and stop-loss targets may fail to execute correctly.
          </p>
        </div>
      </div>
    </LegalLayout>
  );
};
