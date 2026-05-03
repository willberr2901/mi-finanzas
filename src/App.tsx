import { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Link, useLocation } from 'react-router-dom';
import { Home, ShoppingCart, Scan, CreditCard, PieChart, MapPin, Plus, Shield } from 'lucide-react';
import { ThemeProvider } from './contexts/ThemeContext';
import { SecurityProvider, useSecurity } from './contexts/SecurityContext';
import FinancePage from './pages/FinancePage';
import MarketPage from './pages/MarketPage';
import ReceiptScannerPage from './pages/ReceiptScannerPage';
import AirQualityPage from './pages/AirQualityPage';
import CreditPage from './pages/CreditPage';
import RoutesPage from './pages/RoutesPage';
import HomePage from './pages/HomePage';
import SettingsPage from './pages/SettingsPage';
import ReceiptHistoryPage from './pages/ReceiptHistoryPage';
import SecurityLock from './components/SecurityLock';
import ToastProvider from './components/ToastProvider';
import WelcomeModal from './components/WelcomeModal';
import TermsModal from './components/TermsModal';
import UpdatePrompt from './components/UpdatePrompt';
import { notify, setAuditLogFunction, type AuditEntry } from './services/notificationService';

// NavBar como componente separado para usar hooks de router
function NavBar() {
  const location = useLocation();
  const { lockNow } = useSecurity();
  
  const menuItems = [
    { path: '/', icon: Home, label: 'Inicio' },
    { path: '/mercado', icon: ShoppingCart, label: 'Mercado' },
    { path: '/escaner', icon: Scan, label: 'Escáner' },
    { path: '/creditos', icon: CreditCard, label: 'Créditos' },
    { path: '/aire', icon: PieChart, label: 'Aire' },
    { path: '/rutas', icon: MapPin, label: 'Rutas' },
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
          {/* Botón central + */}
          <button 
            onClick={() => window.location.href = '/'} 
            className="fixed bottom-14 left-1/2 -translate-x-1/2 w-12 h-12 rounded-full bg-gradient-to-r from-green-400 to-cyan-400 flex items-center justify-center text-black shadow-[0_0_20px_rgba(34,197,94,0.6)] z-50 hover:scale-110 transition-transform"
          >
            <Plus className="w-6 h-6" />
          </button>
        </div>
      </nav>
      
      {/* Botón de bloqueo rápido */}
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

  // Configurar función de auditoría para notificaciones
  useEffect(() => {
    // Función simple para registrar en localStorage
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
        console.warn('Error guardando log de auditoría:', e);
      }
    };
    
    setAuditLogFunction(logFunction);
  }, []);

  useEffect(() => {
    const welcomeDone = localStorage.getItem('miFinanzasWelcomeDone');
    const savedName = localStorage.getItem('miFinanzasUserName');
    
    if (!welcomeDone) {
      setShowWelcome(true);
    } else if (savedName) {
      setUserName(savedName);
    }

    const termsAccepted = localStorage.getItem('miFinanzasTermsAccepted');
    if (termsAccepted !== 'true') setShowTerms(true);
    
    // Solicitar permisos de notificación
    if (typeof window !== 'undefined' && 'Notification' in window) {
      Notification.requestPermission().catch(console.warn);
    }
    
    // Log de inicio de sesión
    notify({
      title: '🔓 Sesión iniciada',
      message: `Bienvenido${userName ? `, ${userName}` : ''}`,
      type: 'success',
      duration: 2000,
      log: true,
      module: 'Auth'
    });
  }, [userName]);

  return (
    <>
      {/* Pantalla de bloqueo si está activa la seguridad */}
      {isSetup && isLocked && <SecurityLock />}
      
      <div className="pb-20 min-h-screen relative">
        <UpdatePrompt />
        
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/finanzas" element={<FinancePage />} />
          <Route path="/mercado" element={<MarketPage />} />
          <Route path="/escaner" element={<ReceiptScannerPage />} />
          <Route path="/creditos" element={<CreditPage />} />
          <Route path="/aire" element={<AirQualityPage />} />
          <Route path="/rutas" element={<RoutesPage />} />
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
          {/* Fondo con degradados animados */}
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