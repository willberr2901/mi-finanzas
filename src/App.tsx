import React, { useState, useEffect, Suspense } from 'react';
import { BrowserRouter, Routes, Route, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Home, Wallet, ShoppingCart, Settings, Menu, X } from 'lucide-react';
import { ThemeProvider } from './contexts/ThemeContext';
import { SecurityProvider, useSecurity } from './contexts/SecurityContext';
import ToastProvider from './components/ToastProvider';
import SecurityLock from './components/SecurityLock';
import WelcomeModal from './components/WelcomeModal';
import TermsModal from './components/TermsModal';
import OnboardingTour from './components/OnboardingTour';
import { db, migrateData } from './utils/database';

// Lazy loading de páginas
const HomePage = React.lazy(() => import('./pages/HomePage'));
const MarketPage = React.lazy(() => import('./pages/MarketPage'));
const ReceiptScannerPage = React.lazy(() => import('./pages/ReceiptScannerPage'));
const CreditPage = React.lazy(() => import('./pages/CreditPage'));
const ProfitabilityPage = React.lazy(() => import('./pages/ProfitabilityPage'));
const SettingsPage = React.lazy(() => import('./pages/SettingsPage'));
const ReceiptHistoryPage = React.lazy(() => import('./pages/ReceiptHistoryPage'));
const FinancePage = React.lazy(() => import('./pages/FinancePage'));

// Componente de Navegación Inferior
function BottomNav() {
  const location = useLocation();
  const navigate = useNavigate();
  const items = [
    { path: '/', icon: Home, label: 'Inicio' },
    { path: '/finanzas', icon: Wallet, label: 'Finanzas' },
    { path: '/mercado', icon: ShoppingCart, label: 'Mercado' },
    { path: '/ajustes', icon: Settings, label: 'Ajustes' },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-[#0B0F19]/95 backdrop-blur-xl border-t border-white/10 pb-safe">
      <div className="flex justify-around items-center py-2">
        {items.map(({ path, icon: Icon, label }) => {
          const isActive = location.pathname === path;
          return (
            <button
              key={path}
              onClick={() => navigate(path)}
              className={`flex flex-col items-center gap-1 py-2 px-4 rounded-2xl transition-all duration-200 ${
                isActive 
                  ? 'text-violet-400 bg-violet-500/10' 
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Icon size={22} strokeWidth={isActive ? 2.5 : 2} />
              <span className="text-[11px] font-medium">{label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}

// Componente de Actualización PWA Seguro
function PwaUpdateBanner() {
  const [needUpdate, setNeedUpdate] = useState(false);

  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        setNeedUpdate(true);
      });
      
      // Verificar actualizaciones periódicamente
      const check = setInterval(async () => {
        const reg = await navigator.serviceWorker.getRegistration();
        if (reg?.waiting) setNeedUpdate(true);
      }, 60000);
      return () => clearInterval(check);
    }
  }, []);

  const handleUpdate = async () => {
    try {
      const reg = await navigator.serviceWorker.getRegistration();
      if (reg?.waiting) {
        reg.waiting?.postMessage({ type: 'SKIP_WAITING' });
      } else {
        window.location.reload();
      }
    } catch (e) {
      window.location.reload();
    }
  };

  if (!needUpdate) return null;

  return (
    <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-50 w-[90%] max-w-sm animate-slide-up">
      <div className="bg-[#111827] border border-violet-500/30 rounded-2xl p-4 shadow-2xl backdrop-blur-xl">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-violet-500/20 flex items-center justify-center text-xl">🚀</div>
          <div className="flex-1">
            <h3 className="text-white font-semibold">Nueva versión disponible</h3>
            <p className="text-slate-400 text-sm mt-1">Mejoras de rendimiento y seguridad.</p>
            <button 
              onClick={handleUpdate}
              className="mt-3 w-full bg-violet-600 hover:bg-violet-500 text-white font-bold py-2 rounded-xl transition-colors"
            >
              Actualizar ahora
            </button>
          </div>
        </div>
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
      db.settings.get('global').then(settings => {
        if (settings?.onboardingCompleted !== true) setShowOnboarding(true);
      });
    });
    
    if (!localStorage.getItem('miFinanzasWelcomeDone')) setShowWelcome(true);
    setUserName(localStorage.getItem('miFinanzasUserName'));
    if (localStorage.getItem('miFinanzasTermsAccepted') !== 'true') setShowTerms(true);

    setTimeout(() => setShowSplash(false), 1500);
  }, []);

  if (showSplash) {
    return (
      <div className="min-h-screen bg-[#0B0F19] flex items-center justify-center">
        <div className="text-center animate-pulse">
          <div className="w-20 h-20 mx-auto mb-4 rounded-2xl bg-gradient-to-tr from-violet-500 to-cyan-500 flex items-center justify-center">
            <span className="text-3xl font-bold text-white">F$</span>
          </div>
          <p className="text-slate-400">Optimizando tu experiencia...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0B0F19] text-white font-sans pb-24">
      {isSetup && isLocked && <SecurityLock />}
      
      {/* Barra Superior Simple */}
      <div className="fixed top-0 left-0 right-0 z-40 bg-[#0B0F19]/90 backdrop-blur-xl border-b border-white/5 px-4 py-3 flex items-center justify-between">
        <h1 className="text-xl font-bold bg-gradient-to-r from-violet-400 to-cyan-400 bg-clip-text text-transparent">Mi Finanzas</h1>
        <div className="w-8 h-8 rounded-full bg-violet-500 flex items-center justify-center text-sm font-bold">G</div>
      </div>

      <main className="pt-20 pb-24 px-4 min-h-screen">
        <Suspense fallback={<div className="flex h-64 items-center justify-center text-violet-400">Cargando...</div>}>
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
      <PwaUpdateBanner />
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