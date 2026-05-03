import { useState, useEffect } from 'react';
import { Plus, Trash2, ShoppingCart, Check } from 'lucide-react';
import { useMarketStore } from '../store/marketStore';
import { notifyMarketItemAdded, notifyMarketCompleted, notifyPriceChange } from '../services/notificationService';

function formatPrice(num: number): string {
  return num.toLocaleString('es-CO', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
}

function parsePrice(str: string): number {
  const cleaned = str.replace(/[.$,]/g, '');
  return parseInt(cleaned) || 0;
}

// Diccionario de categorías
const KEYWORDS: Record<string, string[]> = {
  'Plaza': ['tomate', 'cebolla', 'papa', 'lechuga', 'zanahoria', 'banano', 'mango', 'limon', 'limón', 'cilantro', 'perejil', 'apio', 'ajo'],
  'Granos': ['arroz', 'lenteja', 'frijol', 'garbanzo', 'avena', 'panela', 'azucar', 'azúcar', 'harina', 'sal', 'pimienta'],
  'Carnes': ['pollo', 'carne', 'cerdo', 'pescado', 'huevo', 'huevos', 'res', 'salchicha', 'jamon'],
  'Lacteos': ['leche', 'yogurt', 'mantequilla', 'crema', 'kumis', 'queso', 'helado'],
  'Panaderia': ['pan', 'galletas', 'torta', 'quesitos', 'empanada'],
  'Bebidas': ['gaseosa', 'jugo', 'agua', 'cerveza', 'ron', 'cafe', 'café', 'ramo', 'chocolate'],
  'Aseo': ['jabon', 'jabón', 'shampoo', 'detergente', 'suavizante', 'blanqueador', 'cloro', 'papel higienico', 'soflan', 'desodorante']
};

function getCategory(item: string): string {
  const lower = item.toLowerCase();
  for (const [cat, words] of Object.entries(KEYWORDS)) {
    if (words.some(w => lower.includes(w))) return cat;
  }
  return 'Otros';
}

export default function MarketList() {
  const { items, loadItems, addItem, updatePrice, deleteItem, completePurchase, getTotal, getCountWithPrice } = useMarketStore();
  
  const [newItem, setNewItem] = useState('');
  const [newPrice, setNewPrice] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingPrice, setEditingPrice] = useState('');

  useEffect(() => {
    loadItems();
  }, [loadItems]);

  const total = getTotal();
  const countWithPrice = getCountWithPrice();

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItem.trim()) return;

    const price = newPrice ? parsePrice(newPrice) : 0;
    const category = getCategory(newItem);

    await addItem({
      name: newItem.trim(),
      price,
      category,
      date: new Date().toISOString(),
      completed: false,
    });

    // Notificación al agregar
    if (price > 0) {
      notifyMarketItemAdded(newItem.trim(), price);
    }

    setNewItem('');
    setNewPrice('');
  };

  const handleSavePrice = async (id: string) => {
    const item = items.find(i => i.id === id);
    if (!item) return;

    const newPriceValue = parsePrice(editingPrice);
    
    // Notificación al cambiar precio
    if (item.price !== newPriceValue && item.price > 0) {
      notifyPriceChange(item.name, item.price, newPriceValue);
    }
    
    await updatePrice(id, newPriceValue);
    setEditingId(null);
    setEditingPrice('');
  };

  const handleDelete = async (id: string) => {
    await deleteItem(id);
  };

  const startEdit = (item: typeof items[0]) => {
    setEditingId(item.id);
    setEditingPrice(item.price > 0 ? item.price.toString() : '');
  };

  const grouped = items.reduce((acc, item) => {
    if (!acc[item.category]) acc[item.category] = [];
    acc[item.category].push(item);
    return acc;
  }, {} as Record<string, typeof items>);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between bg-gray-800 p-4 rounded-xl border border-gray-700 sticky top-4 z-40 shadow-xl">
        <div>
          <p className="text-gray-400 text-sm font-medium">MERCADO TOTAL</p>
          <p className="text-xs text-gray-500">{countWithPrice} de {items.length} con precio</p>
        </div>
        <div className="text-right">
          <p className="text-3xl font-bold text-green-400">${formatPrice(total)}</p>
        </div>
      </div>

      <form onSubmit={handleAdd} className="flex gap-2">
        <input
          type="text"
          placeholder="Producto (ej: Arroz, Jabón...)"
          value={newItem}
          onChange={e => setNewItem(e.target.value)}
          className="flex-1 px-4 py-3 bg-gray-800 border border-gray-700 rounded-xl text-white focus:ring-2 focus:ring-green-500 outline-none"
        />
        <input
          type="text"
          placeholder="$0"
          value={newPrice}
          onChange={e => setNewPrice(e.target.value)}
          className="w-28 px-4 py-3 bg-gray-800 border border-gray-700 rounded-xl text-white text-right focus:ring-2 focus:ring-green-500 outline-none"
        />
        <button type="submit" className="bg-green-600 hover:bg-green-700 text-white px-5 rounded-xl font-bold">
          <Plus className="w-6 h-6" />
        </button>
      </form>

      <div className="space-y-4">
        {items.length === 0 ? (
          <div className="text-center text-gray-500 py-12 bg-gray-800/30 rounded-2xl border-2 border-dashed border-gray-700">
            <ShoppingCart className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p className="text-lg">Tu lista está vacía</p>
          </div>
        ) : (
          Object.entries(grouped).map(([cat, catItems]) => {
            const catTotal = catItems.reduce((s, i) => s + (i.price || 0), 0);
            return (
              <div key={cat} className="bg-gray-800 rounded-xl border border-gray-700 overflow-hidden">
                <div className="px-4 py-3 bg-gray-700/50 border-b border-gray-700 flex justify-between items-center">
                  <h4 className="font-bold text-white">{cat} <span className="text-xs bg-gray-600 px-2 py-1 rounded-full ml-2">{catItems.length}</span></h4>
                  <span className="text-green-400 font-bold text-sm">${formatPrice(catTotal)}</span>
                </div>
                <div className="divide-y divide-gray-700/50">
                  {catItems.map(item => (
                    <div key={item.id} className="p-3 flex items-center gap-3 hover:bg-gray-700/30 transition-colors">
                      <div className="flex-1 min-w-0">
                        <p className="text-white capitalize font-medium truncate">{item.name}</p>
                      </div>
                      
                      {editingId === item.id ? (
                        <div className="flex items-center gap-2">
                          <input
                            type="text"
                            value={editingPrice}
                            onChange={e => setEditingPrice(e.target.value)}
                            onKeyDown={e => {
                              if (e.key === 'Enter') handleSavePrice(item.id);
                              if (e.key === 'Escape') { setEditingId(null); setEditingPrice(''); }
                            }}
                            onBlur={() => handleSavePrice(item.id)}
                            autoFocus
                            className="w-24 px-2 py-1 bg-gray-700 border border-green-500 rounded text-white text-right font-bold text-sm outline-none"
                          />
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <button onClick={() => startEdit(item)} className="w-24 px-2 py-1 bg-gray-700 hover:bg-gray-600 border border-gray-600 rounded text-right text-sm transition-colors truncate">
                            {item.price > 0 ? <span className="text-white font-bold">${formatPrice(item.price)}</span> : <span className="text-gray-500">$0</span>}
                          </button>
                          <button onClick={() => handleDelete(item.id)} className="p-1 text-gray-400 hover:text-red-400">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            );
          })
        )}
      </div>

      {items.length > 0 && (
        <button 
          onClick={async () => {
            await completePurchase();
            notifyMarketCompleted(items.length, total);
          }}
          className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-bold py-4 rounded-xl text-lg flex items-center justify-center gap-2"
        >
          <Check className="w-6 h-6" />
          Finalizar Compra - ${formatPrice(total)}
        </button>
      )}
    </div>
  );
}