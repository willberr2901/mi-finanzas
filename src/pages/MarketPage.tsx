import { useState, useEffect } from 'react';
import { ShoppingCart, Plus, Trash2, Check, Edit } from 'lucide-react';
import { notify } from '../services/notificationService';
import { secureStorage } from '../utils/security';

interface MarketItem {
  id: string;
  name: string;
  quantity: number;
  price: number;
  purchased: boolean;
}

export default function MarketPage() {
  const [items, setItems] = useState<MarketItem[]>([]);
  const [budgetLimit, setBudgetLimit] = useState(200000);
  const [productName, setProductName] = useState('');
  const [quantity, setQuantity] = useState('1');
  const [price, setPrice] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);

  useEffect(() => {
    const savedItems = secureStorage.getItem('marketItems');
    const savedBudget = secureStorage.getItem('marketBudget');
    if (savedItems && Array.isArray(savedItems)) setItems(savedItems);
    if (savedBudget && typeof savedBudget === 'number') setBudgetLimit(savedBudget);
  }, []);

  useEffect(() => {
    secureStorage.setItem('marketItems', items);
    secureStorage.setItem('marketBudget', budgetLimit);
  }, [items, budgetLimit]);

  const totalSpent = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const remaining = budgetLimit - totalSpent;
  const percentage = budgetLimit > 0 ? (totalSpent / budgetLimit) * 100 : 0;
  const filteredItems = items.filter(i => i.name.toLowerCase().includes(searchTerm.toLowerCase()));

  const handleAddOrUpdate = () => {
    if (!productName || !price) {
      notify({ title: '❌ Error', message: 'Ingresa nombre y precio.', type: 'error' }); return;
    }
    const qty = parseInt(quantity) || 1;
    const prc = parseFloat(price.replace(/[^0-9.-]+/g, '')) || 0;
    if (prc <= 0) { notify({ title: '❌ Error', message: 'Precio inválido.', type: 'error' }); return; }

    if (editingId) {
      setItems(prev => prev.map(i => i.id === editingId ? { ...i, name: productName, quantity: qty, price: prc } : i));
      notify({ title: '✅ Actualizado', message: productName, type: 'success' });
    } else {
      setItems(prev => [...prev, { id: Date.now().toString(), name: productName, quantity: qty, price: prc, purchased: false }]);
      notify({ title: '✅ Agregado', message: productName, type: 'success' });
    }
    resetForm();
  };

  const handleEdit = (item: MarketItem) => {
    setProductName(item.name);
    setQuantity(item.quantity.toString());
    setPrice(item.price.toString());
    setEditingId(item.id);
  };

  const handleDelete = (id: string) => {
    setItems(prev => prev.filter(i => i.id !== id));
    notify({ title: '🗑️ Eliminado', type: 'info' });
  };

  const togglePurchased = (id: string) => {
    setItems(prev => prev.map(i => i.id === id ? { ...i, purchased: !i.purchased } : i));
  };

  const resetForm = () => {
    setProductName(''); setQuantity('1'); setPrice(''); setEditingId(null);
  };

  const handleFinalize = () => {
    const purchasedItems = items.filter(i => i.purchased);
    const totalPurchased = purchasedItems.reduce((s, i) => s + (i.price * i.quantity), 0);
    setItems(items.filter(i => !i.purchased));
    notify({ title: '✅ Compra Finalizada', message: `Total: $${totalPurchased.toLocaleString('es-CO')}`, type: 'success' });
  };

  return (
    <div className="p-4 pb-28 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2"><ShoppingCart size={24} /> Mi Mercado</h1>
          <p className="text-slate-400 text-sm">Lista inteligente de compras</p>
        </div>
      </div>

      {/* ✅ PRESUPUESTO MODIFICABLE */}
      <div className="glass-panel p-4">
        <div className="flex justify-between items-center mb-2">
          <span className="text-slate-400 text-sm">PRESUPUESTO</span>
          <input
            type="number"
            value={budgetLimit}
            onChange={(e) => setBudgetLimit(parseFloat(e.target.value) || 0)}
            className="bg-transparent text-right text-white font-bold outline-none w-28 focus:text-emerald-400 transition-colors"
          />
        </div>
        <div className="flex justify-between items-center mb-1">
          <span className="text-xs text-slate-500">Gastado</span>
          <span className={`text-sm font-medium ${totalSpent > budgetLimit ? 'text-red-400' : 'text-emerald-400'}`}>
            ${totalSpent.toLocaleString('es-CO')}
          </span>
        </div>
        <div className="w-full bg-slate-800 rounded-full h-2">
          <div 
            className={`h-2 rounded-full transition-all ${percentage >= 100 ? 'bg-red-500' : 'bg-emerald-500'}`} 
            style={{ width: `${Math.min(percentage, 100)}%` }}
          ></div>
        </div>
        <div className="flex justify-between mt-1">
          <span className="text-[10px] text-slate-500">Disponible: ${remaining.toLocaleString('es-CO')}</span>
          <span className="text-[10px] text-slate-500">{percentage.toFixed(0)}%</span>
        </div>
      </div>

      {/* Formulario */}
      <div className="space-y-3 bg-slate-900/50 p-4 rounded-2xl border border-white/5">
        <input type="text" placeholder="Buscar producto..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="input-modern w-full mb-2" />
        <input type="text" placeholder="Nombre del producto" value={productName} onChange={e => setProductName(e.target.value)} className="input-modern" />
        <div className="flex gap-2">
          <input type="number" placeholder="Cant." value={quantity} onChange={e => setQuantity(e.target.value)} className="input-modern w-1/4" />
          <input type="number" placeholder="Precio unit. $" value={price} onChange={e => setPrice(e.target.value)} className="input-modern flex-1" />
        </div>
        <button onClick={handleAddOrUpdate} className="btn-primary w-full flex items-center justify-center gap-2">
          {editingId ? <Edit size={18} /> : <Plus size={18} />} {editingId ? 'Actualizar Producto' : '+ Agregar Producto'}
        </button>
      </div>

      {/* Lista de Productos */}
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
                  <p className="text-[10px] text-slate-400">{item.quantity}x • ${item.price.toLocaleString('es-CO')}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-white font-bold">${(item.quantity * item.price).toLocaleString()}</span>
                <button onClick={() => handleEdit(item)} className="text-blue-400 p-1"><Edit size={14} /></button>
                <button onClick={() => handleDelete(item.id)} className="text-red-400 p-1"><Trash2 size={14} /></button>
              </div>
            </div>
          ))}
          <button onClick={handleFinalize} className="w-full btn-primary mt-2 flex items-center justify-center gap-2">
            <Check size={18} /> Finalizar Compra • ${items.filter(i=>i.purchased).reduce((s,i)=>s+(i.price*i.quantity),0).toLocaleString('es-CO')}
          </button>
        </div>
      )}
    </div>
  );
}