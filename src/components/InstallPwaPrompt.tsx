import { useState, useEffect } from 'react';
import { Download, X, Smartphone } from 'lucide-react';

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed';
    platform: string;
  }>;
  prompt(): Promise<void>;
}

export default function InstallPwaPrompt() {
  const [supportsPWA, setSupportsPWA] = useState(false);
  const [promptInstall, setPromptInstall] = useState<BeforeInstallPromptEvent | null>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault();
      setSupportsPWA(true);
      setPromptInstall(e as BeforeInstallPromptEvent);
      
      // Mostrar el aviso después de 2 segundos para no ser invasivo al inicio
      setTimeout(() => setIsVisible(true), 2000);
    };
    
    window.addEventListener("beforeinstallprompt", handler);

    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const onClick = async (evt: React.MouseEvent) => {
    evt.preventDefault();
    if (!promptInstall) return;

    promptInstall.prompt();
    const { outcome } = await promptInstall.userChoice;
    
    if (outcome === 'accepted') {
      setIsVisible(false); // Ocultar si aceptó
    }
  };

  const onDismiss = () => {
    setIsVisible(false);
  };

  // Si no soporta PWA o ya está instalada, no mostrar nada
  if (!supportsPWA || !isVisible) return null;

  return (
    <div className="fixed bottom-20 left-4 right-4 z-50 animate-slide-up">
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-4 rounded-2xl shadow-2xl border border-white/20 backdrop-blur-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-white/20 p-2 rounded-full">
              <Smartphone className="w-6 h-6 text-white" />
            </div>
            <div className="text-white">
              <p className="font-bold text-sm">¡Instala Mi Finanzas!</p>
              <p className="text-xs text-white/80">Usa la app sin internet y más rápido</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <button 
              onClick={onClick}
              className="bg-white text-purple-700 font-bold py-2 px-4 rounded-full text-sm hover:bg-gray-100 transition-colors flex items-center gap-2 shadow-lg"
            >
              <Download className="w-4 h-4" />
              Instalar
            </button>
            <button onClick={onDismiss} className="text-white/70 hover:text-white p-1">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}