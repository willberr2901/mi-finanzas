import { useState, useEffect } from 'react';
import { ShoppingCart, Wallet, Scan, CreditCard, PieChart, MapPin } from 'lucide-react';
interface TutorialGuideProps {
  onDismiss: () => void;
}

const steps = [
  {
    icon: ShoppingCart,
    title: '🛒 Mercado',
    description: 'Crea tu lista de mercado inteligente. Agrega productos y la app los clasifica automáticamente (Plaza, Aseo, Granos, etc.)',
    color: 'from-green-500 to-emerald-500',
    route: '/'
  },
  {
    icon: Wallet,
    title: '💰 Finanzas',
    description: 'Controla tus ingresos y gastos. Registra salarios, pagos de servicios, arriendo y más.',
    color: 'from-blue-500 to-cyan-500',
    route: '/finanzas'
  },
  {
    icon: Scan,
    title: '🧾 Escáner',
    description: 'Escanea facturas del mercado con OCR. Compara precios planificados vs reales.',
    color: 'from-purple-500 to-pink-500',
    route: '/escaner'
  },
  {
    icon: CreditCard,
    title: '💳 Créditos',
    description: 'Simula créditos y préstamos. Calcula cuotas, intereses y ve la tabla de amortización completa.',
    color: 'from-orange-500 to-red-500',
    route: '/creditos'
  },
  {
    icon: PieChart,
    title: '🌫️ Calidad del Aire',
    description: 'Monitorea la calidad del aire en tiempo real en diferentes ciudades de Colombia.',
    color: 'from-teal-500 to-green-500',
    route: '/aire'
  },
  {
    icon: MapPin,
    title: '🗺️ Rutas',
    description: 'Próximamente: Calcula rutas, peajes y costos de viaje entre ciudades.',
    color: 'from-gray-500 to-gray-600',
    route: null,
    comingSoon: true
  }
];

export default function TutorialGuide({ onDismiss }: TutorialGuideProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [showFullTutorial, setShowFullTutorial] = useState(true);

  const current = steps[currentStep];
  const Icon = current.icon;

  useEffect(() => {
    const hasSeenTutorial = localStorage.getItem('miFinanzasTutorialSeen');
    if (hasSeenTutorial === 'true') {
      setShowFullTutorial(false);
    }
  }, []);

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      localStorage.setItem('miFinanzasTutorialSeen', 'true');
      onDismiss();
    }
  };

  const handleSkip = () => {
    localStorage.setItem('miFinanzasTutorialSeen', 'true');
    onDismiss();
  };

  if (!showFullTutorial) {
    return (
      <button
        onClick={() => setShowFullTutorial(true)}
        className="fixed bottom-20 right-4 bg-gray-800 p-3 rounded-full shadow-lg border border-gray-700 hover:bg-gray-700 transition-colors z-40"
        title="Ver tutorial"
      >
        <span className="text-xl">❓</span>
      </button>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-gray-800 rounded-3xl p-8 max-w-lg w-full shadow-2xl border border-gray-700 space-y-6">
        <div className="flex justify-between items-center">
          <div className="flex gap-2">
            {steps.map((_, idx) => (
              <div
                key={idx}
                className={`w-2 h-2 rounded-full transition-all ${
                  idx === currentStep ? 'bg-purple-500 w-6' : 'bg-gray-600'
                }`}
              />
            ))}
          </div>
          <button onClick={handleSkip} className="text-gray-400 hover:text-white text-sm">
            Omitir
          </button>
        </div>

        <div className={`w-20 h-20 bg-gradient-to-br ${current.color} rounded-2xl mx-auto flex items-center justify-center shadow-lg`}>
          <Icon className="w-10 h-10 text-white" />
        </div>

        <div className="text-center space-y-4">
          <h2 className="text-2xl font-bold text-white">{current.title}</h2>
          <p className="text-gray-300 text-lg leading-relaxed">{current.description}</p>
        </div>

        <div className="flex gap-3">
          <button
            onClick={handleSkip}
            className="flex-1 bg-gray-700 hover:bg-gray-600 text-white font-semibold py-3 rounded-xl transition-colors"
          >
            Saltar
          </button>
          <button
            onClick={handleNext}
            className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-bold py-3 rounded-xl transition-all"
          >
            {currentStep === steps.length - 1 ? '¡Comenzar!' : 'Siguiente →'}
          </button>
        </div>

        <p className="text-center text-gray-500 text-xs">
          Paso {currentStep + 1} de {steps.length}
        </p>
      </div>
    </div>
  );
}