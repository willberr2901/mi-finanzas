import { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Link, useLocation } from 'react-router-dom';
import { Home, ShoppingCart, Scan, CreditCard, Plus, Shield, Settings, History } from 'lucide-react';
import { ThemeProvider } from './contexts/ThemeContext';
import { SecurityProvider, useSecurity } from './contexts/SecurityContext';
import FinancePage from './pages/FinancePage';
import MarketPage from './pages/MarketPage';
import ReceiptScannerPage from './pages/ReceiptScannerPage';
import CreditPage from './pages/CreditPage';
import HomePage from './pages/HomePage';
import SettingsPage from './pages/SettingsPage';
import ReceiptHistoryPage from './pages/ReceiptHistoryPage';
import SecurityLock from './components/SecurityLock';
import ToastProvider from './components/ToastProvider';
import WelcomeModal from './components/WelcomeModal';
import TermsModal from './components/TermsModal';
import { notify, setAuditLogFunction, type AuditEntry } from './services/notificationService';

// ✅ PWA: Registrar service worker para actualizaciones
if ('serviceWorker' in navigator && import.meta.env.PROD) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(err => {
      console.warn('SW registration failed:', err);
    });
  });
}

function NavBar() {
  const location = useLocation();
  const { lockNow } = useSecurity();
  
  // ✅ Menú SIN módulo de Aire ni Rutas
  const menuItems = [
    { path: '/', icon: Home, label: 'Inicio' },
    { path: '/mercado', icon: ShoppingCart, label: 'Mercado' },
    { path: '/escaner', icon: Scan, label: 'Escáner' },
    { path: '/creditos', icon: CreditCard, label: 'Créditos' },
    { path: '/ajustes', icon: Settings, label: 'Ajustes' },
    { path: '/historial-facturas', icon: History, label: 'Historial' },
  ];
  
  return (
    <>
      <nav className="fixed bottom-0 left-0 right-0 z-50">
        <div className="flex justify-around items-center px-1 py-2 bg-black/90 backdrop-blur-md border-t border-white/10 safe-area-bottom">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            return (
              <Link 
                key={item.path} 
                to={item.path} 
                className={`flex flex-col items-center py-1 px-2 transition-colors ${isActive ? 'text-green-400' : 'text-gray-500 hover:text-gray-300'}`}
              >
                <Icon className="w-5 h-5" />
                <span className="text-[9px] mt-0.5">{item.label}</span>
              </Link>
            );
          })}
          <button 
            onClick={() => window.location.href = '/'} 
            className="fixed bottom-14 left-1/2 -translate-x-1/2 w-12 h-12 rounded-full bg-gradient-to-r from-green-400 to-cyan-400 flex items-center justify-center text-black shadow-[0_0_20px_rgba(34,197,94,0.6)] z-50 hover:scale-110 transition-transform"
          >
            <Plus className="w-6 h-6" />
          </button>
        </div>
      </nav>
      
      <button 
        onClick={lockNow}
        className="fixed top-4 right-4 z-50 w-9 h-9 rounded-full bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center hover:bg-white/20 transition-colors"
        title="Bloquear app"
        aria-label="Bloquear aplicación"
      >
        <Shield className="w-4 h-4 text-white" />
      </button>
    </>
  );
}

