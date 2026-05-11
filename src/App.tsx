import React, { useState, useEffect, Suspense } from 'react';
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Home, Wallet, ShoppingCart, Settings } from 'lucide-react';
import { NavLink } from 'react-router-dom';
import { ThemeProvider } from './contexts/ThemeContext';
import { SecurityProvider, useSecurity } from './contexts/SecurityContext';
import ToastProvider from './components/ToastProvider';
import SecurityLock from './components/SecurityLock';
import WelcomeModal from './components/WelcomeModal';
import TermsModal from './components/TermsModal';
import OnboardingTour from './components/OnboardingTour';
import { db, migrateData } from './utils/database';

// Lazy loading
const HomePage = React.lazy(() => import('./pages/HomePage'));
const MarketPage = React.lazy(() => import('./pages/MarketPage'));
const ReceiptScannerPage = React.lazy(() => import('./pages/ReceiptScannerPage'));
const CreditPage = React.lazy(() => import('./pages/CreditPage'));
const ProfitabilityPage = React.lazy(() => import('./pages/ProfitabilityPage'));
const SettingsPage = React.lazy(() => import('./pages/SettingsPage'));
const ReceiptHistoryPage = React.lazy(() => import('./pages/ReceiptHistoryPage'));
const FinancePage = React.lazy(() => import('./pages/FinancePage'));

// BottomNav inline
function BottomNav() {
  const links = [
    { to: '/', icon: Home, label: 'Inicio' },
    { to: '/finanzas', icon: Wallet, label: 'Finanzas' },
    { to: '/mercado', icon: ShoppingCart, label: 'Mercado' },
    { to: '/ajustes', icon: Settings, label: 'Ajustes' },
  ];

  return (
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 w-[92%] max-w-md z-50">
      <div className="bg-[#111827]/80 backdrop-blur-xl border border-white/10 rounded-3xl px-4 py-3 flex justify-around items-center shadow-2xl">
        {links.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={label}
            to={to}
            className={({ isActive }) =>
              `flex flex-col items-center gap-1 transition-all duration-300 ${
                isActive ? 'text-violet-400 scale-110' : 'text-slate-500 hover:text-slate-300'
              }`
            }
          >
            <Icon size={22} strokeWidth={2} />
            <span className="text-[10px] font-medium">{label}</span>
          </NavLink>
        ))}
      </div>
    </div>
  );
}

// PwaUpdate inline
function PwaUpdate() {
  const [showBanner, setShowBanner] = useState(false);

  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.ready.then((reg) => {
        reg.addEventListener('updatefound', () => {
          const newWorker = reg.installing;
          if (newWorker) {
            newWorker.addEventListener('statechange', () => {
              if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                setShowBanner(true);
              }
            });
          }
        });
      });
    }
  }, []);

  const handleUpdate = () => {
    window.location.reload();
    setShowBanner(false);
  };

  if (!showBanner) return null;

  return (
    <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-[100] w-[90%] max-w-sm">
      <div className="bg-[#111827] border border-violet-500/30 rounded-3xl p-4 shadow-2xl backdrop-blur-xl">
        <h3 className="text-white font-semibold text-sm mb-2">Nueva versión disponible 🚀</h3>
        <p className="text-slate-400 text-xs mb-3">Mejoras de rendimiento y diseño.</p>
        <button onClick={handleUpdate} className="w-full bg-violet-600 hover:bg-violet-500 text-white font-bold py-2.5 rounded-xl transition-all text-sm">
          Actualizar ahora
        </button>
      </div>
    </div>
  );
}

function AppContent() {
  const [showSplash, setShowSplash] = useState(true);
  const [showWelcome, setShowWelcome] = useState(false);
  const [showTerms, setShowTerms] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [userName, setUserName] = useState<string | null>(null);
  const { isLocked, isSetup } = useSecurity();

  useEffect(() => {
    migrateData().then(() => {
      db.settings.get('global').then(s => {
        if (s?.onboardingCompleted !== true) setShowOnboarding(true);
      });
    });
    
    if (!localStorage.getItem('miFinanzasWelcomeDone')) setShowWelcome(true);
    setUserName(localStorage.getItem('miFinanzasUserName'));
    if (localStorage.getItem('miFinanzasTermsAccepted') !== 'true') setShowTerms(true);

    setTimeout(() => setShowSplash(false), 1200);
  }, []);

  if (showSplash) {
    return (
      <div className="min-h-screen bg-[#070B14] flex items-center justify-center">
        <div className="text-center animate-pulse">
          <div className="w-20 h-20 mx-auto mb-4 rounded-2xl bg-gradient-to-tr from-violet-600 to-cyan-500 flex items-center justify-center shadow-lg shadow-violet-500/30">
            <span className="text-3xl font-bold text-white">F$</span>
          </div>
          <p className="text-slate-400 text-sm">Optimizando...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#070B14] text-white font-sans selection:bg-violet-500/30 pb-24">
      {isSetup && isLocked && <SecurityLock />}
      
      <main className="pt-4 px-4 max-w-md mx-auto">
        <Suspense fallback={<div className="h-40 flex items-center justify-center text-slate-500">Cargando...</div>}>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/finanzas" element={<FinancePage />} />
            <Route path="/mercado" element={<MarketPage />} />
            <Route path="/escaner" element={<ReceiptScannerPage />} />
            <Route path="/creditos" element={<CreditPage />} />
            <Route path="/rentabilidad" element={<ProfitabilityPage />} />
            <Route path="/ajustes" element={<SettingsPage />} />
            <Route path="/historial-facturas" element={<ReceiptHistoryPage />} />
          </Routes>
        </Suspense>
      </main>

      <BottomNav />
      <PwaUpdate />
      <ToastProvider />
      {showWelcome && <WelcomeModal onDismiss={() => setShowWelcome(false)} userName={userName} setUserName={setUserName} />}
      {showTerms && <TermsModal onAccept={() => setShowTerms(false)} />}
      {showOnboarding && <OnboardingTour onComplete={() => setShowOnboarding(false)} />}
    </div>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <SecurityProvider>
        <BrowserRouter>
          <AppContent />
        </BrowserRouter>
      </SecurityProvider>
    </ThemeProvider>
  );
}