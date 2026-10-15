import { useState, useEffect } from 'react';
import { ShoppingCart, Plus, Trash2, Check, Edit, TrendingUp } from 'lucide-react';
import { notify } from '../services/notificationService';
import { secureStorage } from '../utils/security';
import { db } from '../utils/database';
import { formatCOP, todayISO } from '../utils/format';
import { addMarketPurchase, lastPriceOf } from '../utils/marketHistory';
import MoneyInput from '../components/ui/MoneyInput';

interface MarketItem {
  id: string;
  name: string;
  quantity: number;
  price: number;
  purchased: boolean;
  previousPrice?: number | null;
}

export default function MarketPage() {
  const [items, setItems] = useState<MarketItem[]>([]);
  const [budgetLimit, setBudgetLimit] = useState(200000);
  const [loaded, setLoaded] = useState(false);
  const [productName, setProductName] = useState('');
  const [quantity, setQuantity] = useState('1');
  const [price, setPrice] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);

  useEffect(() => {
    const savedItems = secureStorage.getItem('marketItems');
    const savedBudget = secureStorage.getItem('marketBudget');
    if (savedItems && Array.isArray(savedItems)) setItems(savedItems);
    if (savedBudget && typeof savedBudget === 'number') setBudgetLimit(savedBudget);
    setLoaded(true);
  }, []);

  useEffect(() => {
    if (!loaded) return; // no pisar lo guardado antes de cargarlo
    secureStorage.setItem('marketItems', items);
    secureStorage.setItem('marketBudget', budgetLimit);
  }, [items, budgetLimit, loaded]);

  const totalSpent = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const purchased = items.filter(i => i.purchased);
  const purchasedTotal = purchased.reduce((s, i) => s + (i.price * i.quantity), 0);
  const remaining = budgetLimit - totalSpent;
  const percentage = budgetLimit > 0 ? (totalSpent / budgetLimit) * 100 : 0;
  const filteredItems = items.filter(i => i.name.toLowerCase().includes(searchTerm.toLowerCase()));

  const handleAddOrUpdate = () => {
    const name = productName.trim();
    if (!name || !price) {
      notify({ title: 'Faltan datos', message: 'Escribe el nombre y el precio del producto.', type: 'error' }); return;
    }
    const qty = Math.max(1, parseInt(quantity) || 1);

    if (editingId) {
      setItems(prev => prev.map(i => i.id === editingId ? { ...i, name, quantity: qty, price } : i));
      notify({ title: 'Producto actualizado', message: name, type: 'success' });
    } else {
      const previousPrice = lastPriceOf(name);
      setItems(prev => [...prev, { id: Date.now().toString(), name, quantity: qty, price, purchased: false, previousPrice }]);
      if (previousPrice && price > previousPrice) {
        const up = Math.round(((price - previousPrice) / previousPrice) * 100);
        notify({ title: `${name} subió ${up}%`, message: `La última vez lo pagaste a ${formatCOP(previousPrice)}`, type: 'warning' });
      } else {
        notify({ title: 'Agregado', message: name, type: 'success' });
      }
    }
    resetForm();
  };

  const handleEdit = (item: MarketItem) => {
    setProductName(item.name);
    setQuantity(item.quantity.toString());
    setPrice(item.price);
    setEditingId(item.id);
  };

  const handleDelete = (id: string) => {
    setItems(prev => prev.filter(i => i.id !== id));
    notify({ title: 'Producto eliminado', type: 'info' });
  };

  const togglePurchased = (id: string) => {
    setItems(prev => prev.map(i => i.id === id ? { ...i, purchased: !i.purchased } : i));
  };

  const resetForm = () => {
    setProductName(''); setQuantity('1'); setPrice(0); setEditingId(null);
  };

  const handleFinalize = async () => {
    // Si marcaste productos, se cierran esos; si no marcaste ninguno, se cierra toda la lista.
    const toClose = purchased.length > 0 ? purchased : items;
    const total = toClose.reduce((s, i) => s + (i.price * i.quantity), 0);
    if (toClose.length === 0) return;
    if (purchased.length === 0 && !window.confirm(`¿Finalizar con todos los productos de la lista (${formatCOP(total)})?`)) return;

    const today = new Date();
    try {
      await db.transactions.add({
        id: crypto.randomUUID(),
        date: todayISO(),
        type: 'expense',
        amount: total,
        category: 'Alimentación',
        description: `Mercado · ${toClose.length} productos`,
        createdAt: Date.now(),
      });
    } catch { /* si falla el registro, igual se guarda el historial del mercado */ }

    addMarketPurchase({
      id: Date.now().toString(),
      date: today.toISOString(),
      total,
      itemsCount: toClose.length,
      items: toClose.map(({ name, quantity, price }) => ({ name, quantity, price })),
    });

    const closedIds = new Set(toClose.map(i => i.id));
    setItems(prev => prev.filter(i => !closedIds.has(i.id)));
    notify({ title: 'Compra finalizada', message: `${formatCOP(total)} registrado como gasto en Finanzas`, type: 'success', duration: 4500 });
  };

  return (
    <div className="p-4 pb-28 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2"><ShoppingCart size={24} /> Mi Mercado</h1>
          <p className="text-slate-400 text-sm">Lista inteligente de compras</p>
        </div>
      </div>

      <div className="glass-panel p-4">
        <div className="flex justify-between items-center mb-2">
          <span className="text-slate-400 text-sm">PRESUPUESTO</span>
          <MoneyInput
            value={budgetLimit}
            onChange={setBudgetLimit}
            prefix
            ariaLabel="Presupuesto del mercado"
            className="bg-transparent text-right text-white font-bold outline-none w-36 focus:text-emerald-400 transition-colors"
          />
        </div>
        <div className="flex justify-between items-center mb-1">
          <span className="text-xs text-slate-500">Total de la lista</span>
          <span className={`text-sm font-medium ${totalSpent > budgetLimit ? 'text-red-400' : 'text-emerald-400'}`}>
            {formatCOP(totalSpent)}
          </span>
        </div>
        <div className="w-full bg-slate-800 rounded-full h-2">
          <div
            className={`h-2 rounded-full transition-all duration-500 ${percentage >= 100 ? 'bg-red-500' : percentage >= 85 ? 'bg-amber-500' : 'bg-emerald-500'}`}
            style={{ width: `${Math.min(percentage, 100)}%` }}
          ></div>
        </div>
        <div className="flex justify-between mt-1">
          <span className={`text-[10px] ${remaining < 0 ? 'text-red-400' : 'text-slate-500'}`}>
            {remaining < 0 ? `Te pasaste ${formatCOP(-remaining)}` : `Disponible: ${formatCOP(remaining)}`}
          </span>
          <span className="text-[10px] text-slate-500">{percentage.toFixed(0)}%</span>
        </div>
        {purchased.length > 0 && (
          <p className="text-[11px] text-slate-400 mt-2">En el carrito: <span className="text-white font-semibold">{formatCOP(purchasedTotal)}</span> · {purchased.length} de {items.length} productos</p>
        )}
      </div>

      <div className="space-y-3 bg-slate-900/50 p-4 rounded-2xl border border-white/5">
        <input type="text" placeholder="Buscar producto..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="input-modern w-full mb-2" />
        <input type="text" placeholder="Nombre del producto" value={productName} onChange={e => setProductName(e.target.value)} className="input-modern" />
        <div className="flex gap-2">
          <input type="number" inputMode="numeric" min={1} placeholder="Cant." aria-label="Cantidad" value={quantity} onChange={e => setQuantity(e.target.value)} className="input-modern w-1/4" />
          <MoneyInput value={price} onChange={setPrice} placeholder="Precio unit. $" prefix className="input-modern flex-1" />
        </div>
        <button onClick={handleAddOrUpdate} className="btn-primary w-full flex items-center justify-center gap-2">
          {editingId ? <Edit size={18} /> : <Plus size={18} />} {editingId ? 'Actualizar producto' : 'Agregar producto'}
        </button>
        {editingId && <button onClick={resetForm} className="w-full text-xs text-slate-400 py-1">Cancelar edición</button>}
      </div>

      {filteredItems.length > 0 && (
        <div className="space-y-2">
          {filteredItems.map(item => {
            const rose = item.previousPrice && item.price > item.previousPrice
              ? Math.round(((item.price - item.previousPrice) / item.previousPrice) * 100) : 0;
            return (
              <div key={item.id} className={`glass-panel p-3 flex justify-between items-center transition-opacity ${item.purchased ? 'opacity-60' : ''}`}>
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <button onClick={() => togglePurchased(item.id)} aria-label={item.purchased ? `Quitar ${item.name} del carrito` : `Marcar ${item.name} en el carrito`} className={`w-6 h-6 shrink-0 rounded border ${item.purchased ? 'bg-emerald-500 border-emerald-500' : 'border-slate-500'} flex items-center justify-center`}>
                    {item.purchased && <Check size={14} className="text-black" />}
                  </button>
                  <div className="min-w-0">
                    <p className={`font-medium text-white truncate ${item.purchased ? 'line-through' : ''}`}>{item.name}</p>
                    <p className="text-[10px] text-slate-400">{item.quantity}x • {formatCOP(item.price)}</p>
                    {rose > 0 && <p className="text-[10px] text-amber-400 flex items-center gap-1"><TrendingUp size={10} /> Subió {rose}% vs. tu último mercado</p>}
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <span className="text-white font-bold">{formatCOP(item.quantity * item.price)}</span>
                  <button onClick={() => handleEdit(item)} aria-label={`Editar ${item.name}`} className="text-blue-400 p-2"><Edit size={14} /></button>
                  <button onClick={() => handleDelete(item.id)} aria-label={`Eliminar ${item.name}`} className="text-red-400 p-2"><Trash2 size={14} /></button>
                </div>
              </div>
            );
          })}
          <button onClick={handleFinalize} className="w-full btn-primary mt-2 flex items-center justify-center gap-2">
            <Check size={18} /> Finalizar compra • {formatCOP(purchased.length > 0 ? purchasedTotal : totalSpent)}
          </button>
          <p className="text-center text-[11px] text-slate-500">
            {purchased.length > 0 ? 'Se registran los productos marcados.' : 'Sin productos marcados: se registra toda la lista.'} El total queda como gasto en Finanzas.
          </p>
        </div>
      )}
    </div>
  );
}
