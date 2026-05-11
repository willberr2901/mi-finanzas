import React, { useState, useEffect, Suspense } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
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

export default function App() {
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
        <div className="text-center">
          <div className="w-20 h-20 mx-auto mb-4 rounded-2xl bg-gradient-to-tr from-violet-500 to-cyan-500 flex items-center justify-center animate-pulse">
            <span className="text-3xl font-bold text-white">F$</span>
          </div>
          <p className="text-slate-400">Optimizando tu experiencia...</p>
        </div>
      </div>
    );
  }

  return (
    <ThemeProvider>
      <SecurityProvider>
        <BrowserRouter>
          <div className="min-h-screen bg-[#0B0F19] text-white pb-24">
            {isSetup && isLocked && <SecurityLock />}
            
            <Suspense fallback={<div className="flex h-screen items-center justify-center">Cargando...</div>}>
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

            <ToastProvider />
            {showWelcome && <WelcomeModal onDismiss={() => setShowWelcome(false)} userName={userName} setUserName={setUserName} />}
            {showTerms && <TermsModal onAccept={() => setShowTerms(false)} />}
            {showOnboarding && <OnboardingTour onComplete={() => setShowOnboarding(false)} />}
          </div>
        </BrowserRouter>
      </SecurityProvider>
    </ThemeProvider>
  );
}