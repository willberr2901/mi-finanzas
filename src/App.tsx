import React, { useState, useEffect, Suspense, useCallback } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import UpdateManager from './components/pwa/UpdateManager';
import WhatsNew, { shouldShowWhatsNew, markWhatsNewSeen } from './components/pwa/WhatsNew';
import { ThemeProvider } from './contexts/ThemeContext';
import { SecurityProvider, useSecurity } from './contexts/SecurityContext';
import ToastProvider from './components/ToastProvider';
import SecurityLock from './components/SecurityLock';
import TermsModal, { termsAccepted } from './components/TermsModal';
import WelcomeExperience from './components/welcome/WelcomeExperience';
import SidebarMenu from './components/SidebarMenu';
import { AppMenuContext } from './components/ui/ModuleHeader';
import QuickAdd from './components/QuickAdd';
import { TourProvider } from './components/tour/Tour';
import { db, migrateData } from './utils/database';
import { guessCategory } from './utils/categories';
import { dailySystemReminder } from './services/alertsService';

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
const SettingsPage = lazyWithRetry(() => import('./pages/SettingsPage'));
const ReceiptHistoryPage = lazyWithRetry(() => import('./pages/ReceiptHistoryPage'));
const FinancePage = lazyWithRetry(() => import('./pages/FinancePage'));
const BillsPage = lazyWithRetry(() => import('./pages/BillsPage'));
const LegalPage = lazyWithRetry(() => import('./pages/LegalPage'));

/** Reclasifica una sola vez los gastos viejos con la nueva clasificación automática. */
const reclassifyOnce = async () => {
  if (localStorage.getItem('mf_reclass_v2')) return;
  try {
    const txs = await db.transactions.toArray();
    for (const t of txs) {
      if (t.type !== 'expense') continue;
      let cat: string | null = null;
      if (/^mercado/i.test(t.description)) cat = 'Mercado';
      else if (['Alimentación', 'Otros', 'Servicios', 'Hogar'].includes(t.category)) cat = guessCategory(t.description);
      if (cat && cat !== t.category) await db.transactions.update(t.id, { category: cat });
    }
    // Las tarjetas de crédito que se guardaron como "deuda" pasan a tipo tarjeta (valor variable, fecha fija).
    for (const b of await db.bills.toArray()) {
      if (b.kind === 'deuda' && /tarjeta/i.test(b.name)) await db.bills.update(b.id, { kind: 'tarjeta', totalInstallments: undefined, paidInstallments: undefined, active: true });
    }
    localStorage.setItem('mf_reclass_v2', '1');
  } catch { /* se intenta de nuevo la próxima vez */ }
};

function AppContent() {
  const [firstTime] = useState(() => !localStorage.getItem('miFinanzasWelcomeDone'));
  const [showWelcome, setShowWelcome] = useState(true);
  const [showTerms, setShowTerms] = useState(false);
  const [showWhatsNew, setShowWhatsNew] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const { isLocked, isSetup } = useSecurity();
  const location = useLocation();

  useEffect(() => {
    migrateData().then(() => db.settings.update('global', { onboardingCompleted: true })).catch(() => {});
    reclassifyOnce();
    // Quien instala por primera vez no necesita ver "novedades".
    if (firstTime) markWhatsNewSeen();
  }, [firstTime]);

  const afterWelcome = useCallback(() => {
    setShowWelcome(false);
    if (!termsAccepted()) setShowTerms(true);
    else if (shouldShowWhatsNew()) setShowWhatsNew(true);
    dailySystemReminder();
  }, []);

  const afterTerms = () => {
    setShowTerms(false);
    if (shouldShowWhatsNew()) setShowWhatsNew(true);
  };

  return (
    <AppMenuContext.Provider value={{ openMenu: () => setMenuOpen(true) }}>
     <TourProvider ready={!showWelcome && !showTerms && !showWhatsNew && !(isSetup && isLocked)}>
      <div className="min-h-screen bg-[#070B14] text-white font-sans selection:bg-violet-500/30">
        {isSetup && isLocked && <SecurityLock />}

        <main className="pb-28 pt-5 px-4 max-w-md mx-auto">
          <AnimatePresence mode="wait">
            <motion.div key={location.pathname} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.22 }}>
              <Suspense fallback={<div className="h-40 flex items-center justify-center text-slate-500">Cargando…</div>}>
                <Routes>
                  <Route path="/" element={<HomePage />} />
                  <Route path="/finanzas" element={<FinancePage />} />
                  <Route path="/mercado" element={<MarketPage />} />
                  <Route path="/pagos" element={<BillsPage />} />
                  <Route path="/escaner" element={<ReceiptScannerPage />} />
                  <Route path="/ajustes" element={<SettingsPage />} />
                  <Route path="/historial-facturas" element={<ReceiptHistoryPage />} />
                  <Route path="/legal" element={<LegalPage />} />
                  <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
              </Suspense>
            </motion.div>
          </AnimatePresence>
        </main>

        <QuickAdd hidden={location.pathname === '/mercado' || location.pathname === '/legal'} />
        <SidebarMenu isOpen={menuOpen} onClose={() => setMenuOpen(false)} />
        <UpdateManager />
        <ToastProvider />
        <AnimatePresence>{showWelcome && <WelcomeExperience firstTime={firstTime} onDone={afterWelcome} />}</AnimatePresence>
        {showTerms && <TermsModal onAccept={afterTerms} />}
        <AnimatePresence>{showWhatsNew && <WhatsNew onClose={() => setShowWhatsNew(false)} />}</AnimatePresence>
      </div>
     </TourProvider>
    </AppMenuContext.Provider>
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
