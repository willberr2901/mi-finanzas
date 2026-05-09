import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ShoppingCart, DollarSign, CreditCard, PieChart, TrendingDown, Info } from 'lucide-react';
import HealthGauge from '../components/HealthGauge';
import { predictCashFlow } from '../services/financialIntelligence';
import type { Transaction, SavingsGoal } from '../utils/database';
import { db } from '../utils/database';

export default function HomePage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [goals, setGoals] = useState<SavingsGoal[]>([]);
  const [prediction, setPrediction] = useState<any>(null);

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (transactions.length > 0) {
      setPrediction(predictCashFlow(transactions, 0));
    }
  }, [transactions]);

  const loadData = async () => {
    try {
      const txs = await db.transactions.toArray();
      const gals = await db.goals.toArray();
      setTransactions(txs.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
      setGoals(gals);
    } catch {}
  };

  const formatCurrency = (v: number) => v.toLocaleString('es-CO', { minimumFractionDigits: 2 });

  return (
    <div className="p-4 pb-24 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-white">Mi Finanzas</h1>
          <p className="text-gray-400 text-sm">Bienvenido de nuevo 👋</p>
        </div>
      </div>

      <HealthGauge transactions={transactions} goals={goals} balance={0} />

      {prediction && (
        <div className={`p-4 rounded-xl border ${prediction.status === 'critical' ? 'bg-red-900/20 border-red-500/30' : prediction.status === 'warning' ? 'bg-yellow-900/20 border-yellow-500/30' : 'bg-emerald-900/20 border-emerald-500/30'}`}>
          <div className="flex items-start gap-3">
            <TrendingDown className={`mt-1 ${prediction.status === 'critical' ? 'text-red-400' : prediction.status === 'warning' ? 'text-yellow-400' : 'text-emerald-400'}`} size={20} />
            <div>
              <h3 className="font-bold text-white text-sm">Predicción de Flujo</h3>
              <p className="text-xs text-gray-300 mt-1">
                {prediction.status === 'critical' ? '⚠️ Posible saldo negativo al fin de mes.' : 
                 prediction.status === 'warning' ? '📉 Quedan pocos días con tu presupuesto.' : 
                 '✅ Flujo positivo proyectado.'}
              </p>
              <p className="text-xs text-gray-400 mt-1">Gasto diario promedio: ${formatCurrency(prediction.dailyBurn)}</p>
            </div>
          </div>
        </div>
      )}

      <div>
        <h3 className="text-white font-bold mb-3">Accesos rápidos</h3>
        <div className="grid grid-cols-2 gap-3">
          <Link to="/mercado" className="bg-gray-800/50 backdrop-blur p-4 rounded-xl border border-gray-700 flex flex-col items-center justify-center gap-2 hover:bg-gray-700/50 transition-colors">
            <ShoppingCart className="text-green-400" size={24} />
            <span className="text-xs text-gray-300">Mercado</span>
          </Link>
          <Link to="/finanzas" className="bg-gray-800/50 backdrop-blur p-4 rounded-xl border border-gray-700 flex flex-col items-center justify-center gap-2 hover:bg-gray-700/50 transition-colors">
            <DollarSign className="text-blue-400" size={24} />
            <span className="text-xs text-gray-300">Finanzas</span>
          </Link>
          <Link to="/creditos" className="bg-gray-800/50 backdrop-blur p-4 rounded-xl border border-gray-700 flex flex-col items-center justify-center gap-2 hover:bg-gray-700/50 transition-colors">
            <CreditCard className="text-purple-400" size={24} />
            <span className="text-xs text-gray-300">Créditos</span>
          </Link>
          <Link to="/rentabilidad" className="bg-gray-800/50 backdrop-blur p-4 rounded-xl border border-gray-700 flex flex-col items-center justify-center gap-2 hover:bg-gray-700/50 transition-colors">
            <PieChart className="text-orange-400" size={24} />
            <span className="text-xs text-gray-300">Rentabilidad</span>
          </Link>
        </div>
      </div>

      <div className="bg-gray-800/50 p-4 rounded-xl border border-gray-700">
        <h3 className="text-white font-bold mb-2 flex items-center gap-2">
          <Info size={18} className="text-blue-400" /> Guía Rápida
        </h3>
        <ul className="text-sm text-gray-300 space-y-2 list-disc pl-5">
          <li><strong>Score 0-100:</strong> Tu salud financiera calculada localmente.</li>
          <li><strong>Predicción:</strong> Proyección de flujo basada en tus últimos 30 días.</li>
          <li><strong>Reglas locales:</strong> Alertas inteligentes sin conexión a la nube.</li>
        </ul>
      </div>
    </div>
  );
}