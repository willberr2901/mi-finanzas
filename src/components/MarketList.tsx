import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Trash2, Check, Search, Edit3, Settings } from 'lucide-react';
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
  const { items, loadItems, addItem, deleteItem, toggleComplete, completePurchase, getTotal } = useMarketStore();
  
  const [budget, setBudget] = useState(() => parseInt(localStorage.getItem('marketBudget') || '200000'));
  const [editingBudget, setEditingBudget] = useState(false);
  const [budgetInput, setBudgetInput] = useState(budget.toString());
  const [newItem, setNewItem] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [unitPrice, setUnitPrice] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [editingItemPrice, setEditingItemPrice] = useState('');

  useEffect(() => { loadItems(); }, [loadItems]);

  useEffect(() => {
    localStorage.setItem('marketBudget', budget.toString());
  }, [budget]);

  const total = getTotal();
  const remaining = budget - total;
  const percentage = budget > 0 ? Math.min((total / budget) * 100, 100) : 0;

  const saveBudget = () => {
    const newBudget = parseInt(budgetInput.replace(/[^0-9]/g, '')) || 200000;
    setBudget(newBudget);
    setEditingBudget(false);
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItem.trim()) return;
    const unitPriceNum = parseInt(unitPrice.replace(/[^0-9]/g, '')) || 0;
    const totalPrice = unitPriceNum * quantity;
    await addItem({
      name: newItem.trim(), price: totalPrice, category: getCategory(newItem),
      date: new Date().toISOString(), completed: false, quantity, unitPrice: unitPriceNum,
    });
    notifyMarketItemAdded(`${newItem.trim()} x${quantity}`, totalPrice);
    setNewItem(''); setUnitPrice(''); setQuantity(1);
  };

  const confirmDelete = (id: string) => setShowDeleteConfirm(id);
  const handleDelete = async () => {
    if (showDeleteConfirm) { await deleteItem(showDeleteConfirm); setShowDeleteConfirm(null); }
  };

  const startEditItem = (id: string, price: number) => {
    setEditingItemId(id);
    setEditingItemPrice(price.toString());
  };

  const saveItemEdit = async (id: string) => {
    const newPrice = parseInt(editingItemPrice.replace(/[^0-9]/g, '')) || 0;
    await toggleComplete(id);
    setEditingItemId(null);
  };

  const filteredItems = items.filter(item => item.name.toLowerCase().includes(searchTerm.toLowerCase()));
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
    <div className={`min-h-screen pb-24 ${isDark ? '' : 'bg-gray-50'}`}>
      <div className={`${bgCard} backdrop-blur-md border-b ${borderColor} px-4 py-3 flex items-center justify-between`}>
        <div className="flex items-center gap-2">
          <span className="text-lg">🛒</span>
          <div>
            <h1 className={`text-base font-bold ${textPrimary}`}>Mi Mercado</h1>
            <p className={`text-[10px] ${textSecondary}`}>Lista inteligente</p>
          </div>
        </div>
        
        {/* Botón de Ajustes - Visible en modo claro y oscuro */}
        <Link to="/ajustes" className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${isDark ? 'bg-white/10' : 'bg-gray-200'}`}>
          <Settings className={`w-4 h-4 ${isDark ? 'text-white' : 'text-gray-700'}`} />
        </Link>
      </div>

      <div className="p-3 space-y-3">
        {/* Presupuesto Modificable */}
        <div className={`${bgCard} backdrop-blur-md rounded-xl border ${borderColor} p-3`}>
          <div className="flex justify-between items-start mb-2">
            <div>
              <p className={`text-[10px] font-bold uppercase ${textSecondary}`}>Presupuesto</p>
              {editingBudget ? (
                <div className="flex items-center gap-2 mt-1">
                  <input type="text" value={budgetInput} onChange={e => setBudgetInput(e.target.value)} autoFocus
                    onKeyDown={e => e.key === 'Enter' && saveBudget()}
                    onBlur={saveBudget}
                    className={`text-xl font-bold bg-transparent ${isDark ? 'text-cyan-400' : 'text-cyan-600'} outline-none w-32`} />
                  <Edit3 className="w-4 h-4 text-green-400" />
                </div>
              ) : (
                <p onClick={() => { setEditingBudget(true); setBudgetInput(budget.toString()); }}
                  className={`text-xl font-bold ${isDark ? 'text-cyan-400' : 'text-cyan-600'} cursor-pointer flex items-center gap-2`}>
                  ${formatPrice(budget)} <Edit3 className="w-4 h-4 opacity-50" />
                </p>
              )}
            </div>
            <div className="text-right">
              <p className={`text-[10px] font-bold ${textSecondary}`}>Total</p>
              <p className={`text-lg font-bold ${isDark ? 'text-purple-400' : 'text-purple-600'}`}>${formatPrice(total)}</p>
              <p className={`text-[10px] ${textSecondary}`}>Disp: ${formatPrice(remaining)}</p>
            </div>
          </div>
          <div className="space-y-1">
            <div>
              <div className="flex justify-between text-[10px] mb-0.5">
                <span className={textSecondary}>Comprados</span>
                <span className="text-green-400">{items.filter(i=>i.completed).length}/{items.length}</span>
              </div>
              <div className={`h-1.5 rounded-full ${isDark ? 'bg-white/10' : 'bg-gray-200'}`}>
                <div className="h-full bg-gradient-to-r from-green-400 to-cyan-400 rounded-full" style={{width:`${items.length?((items.filter(i=>i.completed).length/items.length)*100):0}%`}}></div>
              </div>
            </div>
            <div>
              <div className="flex justify-between text-[10px] mb-0.5">
                <span className={textSecondary}>Presupuesto usado</span>
                <span className="text-purple-400">{percentage.toFixed(0)}%</span>
              </div>
              <div className={`h-1.5 rounded-full ${isDark ? 'bg-white/10' : 'bg-gray-200'}`}>
                <div className={`h-full rounded-full ${percentage>90?'bg-red-500':percentage>70?'bg-yellow-500':'bg-gradient-to-r from-purple-500 to-pink-500'}`} style={{width:`${percentage}%`}}></div>
              </div>
            </div>
          </div>
        </div>

        {/* Buscador */}
        <div className="relative">
          <Search className={`absolute left-3 top-2.5 w-4 h-4 ${textSecondary}`} />
          <input type="text" placeholder="Buscar producto..." value={searchTerm} onChange={e=>setSearchTerm(e.target.value)}
            className={`w-full pl-9 pr-3 py-2 rounded-xl ${bgCard} border ${borderColor} ${textPrimary} text-sm placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-green-400/50`} />
        </div>

        {/* Formulario */}
        <form onSubmit={handleAdd} className="space-y-2">
          <input type="text" placeholder="Nombre del producto" value={newItem} onChange={e=>setNewItem(e.target.value)}
            className={`w-full px-3 py-2 rounded-xl ${bgCard} border ${borderColor} ${textPrimary} text-sm placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-green-400/50`} />
          <div className="grid grid-cols-2 gap-2">
            <input type="number" placeholder="Cant." value={quantity} onChange={e=>setQuantity(parseInt(e.target.value)||1)} min="1"
              className={`px-3 py-2 rounded-xl ${bgCard} border ${borderColor} ${textPrimary} text-sm focus:outline-none focus:ring-2 focus:ring-green-400/50`} />
            <input type="text" placeholder="Precio unit. $" value={unitPrice} onChange={e=>setUnitPrice(e.target.value)}
              className={`px-3 py-2 rounded-xl ${bgCard} border ${borderColor} ${textPrimary} text-sm focus:outline-none focus:ring-2 focus:ring-green-400/50`} />
          </div>
          {unitPrice && (
            <div className={`text-center py-1.5 rounded-lg ${isDark?'bg-green-500/10':'bg-green-50'}`}>
              <p className="text-sm font-bold text-green-500">${formatPrice((parseInt(unitPrice.replace(/[^0-9]/g,''))||0)*quantity)}</p>
            </div>
          )}
          <button type="submit" className="w-full bg-gradient-to-r from-green-400 to-cyan-400 text-black py-2.5 rounded-xl font-bold text-sm">
            + Agregar Producto
          </button>
        </form>

        {/* Lista */}
        <div className="space-y-2">
          {Object.entries(grouped).map(([cat, catItems]) => {
            const catTotal = catItems.reduce((s,i)=>s+(i.price||0),0);
            return (
              <div key={cat} className={`${bgCard} rounded-xl border ${borderColor} overflow-hidden`}>
                <div className={`px-3 py-2 ${isDark?'bg-white/5':'bg-gray-100'} border-b ${borderColor} flex justify-between`}>
                  <span className={`text-xs font-bold ${textPrimary}`}>{cat} ({catItems.length})</span>
                  <span className="text-xs font-bold text-yellow-400">${formatPrice(catTotal)}</span>
                </div>
                {catItems.map(item => (
                  <div key={item.id} className="p-2.5 flex items-center gap-2 border-b border-white/5 last:border-0">
                    <div onClick={()=>toggleComplete(item.id)}
                      className={`w-5 h-5 rounded flex-shrink-0 flex items-center justify-center cursor-pointer border-2 ${item.completed?'bg-green-500 border-green-500':'border-gray-500'}`}>
                      {item.completed && <Check className="w-3 h-3 text-white" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm truncate ${item.completed?'line-through opacity-50':textPrimary}`}>{item.name}</p>
                      <p className={`text-[10px] ${textSecondary}`}>x{item.quantity||1}</p>
                    </div>
                    <div className="flex items-center gap-1 flex-shrink-0">
                      {editingItemId===item.id ? (
                        <input type="text" value={editingItemPrice} onChange={e=>setEditingItemPrice(e.target.value)}
                          onKeyDown={e=>{if(e.key==='Enter')saveItemEdit(item.id);if(e.key==='Escape')setEditingItemId(null);}}
                          onBlur={()=>saveItemEdit(item.id)} autoFocus
                          className={`w-20 px-2 py-1 rounded text-xs ${bgCard} border border-green-400 ${textPrimary} text-right`} />
                      ) : (
                        <span onClick={()=>startEditItem(item.id,item.price)} className={`text-sm font-bold ${textPrimary} cursor-pointer`}>${formatPrice(item.price)}</span>
                      )}
                      <button onClick={()=>confirmDelete(item.id)} className="p-1 text-gray-500 hover:text-red-400"><Trash2 className="w-3.5 h-3.5" /></button>
                    </div>
                  </div>
                ))}
              </div>
            );
          })}
        </div>

        {/* Finalizar */}
        {items.length>0 && (
          <button onClick={async()=>{await completePurchase();notifyMarketCompleted(items.length,total);}}
            className="w-full bg-gradient-to-r from-green-500 to-cyan-500 text-black font-bold py-3 rounded-xl text-sm">
            ✓ Finalizar • ${formatPrice(total)}
          </button>
        )}
      </div>

      {/* Confirmar eliminar */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className={`${bgCard} rounded-2xl p-5 max-w-sm w-full border ${borderColor}`}>
            <h3 className={`text-base font-bold ${textPrimary} mb-3`}>¿Eliminar producto?</h3>
            <div className="flex gap-2">
              <button onClick={()=>setShowDeleteConfirm(null)} className={`flex-1 py-2 rounded-xl font-semibold ${isDark?'bg-white/10 text-white':'bg-gray-200'}`}>Cancelar</button>
              <button onClick={handleDelete} className="flex-1 py-2 rounded-xl font-semibold bg-red-500 text-white">Eliminar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}