/**
 * ════════════════════════════════════════════════════════════════════
 * 🧭 APP PRINCIPAL (rutas y piezas globales)
 * ────────────────────────────────────────────────────────────────────
 * Qué hace: Decide qué pantalla se ve según la dirección (/, /mercado, /pagos…) y monta lo que está en toda la app: menú, botón +, avisos, bloqueo con PIN, bienvenida, hogar sincronizado.
 * Dónde se ve: En toda la app.
 * Si lo cambias: Puedes dejar pantallas sin abrir o romper el arranque. Para agregar una pantalla: agrégala en "loaders" y en <Routes>.
 * ════════════════════════════════════════════════════════════════════
 */
import React, { useState, useEffect, Suspense, useCallback } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import UpdateManager from './components/pwa/UpdateManager';
import WhatsNew, { shouldShowWhatsNew, markWhatsNewSeen } from './components/pwa/WhatsNew';
import { RELEASE_STORY } from './services/releaseStories';
import { ThemeProvider } from './contexts/ThemeContext';
import { SecurityProvider, useSecurity } from './contexts/SecurityContext';
import ToastProvider from './components/ToastProvider';
import SecurityLock from './components/SecurityLock';
import SecurityAlert from './components/security/SecurityAlert';
import PushPrompt from './components/pwa/PushPrompt';
import TermsModal, { termsAccepted } from './components/TermsModal';
import SidebarMenu from './components/SidebarMenu';
import { AppMenuContext } from './components/ui/ModuleHeader';
import QuickAdd from './components/QuickAdd';
import HomeSkeleton from './components/home/HomeSkeleton';
import PasteMovementSheet, { openPasteMovement } from './components/quick/PasteMovementSheet';
import { checkDailyReminderInApp } from './services/dailyReminder';
import { TourProvider } from './components/tour/Tour';
import { db, migrateData } from './utils/database';
import { guessCategory } from './utils/categories';
import { dailySystemReminder } from './services/alertsService';
import { ConfirmHost } from './components/ui/ConfirmDialog';
import HouseholdSheet, { handleInvite } from './components/household/HouseholdSheet';
import { startHouseholdSync } from './services/household/householdSync';
import SecurityCenter, { securityIntroSeen } from './components/security/SecurityCenter';
import { InstagramMoment } from './components/social/Instagram';
import { SeasonDecor, SeasonPopup } from './components/season/Season';
import { seasonFor } from './services/season';
import { syncLoansToSW } from './services/loansService';
import { startStats } from './services/statsService';
import TestBanner from './components/ui/TestBanner';
import DateSimulator from './components/ui/DateSimulator';
import { IS_TEST } from './utils/env';

// Lazy loading de páginas. Si tras una actualización falla la carga de una página
// (quedó la versión vieja en memoria), se recarga una sola vez para traer la nueva.
const lazyWithRetry = (factory: () => Promise<{ default: React.ComponentType<any> }>) =>
  React.lazy(() => factory().then(m => { sessionStorage.removeItem('chunkReload'); return m; }).catch(err => {
    if (!sessionStorage.getItem('chunkReload')) { sessionStorage.setItem('chunkReload', '1'); window.location.reload(); }
    throw err;
  }));
// Ventanas que salen de vez en cuando: se descargan solo cuando hacen falta (la app abre más rápido)
// Pantallas grandes que no hacen falta para pintar el Inicio: se cargan aparte (abre más rápido)
const WhatsNewStory = lazyWithRetry(() => import('./components/pwa/WhatsNewStory'));
const WelcomeExperience = lazyWithRetry(() => import('./components/welcome/WelcomeExperience'));
const ShareAppSheet = React.lazy(() => import('./components/share/ShareAppSheet'));
const InstallAppSheet = React.lazy(() => import('./components/pwa/InstallAppSheet'));
const FeedbackSheet = React.lazy(() => import('./components/feedback/FeedbackSheet'));
const HalloweenIntro = React.lazy(() => import('./components/season/HalloweenIntro'));
const LoanReminder = React.lazy(() => import('./components/loans/LoanReminder'));
const FollowUs = React.lazy(() => import('./components/social/FollowUs'));
const SupportSheet = React.lazy(() => import('./components/support/SupportSheet'));
const BudgetAssistant = React.lazy(() => import('./components/assistant/BudgetAssistant'));
const BudgetCalc = React.lazy(() => import('./components/assistant/BudgetCalc'));
const DebtSyncHost = React.lazy(() => import('./components/household/DebtSyncSheet'));
const RatingHost = React.lazy(() => import('./components/feedback/RatingSheet'));
const loaders = {
  home: () => import('./pages/HomePage'),
  market: () => import('./pages/MarketPage'),
  scanner: () => import('./pages/ReceiptScannerPage'),
  settings: () => import('./pages/SettingsPage'),
  history: () => import('./pages/ReceiptHistoryPage'),
  finance: () => import('./pages/FinancePage'),
  bills: () => import('./pages/BillsPage'),
  legal: () => import('./pages/LegalPage'),
  reports: () => import('./pages/ReportsPage'),
  loans: () => import('./pages/LoansPage'),
  analysis: () => import('./pages/AnalysisPage'),
};
const HomePage = lazyWithRetry(loaders.home);
const MarketPage = lazyWithRetry(loaders.market);
const ReceiptScannerPage = lazyWithRetry(loaders.scanner);
const SettingsPage = lazyWithRetry(loaders.settings);
const ReceiptHistoryPage = lazyWithRetry(loaders.history);
const FinancePage = lazyWithRetry(loaders.finance);
const BillsPage = lazyWithRetry(loaders.bills);
const LegalPage = lazyWithRetry(loaders.legal);
const ReportsPage = lazyWithRetry(loaders.reports);
const LoansPage = lazyWithRetry(loaders.loans);
const AnalysisPage = lazyWithRetry(loaders.analysis);

