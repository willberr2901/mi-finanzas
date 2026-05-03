import { useState, useEffect } from 'react';
import { Plus, Trash2, ShoppingCart, Check, DollarSign, Search } from 'lucide-react';
import { useMarketStore } from '../store/marketStore';
import { notifyMarketItemAdded, notifyMarketCompleted } from '../services/notificationService';
import { useTheme } from '../contexts/ThemeContext';

function formatPrice(num: number): string {
  return num.toLocaleString('es-CO', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
}

const KEYWORDS: Record<string, string[]> = {
  'Granos': ['arroz', 'lenteja', 'frijol', 'garbanzo', 'avena', 'pasta'],
  'Aseo': ['jabón', 'shampoo', 'detergente', 'suavizante', 'blanqueador', 'soflan'],
  'Lácteos': ['leche', 'yogurt', 'mantequilla', 'queso', 'kumis'],
  'Carnes': ['pollo', 'carne', 'pescado', 'huevo', 'jamón', 'salchicha'],
  'Verduras': ['tomate', 'cebolla', 'papa', 'lechuga', 'zanahoria'],
  'Bebidas': ['gaseosa', 'jugo', 'agua', 'cerveza', 'café'],
  'Panaderia': ['pan', 'galletas', 'torta', 'quesitos']
};

function getCategory(item: string): string {
  const lower = item.toLowerCase();
  for (const [cat, words] of Object.entries(KEYWORDS)) {
    if (words.some(w => lower.includes(w))) return cat;
  }
  return 'Otros';
}

export default function MarketList() {
  const { theme } = useTheme();
  const { items, loadItems, addItem, deleteItem, completePurchase, getTotal } = useMarketStore();
  
  const [newItem, setNewItem] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [unitPrice, setUnitPrice] = useState('');
  const [budget] = useState(200000);
  const [searchTerm, setSearchTerm] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());

  useEffect(() => {
    loadItems();
  }, [loadItems]);

  const total = getTotal();
  const remaining = budget - total;
  const percentage = Math.min((total / budget) * 100, 100);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItem.trim()) return;

    const unitPriceNum = parseInt(unitPrice.replace(/[^0-9]/g, '')) || 0;
    const totalPrice = unitPriceNum * quantity;
    const category = getCategory(newItem);

    await addItem({
      name: newItem.trim(),
      price: totalPrice,
      category,
      date: new Date().toISOString(),
      completed: false,
      quantity: quantity,
      unitPrice: unitPriceNum,
    });

    notifyMarketItemAdded(`${newItem.trim()} x${quantity}`, totalPrice);
    setNewItem('');
    setUnitPrice('');
    setQuantity(1);
  };

  const confirmDelete = (id: string) => {
    setShowDeleteConfirm(id);
  };

  const handleDelete = async () => {
    if (showDeleteConfirm) {
      await deleteItem(showDeleteConfirm);
      setShowDeleteConfirm(null);
    }
  };

  const toggleItemSelection = (id: string) => {
    const newSelected = new Set(selectedItems);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedItems(newSelected);
  };

  const filteredItems = items.filter(item =>
    item.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const grouped = filteredItems.reduce((acc, item) => {
    if (!acc[item.category]) acc[item.category] = [];
    acc[item.category].push(item);
    return acc;
  }, {} as Record<string, typeof items>);

  const isDark = theme === 'dark';
  const bgCard = isDark ? 'bg-white/5' : 'bg-white';
  const textPrimary = isDark ? 'text-white' : 'text-gray-900';
  const textSecondary = isDark ? 'text-gray-400' : 'text-gray-600';
  const borderColor = isDark ? 'border-white/10' : 'border-gray-200';

  return (
    <div className={`max-w-4xl mx-auto p-4 space-y-4 pb-24 ${isDark ? '' : 'bg-gray-50 min-h-screen'}`}>
      
      {/* Header con Presupuesto */}
      <div className={`rounded-2xl p-5 ${bgCard} backdrop-blur-md border ${borderColor}`}>
        <div className="flex justify-between items-start mb-4">
          <div>
            <p className={`text-xs font-bold uppercase tracking-wider ${textSecondary}`}>Presupuesto del Mercado</p>
            <div className="flex items-center gap-2 mt-1">
              <h2 className={`text-3xl font-bold ${isDark ? 'text-cyan-400' : 'text-cyan-600'}`}>
                ${formatPrice(budget)}
              </h2>
            </div>
          </div>
          
          <div className="flex gap-3 text-right">
            <div>
              <p className={`text-[10px] uppercase font-bold ${textSecondary}`}>Comprado</p>
              <p className="text-green-400 font-bold text-sm">$0</p>
            </div>
            <div>
              <p className={`text-[10px] uppercase font-bold ${textSecondary}`}>Lista Total</p>
              <p className={`font-bold ${isDark ? 'text-purple-400' : 'text-purple-600'} text-sm`}>${formatPrice(total)}</p>
            </div>
            <div>
              <p className={`text-[10px] uppercase font-bold ${textSecondary}`}>Disponible</p>
              <p className={`font-bold ${isDark ? 'text-cyan-400' : 'text-cyan-600'} text-sm`}>${formatPrice(remaining)}</p>
            </div>
          </div>
        </div>

        {/* Barras de progreso */}
        <div className="space-y-2">
          <div>
            <div className="flex justify-between text-xs mb-1">
              <span className={textSecondary}>Productos comprados</span>
              <span className={isDark ? 'text-cyan-400' : 'text-cyan-600'}>40.0%</span>
            </div>
            <div className={`h-2 rounded-full ${isDark ? 'bg-white/10' : 'bg-gray-200'}`}>
              <div className="h-full w-[40%] bg-gradient-to-r from-cyan-500 to-blue-500 rounded-full"></div>
            </div>
          </div>
          <div>
            <div className="flex justify-between text-xs mb-1">
              <span className={textSecondary}>Total si compras todo</span>
              <span className={isDark ? 'text-purple-400' : 'text-purple-600'}>100.0%</span>
            </div>
            <div className={`h-2 rounded-full ${isDark ? 'bg-white/10' : 'bg-gray-200'}`}>
              <div className="h-full bg-gradient-to-r from-purple-500 to-pink-500 rounded-full" style={{ width: `${percentage}%` }}></div>
            </div>
          </div>
        </div>
      </div>

      {/* Buscador */}
      <div className="relative">
        <Search className={`absolute left-4 top-3.5 w-5 h-5 ${textSecondary}`} />
        <input
          type="text"
          placeholder="Buscar producto..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className={`w-full pl-12 pr-4 py-3 rounded-xl ${bgCard} border ${borderColor} ${textPrimary} placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-green-400/50`}
        />
      </div>

      {/* Agregar Producto */}
      <form onSubmit={handleAdd} className="space-y-3">
        <input
          type="text"
          placeholder="Nombre del producto"
          value={newItem}
          onChange={e => setNewItem(e.target.value)}
          className={`w-full px-4 py-3 rounded-xl ${bgCard} border ${borderColor} ${textPrimary} placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-green-400/50`}
        />
        
        <div className="grid grid-cols-2 gap-3">
          <input
            type="number"
            placeholder="Cantidad"
            value={quantity}
            onChange={e => setQuantity(parseInt(e.target.value) || 1)}
            min="1"
            className={`px-4 py-3 rounded-xl ${bgCard} border ${borderColor} ${textPrimary} placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-green-400/50`}
          />
          <input
            type="text"
            placeholder="Precio unitario $"
            value={unitPrice}
            onChange={e => setUnitPrice(e.target.value)}
            className={`px-4 py-3 rounded-xl ${bgCard} border ${borderColor} ${textPrimary} placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-green-400/50`}
          />
        </div>
        
        {quantity > 0 && unitPrice && (
          <div className={`text-center py-2 rounded-lg ${isDark ? 'bg-green-500/10' : 'bg-green-50'}`}>
            <p className={`text-sm ${textSecondary}`}>Total del producto:</p>
            <p className="text-xl font-bold text-green-500">
              ${formatPrice((parseInt(unitPrice.replace(/[^0-9]/g, '')) || 0) * quantity)}
            </p>
          </div>
        )}
        
        <button type="submit" className="w-full bg-gradient-to-br from-green-400 to-cyan-400 text-black py-3 rounded-xl font-bold shadow-lg hover:scale-105 transition-transform flex items-center justify-center gap-2">
          <Plus className="w-5 h-5" />
          Agregar Producto
        </button>
      </form>

      {/* Lista de Productos */}
      <div className="space-y-4">
        {Object.entries(grouped).map(([cat, catItems]) => {
          const catTotal = catItems.reduce((s, i) => s + (i.price || 0), 0);
          return (
            <div key={cat} className={`rounded-xl overflow-hidden ${bgCard} border ${borderColor}`}>
              <div className={`px-4 py-3 ${isDark ? 'bg-white/5' : 'bg-gray-100'} border-b ${borderColor} flex justify-between items-center`}>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-yellow-400"></div>
                  <h4 className={`text-sm font-bold ${textPrimary}`}>{cat}</h4>
                  <span className={`text-[10px] px-2 py-0.5 rounded-full ${isDark ? 'bg-white/10' : 'bg-gray-200'} ${textSecondary}`}>
                    {catItems.length}/{catItems.length}
                  </span>
                </div>
                <span className={`font-bold ${isDark ? 'text-yellow-400' : 'text-yellow-600'}`}>${formatPrice(catTotal)}</span>
              </div>
              
              <div className="divide-y divide-white/5">
                {catItems.map(item => (
                  <div key={item.id} className={`p-3 flex items-center justify-between group ${isDark ? 'hover:bg-white/5' : 'hover:bg-gray-50'} transition-colors`}>
                    <div className="flex items-center gap-3 flex-1">
                      <div 
                        onClick={() => toggleItemSelection(item.id)}
                        className={`w-5 h-5 rounded border-2 cursor-pointer flex items-center justify-center transition-all ${
                          selectedItems.has(item.id) 
                            ? 'bg-green-500 border-green-500' 
                            : isDark ? 'border-gray-600' : 'border-gray-300'
                        }`}
                      >
                        {selectedItems.has(item.id) && <Check className="w-3 h-3 text-white" />}
                      </div>
                      <div className="flex-1">
                        <p className={`font-medium ${textPrimary}`}>{item.name}</p>
                        <p className={`text-xs ${textSecondary}`}>x{item.quantity || 1} unidad{(item.quantity || 1) > 1 ? 'es' : ''}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-3">
                      <span className={`font-bold ${textPrimary}`}>${formatPrice(item.price)}</span>
                      <button 
                        onClick={() => confirmDelete(item.id)}
                        className={`p-1.5 rounded-lg ${isDark ? 'text-gray-600 hover:text-red-400 hover:bg-red-400/10' : 'text-gray-400 hover:text-red-500 hover:bg-red-50'} transition-all opacity-0 group-hover:opacity-100`}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* Confirmación de Eliminación */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className={`${bgCard} rounded-2xl p-6 max-w-sm w-full border ${borderColor} shadow-2xl`}>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-full bg-red-500/20 flex items-center justify-center">
                <Trash2 className="w-6 h-6 text-red-400" />
              </div>
              <div>
                <h3 className={`text-lg font-bold ${textPrimary}`}>¿Eliminar producto?</h3>
                <p className={`text-sm ${textSecondary}`}>Esta acción no se puede deshacer</p>
              </div>
            </div>
            
            <div className="flex gap-3">
              <button
                onClick={() => setShowDeleteConfirm(null)}
                className={`flex-1 py-3 rounded-xl font-semibold ${isDark ? 'bg-white/10 text-white hover:bg-white/20' : 'bg-gray-100 text-gray-900 hover:bg-gray-200'} transition-colors`}
              >
                Cancelar
              </button>
              <button
                onClick={handleDelete}
                className="flex-1 py-3 rounded-xl font-semibold bg-red-500 text-white hover:bg-red-600 transition-colors"
              >
                Eliminar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Botón Finalizar */}
      {items.length > 0 && (
        <button 
          onClick={async () => {
            await completePurchase();
            notifyMarketCompleted(items.length, total);
          }}
          className="w-full bg-gradient-to-r from-green-500 to-cyan-500 text-black font-extrabold py-4 rounded-2xl text-lg shadow-[0_0_25px_rgba(34,197,94,0.5)] hover:scale-[1.02] transition-all flex items-center justify-center gap-3 mt-6"
        >
          <Check className="w-6 h-6" />
          Finalizar Compra • ${formatPrice(total)}
        </button>
      )}
    </div>
  );
}