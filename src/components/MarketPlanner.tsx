import { useState } from 'react';
import { Plus, ShoppingCart, ChevronRight } from 'lucide-react';
import { useFinanceStore } from '../store/financeStore';

const MARKET_CATEGORIES = ['Aseo', 'Plaza', 'Granos', 'Carnes', 'Lacteos', 'Panaderia'];

const KEYWORDS = {
  Aseo: ['jabon', 'shampoo', 'detergente', 'suavizante', 'blanqueador', 'cloro', 'limpiavidrios', 'escoba'],
  Plaza: ['tomate', 'cebolla', 'papa', 'lechuga', 'zanahoria', 'banano', 'mango', 'limon', 'cilantro'],
  Granos: ['arroz', 'lenteja', 'frijol', 'garbanzo', 'avena', 'frijoles'],
  Carnes: ['pollo', 'carne', 'cerdo', 'pescado', 'milanesa', 'huevo', 'huevos', 'res'],
  Lacteos: ['leche', 'queso', 'yogurt', 'mantequilla', 'crema', 'kumis'],
  Panaderia: ['pan', 'galletas', 'torta', 'quesitos']
};

function getCategory(item: string): string {
  const lowerItem = item.toLowerCase();
  for (const [category, keywords] of Object.entries(KEYWORDS)) {
    if (keywords.some(k => lowerItem.includes(k))) {
      return category;
    }
  }
  return 'Otros';
}

export default function MarketPlanner({ onStartShopping }: { onStartShopping: () => void }) {
  const { transactions, addTransaction } = useFinanceStore();
  const [newItem, setNewItem] = useState('');

  // Filtrar solo productos de mercado SIN precio (precio = 0 o null)
  const plannedItems = transactions.filter(t => 
    MARKET_CATEGORIES.includes(t.category) && t.description && !t.amount
  );

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItem.trim()) return;

    const category = getCategory(newItem);

    await addTransaction({
      type: 'expense',
      amount: 0, // SIN PRECIO AÚN
      category: category,
      description: newItem.trim(),
      date: new Date().toISOString(),
    });

    setNewItem('');
  };

  const grouped = plannedItems.reduce((acc, item) => {
    if (!acc[item.category]) acc[item.category] = [];
    acc[item.category].push(item);
    return acc;
  }, {} as Record<string, typeof plannedItems>);

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-6 rounded-2xl shadow-lg">
        <h2 className="text-2xl font-bold text-white mb-2">📝 Planificar Mercado</h2>
        <p className="text-white/80 text-sm">Agrega los productos que necesitas comprar</p>
      </div>

      {/* Formulario rápido */}
      <form onSubmit={handleAdd} className="flex gap-2">
        <input
          type="text"
          placeholder="Producto (ej: Arroz, Jabón, Tomate...)"
          value={newItem}
          onChange={e => setNewItem(e.target.value)}
          className="flex-1 px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:ring-2 focus:ring-blue-500 outline-none"
        />
        <button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-bold transition-colors">
          <Plus className="w-6 h-6" />
        </button>
      </form>

      {/* Lista clasificada */}
      <div className="space-y-4">
        {Object.keys(grouped).length === 0 ? (
          <div className="text-center text-gray-500 py-12 bg-gray-800/50 rounded-xl">
            <ShoppingCart className="w-16 h-16 mx-auto mb-3 opacity-50" />
            <p className="text-lg">Tu lista está vacía</p>
            <p className="text-sm mt-1">Agrega productos arriba</p>
          </div>
        ) : (
          Object.entries(grouped).map(([category, items]) => (
            <div key={category} className="bg-gray-800 rounded-xl overflow-hidden border border-gray-700">
              <div className="px-4 py-3 bg-gray-700/50 border-b border-gray-700">
                <h4 className="font-bold text-white flex items-center gap-2">
                  <ChevronRight className="w-5 h-5 text-blue-400" /> 
                  {category}
                  <span className="text-xs bg-blue-600 px-2 py-1 rounded-full">{items.length}</span>
                </h4>
              </div>
              <div className="divide-y divide-gray-700/50">
                {items.map(item => (
                  <div key={item.id} className="px-4 py-3 flex justify-between items-center">
                    <div>
                      <p className="text-white font-medium capitalize">{item.description}</p>
                      <p className="text-xs text-gray-500">Sin precio</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Botón para ir a comprar */}
      {plannedItems.length > 0 && (
        <button
          onClick={onStartShopping}
          className="w-full bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-bold py-4 rounded-xl shadow-lg transition-all transform hover:scale-105"
        >
          🛍️ Ir a Hacer Mercado ({plannedItems.length} productos)
        </button>
      )}
    </div>
  );
}