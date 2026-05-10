import { Link } from 'react-router-dom';
import { ShoppingCart, DollarSign, CreditCard, TrendingUp, AlertTriangle } from 'lucide-react';
import Card from '../components/ui/Card';

export default function HomePage() {
  return (
    <div className="space-y-6">
      {/* Saludo */}
      <div>
        <h1 className="text-2xl font-bold text-white">Mi Finanzas</h1>
        <p className="text-slate-400">Bienvenido de nuevo 👋</p>
      </div>

      {/* Score Financiero */}
      <Card className="relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-red-500/10 rounded-full blur-2xl -mr-8 -mt-8"></div>
        
        <div className="relative">
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="text-4xl font-bold text-white">8<span className="text-lg text-slate-400">/100</span></div>
              <div className="flex items-center gap-2 mt-1">
                <div className="w-2 h-2 rounded-full bg-red-500"></div>
                <span className="text-sm text-red-400">Requiere atención</span>
              </div>
            </div>
            <div className="w-24 h-24 rounded-full border-4 border-slate-700 border-t-red-500 rotate-45"></div>
          </div>
          <p className="text-xs text-slate-500">Salud Financiera Local</p>
        </div>
      </Card>

      {/* Predicción de Flujo */}
      <Card className="bg-red-950/20 border-red-500/20">
        <div className="flex items-start gap-3">
          <div className="p-2 bg-red-500/10 rounded-xl">
            <AlertTriangle size={20} className="text-red-400" />
          </div>
          <div className="flex-1">
            <h3 className="text-white font-semibold">Predicción de Flujo</h3>
            <p className="text-sm text-slate-300 mt-1">
              ⚠️ Posible saldo negativo al fin de mes.
            </p>
            <p className="text-xs text-slate-400 mt-1">
              Gasto diario promedio: $56,850,767
            </p>
          </div>
        </div>
      </Card>

      {/* Accesos Rápidos */}
      <div>
        <h2 className="text-lg font-bold text-white mb-3">Accesos rápidos</h2>
        <div className="grid grid-cols-2 gap-3">
          <Link to="/mercado" className="block">
            <Card className="p-4 hover:bg-[#1a2332] transition-colors group">
              <ShoppingCart size={24} className="text-green-400 mb-2 group-hover:scale-110 transition-transform" />
              <p className="text-white font-medium">Mercado</p>
            </Card>
          </Link>
          
          <Link to="/finanzas" className="block">
            <Card className="p-4 hover:bg-[#1a2332] transition-colors group">
              <DollarSign size={24} className="text-blue-400 mb-2 group-hover:scale-110 transition-transform" />
              <p className="text-white font-medium">Finanzas</p>
            </Card>
          </Link>
          
          <Link to="/creditos" className="block">
            <Card className="p-4 hover:bg-[#1a2332] transition-colors group">
              <CreditCard size={24} className="text-purple-400 mb-2 group-hover:scale-110 transition-transform" />
              <p className="text-white font-medium">Créditos</p>
            </Card>
          </Link>
          
          <Link to="/rentabilidad" className="block">
            <Card className="p-4 hover:bg-[#1a2332] transition-colors group">
              <TrendingUp size={24} className="text-orange-400 mb-2 group-hover:scale-110 transition-transform" />
              <p className="text-white font-medium">Rentabilidad</p>
            </Card>
          </Link>
        </div>
      </div>

      {/* Guía Rápida */}
      <Card className="p-4">
        <h3 className="text-white font-semibold mb-3 flex items-center gap-2">
          <span className="w-5 h-5 rounded-full bg-blue-500/20 flex items-center justify-center text-[10px]">i</span>
          Guía Rápida
        </h3>
        <ul className="space-y-2 text-sm text-slate-300">
          <li className="flex items-start gap-2">
            <span className="text-violet-400">•</span>
            <span><strong>Score 0-100:</strong> Tu salud financiera calculada localmente.</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-violet-400">•</span>
            <span><strong>Predicción:</strong> Proyección de flujo basada en tus últimos 30 días.</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-violet-400">•</span>
            <span><strong>Reglas locales:</strong> Alertas inteligentes sin conexión a la nube.</span>
          </li>
        </ul>
      </Card>
    </div>
  );
}