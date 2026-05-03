import { useEffect } from 'react';
import { useFinanceStore } from '../store/financeStore';
import { Wallet, TrendingUp, TrendingDown, Plus } from 'lucide-react';
import TransactionForm from '../components/TransactionForm';
import TransactionList from '../components/TransactionList';
import ExpenseChart from '../components/ExpenseChart';

const GLASS_STYLE = {
  background: 'rgba(255, 255, 255, 0.05)',
  backdropFilter: 'blur(16px)',
  border: '1px solid rgba(255, 255, 255, 0.1)',
  boxShadow: '0 4px 30px rgba(0, 0, 0, 0.1)',
};

export default function FinancePage() {
  const { transactions, loadTransactions, getTotalIncome, getTotalExpense, getBalance } = useFinanceStore();

  useEffect(() => {
    loadTransactions();
  }, [loadTransactions]);

  const totalIncome = getTotalIncome();
  const totalExpense = getTotalExpense();
  const balance = getBalance();

  const formatMoney = (amount: number) =>
    amount.toLocaleString('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 });

  return (
    <div className="max-w-4xl mx-auto p-4 space-y-6 pb-24">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-green-400 to-cyan-500 flex items-center justify-center shadow-[0_0_15px_rgba(0,255,163,0.4)]">
          <Wallet className="w-6 h-6 text-black" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Panel Financiero</h1>
          <p className="text-xs text-gray-400">Control de ingresos y gastos</p>
        </div>
      </div>

      <div className="rounded-3xl p-6 relative overflow-hidden" style={GLASS_STYLE}>
        <div className="absolute top-0 right-0 w-40 h-40 bg-green-500/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
        
        <div className="relative z-10">
          <p className="text-sm font-medium text-gray-300 mb-1 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-green-400 shadow-[0_0_8px_rgba(74,222,128,0.8)]"></span>
            Saldo Total
          </p>
          <h2 className="text-4xl font-extrabold text-white mb-6 tracking-tight">
            {formatMoney(balance)}
          </h2>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-black/20 p-3 rounded-xl border border-white/5">
              <div className="flex items-center gap-2 mb-1">
                <TrendingUp className="w-4 h-4 text-green-400" />
                <span className="text-xs text-gray-400">Ingresos</span>
              </div>
              <p className="text-lg font-bold text-green-400">{formatMoney(totalIncome)}</p>
            </div>

            <div className="bg-black/20 p-3 rounded-xl border border-white/5">
              <div className="flex items-center gap-2 mb-1">
                <TrendingDown className="w-4 h-4 text-red-400" />
                <span className="text-xs text-gray-400">Gastos</span>
              </div>
              <p className="text-lg font-bold text-red-400">{formatMoney(totalExpense)}</p>
            </div>
          </div>
        </div>
      </div>

      {transactions.length > 0 && (
        <div className="rounded-2xl p-4" style={GLASS_STYLE}>
          <h3 className="text-sm font-semibold text-gray-300 mb-4">Distribución de Gastos</h3>
          <ExpenseChart />
        </div>
      )}

      <div className="rounded-2xl p-5" style={GLASS_STYLE}>
        <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
          <Plus className="w-5 h-5 text-cyan-400" />
          Registrar Movimiento
        </h3>
        <TransactionForm />
      </div>

      <div>
        <h3 className="text-sm font-semibold text-gray-400 mb-3 uppercase tracking-wider">Historial Reciente</h3>
        <TransactionList />
      </div>
    </div>
  );
}