import React, { useState, useEffect, Suspense } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { ThemeProvider } from './contexts/ThemeContext';
import { SecurityProvider, useSecurity } from './contexts/SecurityContext';
import AnimatedSplash from './components/AnimatedSplash';
import ToastProvider from './components/ToastProvider';
import FeedbackButton from './components/FeedbackButton';
import SecurityLock from './components/SecurityLock';
import WelcomeModal from './components/WelcomeModal';
import TermsModal from './components/TermsModal';
import OnboardingTour from './components/OnboardingTour';
import SmartNavBar from './components/SmartNavBar';
import { db, migrateData } from './utils/database';

const HomePage = React.lazy(() => import('./pages/HomePage'));
const MarketPage = React.lazy(() => import('./pages/MarketPage'));
const ReceiptScannerPage = React.lazy(() => import('./pages/ReceiptScannerPage'));
const CreditPage = React.lazy(() => import('./pages/CreditPage'));
const ProfitabilityPage = React.lazy(() => import('./pages/ProfitabilityPage'));
const SettingsPage = React.lazy(() => import('./pages/SettingsPage'));
const ReceiptHistoryPage = React.lazy(() => import('./pages/ReceiptHistoryPage'));
const FinancePage = React.lazy(() => import('./pages/FinancePage'));

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
    
    const welcomeDone = localStorage.getItem('miFinanzasWelcomeDone');
    const savedName = localStorage.getItem('miFinanzasUserName');
    if (!welcomeDone) setShowWelcome(true);
    if (savedName) setUserName(savedName);
    if (localStorage.getItem('miFinanzasTermsAccepted') !== 'true') setShowTerms(true);

    const timer = setTimeout(() => setShowSplash(false), 1800);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="min-h-screen bg-slate-950 text-white selection:bg-emerald-500/30 font-sans">
      {showSplash && <AnimatedSplash onComplete={() => setShowSplash(false)} />}
      
      {!showSplash && (
        <>
          {isSetup && isLocked && <SecurityLock />}
          
          <Suspense fallback={<div className="flex h-screen items-center justify-center text-emerald-400">Cargando...</div>}>
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

          <SmartNavBar />
          <ToastProvider />
          <FeedbackButton />
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