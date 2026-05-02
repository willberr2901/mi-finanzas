import { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Link, useLocation } from 'react-router-dom';
import { Wallet, ShoppingCart, PieChart, MapPin, Scan, CreditCard } from 'lucide-react';
import FinancePage from './pages/FinancePage';
import MarketPage from './pages/MarketPage';
import ReceiptScannerPage from './pages/ReceiptScannerPage';
import AirQualityPage from './pages/AirQualityPage';
import CreditPage from './pages/CreditPage';
import RoutesPage from './pages/RoutesPage';
import ToastProvider from './components/ToastProvider';
import WelcomeModal from './components/WelcomeModal';
import TutorialGuide from './components/TutorialGuide';
import TermsModal from './components/TermsModal';
import InstallPwaPrompt from './components/InstallPwaPrompt';

const NavBar = () => {
  const location = useLocation();
  
  const menuItems = [
    { path: '/finanzas', label: 'Finanzas', icon: Wallet },
    { path: '/', label: 'Mercado', icon: ShoppingCart },
    { path: '/escaner', label: 'Escáner', icon: Scan }, 
    { path: '/creditos', label: 'Créditos', icon: CreditCard },
    { path: '/aire', label: 'Aire', icon: PieChart },
    { path: '/rutas', label: 'Rutas', icon: MapPin },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-gray-800 border-t border-gray-700 px-2 py-2 z-50">
      <div className="max-w-4xl mx-auto flex justify-around items-center">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path;
          
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`flex flex-col items-center p-2 rounded-lg transition-all ${isActive ? 'text-green-400 scale-110' : 'text-gray-500 hover:text-white'}`}
            >
              <Icon className={`w-6 h-6 ${isActive ? 'drop-shadow-[0_0_8px_rgba(74,222,128,0.5)]' : ''}`} />
              <span className="text-[10px] mt-1 font-medium">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
};

function App() {
  const [userName, setUserName] = useState<string | null>(null);
  const [showWelcome, setShowWelcome] = useState(false);
  const [showTutorial, setShowTutorial] = useState(false);
  const [showTerms, setShowTerms] = useState(false);

  useEffect(() => {
    const savedName = localStorage.getItem('miFinanzasUserName');
    if (savedName) {
      setUserName(savedName);
    } else {
      setShowWelcome(true);
    }

    const termsAccepted = localStorage.getItem('miFinanzasTermsAccepted');
    if (termsAccepted !== 'true') {
      setShowTerms(true);
    }

    if ('Notification' in window) {
      Notification.requestPermission();
    }
  }, []);

  const handleWelcomeDismiss = () => {
    setShowWelcome(false);
    setShowTutorial(true);
  };

  const handleTutorialDismiss = () => {
    setShowTutorial(false);
  };

  const handleTermsAccept = () => {
    setShowTerms(false);
  };

  return (
    <BrowserRouter>
      <div className="pb-20 bg-gray-900 min-h-screen">
        <Routes>
          <Route path="/finanzas" element={<FinancePage />} />
          <Route path="/" element={<MarketPage />} />
          <Route path="/escaner" element={<ReceiptScannerPage />} />
          <Route path="/creditos" element={<CreditPage />} />
          <Route path="/aire" element={<AirQualityPage />} />
          <Route path="/rutas" element={<RoutesPage />} />
        </Routes>
        
        <NavBar />
        <ToastProvider />
        
        {showWelcome && (
          <WelcomeModal 
            onDismiss={handleWelcomeDismiss}
            userName={userName}
            setUserName={(name) => {
              setUserName(name);
              handleWelcomeDismiss();
            }}
          />
        )}
        
        {showTutorial && <TutorialGuide onDismiss={handleTutorialDismiss} />}
        
        {showTerms && <TermsModal onAccept={handleTermsAccept} />}
        
        <InstallPwaPrompt />
      </div>
    </BrowserRouter>
  );
}

export default App;