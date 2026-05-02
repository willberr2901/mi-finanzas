import { useEffect } from 'react';
import { useFinanceStore } from '../store/financeStore';
import BalanceCard from '../components/BalanceCard';
import TransactionForm from '../components/TransactionForm';
import TransactionList from '../components/TransactionList';
import ExpenseChart from '../components/ExpenseChart';

export default function FinancePage() {
  const { loadTransactions } = useFinanceStore();

  useEffect(() => {
    console.log('🔄 Cargando transacciones de finanzas...');
    loadTransactions();
  }, []); // ← Array vacío para que solo cargue una vez al entrar

  return (
    <div className="max-w-4xl mx-auto p-4 space-y-6">
      <header className="pt-4">
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          💰 Panel Financiero
        </h1>
        <p className="text-gray-400 text-sm">Control de ingresos y gastos generales</p>
      </header>

      <BalanceCard />
      <ExpenseChart />
      
      <div className="bg-gray-800 p-6 rounded-xl border border-gray-700">
        <h3 className="text-lg font-bold text-white mb-4">📝 Registrar Movimiento General</h3>
        <TransactionForm />
      </div>
      
      <div>
        <h3 className="text-lg font-bold text-white mb-4">📜 Historial General</h3>
        <TransactionList />
      </div>
    </div>
  );
}