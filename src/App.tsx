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
import TopBar from './components/TopBar';
import SidebarMenu from './components/SidebarMenu';
import { db, migrateData } from './utils/database';

// Importación diferida de páginas
const HomePage = React.lazy(() => import('./pages/HomePage'));
const MarketPage = React.lazy(() => import('./pages/MarketPage'));
const ReceiptScannerPage = React.lazy(() => import('./pages/ReceiptScannerPage'));
const CreditPage = React.lazy(() => import('./pages/CreditPage'));
const ProfitabilityPage = React.lazy(() => import('./pages/ProfitabilityPage'));
const SettingsPage = React.lazy(() => import('./pages/SettingsPage'));
const ReceiptHistoryPage = React.lazy(() => import('./pages/ReceiptHistoryPage'));
const FinancePage = React.lazy(() => import('./pages/FinancePage'));

// Componente de Navegación Inferior (Corregido)
function BottomNav() {
  const location = useLocation();
  const navigate = useNavigate();

  const NavButton = ({ path, icon, label }: { path: string, icon: string, label: string }) => {
    const isActive = location.pathname === path;
    return (
      <button 
        onClick={() => navigate(path)}
        className={`flex flex-col items-center justify-center py-2 px-4 flex-1 transition-all duration-200 ${isActive ? 'text-emerald-400' : 'text-slate-500 hover:text-slate-300'}`}
      >
        <span className="text-2xl mb-1 filter drop-shadow-lg">{icon}</span>
        <span className="text-[10px] font-medium">{label}</span>
        {isActive && <div className="absolute top-2 w-8 h-1 bg-emerald-500 rounded-full" />}
      </button>
    );
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-slate-950/90 backdrop-blur-xl border-t border-white/10 pb-safe pt-2">
      <div className="flex justify-around items-center">
        <NavButton path="/" icon="🏠" label="Inicio" />
        <NavButton path="/finanzas" icon="💰" label="Finanzas" />
        <NavButton path="/mercado" icon="🛒" label="Mercado" />
        <NavButton path="/ajustes" icon="⚙️" label="Ajustes" />
      </div>
    </nav>
  );
}

function AppContent() {
  const [showSplash, setShowSplash] = useState(true);
  const [showWelcome, setShowWelcome] = useState(false);
  const [showTerms, setShowTerms] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [userName, setUserName] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { isLocked, isSetup } = useSecurity();
  const location = useLocation();

  // Título dinámico para la barra superior
  const getPageTitle = () => {
    const titles: Record<string, string> = {
      '/': 'Mi Finanzas',
      '/finanzas': 'Control Financiero',
      '/mercado': 'Lista Inteligente',
      '/creditos': 'Simulador Créditos',
      '/rentabilidad': 'Ganancia Diaria',
      '/escaner': 'Escáner Facturas',
      '/historial-facturas': 'Historial',
      '/ajustes': 'Configuración',
    };
    return titles[location.pathname] || 'Mi Finanzas';
  };

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
          
          {/* BARRA SUPERIOR PROFESIONAL */}
          <TopBar 
            title={getPageTitle()} 
            onMenuClick={() => setSidebarOpen(true)} 
            showBell={location.pathname === '/finanzas'}
            onBellClick={() => alert('Notificaciones activadas')}
          />

          {/* MENÚ LATERAL DESPLEGABLE */}
          <SidebarMenu isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

          {/* CONTENIDO PRINCIPAL */}
          <Suspense fallback={<div className="flex h-screen items-center justify-center text-emerald-400 pt-20">Cargando...</div>}>
            <main className="pt-20 pb-24 px-4 min-h-screen overflow-y-auto scroll-smooth">
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
            </main>
          </Suspense>

          {/* NAVEGACIÓN INFERIOR */}
          <BottomNav />

          <ToastProvider />
          {/* ELIMINADO: FeedbackButton flotante */}
          
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