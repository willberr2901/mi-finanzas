import { useState, useEffect } from 'react';
import { ShoppingCart, Plus, Trash2, Check, AlertTriangle, Edit } from 'lucide-react'; // ✅ Eliminado Search
import { notify } from '../services/notificationService';
import { secureStorage } from '../utils/security';

interface CategoryBudget {
  id: string;
  name: string;
  budget: number;
  spent: number;
}

interface MarketItem {
  id: string;
  name: string;
  quantity: number;
  price: number;
  category: string;
  purchased: boolean;
}

const CATEGORIES: CategoryBudget[] = [
  { id: 'c1', name: 'Alimentación', budget: 80000, spent: 0 },
  { id: 'c2', name: 'Transporte', budget: 40000, spent: 0 },
  { id: 'c3', name: 'Servicios', budget: 30000, spent: 0 },
  { id: 'c4', name: 'Entretenimiento', budget: 20000, spent: 0 },
  { id: 'c5', name: 'Hogar', budget: 20000, spent: 0 },
  { id: 'c6', name: 'Otros', budget: 10000, spent: 0 },
];

export default function MarketPage() {
  const [items, setItems] = useState<MarketItem[]>([]);
  const [budgets, setBudgets] = useState<CategoryBudget[]>(CATEGORIES);
  const [productName, setProductName] = useState('');
  const [quantity, setQuantity] = useState('1');
  const [price, setPrice] = useState('');
  const [selectedCategory, setSelectedCategory] = useState(CATEGORIES[0].id);
  const [searchTerm, setSearchTerm] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);

  useEffect(() => {
    const savedItems = secureStorage.getItem('marketItems');
    const savedBudgets = secureStorage.getItem('marketBudgets');
    if (savedItems && Array.isArray(savedItems)) setItems(savedItems);
    if (savedBudgets && Array.isArray(savedBudgets)) setBudgets(savedBudgets);
  }, []);

  useEffect(() => {
    secureStorage.setItem('marketItems', items);
    secureStorage.setItem('marketBudgets', budgets);
  }, [items, budgets]);

  useEffect(() => {
    budgets.forEach(cat => {
      if (cat.budget > 0) {
        const percentage = (cat.spent / cat.budget) * 100;
        // ✅ Eliminado const alertKey = ... (variable no usada)
        
        if (percentage >= 80 && !sessionStorage.getItem(`warn_80_${cat.id}`)) {
          notify({ title: '⚠️ Presupuesto al 80%', message: `${cat.name}: Ya gastaste el 80% de tu presupuesto.`, type: 'warning' });
          sessionStorage.setItem(`warn_80_${cat.id}`, 'true');
        }
        if (percentage >= 100 && !sessionStorage.getItem(`warn_100_${cat.id}`)) {
          notify({ title: '🚨 Presupuesto agotado', message: `${cat.name}: Has superado tu límite de compra.`, type: 'error' });
          sessionStorage.setItem(`warn_100_${cat.id}`, 'true');
        }
      }
    });
  }, [budgets]);

  const totalBudget = budgets.reduce((sum, cat) => sum + cat.budget, 0);
  const totalSpent = budgets.reduce((sum, cat) => sum + cat.spent, 0);
  const filteredItems = items.filter(i => i.name.toLowerCase().includes(searchTerm.toLowerCase()));

  const handleAddOrUpdate = () => {
    if (!productName || !price) {
      notify({ title: '❌ Error', message: 'Ingresa nombre y precio.', type: 'error' }); return;
    }

    const qty = parseInt(quantity) || 1;
    const prc = parseFloat(price.replace(/[^0-9.-]+/g, '')) || 0;
    if (prc <= 0) { notify({ title: '❌ Error', message: 'El precio debe ser mayor a 0.', type: 'error' }); return; }

    const totalItemPrice = prc * qty;

    const updatedBudgets = budgets.map(cat => 
      cat.id === selectedCategory ? { ...cat, spent: cat.spent + (editingId ? -getOldItemTotal(editingId) : 0) + totalItemPrice } : cat
    );
    setBudgets(updatedBudgets);

    if (editingId) {
      setItems(prev => prev.map(i => i.id === editingId ? { ...i, name: productName, quantity: qty, price: prc, category: selectedCategory } : i));
      notify({ title: '✅ Actualizado', message: productName, type: 'success' });
    } else {
      setItems(prev => [...prev, { id: Date.now().toString(), name: productName, quantity: qty, price: prc, category: selectedCategory, purchased: false }]);
      notify({ title: '✅ Agregado', message: `${productName} a ${getCategoryName(selectedCategory)}`, type: 'success' });
    }

    resetForm();
  };

  const getOldItemTotal = (id: string) => {
    const old = items.find(i => i.id === id);
    return old ? old.price * old.quantity : 0;
  };

  const getCategoryName = (id: string) => budgets.find(c => c.id === id)?.name || 'Sin categoría';

  const handleEdit = (item: MarketItem) => {
    setProductName(item.name);
    setQuantity(item.quantity.toString());
    setPrice(item.price.toString());
    setSelectedCategory(item.category);
    setEditingId(item.id);
  };

  const handleDelete = (id: string) => {
    const item = items.find(i => i.id === id);
    if (item) {
      setBudgets(prev => prev.map(cat => cat.id === item.category ? { ...cat, spent: Math.max(0, cat.spent - (item.price * item.quantity)) } : cat));
      setItems(prev => prev.filter(i => i.id !== id));
    }
    notify({ title: '🗑️ Eliminado', type: 'info' });
  };

  const togglePurchased = (id: string) => {
    setItems(prev => prev.map(i => i.id === id ? { ...i, purchased: !i.purchased } : i));
  };

  const resetForm = () => {
    setProductName(''); setQuantity('1'); setPrice(''); setSelectedCategory(CATEGORIES[0].id); setEditingId(null);
  };

  const resetBudgets = () => {
    setBudgets(CATEGORIES.map(c => ({ ...c, spent: 0 })));
    sessionStorage.clear();
    notify({ title: '🔄 Presupuestos reiniciados', type: 'info' });
  };

  return (
    <div className="p-4 pb-28 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2"><ShoppingCart size={24} /> Mi Mercado</h1>
          <p className="text-slate-400 text-sm">Lista inteligente de compras</p>
        </div>
        <button onClick={resetBudgets} className="text-slate-400 text-xs underline hover:text-white">Reiniciar</button>
      </div>

      <div className="glass-panel p-4">
        <div className="flex justify-between items-center mb-2">
          <span className="text-slate-400 text-sm">PRESUPUESTO TOTAL</span>
          <span className="text-white font-bold">${totalBudget.toLocaleString('es-CO')}</span>
        </div>
        <div className="flex justify-between items-center mb-3">
          <span className="text-slate-400 text-xs">Total Gastado</span>
          <span className="text-purple-400 font-bold">${totalSpent.toLocaleString('es-CO')}</span>
        </div>
        <div className="w-full bg-slate-800 rounded-full h-2">
          <div className="bg-purple-500 h-2 rounded-full transition-all" style={{ width: `${(totalSpent/totalBudget)*100}%` }}></div>
        </div>
        <div className="flex justify-between mt-1">
          <span className="text-[10px] text-slate-500">Disponible: ${(totalBudget - totalSpent).toLocaleString('es-CO')}</span>
          <span className="text-[10px] text-slate-500">{((totalSpent/totalBudget)*100).toFixed(0)}% usado</span>
        </div>
      </div>

      <div className="space-y-3">
        <h3 className="text-sm font-bold text-slate-300">Presupuesto por Categoría</h3>
        {budgets.map(cat => {
          const pct = cat.budget > 0 ? (cat.spent / cat.budget) * 100 : 0;
          const isWarning = pct >= 80;
          const isOver = pct >= 100;
          return (
            <div key={cat.id} className={`p-3 rounded-xl border ${isOver ? 'bg-red-900/20 border-red-500/30' : isWarning ? 'bg-yellow-900/20 border-yellow-500/30' : 'bg-slate-800/50 border-white/5'}`}>
              <div className="flex justify-between text-xs mb-1">
                <span className="font-medium text-white">{cat.name}</span>
                <span className={`${isOver ? 'text-red-400' : isWarning ? 'text-yellow-400' : 'text-slate-400'}`}>${cat.spent.toLocaleString()} / ${cat.budget.toLocaleString()}</span>
              </div>
              <div className="w-full bg-slate-800 rounded-full h-1.5">
                <div className={`h-1.5 rounded-full transition-all ${isOver ? 'bg-red-500' : isWarning ? 'bg-yellow-500' : 'bg-emerald-500'}`} style={{ width: `${Math.min(pct, 100)}%` }}></div>
              </div>
              {isWarning && <div className="flex items-center gap-1 mt-1"><AlertTriangle size={10} className="text-yellow-400" /><span className="text-[10px] text-yellow-400">Cuidado: {pct.toFixed(0)}% usado</span></div>}
            </div>
          );
        })}
      </div>

      <div className="space-y-3 bg-slate-900/50 p-4 rounded-2xl border border-white/5">
        <input type="text" placeholder="Buscar producto..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="input-modern w-full mb-2" />
        <input type="text" placeholder="Nombre del producto" value={productName} onChange={e => setProductName(e.target.value)} className="input-modern" />
        <div className="flex gap-2">
          <input type="number" placeholder="Cant." value={quantity} onChange={e => setQuantity(e.target.value)} className="input-modern w-1/4" />
          <input type="number" placeholder="Precio unit. $" value={price} onChange={e => setPrice(e.target.value)} className="input-modern flex-1" />
        </div>
        <select value={selectedCategory} onChange={e => setSelectedCategory(e.target.value)} className="input-modern">
          {budgets.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
        <button onClick={handleAddOrUpdate} className="btn-primary w-full flex items-center justify-center gap-2">
          {editingId ? <Edit size={18} /> : <Plus size={18} />} {editingId ? 'Actualizar Producto' : '+ Agregar Producto'}
        </button>
      </div>

      {filteredItems.length > 0 && (
        <div className="space-y-2">
          {filteredItems.map(item => (
            <div key={item.id} className={`glass-panel p-3 flex justify-between items-center ${item.purchased ? 'opacity-60' : ''}`}>
              <div className="flex items-center gap-3 flex-1">
                <button onClick={() => togglePurchased(item.id)} className={`w-5 h-5 rounded border ${item.purchased ? 'bg-emerald-500 border-emerald-500' : 'border-slate-500'} flex items-center justify-center`}>
                  {item.purchased && <Check size={12} className="text-black" />}
                </button>
                <div>
                  <p className={`font-medium text-white ${item.purchased ? 'line-through' : ''}`}>{item.name}</p>
                  <p className="text-[10px] text-slate-400">{item.quantity}x • ${item.price.toLocaleString()} • {getCategoryName(item.category)}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-white font-bold">${(item.quantity * item.price).toLocaleString()}</span>
                <button onClick={() => handleEdit(item)} className="text-blue-400 p-1"><Edit size={14} /></button>
                <button onClick={() => handleDelete(item.id)} className="text-red-400 p-1"><Trash2 size={14} /></button>
              </div>
            </div>
          ))}
          <button onClick={() => setItems([])} className="w-full btn-primary mt-2 flex items-center justify-center gap-2">
            <Check size={18} /> Finalizar Compra • ${items.filter(i=>i.purchased).reduce((s,i)=>s+(i.price*i.quantity),0).toLocaleString()}
          </button>
        </div>
      )}
    </div>
  );
}