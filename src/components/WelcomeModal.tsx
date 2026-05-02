import { useState, useEffect } from 'react';
import { X, Sparkles } from 'lucide-react';

interface WelcomeModalProps {
  onDismiss: () => void;
  userName: string | null;
  setUserName: (name: string) => void;
}

export default function WelcomeModal({ onDismiss, userName, setUserName }: WelcomeModalProps) {
  const [step, setStep] = useState<'welcome' | 'name' | 'tutorial'>('welcome');
  const [tempName, setTempName] = useState('');

  useEffect(() => {
    if (userName) {
      setStep('tutorial');
    }
  }, [userName]);

  const handleSaveName = () => {
    if (tempName.trim()) {
      setUserName(tempName.trim());
      localStorage.setItem('miFinanzasUserName', tempName.trim());
      setStep('tutorial');
    }
  };

  if (step === 'welcome') {
    return (
      <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
        <div className="bg-gradient-to-br from-blue-600 via-purple-600 to-pink-600 p-1 rounded-3xl max-w-md w-full shadow-2xl animate-pulse">
          <div className="bg-gray-900 rounded-3xl p-8 text-center space-y-6">
            <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full mx-auto flex items-center justify-center">
              <Sparkles className="w-10 h-10 text-white" />
            </div>
            
            <div>
              <h2 className="text-3xl font-bold text-white mb-2">¡Bienvenido! 🎉</h2>
              <p className="text-gray-300">Tu asistente financiero personal</p>
            </div>

            <p className="text-gray-400 text-sm">
              Gestiona tus finanzas, mercado y más en un solo lugar
            </p>

            <button
              onClick={() => setStep('name')}
              className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-bold py-4 rounded-xl transition-all transform hover:scale-105"
            >
              Comenzar →
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (step === 'name') {
    return (
      <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
        <div className="bg-gray-800 rounded-3xl p-8 max-w-md w-full shadow-2xl border border-gray-700">
          <button
            onClick={onDismiss}
            className="absolute top-4 right-4 text-gray-400 hover:text-white"
          >
            <X className="w-6 h-6" />
          </button>

          <div className="text-center space-y-6">
            <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-emerald-500 rounded-full mx-auto flex items-center justify-center">
              <span className="text-3xl">👋</span>
            </div>

            <div>
              <h2 className="text-2xl font-bold text-white mb-2">¿Cómo te llamas?</h2>
              <p className="text-gray-400 text-sm">Para personalizar tu experiencia</p>
            </div>

            <input
              type="text"
              value={tempName}
              onChange={e => setTempName(e.target.value)}
              placeholder="Tu nombre o apodo"
              className="w-full p-4 bg-gray-700 border border-gray-600 rounded-xl text-white text-center text-lg focus:ring-2 focus:ring-purple-500 outline-none"
              onKeyDown={e => e.key === 'Enter' && handleSaveName()}
              autoFocus
            />

            <button
              onClick={handleSaveName}
              disabled={!tempName.trim()}
              className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-4 rounded-xl transition-all"
            >
              Continuar →
            </button>
          </div>
        </div>
      </div>
    );
  }

  return null;
}