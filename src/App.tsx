import React, { useState, useEffect, Suspense } from 'react';
import { BrowserRouter, Routes, Route, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Home, Wallet, ShoppingCart, Settings } from 'lucide-react';
import UpdateManager from './components/pwa/UpdateManager';
import { NavLink } from 'react-router-dom';
import { ThemeProvider } from './contexts/ThemeContext';
import { SecurityProvider, useSecurity } from './contexts/SecurityContext';
import ToastProvider from './components/ToastProvider';
import SecurityLock from './components/SecurityLock';
import WelcomeModal from './components/WelcomeModal';
import TermsModal from './components/TermsModal';
import OnboardingTour from './components/OnboardingTour';
import { db, migrateData } from './utils/database';

// Lazy loading de páginas. Si tras una actualización falla la carga de una página
// (quedó la versión vieja en memoria), se recarga una sola vez para traer la nueva.
const lazyWithRetry = (factory: () => Promise<{ default: React.ComponentType<any> }>) =>
  React.lazy(() => factory().then(m => { sessionStorage.removeItem('chunkReload'); return m; }).catch(err => {
    if (!sessionStorage.getItem('chunkReload')) { sessionStorage.setItem('chunkReload', '1'); window.location.reload(); }
    throw err;
  }));
const HomePage = lazyWithRetry(() => import('./pages/HomePage'));
const MarketPage = lazyWithRetry(() => import('./pages/MarketPage'));
const ReceiptScannerPage = lazyWithRetry(() => import('./pages/ReceiptScannerPage'));
const CreditPage = lazyWithRetry(() => import('./pages/CreditPage'));
const ProfitabilityPage = lazyWithRetry(() => import('./pages/ProfitabilityPage'));
const SettingsPage = lazyWithRetry(() => import('./pages/SettingsPage'));
const ReceiptHistoryPage = lazyWithRetry(() => import('./pages/ReceiptHistoryPage'));
const FinancePage = lazyWithRetry(() => import('./pages/FinancePage'));

// --- COMPONENTE: NAVEGACIÓN FLOTANTE PREMIUM ---
function BottomNav() {
  const links = [
    { to: '/', icon: Home, label: 'Inicio' },
    { to: '/finanzas', icon: Wallet, label: 'Finanzas' },
    { to: '/mercado', icon: ShoppingCart, label: 'Mercado' },
    { to: '/ajustes', icon: Settings, label: 'Ajustes' },
  ];

  return (
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 w-[92%] max-w-md z-50">
      <div className="bg-[#111827]/90 backdrop-blur-xl border border-white/10 rounded-3xl px-4 py-3 flex justify-around items-center shadow-2xl shadow-black/50">
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
            <span className="text-[10px] font-medium tracking-wide">{label}</span>
          </NavLink>
        ))}
      </div>
    </div>
  );
}

// --- COMPONENTE: CONTENIDO PRINCIPAL ---
function AppContent() {
  const [showSplash, setShowSplash] = useState(true);
  const [showWelcome, setShowWelcome] = useState(false);
  const [showTerms, setShowTerms] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [userName, setUserName] = useState<string | null>(null);
  const { isLocked, isSetup } = useSecurity();
  const location = useLocation();

  useEffect(() => {
    migrateData().then(() => {
      db.settings.get('global').then(s => { if (s?.onboardingCompleted !== true) setShowOnboarding(true); });
    });
    if (!localStorage.getItem('miFinanzasWelcomeDone')) setShowWelcome(true);
    setUserName(localStorage.getItem('miFinanzasUserName'));
    if (localStorage.getItem('miFinanzasTermsAccepted') !== 'true') setShowTerms(true);
    setTimeout(() => setShowSplash(false), 1000);
  }, []);

  if (showSplash) {
    return (
      <div className="min-h-screen bg-[#070B14] flex items-center justify-center">
        <div className="text-center animate-pulse">
          <div className="w-20 h-20 mx-auto mb-4 rounded-2xl bg-gradient-to-tr from-violet-600 to-cyan-500 flex items-center justify-center shadow-lg shadow-violet-500/30">
            <span className="text-3xl font-bold text-white">F$</span>
          </div>
          <p className="text-slate-400 text-sm">Cargando Mi Finanzas...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#070B14] text-white font-sans selection:bg-violet-500/30">
      {isSetup && isLocked && <SecurityLock />}
      
      {/* Área de contenido con animación */}
      <main className="pb-32 pt-4 px-4 max-w-md mx-auto">
        <AnimatePresence mode="wait">
          <motion.div key={location.pathname} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.2 }}>
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
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Elementos Globales */}
      <BottomNav />
      <UpdateManager />
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