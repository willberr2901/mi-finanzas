import { Trash2 } from 'lucide-react';
import { useFinanceStore } from '../store/financeStore';

export default function TransactionList() {
  const { transactions, deleteTransaction, isLoading } = useFinanceStore();

  if (isLoading) {
    return <div className="text-center text-gray-400 py-8">Cargando...</div>;
  }

  if (transactions.length === 0) {
    return (
      <div className="text-center text-gray-400 py-8">
        <p>No hay transacciones registradas</p>
        <p className="text-sm mt-2">¡Agrega tu primera transacción!</p>
      </div>
    );
  }

  const sortedTransactions = [...transactions].sort((a, b) => 
    new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  return (
    <div className="bg-gray-800 rounded-xl shadow-lg overflow-hidden">
      <div className="p-4 border-b border-gray-700">
        <h3 className="text-lg font-bold text-white">Transacciones Recientes</h3>
      </div>
      
      <div className="divide-y divide-gray-700 max-h-96 overflow-y-auto">
        {sortedTransactions.map((tx) => (
          <div key={tx.id} className="p-4 hover:bg-gray-700/50 transition-colors flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center ${tx.type === 'income' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'}`}>
                {tx.type === 'income' ? '↑' : '↓'}
              </div>
              <div>
                <p className="text-white font-medium">{tx.category}</p>
                <p className="text-sm text-gray-400">
                  {new Date(tx.date).toLocaleDateString('es-CO')}
                </p>
                {tx.description && (
                  <p className="text-xs text-gray-500">{tx.description}</p>
                )}
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <span className={`text-lg font-bold ${tx.type === 'income' ? 'text-emerald-400' : 'text-red-400'}`}>
                {tx.type === 'income' ? '+' : '-'}${tx.amount.toLocaleString('es-CO', { minimumFractionDigits: 0 })}
              </span>
              <button
                onClick={() => deleteTransaction(tx.id)}
                className="p-2 text-gray-400 hover:text-red-400 transition-colors"
                title="Eliminar"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}