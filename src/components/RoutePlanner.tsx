import { MapPin, AlertCircle } from 'lucide-react';

export default function RoutePlanner() {
  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="text-center space-y-6 max-w-md">
        <div className="w-24 h-24 bg-gradient-to-br from-gray-600 to-gray-700 rounded-full mx-auto flex items-center justify-center">
          <MapPin className="w-12 h-12 text-gray-400" />
        </div>
        
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">🚧 Próximamente</h1>
          <p className="text-gray-400">
            Estamos trabajando en esta función. Muy pronto podrás calcular rutas, 
            peajes y planificar tus viajes por Colombia.
          </p>
        </div>

        <div className="bg-gray-800 p-6 rounded-2xl border border-gray-700 text-left space-y-3">
          <h3 className="text-white font-bold flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-blue-400" />
            Características que incluirá:
          </h3>
          <ul className="text-gray-300 space-y-2 text-sm">
            <li className="flex items-center gap-2">
              <span className="text-green-400">✓</span>
              Cálculo de rutas entre ciudades
            </li>
            <li className="flex items-center gap-2">
              <span className="text-green-400">✓</span>
              Peajes y costos estimados
            </li>
            <li className="flex items-center gap-2">
              <span className="text-green-400">✓</span>
              Mapa interactivo estilo Waze
            </li>
          </ul>
        </div>

        <p className="text-gray-500 text-sm">
          ¡Gracias por tu paciencia!
        </p>
      </div>
    </div>
  );
}