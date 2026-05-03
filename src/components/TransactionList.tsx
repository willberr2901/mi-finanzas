import { useFinanceStore } from '../store/financeStore';
import { Trash2, TrendingUp, TrendingDown } from 'lucide-react';

export default function TransactionList() {
  const { transactions, deleteTransaction } = useFinanceStore();

  const formatMoney = (amount: number) =>
    amount.toLocaleString('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 });

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-CO', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  if (transactions.length === 0) {
    return (
      <div 
        className="rounded-xl p-8 text-center border border-white/5"
        style={{
          background: 'rgba(255, 255, 255, 0.03)',
          backdropFilter: 'blur(12px)',
        }}
      >
        <p className="text-gray-500">No hay transacciones registradas</p>
        <p className="text-sm text-gray-600 mt-1">¡Agrega tu primera transacción!</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {transactions.map((transaction) => (
        <div
          key={transaction.id}
          className="flex items-center justify-between p-4 rounded-xl border border-white/5 group hover:border-white/10 transition-all"
          style={{
            background: 'rgba(255, 255, 255, 0.03)',
            backdropFilter: 'blur(12px)',
          }}
        >
          <div className="flex items-center gap-3 flex-1">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
              transaction.type === 'income' 
                ? 'bg-green-500/20 text-green-400' 
                : 'bg-red-500/20 text-red-400'
            }`}>
              {transaction.type === 'income' ? (
                <TrendingUp className="w-5 h-5" />
              ) : (
                <TrendingDown className="w-5 h-5" />
              )}
            </div>
            
            <div className="flex-1 min-w-0">
              <p className="text-white font-semibold truncate">{transaction.category}</p>
              {transaction.description && (
                <p className="text-xs text-gray-500 truncate">{transaction.description}</p>
              )}
              <p className="text-[10px] text-gray-600">{formatDate(transaction.date)}</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <span className={`text-lg font-bold ${
              transaction.type === 'income' ? 'text-green-400' : 'text-red-400'
            }`}>
              {transaction.type === 'income' ? '+' : '-'} {formatMoney(transaction.amount)}
            </span>
            
            <button
              onClick={() => deleteTransaction(transaction.id)}
              className="opacity-0 group-hover:opacity-100 p-2 text-gray-600 hover:text-red-400 transition-all"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}