/** Deja todas las pantallas cargadas en segundo plano: así abrir Ajustes u otro módulo
 *  es instantáneo y no depende de archivos que una actualización pudo reemplazar. */
const preloadPages = () => {
  const run = () => Object.values(loaders).forEach(load => load().catch(() => {}));
  const w = window as Window & { requestIdleCallback?: (cb: () => void) => number };
  if (w.requestIdleCallback) w.requestIdleCallback(run); else setTimeout(run, 1500);
};

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
  // La bienvenida sale una vez por sesión (no cada vez que la app se recarga sola).
  const [showWelcome, setShowWelcome] = useState(() => {
    try { return firstTime || !sessionStorage.getItem('mf_welcomed'); } catch { return true; }
  });
  const [showTerms, setShowTerms] = useState(false);
  const [showIntro, setShowIntro] = useState(false);
  const [showWhatsNew, setShowWhatsNew] = useState(false);
  useEffect(() => { const on = () => setShowWhatsNew(true); window.addEventListener('mf:open-whatsnew', on); return () => window.removeEventListener('mf:open-whatsnew', on); }, []);
  // Cuando se registra algo desde un botón de una notificación, el service worker avisa para refrescar la pantalla
  useEffect(() => {
    const on = (e: MessageEvent) => { if (e.data?.type === 'MF_DATA_CHANGED') window.dispatchEvent(new Event('mf:data-changed')); };
    navigator.serviceWorker?.addEventListener('message', on);
    return () => navigator.serviceWorker?.removeEventListener('message', on);
  }, []);
  const [menuOpen, setMenuOpen] = useState(false);
  // Copia mínima de préstamos para los avisos con la app cerrada (src/sw.ts → checkLoans)
  useEffect(() => { syncLoansToSW(); }, []);
  const { isLocked, isSetup } = useSecurity();
  const location = useLocation();
  // Texto compartido desde otra app (menú Compartir de Android → Mi Finanzas): se lee antes de cualquier redirección.
  const [sharedText] = useState<string | null>(() => {
    if (window.location.pathname !== '/compartir') return null;
    const sp = new URLSearchParams(window.location.search);
    window.history.replaceState(null, '', '/');
    return [sp.get('title'), sp.get('text'), sp.get('url')].filter(Boolean).join(' ');
  });
  // Invitación al hogar (/hogar#k=…): la llave viene después de "#" y nunca llega a ningún servidor.
  const [invite] = useState<string | null>(() => {
    if (window.location.pathname !== '/hogar') return null;
    const h = window.location.hash;
    window.history.replaceState(null, '', '/mercado');
    return h || null;
  });
  const [maskTick, setMaskTick] = useState(0);
  useEffect(() => { const on = () => setMaskTick(t => t + 1); window.addEventListener('mf:mask-changed', on); return () => window.removeEventListener('mf:mask-changed', on); }, []);

  useEffect(() => {
    migrateData().then(() => db.settings.update('global', { onboardingCompleted: true })).catch(() => {});
    reclassifyOnce();
    if (sharedText !== null) setTimeout(() => openPasteMovement(sharedText), 600);
    startHouseholdSync();
    startStats();
    if (invite) setTimeout(() => handleInvite(invite), 900);
    const onVisible = () => { if (document.visibilityState === 'visible') checkDailyReminderInApp(); };
    document.addEventListener('visibilitychange', onVisible);
    preloadPages();
    // Quien instala por primera vez no necesita ver "novedades".
    if (firstTime) markWhatsNewSeen();
    return () => document.removeEventListener('visibilitychange', onVisible);
  }, [firstTime]);

  const afterWelcome = useCallback(() => {
    try { sessionStorage.setItem('mf_welcomed', '1'); } catch { /* sin almacenamiento de sesión */ }
    setShowWelcome(false);
    // Orden: 1) pantalla de privacidad y seguridad (una vez) → 2) términos → 3) novedades
    if (!securityIntroSeen()) setShowIntro(true);
    else if (!termsAccepted()) setShowTerms(true);
    else if (shouldShowWhatsNew()) setShowWhatsNew(true);
    dailySystemReminder();
    checkDailyReminderInApp();
  }, []);

  const afterIntro = () => {
    setShowIntro(false);
    if (!termsAccepted()) setShowTerms(true);
    else if (shouldShowWhatsNew()) setShowWhatsNew(true);
  };

  const afterTerms = () => {
    setShowTerms(false);
    if (shouldShowWhatsNew()) setShowWhatsNew(true);
  };

  return (
    <AppMenuContext.Provider value={{ openMenu: () => setMenuOpen(true) }}>
     <TourProvider ready={!showWelcome && !showIntro && !showTerms && !showWhatsNew && !(isSetup && isLocked)}>
      <div className="min-h-screen bg-appbg text-white font-sans selection:bg-violet-500/30">
        {isSetup && isLocked && <SecurityLock />}

        <main className="pb-28 pt-5 px-4 max-w-md mx-auto">
          {/* Solo animación de entrada: la de salida (AnimatePresence mode="wait") podía quedarse
              trabada y dejar la pantalla en blanco al abrir Ajustes desde el menú. */}
          <motion.div key={`${location.pathname}-${maskTick}`} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.22 }}>
              <Suspense fallback={location.pathname === '/' ? <HomeSkeleton /> : <div className="h-40 flex items-center justify-center text-slate-500">Cargando…</div>}>
                <Routes>
                  <Route path="/" element={<HomePage />} />
                  <Route path="/finanzas" element={<FinancePage />} />
                  <Route path="/mercado" element={<MarketPage />} />
                  <Route path="/pagos" element={<BillsPage />} />
                  <Route path="/prestamos" element={<LoansPage />} />
                  <Route path="/escaner" element={<ReceiptScannerPage />} />
                  <Route path="/ajustes" element={<SettingsPage />} />
                  <Route path="/historial-facturas" element={<ReceiptHistoryPage />} />
                  <Route path="/legal" element={<LegalPage />} />
                  <Route path="/reportes" element={<ReportsPage />} />
                  <Route path="/analisis" element={<AnalysisPage />} />
                  <Route path="/hogar" element={<Navigate to="/mercado" replace />} />
                  <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
              </Suspense>
          </motion.div>
        </main>

        <QuickAdd hidden={['/mercado', '/prestamos', '/legal', '/escaner', '/reportes'].includes(location.pathname)} />
        <SidebarMenu isOpen={menuOpen} onClose={() => setMenuOpen(false)} />
        <Suspense fallback={null}><ShareAppSheet /></Suspense>
        <PasteMovementSheet />
        <HouseholdSheet />
        <ConfirmHost />
        <SecurityCenter autoIntro={showIntro} onIntroDone={afterIntro} />
        <InstagramMoment />
        <SeasonDecor />
        <SeasonPopup ready={!showWelcome && !showIntro && !showTerms && !showWhatsNew} />
        <Suspense fallback={null}>
          <InstallAppSheet ready={!showWelcome && !showIntro && !showTerms && !showWhatsNew} />
          <FollowUs ready={!showWelcome && !showIntro && !showTerms && !showWhatsNew && !(isSetup && isLocked)} />
          {/* La encuesta ya no sale sola al abrir: ahora se piden estrellas en momentos felices (RatingHost). Queda para 'Danos tu opinión'. */}
          {!IS_TEST && <FeedbackSheet ready={false} />}
          <RatingHost ready={!showWelcome && !showIntro && !showTerms && !showWhatsNew} />
          {seasonFor() === 'halloween' && <HalloweenIntro ready={!showWelcome && !(isSetup && isLocked)} />}
          <SupportSheet ready={!showWelcome && !showIntro && !showTerms && !showWhatsNew && !(isSetup && isLocked)} />
          <LoanReminder ready={!showWelcome && !showIntro && !showTerms && !showWhatsNew && !(isSetup && isLocked)} />
          <BudgetAssistant />
          <BudgetCalc />
          <DebtSyncHost ready={!showWelcome && !showIntro && !showTerms && !showWhatsNew && !(isSetup && isLocked)} />
        </Suspense>
        <TestBanner /><DateSimulator /><SecurityAlert /><PushPrompt />
        <UpdateManager />
        <ToastProvider />
        <Suspense fallback={null}><AnimatePresence>{showWelcome && <WelcomeExperience firstTime={firstTime} onDone={afterWelcome} />}</AnimatePresence></Suspense>
        {showTerms && <TermsModal onAccept={afterTerms} />}
        <Suspense fallback={null}><AnimatePresence>{showWhatsNew && (RELEASE_STORY.length
          ? <WhatsNewStory onClose={() => { markWhatsNewSeen(); setShowWhatsNew(false); }} />
          : <WhatsNew onClose={() => setShowWhatsNew(false)} />)}</AnimatePresence></Suspense>
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
