import { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Link, useLocation } from 'react-router-dom';
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
import { notify, setAuditLogFunction, type AuditEntry } from './services/notificationService';

// ✅ REGISTRO DE SERVICE WORKER PARA ACTUALIZACIONES (CORREGIDO)
if ('serviceWorker' in navigator && import.meta.env.PROD) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').then(registration => {
      console.log('SW registrado:', registration);
      
      // Detectar nueva versión
      if (registration.installing) {
        const newWorker = registration.installing;
        
        if (newWorker) { // ✅ Verificación null
          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              // Nueva versión disponible
              notify({
                title: '🔄 Actualización Disponible',
                message: 'Se ha detectado una nueva versión. Recargando...',
                type: 'info',
                duration: 5000,
                module: 'PWA'
              });
              
              // Forzar recarga después de 3 segundos
              setTimeout(() => {
                window.location.reload();
              }, 3000);
            }
          });
        }
      }
    }).catch(err => {
      console.error('Error registrando SW:', err);
    });
  });
}

function NavBar() {
  const location = useLocation();
  const { lockNow } = useSecurity();
  
  // ✅ SOLO MÓDULOS FUNCIONALES (Sin Aire ni Rutas)
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
  const { isLocked, isSetup } = useSecurity();

  // Configurar auditoría
  // Dentro de AppContent en App.tsx
useEffect(() => {
  if ('serviceWorker' in navigator && import.meta.env.PROD) {
    navigator.serviceWorker.register('/sw.js').then(registration => {
      
      // Detectar nueva versión instalándose
      registration.addEventListener('updatefound', () => {
        const newWorker = registration.installing;
        
        if (newWorker) {
          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              // Hay una nueva versión lista
              notify({
                title: '🔄 Actualización Crítica Disponible',
                message: 'Se ha detectado una nueva versión con mejoras de seguridad y rendimiento. La app se recargará automáticamente.',
                type: 'warning',
                duration: 5000,
                module: 'System'
              });
              
              // Forzar recarga para limpiar caché viejo y cargar nuevo SW
              setTimeout(() => {
                window.location.reload();
              }, 3000);
            }
          });
        }
      });
    });
  }
}, []);

  // ✅ NOTIFICACIÓN DE BIENVENIDA (SOLO UNA VEZ POR SESIÓN)
  useEffect(() => {
    const NOTIFIED_FLAG = 'miFinanzas_WelcomeNotified_v3';
    const welcomeDone = localStorage.getItem('miFinanzasWelcomeDone');
    const savedName = localStorage.getItem('miFinanzasUserName');
    const alreadyNotified = sessionStorage.getItem(NOTIFIED_FLAG);
    
    if (!welcomeDone) {
      setShowWelcome(true);
    } else if (savedName && !alreadyNotified) {
      setUserName(savedName);
      
      // Notificación única
      notify({
        title: '🔓 Sesión iniciada',
        message: `Bienvenido${savedName ? `, ${savedName}` : ''}`,
        type: 'success',
        duration: 3000,
        log: true,
        module: 'Auth'
      });
      
      sessionStorage.setItem(NOTIFIED_FLAG, 'true');
    }

    const termsAccepted = localStorage.getItem('miFinanzasTermsAccepted');
    if (termsAccepted !== 'true') setShowTerms(true);
    
    // Solicitar permisos para notificaciones push
    if (typeof window !== 'undefined' && 'Notification' in window) {
      Notification.requestPermission().then(permission => {
        if (permission === 'granted') {
          console.log('Permisos de notificación concedidos');
        }
      }).catch(console.warn);
    }
  }, []);

  return (
    <>
      {isSetup && isLocked && <SecurityLock />}
      <div className="pb-20 min-h-screen relative">
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