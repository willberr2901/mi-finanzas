import { useState } from 'react';
import { Check, X } from 'lucide-react';
import { useFinanceStore } from '../store/financeStore';

export default function MarketActive({ onFinish }: { onFinish: () => void }) {
  const { transactions, addTransaction } = useFinanceStore();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [tempPrice, setTempPrice] = useState('');

  // Productos planificados que aún no tienen precio
  const itemsWithoutPrice = transactions.filter(t => 
    ['Aseo', 'Plaza', 'Granos', 'Carnes', 'Lacteos', 'Panaderia'].includes(t.category) && 
    (!t.amount || t.amount === 0)
  );

  // Productos que ya tienen precio
  const itemsWithPrice = transactions.filter(t => 
    ['Aseo', 'Plaza', 'Granos', 'Carnes', 'Lacteos', 'Panaderia'].includes(t.category) && 
    t.amount && t.amount > 0
  );

  const total = itemsWithPrice.reduce((sum, item) => sum + item.amount, 0);

  const handleAddPrice = async (id: string, description: string, category: string) => {
    if (!tempPrice) return;

    await addTransaction({
      type: 'expense',
      amount: parseFloat(tempPrice),
      category,
      description,
      date: new Date().toISOString(),
    });

    setEditingId(null);
    setTempPrice('');
  };

  const grouped = itemsWithPrice.reduce((acc, item) => {
    if (!acc[item.category]) acc[item.category] = [];
    acc[item.category].push(item);
    return acc;
  }, {} as Record<string, typeof itemsWithPrice>);

  return (
    <div className="space-y-4">
      {/* Total en tiempo real - FIJO ARRIBA */}
      <div className="bg-gradient-to-r from-green-500 to-emerald-600 p-6 rounded-2xl shadow-lg sticky top-20 z-40">
        <p className="text-white/80 text-sm font-semibold uppercase">Total en Canasta</p>
        <p className="text-5xl font-bold text-white">${total.toLocaleString('es-CO', { minimumFractionDigits: 0 })}</p>
        <p className="text-white/60 text-xs mt-2">{itemsWithPrice.length} de {itemsWithoutPrice.length + itemsWithPrice.length} productos</p>
      </div>

      {/* Productos sin precio - Para agregar */}
      <div className="space-y-2">
        <h3 className="text-lg font-bold text-white mb-3">📦 Por Agregar ({itemsWithoutPrice.length})</h3>
        {itemsWithoutPrice.map(item => (
          <div key={item.id} className="bg-gray-800 p-4 rounded-xl border border-gray-700">
            <div className="flex items-center justify-between mb-2">
              <div>
                <p className="text-white font-medium capitalize text-lg">{item.description}</p>
                <p className="text-xs text-gray-500">{item.category}</p>
              </div>
              {editingId === item.id ? (
                <div className="flex gap-2">
                  <input
                    type="number"
                    placeholder="$ Precio"
                    value={tempPrice}
                    onChange={e => setTempPrice(e.target.value)}
                    className="w-28 px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white text-right outline-none focus:ring-2 focus:ring-green-500"
                    autoFocus
                  />
                  <button
                    onClick={() => handleAddPrice(item.id, item.description, item.category)}
                    className="bg-green-600 p-2 rounded-lg text-white"
                  >
                    <Check className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => { setEditingId(null); setTempPrice(''); }}
                    className="bg-gray-600 p-2 rounded-lg text-white"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => { setEditingId(item.id); setTempPrice(''); }}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
                >
                  Agregar
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Productos con precio - Ya agregados */}
      {Object.keys(grouped).length > 0 && (
        <div className="space-y-2">
          <h3 className="text-lg font-bold text-white mb-3">✅ Agregados</h3>
          {Object.entries(grouped).map(([category, items]) => (
            <div key={category} className="bg-gray-800 rounded-xl overflow-hidden border border-gray-700">
              <div className="px-4 py-2 bg-gray-700/50 border-b border-gray-700">
                <h4 className="font-bold text-gray-300">{category}</h4>
              </div>
              <div className="divide-y divide-gray-700/50">
                {items.map(item => (
                  <div key={item.id} className="px-4 py-3 flex justify-between items-center">
                    <p className="text-white font-medium capitalize">{item.description}</p>
                    <span className="text-green-400 font-bold">${item.amount.toLocaleString('es-CO')}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Botón finalizar */}
      {itemsWithPrice.length > 0 && (
        <button
          onClick={onFinish}
          className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-bold py-4 rounded-xl shadow-lg transition-all"
        >
          ✅ Finalizar Compra
        </button>
      )}
    </div>
  );
}