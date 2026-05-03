import { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Link, useLocation } from 'react-router-dom';
import { Home, ShoppingCart, Scan, CreditCard, PieChart, MapPin, Plus } from 'lucide-react';
import { ThemeProvider } from './contexts/ThemeContext';
import FinancePage from './pages/FinancePage';
import MarketPage from './pages/MarketPage';
import ReceiptScannerPage from './pages/ReceiptScannerPage';
import AirQualityPage from './pages/AirQualityPage';
import CreditPage from './pages/CreditPage';
import RoutesPage from './pages/RoutesPage';
import HomePage from './pages/HomePage';
import SettingsPage from './pages/SettingsPage';
import ToastProvider from './components/ToastProvider';
import WelcomeModal from './components/WelcomeModal';
import TutorialGuide from './components/TutorialGuide';
import TermsModal from './components/TermsModal';
import UpdatePrompt from './components/UpdatePrompt';

function NavBar() {
  const location = useLocation();
  const menuItems = [
    { path: '/', icon: Home, label: 'Inicio' },
    { path: '/mercado', icon: ShoppingCart, label: 'Mercado' },
    { path: '/escaner', icon: Scan, label: 'Escáner' },
    { path: '/creditos', icon: CreditCard, label: 'Créditos' },
    { path: '/aire', icon: PieChart, label: 'Aire' },
    { path: '/rutas', icon: MapPin, label: 'Rutas' },
  ];
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50">
      <div className="flex justify-around items-center px-1 py-2 bg-black/90 backdrop-blur-md border-t border-white/10">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path;
          return (
            <Link key={item.path} to={item.path} className={`flex flex-col items-center py-1 px-2 ${isActive ? 'text-green-400' : 'text-gray-500'}`}>
              <Icon className="w-5 h-5" />
              <span className="text-[9px] mt-0.5">{item.label}</span>
            </Link>
          );
        })}
        <button onClick={() => window.location.href = '/'} className="fixed bottom-14 left-1/2 -translate-x-1/2 w-12 h-12 rounded-full bg-gradient-to-r from-green-400 to-cyan-400 flex items-center justify-center text-black shadow-lg">
          <Plus className="w-6 h-6" />
        </button>
      </div>
    </nav>
  );
}

function App() {
  const [userName, setUserName] = useState<string | null>(null);
  const [showWelcome, setShowWelcome] = useState(false);
  const [showTutorial, setShowTutorial] = useState(false);
  const [showTerms, setShowTerms] = useState(false);

  useEffect(() => {
    const savedName = localStorage.getItem('miFinanzasUserName');
    const hasSeenWelcome = sessionStorage.getItem('miFinanzasWelcomeSeen');
    if (!savedName || !hasSeenWelcome) {
      setShowWelcome(true);
      sessionStorage.setItem('miFinanzasWelcomeSeen', 'true');
    }
    const termsAccepted = localStorage.getItem('miFinanzasTermsAccepted');
    if (termsAccepted !== 'true') setShowTerms(true);
    if ('Notification' in window) Notification.requestPermission();
  }, []);

  return (
    <ThemeProvider>
      <BrowserRouter>
        <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
          <div className="absolute top-0 left-0 w-96 h-96 bg-green-400 rounded-full opacity-20 blur-3xl"></div>
          <div className="absolute top-0 right-0 w-96 h-96 bg-cyan-400 rounded-full opacity-20 blur-3xl"></div>
          <div className="absolute bottom-0 left-1/2 w-96 h-96 bg-emerald-400 rounded-full opacity-20 blur-3xl"></div>
        </div>
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
          </Routes>
          <NavBar />
          <ToastProvider />
          {showWelcome && <WelcomeModal onDismiss={() => { setShowWelcome(false); setShowTutorial(true); }} userName={userName} setUserName={setUserName} />}
          {showTutorial && <TutorialGuide onDismiss={() => setShowTutorial(false)} />}
          {showTerms && <TermsModal onAccept={() => setShowTerms(false)} />}
        </div>
      </BrowserRouter>
    </ThemeProvider>
  );
}

export default App;