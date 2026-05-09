import { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, useLocation, useNavigate } from 'react-router-dom';
import { Home, ShoppingCart, Scan, CreditCard, Plus, Shield, Settings, History, PieChart } from 'lucide-react';
import { ThemeProvider } from './contexts/ThemeContext';
import { SecurityProvider, useSecurity } from './contexts/SecurityContext';
import FinancePage from './pages/FinancePage';
import MarketPage from './pages/MarketPage';
import ReceiptScannerPage from './pages/ReceiptScannerPage';
import CreditPage from './pages/CreditPage';
import HomePage from './pages/HomePage';
import SettingsPage from './pages/SettingsPage';
import ReceiptHistoryPage from './pages/ReceiptHistoryPage';
import ProfitabilityPage from './pages/ProfitabilityPage';
import SecurityLock from './components/SecurityLock';
import ToastProvider from './components/ToastProvider';
import WelcomeModal from './components/WelcomeModal';
import TermsModal from './components/TermsModal';
import FeedbackButton from './components/FeedbackButton';
import { notify } from './services/notificationService';

const SERVER_VERSION = "1.0.6";

function NavBar() {
  const location = useLocation();
  const navigate = useNavigate(); // ✅ FIX: Navegación nativa de React Router
  const { lockNow } = useSecurity();
  
  const menuItems = [
    { path: '/', icon: Home, label: 'Inicio' },
    { path: '/mercado', icon: ShoppingCart, label: 'Mercado' },
    { path: '/escaner', icon: Scan, label: 'Escáner' },
    { path: '/creditos', icon: CreditCard, label: 'Créditos' },
    { path: '/rentabilidad', icon: PieChart, label: 'Rentabilidad' },
    { path: '/ajustes', icon: Settings, label: 'Ajustes' },
    { path: '/historial-facturas', icon: History, label: 'Historial' },
  ];

  return (
    <>
      {/* ✅ ESCUDO CORREGIDO: Posición fija, no interfiere con botones */}
      <button 
        onClick={lockNow}
        className="fixed top-4 right-4 z-40 w-10 h-10 rounded-full bg-slate-800/90 backdrop-blur border border-white/10 flex items-center justify-center hover:bg-slate-700 transition-colors active:scale-95"
        title="Bloquear app"
      >
        <Shield className="w-5 h-5 text-slate-300" />
      </button>

      {/* ✅ BARRA DE NAVEGACIÓN CON TOQUES RESPONSIVOS */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 pb-safe">
        <div className="flex justify-around items-center px-1 py-2 bg-slate-900/95 backdrop-blur-md border-t border-white/10">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            return (
              <button 
                key={item.path} 
                onClick={() => navigate(item.path)} // ✅ FIX: Navegación correcta
                className={`flex flex-col items-center py-1 px-2 min-w-[44px] transition-all duration-200 active:scale-95 ${isActive ? 'text-emerald-400 scale-105' : 'text-slate-500 hover:text-slate-300'}`}
              >
                <Icon className="w-6 h-6 mb-1" strokeWidth={isActive ? 2.5 : 2} />
                <span className="text-[10px] font-medium">{item.label}</span>
              </button>
            );
          })}
        </div>
      </nav>
      
      {/* ✅ BOTÓN FLOTANTE CENTRAL (SIEMPRE VISIBLE) */}
      <button 
        onClick={() => navigate('/rentabilidad')} 
        className="fixed bottom-20 left-1/2 -translate-x-1/2 w-14 h-14 rounded-full bg-gradient-to-tr from-emerald-400 to-cyan-500 flex items-center justify-center text-black shadow-[0_0_25px_rgba(16,185,129,0.5)] z-40 hover:scale-110 active:scale-95 transition-transform"
      >
        <Plus className="w-8 h-8" />
      </button>
    </>
  );
}

function AppContent() {
  const [userName, setUserName] = useState<string | null>(null);
  const [showWelcome, setShowWelcome] = useState(false);
  const [showTerms, setShowTerms] = useState(false);
  const [showUpdatePopup, setShowUpdatePopup] = useState(false);
  const { isLocked, isSetup } = useSecurity();

  useEffect(() => {
    const currentVersion = localStorage.getItem('appVersion') || "0.0.0";
    if (currentVersion !== SERVER_VERSION) {
      setShowUpdatePopup(true);
      setTimeout(() => localStorage.setItem('appVersion', SERVER_VERSION), 500);
    } else {
      const NOTIFIED_FLAG = 'miFinanzas_WelcomeNotified_v4';
      const welcomeDone = localStorage.getItem('miFinanzasWelcomeDone');
      const savedName = localStorage.getItem('miFinanzasUserName');
      const alreadyNotified = sessionStorage.getItem(NOTIFIED_FLAG);
      
      if (!welcomeDone) setShowWelcome(true);
      else if (savedName && !alreadyNotified) {
        setUserName(savedName);
        notify({ title: '👋 Bienvenido', message: `${savedName}, tus finanzas están listas.`, type: 'info' });
        sessionStorage.setItem(NOTIFIED_FLAG, 'true');
      }
    }

    if (localStorage.getItem('miFinanzasTermsAccepted') !== 'true') setShowTerms(true);
  }, []);

  return (
    <>
      {isSetup && isLocked && <SecurityLock />}
      <div className="pb-24 min-h-screen relative max-w-md mx-auto overflow-x-hidden">
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
        
        <NavBar />
        <ToastProvider />
        <FeedbackButton />
        
        {showWelcome && <WelcomeModal onDismiss={() => setShowWelcome(false)} userName={userName} setUserName={setUserName} />}
        {showTerms && <TermsModal onAccept={() => setShowTerms(false)} />}

        {showUpdatePopup && (
          <div className="fixed inset-0 bg-black/90 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
            <div className="bg-slate-900 w-full max-w-sm rounded-2xl p-6 border border-emerald-500/30 shadow-2xl">
              <div className="text-center">
                <div className="mx-auto w-16 h-16 bg-emerald-500/20 rounded-full flex items-center justify-center mb-4">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                </div>
                <h2 className="text-xl font-bold text-white mb-2">¡Nueva Versión!</h2>
                <p className="text-slate-300 mb-6">Se ha detectado la versión {SERVER_VERSION}. Aplicando mejoras automáticas.</p>
                <button 
                  onClick={() => { setShowUpdatePopup(false); window.location.reload(); }}
                  className="w-full bg-gradient-to-r from-emerald-500 to-teal-500 text-black font-bold py-3 px-6 rounded-xl shadow-lg active:scale-95 transition-transform"
                >
                  Actualizar Ahora
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
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