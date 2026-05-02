import { TrendingUp, TrendingDown, DollarSign } from 'lucide-react';
import { useFinanceStore } from '../store/financeStore';

export default function BalanceCard() {
  const { getBalance, getTotalIncome, getTotalExpense } = useFinanceStore();
  
  const balance = getBalance();
  const income = getTotalIncome();
  const expense = getTotalExpense();

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
      {/* Balance Total */}
      <div className={`p-6 rounded-xl shadow-lg ${balance >= 0 ? 'bg-gradient-to-br from-emerald-500 to-emerald-700' : 'bg-gradient-to-br from-red-500 to-red-700'}`}>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-white/80 text-sm font-medium">Balance Total</p>
            <p className="text-3xl font-bold text-white mt-1">
              ${balance.toLocaleString('es-CO', { minimumFractionDigits: 0 })}
            </p>
          </div>
          <div className="bg-white/20 p-3 rounded-lg">
            <DollarSign className="w-8 h-8 text-white" />
          </div>
        </div>
      </div>

      {/* Ingresos */}
      <div className="p-6 rounded-xl shadow-lg bg-gradient-to-br from-blue-500 to-blue-700">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-white/80 text-sm font-medium">Ingresos</p>
            <p className="text-3xl font-bold text-white mt-1">
              ${income.toLocaleString('es-CO', { minimumFractionDigits: 0 })}
            </p>
          </div>
          <div className="bg-white/20 p-3 rounded-lg">
            <TrendingUp className="w-8 h-8 text-white" />
          </div>
        </div>
      </div>

      {/* Gastos */}
      <div className="p-6 rounded-xl shadow-lg bg-gradient-to-br from-orange-500 to-orange-700">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-white/80 text-sm font-medium">Gastos</p>
            <p className="text-3xl font-bold text-white mt-1">
              ${expense.toLocaleString('es-CO', { minimumFractionDigits: 0 })}
            </p>
          </div>
          <div className="bg-white/20 p-3 rounded-lg">
            <TrendingDown className="w-8 h-8 text-white" />
          </div>
        </div>
      </div>
    </div>
  );
}