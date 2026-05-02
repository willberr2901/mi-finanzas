import { useState } from 'react';
import { PlusCircle } from 'lucide-react';
import { useFinanceStore } from '../store/financeStore';
import { notifyExpenseAdded, notifyIncomeAdded } from '../services/notificationService';

const categories = {
  income: ['Salario', 'Freelance', 'Ahorros', 'Otros Ingresos'],
  expense: ['Vivienda', 'Servicios', 'Transporte', 'Educación', 'Salud', 'Entretenimiento', 'Otros Gastos']
};

export default function TransactionForm() {
  const { addTransaction } = useFinanceStore();
  const [type, setType] = useState<'income' | 'expense'>('expense');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('Alimentación');
  const [description, setDescription] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!amount || !category) return;

    await addTransaction({
      type,
      amount: parseFloat(amount),
      category,
      description,
      date: new Date().toISOString(),
    });
    
    // Notificación
  if (type === 'expense') {
    notifyExpenseAdded(category, parseFloat(amount));
  } else {
    notifyIncomeAdded(category, parseFloat(amount));
  }

    // Reset form
    setAmount('');
    setDescription('');
  };

  return (
    <form onSubmit={handleSubmit} className="bg-gray-800 p-6 rounded-xl shadow-lg mb-6">
      <h3 className="text-xl font-bold text-white mb-4">Nueva Transacción</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        {/* Tipo */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">Tipo</label>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => { setType('expense'); setCategory('Alimentación'); }}
              className={`flex-1 py-2 px-4 rounded-lg transition-colors ${type === 'expense' ? 'bg-red-600 text-white' : 'bg-gray-700 text-gray-300'}`}
            >
              Gasto
            </button>
            <button
              type="button"
              onClick={() => { setType('income'); setCategory('Salario'); }}
              className={`flex-1 py-2 px-4 rounded-lg transition-colors ${type === 'income' ? 'bg-emerald-600 text-white' : 'bg-gray-700 text-gray-300'}`}
            >
              Ingreso
            </button>
          </div>
        </div>

        {/* Monto */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">Monto ($)</label>
          <input
            type="number"
            step="0.01"
            min="0"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="0.00"
            className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>

        {/* Categoría */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">Categoría</label>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {categories[type].map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
        </div>

        {/* Descripción */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">Descripción</label>
          <input
            type="text"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Opcional"
            className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      <button
        type="submit"
        className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors flex items-center justify-center gap-2"
      >
        <PlusCircle className="w-5 h-5" />
        Agregar {type === 'income' ? 'Ingreso' : 'Gasto'}
      </button>
    </form>
  );
}