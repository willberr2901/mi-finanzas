import React, { useState, useEffect, Suspense } from 'react'; // ✅ FIX 1: Import React explícitamente
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import { ThemeProvider } from './contexts/ThemeContext';
import { SecurityProvider, useSecurity } from './contexts/SecurityContext';

// ✅ FIX 2: Ruta relativa correcta './' (quitado el slash inicial '/')
// Asegúrate de que este archivo exista en tu carpeta src/components/
import AnimatedSplash from './components/AnimatedSplash';
import ToastProvider from './components/ToastProvider';
import FeedbackButton from './components/FeedbackButton';

// ✅ Lazy loading (Carga diferida) para optimizar rendimiento
const HomePage = React.lazy(() => import('./pages/HomePage'));
const MarketPage = React.lazy(() => import('./pages/MarketPage'));
const ReceiptScannerPage = React.lazy(() => import('./pages/ReceiptScannerPage'));
const CreditPage = React.lazy(() => import('./pages/CreditPage'));
const ProfitabilityPage = React.lazy(() => import('./pages/ProfitabilityPage'));
const SettingsPage = React.lazy(() => import('./pages/SettingsPage'));
const ReceiptHistoryPage = React.lazy(() => import('./pages/ReceiptHistoryPage'));
const SecurityLock = React.lazy(() => import('./components/SecurityLock'));
const WelcomeModal = React.lazy(() => import('./components/WelcomeModal'));
const TermsModal = React.lazy(() => import('./components/TermsModal'));

// ✅ FIX 3: Constante global para que el linter vea que se usa
const SERVER_VERSION = "1.0.8";

// ✅ FIX 4: Se eliminó el componente PageTransition porque no se usaba y daba warning

function NavBar() {
  const location = useLocation();

  const menuItems = [
    { path: '/', icon: '🏠', label: 'Inicio' },
    { path: '/mercado', icon: '🛒', label: 'Mercado' },
    { path: '/escaner', icon: '📷', label: 'Escáner' },
    { path: '/creditos', icon: '💳', label: 'Créditos' },
    { path: '/rentabilidad', icon: '📈', label: 'Rentabilidad' },
    { path: '/ajustes', icon: '⚙️', label: 'Ajustes' },
    { path: '/historial-facturas', icon: '📜', label: 'Historial' },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 pb-safe">
      <div className="flex justify-around items-center px-1 py-2 bg-slate-900/95 backdrop-blur-md border-t border-white/10">
        {menuItems.map((item) => (
          <a
            key={item.path}
            href={item.path}
            className={`flex flex-col items-center py-1 px-2 min-w-[44px] transition-all duration-200 active:scale-95 ${
              location.pathname === item.path
                ? 'text-emerald-400 scale-105'
                : 'text-slate-500 hover:text-slate-300'
            }`}
          >
            <span className="text-xl mb-1">{item.icon}</span>
            <span className="text-[10px] font-medium">{item.label}</span>
          </a>
        ))}
      </div>
    </nav>
  );
}

function AppContent() {
  const [showSplash, setShowSplash] = useState(true);
  const [showWelcome, setShowWelcome] = useState(false);
  const [showTerms, setShowTerms] = useState(false);
  const [userName, setUserName] = useState<string | null>(null);
  const { isLocked, isSetup } = useSecurity();

  useEffect(() => {
    // ✅ FIX 5: Uso correcto de las variables para eliminar warnings
    const currentVersion = localStorage.getItem('appVersion') || "0.0.0";
    const welcomeDone = localStorage.getItem('miFinanzasWelcomeDone');
    const savedName = localStorage.getItem('miFinanzasUserName');

    // Verificar versión (usa SERVER_VERSION)
    if (currentVersion !== SERVER_VERSION) {
      console.log(`Nueva versión detectada: ${SERVER_VERSION}`);
      // Aquí podrías disparar un modal de actualización si quisieras
    }

    // Manejo de bienvenida y términos
    if (!welcomeDone) setShowWelcome(true);
    if (savedName) setUserName(savedName);
    if (localStorage.getItem('miFinanzasTermsAccepted') !== 'true') setShowTerms(true);

    // Simular carga de assets para el Splash
    const timer = setTimeout(() => setShowSplash(false), 2000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="min-h-screen bg-slate-950 text-white selection:bg-emerald-500/30 font-sans">
      {/* Pantalla de carga animada */}
      {showSplash && <AnimatedSplash onComplete={() => setShowSplash(false)} />}
      
      {/* Contenido principal */}
      {!showSplash && (
        <>
          {isSetup && isLocked && <SecurityLock />}
          
          <Suspense fallback={<div className="flex h-screen items-center justify-center text-emerald-400">Cargando...</div>}>
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/mercado" element={<MarketPage />} />
              <Route path="/escaner" element={<ReceiptScannerPage />} />
              <Route path="/creditos" element={<CreditPage />} />
              <Route path="/rentabilidad" element={<ProfitabilityPage />} />
              <Route path="/ajustes" element={<SettingsPage />} />
              <Route path="/historial-facturas" element={<ReceiptHistoryPage />} />
            </Routes>
          </Suspense>

          <NavBar />
          <ToastProvider />
          <FeedbackButton />
          
          {showWelcome && <WelcomeModal onDismiss={() => setShowWelcome(false)} userName={userName} setUserName={setUserName} />}
          {showTerms && <TermsModal onAccept={() => setShowTerms(false)} />}
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