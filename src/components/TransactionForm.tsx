import { useState } from 'react';
import { useFinanceStore } from '../store/financeStore';
import { Plus, TrendingUp, TrendingDown } from 'lucide-react';
import { notifyExpenseAdded, notifyIncomeAdded } from '../services/notificationService';

export default function TransactionForm() {
  const { addTransaction } = useFinanceStore();
  const [type, setType] = useState<'income' | 'expense'>('expense');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('');
  const [description, setDescription] = useState('');

  const categories = {
    expense: ['Alimentación', 'Transporte', 'Vivienda', 'Servicios', 'Salud', 'Educación', 'Ocio', 'Otros'],
    income: ['Salario', 'Ventas', 'Inversiones', 'Regalos', 'Otros'],
  };

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

    if (type === 'expense') notifyExpenseAdded(category, parseFloat(amount));
    else notifyIncomeAdded(category, parseFloat(amount));

    setAmount('');
    setDescription('');
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      
      {/* Toggle Tipo (Compacto) */}
      <div className="flex p-1 bg-black/30 rounded-xl border border-white/5 relative">
        <div 
          className={`absolute top-1 bottom-1 w-[calc(50%-4px)] bg-gradient-to-r ${type === 'expense' ? 'from-red-500 to-orange-500' : 'from-green-500 to-emerald-500'} rounded-lg transition-all duration-300 shadow-lg`}
          style={{ left: type === 'expense' ? '4px' : 'calc(50% + 0px)' }}
        />
        <button
          type="button"
          onClick={() => setType('expense')}
          className={`flex-1 py-2 rounded-lg text-sm font-bold flex items-center justify-center gap-2 transition-colors z-10 ${type === 'expense' ? 'text-white' : 'text-gray-500 hover:text-gray-300'}`}
        >
          <TrendingDown className="w-4 h-4" /> Gasto
        </button>
        <button
          type="button"
          onClick={() => setType('income')}
          className={`flex-1 py-2 rounded-lg text-sm font-bold flex items-center justify-center gap-2 transition-colors z-10 ${type === 'income' ? 'text-white' : 'text-gray-500 hover:text-gray-300'}`}
        >
          <TrendingUp className="w-4 h-4" /> Ingreso
        </button>
      </div>

      {/* Inputs Grid */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1">
          <label className="text-[10px] font-bold text-gray-500 uppercase ml-1">Monto</label>
          <div className="relative">
            <span className="absolute left-3 top-3 text-gray-500">$</span>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.00"
              className="w-full pl-8 pr-3 py-2.5 bg-black/20 border border-white/10 rounded-xl text-white placeholder-gray-600 focus:outline-none focus:border-green-400/50 transition-all"
              required
            />
          </div>
        </div>

        <div className="space-y-1">
          <label className="text-[10px] font-bold text-gray-500 uppercase ml-1">Categoría</label>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="w-full px-3 py-2.5 bg-black/20 border border-white/10 rounded-xl text-white focus:outline-none focus:border-green-400/50 transition-all appearance-none cursor-pointer text-sm"
            required
          >
            <option value="" className="bg-gray-900">Seleccionar</option>
            {categories[type].map((cat) => (
              <option key={cat} value={cat} className="bg-gray-900">{cat}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Botón Submit */}
      <button
        type="submit"
        className="w-full py-3.5 rounded-xl font-bold text-black shadow-[0_0_20px_rgba(34,197,94,0.4)] hover:scale-[1.02] transition-all flex items-center justify-center gap-2 bg-gradient-to-r from-green-400 to-cyan-400"
      >
        <Plus className="w-5 h-5" />
        Agregar {type === 'expense' ? 'Gasto' : 'Ingreso'}
      </button>
    </form>
  );
}