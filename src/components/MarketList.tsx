import { useState, useEffect } from 'react';
import { Plus, Trash2, ShoppingCart, Check, DollarSign } from 'lucide-react';
import { useMarketStore } from '../store/marketStore';
import { notifyMarketItemAdded, notifyMarketCompleted, notifyPriceChange } from '../services/notificationService';

function formatPrice(num: number): string {
  return num.toLocaleString('es-CO', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
}

function parsePrice(str: string): number {
  const cleaned = str.replace(/[.$,]/g, '');
  return parseInt(cleaned) || 0;
}

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

const GLASS_STYLE = {
  background: 'rgba(255, 255, 255, 0.05)',
  backdropFilter: 'blur(16px)',
  border: '1px solid rgba(255, 255, 255, 0.1)',
  boxShadow: '0 4px 30px rgba(0, 0, 0, 0.1)',
};

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

    if (price > 0) notifyMarketItemAdded(newItem.trim(), price);
    setNewItem('');
    setNewPrice('');
  };

  const handleSavePrice = async (id: string) => {
    const item = items.find(i => i.id === id);
    if (!item) return;

    const newPriceValue = parsePrice(editingPrice);
    if (item.price !== newPriceValue && item.price > 0) {
      notifyPriceChange(item.name, item.price, newPriceValue);
    }
    
    await updatePrice(id, newPriceValue);
    setEditingId(null);
    setEditingPrice('');
  };

  const grouped = items.reduce((acc, item) => {
    if (!acc[item.category]) acc[item.category] = [];
    acc[item.category].push(item);
    return acc;
  }, {} as Record<string, typeof items>);

  return (
    <div className="max-w-4xl mx-auto p-4 space-y-5 pb-24">
      <div className="flex items-center gap-3 mb-2">
        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center shadow-[0_0_15px_rgba(34,197,94,0.4)]">
          <ShoppingCart className="w-6 h-6 text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-white">Mi Mercado</h1>
          <p className="text-xs text-gray-400">Lista inteligente de compras</p>
        </div>
      </div>

      <div className="rounded-2xl p-5 relative overflow-hidden" style={GLASS_STYLE}>
        <div className="flex items-center justify-between relative z-10">
          <div>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Total Estimado</p>
            <p className="text-3xl font-extrabold text-green-400 text-shadow-glow">${formatPrice(total)}</p>
          </div>
          <div className="w-12 h-12 rounded-full bg-green-500/10 flex items-center justify-center border border-green-500/20">
            <DollarSign className="w-6 h-6 text-green-400" />
          </div>
        </div>
        <div className="w-full bg-white/5 h-1.5 rounded-full mt-4 overflow-hidden">
          <div 
            className="h-full bg-gradient-to-r from-green-400 to-cyan-400 transition-all duration-500" 
            style={{ width: `${items.length > 0 ? (countWithPrice / items.length) * 100 : 0}%` }}
          ></div>
        </div>
        <p className="text-right text-[10px] text-gray-500 mt-1">{countWithPrice} de {items.length} con precio</p>
      </div>

      <form onSubmit={handleAdd} className="flex gap-2">
        <input
          type="text"
          placeholder="Agregar producto..."
          value={newItem}
          onChange={e => setNewItem(e.target.value)}
          className="flex-1 px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-green-400/50 transition-all"
        />
        <input
          type="text"
          placeholder="$0"
          value={newPrice}
          onChange={e => setNewPrice(e.target.value)}
          className="w-24 px-3 py-3 bg-white/5 border border-white/10 rounded-xl text-white text-center placeholder-gray-500 focus:outline-none focus:border-green-400/50 transition-all"
        />
        <button type="submit" className="bg-gradient-to-br from-green-400 to-emerald-600 text-black p-3 rounded-xl font-bold shadow-lg hover:scale-105 transition-transform">
          <Plus className="w-6 h-6" />
        </button>
      </form>

      <div className="space-y-3">
        {Object.entries(grouped).map(([cat, catItems]) => {
          const catTotal = catItems.reduce((s, i) => s + (i.price || 0), 0);
          return (
            <div key={cat} className="rounded-xl overflow-hidden border border-white/5 bg-black/20 backdrop-blur-sm">
              <div className="px-4 py-2 bg-white/5 border-b border-white/5 flex justify-between items-center">
                <h4 className="text-xs font-bold text-gray-400 uppercase">{cat}</h4>
                <span className="text-xs font-bold text-green-400">${formatPrice(catTotal)}</span>
              </div>
              <div className="divide-y divide-white/5">
                {catItems.map(item => (
                  <div key={item.id} className="p-3 flex items-center justify-between group">
                    <div className="flex-1">
                      <p className="text-white font-medium capitalize">{item.name}</p>
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
                          className="w-20 px-2 py-1 bg-white/10 border border-green-400 rounded text-white text-right text-sm outline-none"
                        />
                      </div>
                    ) : (
                      <div className="flex items-center gap-3">
                        <button onClick={() => { setEditingId(item.id); setEditingPrice(item.price.toString()); }} className="text-gray-400 hover:text-green-400 text-sm font-mono transition-colors">
                          ${formatPrice(item.price)}
                        </button>
                        <button onClick={() => deleteItem(item.id)} className="text-gray-600 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

         {items.length > 0 && (
        <button 
          onClick={async () => {
            await completePurchase();
            notifyMarketCompleted(items.length, total);
          }}
          className="w-full bg-gradient-to-r from-green-500 to-cyan-500 text-black font-extrabold py-4 rounded-2xl text-lg shadow-[0_0_25px_rgba(34,197,94,0.5)] hover:scale-[1.03] active:scale-[0.98] transition-all flex items-center justify-center gap-3 mt-6 border border-green-400/30"
        >
          <Check className="w-6 h-6" />
          Finalizar Compra • ${formatPrice(total)}
        </button>
      )}
    </div>
  );
}