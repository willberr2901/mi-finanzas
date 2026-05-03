import { useState } from 'react';
import { Sparkles } from 'lucide-react'; // Quitada la X

interface WelcomeModalProps {
  onDismiss: () => void;
  userName: string | null;
  setUserName: (name: string) => void;
}

export default function WelcomeModal({ onDismiss, userName, setUserName }: WelcomeModalProps) {
  const [step, setStep] = useState<'welcome' | 'name' | 'tutorial'>('welcome');
  const [tempName, setTempName] = useState('');

  const handleSaveName = () => {
    if (tempName.trim()) {
      setUserName(tempName.trim());
      localStorage.setItem('miFinanzasUserName', tempName.trim());
      localStorage.setItem('miFinanzasWelcomeDone', 'true');
      setStep('tutorial');
    }
  };

  const handleSkipTutorial = () => {
    localStorage.setItem('miFinanzasTutorialSeen', 'true');
    onDismiss();
  };

  if (step === 'welcome') {
    return (
      <div className="fixed inset-0 bg-black/90 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
        <div className="bg-gradient-to-br from-green-600 to-cyan-600 p-1 rounded-3xl max-w-sm w-full shadow-2xl">
          <div className="bg-gray-900 rounded-3xl p-8 text-center space-y-6">
            <div className="w-20 h-20 bg-gradient-to-br from-green-400 to-cyan-400 rounded-full mx-auto flex items-center justify-center">
              <Sparkles className="w-10 h-10 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-white mb-2">¡Bienvenido! 🎉</h2>
              <p className="text-gray-300 text-sm">Tu asistente financiero personal</p>
            </div>
            <button onClick={() => setStep('name')} className="w-full bg-gradient-to-r from-green-500 to-cyan-500 hover:from-green-600 hover:to-cyan-600 text-black font-bold py-3 rounded-xl transition-all">
              Comenzar →
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (step === 'name') {
    return (
      <div className="fixed inset-0 bg-black/90 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
        <div className="bg-gray-800 rounded-3xl p-6 max-w-sm w-full shadow-2xl border border-gray-700 space-y-4">
          <div className="text-center">
            <span className="text-4xl">👋</span>
            <h2 className="text-xl font-bold text-white mt-3">¿Cómo te llamas?</h2>
            <p className="text-gray-400 text-xs">Para personalizar tu experiencia</p>
          </div>
          <input type="text" value={tempName} onChange={e => setTempName(e.target.value)} placeholder="Tu nombre o apodo" autoFocus
            className="w-full p-3 bg-gray-700 border border-gray-600 rounded-xl text-white text-center text-lg focus:ring-2 focus:ring-green-400 outline-none"
            onKeyDown={e => e.key === 'Enter' && handleSaveName()} />
          <button onClick={handleSaveName} disabled={!tempName.trim()}
            className="w-full bg-gradient-to-r from-green-500 to-cyan-500 disabled:opacity-50 text-black font-bold py-3 rounded-xl">
            Continuar →
          </button>
        </div>
      </div>
    );
  }

  if (step === 'tutorial') {
    return (
      <div className="fixed inset-0 bg-black/90 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
        <div className="bg-gray-800 rounded-3xl p-6 max-w-sm w-full shadow-2xl border border-gray-700 space-y-4">
          <div className="text-center">
            <span className="text-4xl">📱</span>
            <h2 className="text-xl font-bold text-white mt-3">¡Listo, {userName || 'Amigo'}!</h2>
            <p className="text-gray-400 text-xs mt-1">Tu app está configurada. Explora cada módulo desde el menú inferior.</p>
          </div>
          <div className="grid grid-cols-3 gap-2">
            {['🛒 Mercado','💰 Finanzas','💳 Créditos','🧾 Escáner','🌫️ Aire','🗺️ Rutas'].map(m => (
              <div key={m} className="bg-gray-700 p-2 rounded-lg text-center text-xs text-gray-300">{m}</div>
            ))}
          </div>
          <button onClick={handleSkipTutorial} className="w-full bg-gradient-to-r from-green-500 to-cyan-500 text-black font-bold py-3 rounded-xl">
            ¡Empezar! 🚀
          </button>
        </div>
      </div>
    );
  }

  return null;
}