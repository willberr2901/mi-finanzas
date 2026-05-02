import { useEffect } from 'react';
import { Shield, AlertTriangle } from 'lucide-react';

interface TermsModalProps {
  onAccept: () => void;
}

export default function TermsModal({ onAccept }: TermsModalProps) {
  useEffect(() => {
    const hasAccepted = localStorage.getItem('miFinanzasTermsAccepted');
    if (hasAccepted === 'true') {
      onAccept();
    }
  }, [onAccept]);

  const handleAccept = () => {
    localStorage.setItem('miFinanzasTermsAccepted', 'true');
    onAccept();
  };

  const handleReject = () => {
    localStorage.setItem('miFinanzasTermsAccepted', 'false');
    // Mostrar mensaje de rechazo
    alert('Has rechazado los términos. La aplicación no puede funcionar sin aceptarlos.');
  };

  return (
    <div className="fixed inset-0 bg-black/90 backdrop-blur-md z-50 flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-gray-800 rounded-3xl max-w-2xl w-full shadow-2xl border border-gray-700 my-8">
        <div className="p-8 space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-500 rounded-xl flex items-center justify-center">
                <Shield className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-white">Términos y Condiciones</h2>
                <p className="text-gray-400 text-sm">Versión Beta 1.0</p>
              </div>
            </div>
          </div>

          <div className="bg-yellow-900/30 border border-yellow-700 p-4 rounded-xl flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-yellow-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-yellow-400 font-semibold text-sm">Aplicación en Estado Beta</p>
              <p className="text-yellow-300/80 text-xs mt-1">
                Esta es una versión de prueba en desarrollo. Los datos pueden no ser completamente precisos.
              </p>
            </div>
          </div>

          <div className="prose prose-invert max-w-none space-y-4 text-gray-300 text-sm overflow-y-auto max-h-96 pr-4">
            <section>
              <h3 className="text-white font-bold text-lg mb-2">1. Naturaleza de la Aplicación</h3>
              <p>
                Mi Finanzas es una aplicación de gestión financiera personal en fase de desarrollo (Beta). 
                No nos hacemos responsables por decisiones financieras basadas en la información proporcionada.
              </p>
            </section>

            <section>
              <h3 className="text-white font-bold text-lg mb-2">2. Almacenamiento de Datos</h3>
              <p>
                Todos los datos se almacenan localmente en tu dispositivo. No recopilamos información personal 
                ni la compartimos con terceros. Eres responsable de hacer copias de seguridad.
              </p>
            </section>

            <section>
              <h3 className="text-white font-bold text-lg mb-2">3. Precisión de la Información</h3>
              <p>
                La aplicación proporciona estimaciones y proyecciones basadas en los datos ingresados. 
                Los resultados pueden variar de la realidad. Verifica siempre con fuentes oficiales.
              </p>
            </section>

            <section>
              <h3 className="text-white font-bold text-lg mb-2">4. Limitación de Responsabilidad</h3>
              <p>
                No nos hacemos responsables por:
              </p>
              <ul className="list-disc list-inside mt-2 space-y-1 text-gray-400">
                <li>Pérdidas financieras derivadas del uso de la app</li>
                <li>Errores en cálculos de créditos, peajes o presupuestos</li>
                <li>Problemas técnicos o pérdida de datos</li>
                <li>Información desactualizada de APIs externas</li>
              </ul>
            </section>

            <section>
              <h3 className="text-white font-bold text-lg mb-2">5. Aceptación</h3>
              <p>
                Al hacer clic en "Aceptar y Continuar", reconoces que has leído y aceptas estos términos 
                y condiciones de uso de la aplicación en estado Beta.
              </p>
            </section>
          </div>

          <div className="flex gap-3 pt-4 border-t border-gray-700">
            <button
              onClick={handleReject}
              className="flex-1 bg-gray-700 hover:bg-gray-600 text-white font-semibold py-4 rounded-xl transition-colors"
            >
              Rechazar y Salir
            </button>
            <button
              onClick={handleAccept}
              className="flex-1 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-bold py-4 rounded-xl transition-all"
            >
              Aceptar y Continuar ✓
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}