function AppContent() {
  const [userName, setUserName] = useState<string | null>(null);
  const [showWelcome, setShowWelcome] = useState(false);
  const [showTerms, setShowTerms] = useState(false);
  const [updateAvailable, setUpdateAvailable] = useState(false);
  const { isLocked, isSetup } = useSecurity();

  // ✅ PWA: Detectar actualización disponible (SOLO UNA VEZ)
  useEffect(() => {
    if (!('serviceWorker' in navigator) || !import.meta.env.PROD) return;
    
    const UPDATE_FLAG = 'miFinanzas_UpdateNotified_v1';
    
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      const alreadyNotified = sessionStorage.getItem(UPDATE_FLAG);
      if (!alreadyNotified) {
        notify({
          title: '🔄 Nueva versión disponible',
          message: 'Actualizando automáticamente...',
          type: 'info',
          duration: 3000,
          module: 'PWA'
        });
        sessionStorage.setItem(UPDATE_FLAG, 'true');
        // Recargar después de 2 segundos para aplicar cambios
        setTimeout(() => window.location.reload(), 2000);
      }
    });

    // Verificar si hay nuevo service worker esperando
    navigator.serviceWorker.ready.then(registration => {
      if (registration.waiting) {
        registration.waiting.postMessage({ type: 'SKIP_WAITING' });
      }
    });
  }, []);

  // ✅ Auditoría y estado inicial (ejecuta 1 sola vez)
  useEffect(() => {
    const logFunction = (entry: Omit<AuditEntry, 'id' | 'timestamp'>) => {
      const newEntry: AuditEntry = {
        ...entry,
        id: `${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        timestamp: Date.now(),
      };
      try {
        const existing = JSON.parse(localStorage.getItem('miFinanzasAuditLog') || '[]');
        const updated = [newEntry, ...existing].slice(0, 100);
        localStorage.setItem('miFinanzasAuditLog', JSON.stringify(updated));
      } catch (e) {
        console.warn('Error en auditoría:', e);
      }
    };
    setAuditLogFunction(logFunction);
  }, []);

  // ✅ Notificación de bienvenida (SOLO UNA VEZ por sesión)
  useEffect(() => {
    const NOTIFIED_FLAG = 'miFinanzas_WelcomeNotified_v1';
    const welcomeDone = localStorage.getItem('miFinanzasWelcomeDone');
    const savedName = localStorage.getItem('miFinanzasUserName');
    const alreadyNotified = sessionStorage.getItem(NOTIFIED_FLAG);
    
    if (!welcomeDone) {
      setShowWelcome(true);
    } else if (savedName && !alreadyNotified) {
      setUserName(savedName);
      notify({
        title: '🔓 Sesión iniciada',
        message: `Bienvenido${savedName ? `, ${savedName}` : ''}`,
        type: 'success',
        duration: 2000,
        log: true,
        module: 'Auth'
      });
      sessionStorage.setItem(NOTIFIED_FLAG, 'true');
    }

    const termsAccepted = localStorage.getItem('miFinanzasTermsAccepted');
    if (termsAccepted !== 'true') setShowTerms(true);
    
    if (typeof window !== 'undefined' && 'Notification' in window) {
      Notification.requestPermission().catch(() => {});
    }
  }, []); // ← Array vacío = ejecuta SOLO al montar

  return (
    <>
      {isSetup && isLocked && <SecurityLock />}
      <div className="pb-20 min-h-screen relative">
        {/* ✅ Banner de actualización (solo si hay nueva versión) */}
        {updateAvailable && (
          <div className="fixed top-0 left-0 right-0 bg-gradient-to-r from-green-500 to-cyan-500 text-white text-center py-2 text-sm font-medium z-50 animate-pulse">
            🔄 Actualización disponible • Recargando...
          </div>
        )}
        
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/finanzas" element={<FinancePage />} />
          <Route path="/mercado" element={<MarketPage />} />
          <Route path="/escaner" element={<ReceiptScannerPage />} />
          <Route path="/creditos" element={<CreditPage />} />
          <Route path="/ajustes" element={<SettingsPage />} />
          <Route path="/historial-facturas" element={<ReceiptHistoryPage />} />
        </Routes>
        
        <NavBar />
        <ToastProvider />
        
        {showWelcome && (
          <WelcomeModal 
            onDismiss={() => setShowWelcome(false)} 
            userName={userName} 
            setUserName={setUserName} 
          />
        )}
        {showTerms && <TermsModal onAccept={() => setShowTerms(false)} />}
      </div>
    </>
  );
}

function App() {
  return (
    <ThemeProvider>
      <SecurityProvider>
        <BrowserRouter>
          <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
            <div className="absolute top-0 left-0 w-96 h-96 bg-green-400 rounded-full opacity-20 blur-3xl animate-pulse"></div>
            <div className="absolute top-0 right-0 w-96 h-96 bg-cyan-400 rounded-full opacity-20 blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
            <div className="absolute bottom-0 left-1/2 w-96 h-96 bg-emerald-400 rounded-full opacity-20 blur-3xl animate-pulse" style={{ animationDelay: '2s' }}></div>
          </div>
          <AppContent />
        </BrowserRouter>
      </SecurityProvider>
    </ThemeProvider>
  );
}

export default App;