import React, { useState, useEffect, Suspense } from 'react';
import { BrowserRouter, Routes, Route, useLocation, useNavigate } from 'react-router-dom';
import { ThemeProvider } from './contexts/ThemeContext';
import { SecurityProvider, useSecurity } from './contexts/SecurityContext';
import AnimatedSplash from './components/AnimatedSplash';
import ToastProvider from './components/ToastProvider';
import SecurityLock from './components/SecurityLock';
import WelcomeModal from './components/WelcomeModal';
import TermsModal from './components/TermsModal';
import OnboardingTour from './components/OnboardingTour';
import PwaUpdateBanner from './components/ui/PwaUpdateBanner';
import { db, migrateData } from './utils/database';

const HomePage = React.lazy(() => import('./pages/HomePage'));
const MarketPage = React.lazy(() => import('./pages/MarketPage'));
const ReceiptScannerPage = React.lazy(() => import('./pages/ReceiptScannerPage'));
const CreditPage = React.lazy(() => import('./pages/CreditPage'));
const ProfitabilityPage = React.lazy(() => import('./pages/ProfitabilityPage'));
const SettingsPage = React.lazy(() => import('./pages/SettingsPage'));
const ReceiptHistoryPage = React.lazy(() => import('./pages/ReceiptHistoryPage'));
const FinancePage = React.lazy(() => import('./pages/FinancePage'));

function BottomNav() {
  const location = useLocation();
  const navigate = useNavigate();
  
  const items = [
    { path: '/', icon: '🏠', label: 'Inicio' },
    { path: '/finanzas', icon: '💰', label: 'Finanzas' },
    { path: '/mercado', icon: '🛒', label: 'Mercado' },
    { path: '/ajustes', icon: '⚙️', label: 'Ajustes' }
  ];
  
  return (
    <nav className="fixed bottom-4 left-1/2 -translate-x-1/2 w-[92%] max-w-md z-40 bg-slate-950/90 backdrop-blur-xl border border-white/10 rounded-3xl p-2 flex justify-around shadow-2xl">
      {items.map(i => (
        <button 
          key={i.path} 
          onClick={() => navigate(i.path)} 
          className={`flex flex-col items-center gap-1 py-2 px-3 rounded-xl transition-all ${
            location.pathname === i.path ? 'text-violet-400 bg-white/5' : 'text-slate-500 hover:text-slate-300'
          }`}
        >
          <span className="text-xl">{i.icon}</span>
          <span className="text-[10px] font-medium">{i.label}</span>
        </button>
      ))}
    </nav>
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
    setTimeout(() => setShowSplash(false), 1500);
  }, []);

  return (
    <div className="min-h-screen bg-[#0B0F19] text-white font-sans pb-24">
      {showSplash && <AnimatedSplash onComplete={() => setShowSplash(false)} />}
      {!showSplash && (
        <>
          {isSetup && isLocked && <SecurityLock />}
          <div className="pt-4 px-4 space-y-6">
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
          </div>
          <BottomNav />
          <PwaUpdateBanner />
          <ToastProvider />
          {showWelcome && <WelcomeModal onDismiss={() => setShowWelcome(false)} userName={userName} setUserName={setUserName} />}
          {showTerms && <TermsModal onAccept={() => setShowTerms(false)} />}
          {showOnboarding && <OnboardingTour onComplete={() => setShowOnboarding(false)} />}
        </>
      )}
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