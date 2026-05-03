import { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { ThemeProvider } from './contexts/ThemeContext';
import FinancePage from './pages/FinancePage';
import MarketPage from './pages/MarketPage';
import ReceiptScannerPage from './pages/ReceiptScannerPage';
import AirQualityPage from './pages/AirQualityPage';
import CreditPage from './pages/CreditPage';
import RoutesPage from './pages/RoutesPage';
import HomePage from './pages/HomePage';
import ToastProvider from './components/ToastProvider';
import WelcomeModal from './components/WelcomeModal';
import TutorialGuide from './components/TutorialGuide';
import TermsModal from './components/TermsModal';
import NavBar from './components/NavBar';
import UpdatePrompt from './components/UpdatePrompt';

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
        </div>
      </BrowserRouter>
    </ThemeProvider>
  );
}

export default App;