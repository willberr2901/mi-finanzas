import { useState, useEffect, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Minus, Trash2, Check, TrendingUp, Pencil, Search, ShoppingBasket, X, Sparkles } from 'lucide-react';
import { notify } from '../services/notificationService';
import { secureStorage } from '../utils/security';
import { db } from '../utils/database';
import { formatCOP, todayISO } from '../utils/format';
import { addMarketPurchase, lastPriceOf, knownProducts } from '../utils/marketHistory';
import MoneyInput from '../components/ui/MoneyInput';
import ModuleHeader from '../components/ui/ModuleHeader';
import { usePageTour } from '../components/tour/Tour';

interface MarketItem {
  id: string;
  name: string;
  quantity: number;
  price: number;
  purchased: boolean;
  previousPrice?: number | null;
}

const BUDGET_PRESETS = [100000, 200000, 300000, 500000];

export default function MarketPage() {
  const [items, setItems] = useState<MarketItem[]>([]);
  const [budget, setBudget] = useState(200000);
  const [loaded, setLoaded] = useState(false);
  const [name, setName] = useState('');
  const [qty, setQty] = useState(1);
  const [price, setPrice] = useState(0);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingBudget, setEditingBudget] = useState(false);
  const [search, setSearch] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const [lastAdded, setLastAdded] = useState<string | null>(null);
  const [celebrate, setCelebrate] = useState<number | null>(null);
  const nameRef = useRef<HTMLInputElement>(null);
  const known = useMemo(() => knownProducts(), [loaded]);

  usePageTour('mercado', [
    { target: 'mk-budget', title: 'Tu presupuesto', text: 'Toca el lápiz para decir cuánto piensas gastar. La barra cambia a amarillo cuando vas por el 85% y a rojo si te pasas.' },
    { target: 'mk-composer', title: 'Agrega productos', text: 'Escribe el producto: si ya lo compraste antes, te sugerimos el precio. Ajusta la cantidad con − y + y toca el botón verde.' },
    { target: 'mk-list', title: 'Márcalos en el carrito', text: 'Toca un producto cuando lo eches al carrito y baja a "En el carrito". Si un precio subió frente a tu último mercado, te avisamos.' },
    { target: 'mk-finish', title: 'Finaliza la compra', text: 'Al terminar, el total queda guardado como gasto de Mercado en Finanzas y en tu historial para comparar precios la próxima vez.' },
  ]);

  useEffect(() => {
    const savedItems = secureStorage.getItem('marketItems');
    const savedBudget = secureStorage.getItem('marketBudget');
    if (Array.isArray(savedItems)) setItems(savedItems);
    if (typeof savedBudget === 'number') setBudget(savedBudget);
    setLoaded(true);
  }, []);

  useEffect(() => {
    if (!loaded) return;
    secureStorage.setItem('marketItems', items);
    secureStorage.setItem('marketBudget', budget);
    window.dispatchEvent(new Event('mf:data-changed'));
  }, [items, budget, loaded]);

  const total = items.reduce((s, i) => s + i.price * i.quantity, 0);
  const inCart = items.filter(i => i.purchased);
  const cartTotal = inCart.reduce((s, i) => s + i.price * i.quantity, 0);
  const pending = items.filter(i => !i.purchased);
  const pct = budget > 0 ? (total / budget) * 100 : 0;
  const left = budget - total;
  const barColor = pct >= 100 ? 'from-red-500 to-rose-500' : pct >= 85 ? 'from-amber-400 to-orange-500' : 'from-emerald-400 to-lime-400';
  const filter = (list: MarketItem[]) => list.filter(i => i.name.toLowerCase().includes(search.toLowerCase()));

  const suggestions = name.trim().length >= 1
    ? known.filter(k => k.name.toLowerCase().includes(name.trim().toLowerCase()) && !items.some(i => i.name.toLowerCase() === k.name.toLowerCase())).slice(0, 5)
    : [];
  const frequent = known.filter(k => !items.some(i => i.name.toLowerCase() === k.name.toLowerCase())).slice(0, 8);

  const resetComposer = () => { setName(''); setQty(1); setPrice(0); setEditingId(null); };

  const add = (n = name, q = qty, p = price) => {
    const clean = n.trim();
    if (!clean) { nameRef.current?.focus(); return notify({ title: 'Escribe qué vas a comprar', type: 'info' }); }
    if (!p) return notify({ title: `¿Cuánto cuesta ${clean}?`, message: 'Escribe el precio por unidad.', type: 'info' });
    if (editingId) {
      setItems(prev => prev.map(i => i.id === editingId ? { ...i, name: clean, quantity: q, price: p } : i));
      setLastAdded(editingId);
      notify({ title: 'Producto actualizado', message: clean, type: 'success' });
    } else {
      const previousPrice = lastPriceOf(clean);
      const id = Date.now().toString();
      setItems(prev => [{ id, name: clean, quantity: q, price: p, purchased: false, previousPrice }, ...prev]);
      setLastAdded(id);
      if (previousPrice && p > previousPrice) notify({ title: `${clean} subió ${Math.round(((p - previousPrice) / previousPrice) * 100)}%`, message: `La última vez lo pagaste a ${formatCOP(previousPrice)}`, type: 'warning' });
    }
    resetComposer();
    nameRef.current?.focus();
  };

  const pick = (k: { name: string; price: number }) => { setName(k.name); setPrice(k.price); };
  const quickAdd = (k: { name: string; price: number }) => add(k.name, 1, k.price);
  const toggle = (id: string) => setItems(prev => prev.map(i => i.id === id ? { ...i, purchased: !i.purchased } : i));
  const changeQty = (id: string, d: number) => setItems(prev => prev.map(i => i.id === id ? { ...i, quantity: Math.max(1, i.quantity + d) } : i));
  const remove = (id: string) => setItems(prev => prev.filter(i => i.id !== id));
  const edit = (i: MarketItem) => { setEditingId(i.id); setName(i.name); setQty(i.quantity); setPrice(i.price); window.scrollTo({ top: 0, behavior: 'smooth' }); };

  const finalize = async () => {
    const toClose = inCart.length ? inCart : items;
    if (!toClose.length) return;
    const sum = toClose.reduce((s, i) => s + i.price * i.quantity, 0);
    if (!inCart.length && !window.confirm(`No marcaste productos en el carrito. ¿Finalizar con toda la lista (${formatCOP(sum)})?`)) return;
    try {
      await db.transactions.add({ id: crypto.randomUUID(), date: todayISO(), type: 'expense', amount: sum, category: 'Mercado', description: `Mercado · ${toClose.length} productos`, createdAt: Date.now() });
    } catch { /* el historial se guarda igual */ }
    addMarketPurchase({ id: Date.now().toString(), date: new Date().toISOString(), total: sum, itemsCount: toClose.length, items: toClose.map(({ name, quantity, price }) => ({ name, quantity, price })) });
    const ids = new Set(toClose.map(i => i.id));
    setItems(prev => prev.filter(i => !ids.has(i.id)));
    setCelebrate(sum);
    setTimeout(() => setCelebrate(null), 2600);
  };

  const itemCard = (i: MarketItem) => {
    const rose = i.previousPrice && i.price > i.previousPrice ? Math.round(((i.price - i.previousPrice) / i.previousPrice) * 100) : 0;
    const fresh = i.id === lastAdded;
    return (
      <motion.li key={i.id} layout
        initial={fresh ? { opacity: 0, y: -40, scale: 0.85 } : { opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, x: -120, transition: { duration: 0.2 } }}
        transition={{ type: 'spring', damping: 20, stiffness: 260 }}
        drag="x" dragConstraints={{ left: 0, right: 0 }} dragElastic={{ left: 0.6, right: 0 }} onDragEnd={(_, info) => { if (info.offset.x < -110) remove(i.id); }}
        className={`relative flex items-center gap-3 p-3 rounded-2xl border ${i.purchased ? 'bg-emerald-500/[0.06] border-emerald-500/20' : 'bg-surface border-white/5'} ${fresh ? 'ring-2 ring-emerald-400/50' : ''}`}>
        <motion.button whileTap={{ scale: 0.8 }} onClick={() => toggle(i.id)} aria-label={i.purchased ? `Sacar ${i.name} del carrito` : `Echar ${i.name} al carrito`}
          className={`w-9 h-9 shrink-0 rounded-xl border-2 flex items-center justify-center transition-colors ${i.purchased ? 'bg-emerald-500 border-emerald-500' : 'border-slate-600'}`}>
          <AnimatePresence>{i.purchased && <motion.span initial={{ scale: 0, rotate: -90 }} animate={{ scale: 1, rotate: 0 }} exit={{ scale: 0 }}><Check size={18} className="text-black" strokeWidth={3} /></motion.span>}</AnimatePresence>
        </motion.button>
        <button className="flex-1 min-w-0 text-left" onClick={() => toggle(i.id)}>
          <p className={`text-white font-semibold truncate ${i.purchased ? 'line-through opacity-60' : ''}`}>{i.name}</p>
          <p className="text-[11px] text-slate-400">{formatCOP(i.price)} c/u</p>
          {rose > 0 && <p className="text-[10px] text-amber-300 flex items-center gap-1 mt-0.5"><TrendingUp size={10} /> Subió {rose}%</p>}
        </button>
        <div className="flex flex-col items-end gap-1.5">
          <span className="text-white font-bold text-sm">{formatCOP(i.price * i.quantity)}</span>
          <div className="flex items-center bg-black/30 rounded-xl">
            <button onClick={() => changeQty(i.id, -1)} aria-label="Uno menos" className="w-8 h-8 flex items-center justify-center text-slate-300"><Minus size={14} /></button>
            <motion.span key={i.quantity} initial={{ scale: 1.4, color: '#a3e635' }} animate={{ scale: 1, color: '#ffffff' }} className="w-6 text-center text-sm font-bold">{i.quantity}</motion.span>
            <button onClick={() => changeQty(i.id, 1)} aria-label="Uno más" className="w-8 h-8 flex items-center justify-center text-slate-300"><Plus size={14} /></button>
          </div>
        </div>
        <div className="flex flex-col">
          <button onClick={() => edit(i)} aria-label={`Editar ${i.name}`} className="p-1.5 text-slate-500 hover:text-blue-300"><Pencil size={14} /></button>
          <button onClick={() => remove(i.id)} aria-label={`Quitar ${i.name}`} className="p-1.5 text-slate-500 hover:text-red-300"><Trash2 size={14} /></button>
        </div>
      </motion.li>
    );
  };

  return (
    <div className="pb-44">
      <ModuleHeader module="mercado" />

      {/* Presupuesto */}
      <motion.div data-tour="mk-budget" initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-[28px] p-5 bg-gradient-to-br from-emerald-600/30 via-emerald-500/10 to-lime-400/10 border border-emerald-400/20">
        <div className="absolute -right-8 -top-8 w-40 h-40 rounded-full bg-emerald-400/20 blur-3xl" aria-hidden="true" />
        <div className="relative">
          <div className="flex items-center justify-between">
            <p className="text-emerald-100/80 text-sm">Llevas en la lista</p>
            <button onClick={() => setEditingBudget(v => !v)} className="flex items-center gap-1 text-xs text-emerald-200 bg-black/20 rounded-full px-3 py-1.5">
              <Pencil size={12} /> Presupuesto {formatCOP(budget)}
            </button>
          </div>
          <motion.p key={total} initial={{ scale: 1.08 }} animate={{ scale: 1 }} className="text-white text-4xl font-extrabold mt-1 tracking-tight origin-left">{formatCOP(total)}</motion.p>
          <div className="h-3 rounded-full bg-black/30 mt-3 overflow-hidden">
            <motion.div className={`h-full rounded-full bg-gradient-to-r ${barColor}`} animate={{ width: `${Math.min(pct, 100)}%` }} transition={{ type: 'spring', damping: 20 }} />
          </div>
          <div className="flex justify-between text-xs mt-2">
            <span className={left < 0 ? 'text-red-300 font-semibold' : 'text-emerald-100/80'}>{left < 0 ? `Te pasaste ${formatCOP(-left)}` : `Te quedan ${formatCOP(left)}`}</span>
            <span className="text-emerald-100/80">{Math.round(pct)}% del presupuesto</span>
          </div>
          <div className="grid grid-cols-3 gap-2 mt-4 text-center">
            <div className="bg-black/20 rounded-2xl py-2"><p className="text-white font-bold">{items.length}</p><p className="text-[10px] text-emerald-100/70">productos</p></div>
            <div className="bg-black/20 rounded-2xl py-2"><p className="text-white font-bold">{inCart.length}</p><p className="text-[10px] text-emerald-100/70">en el carrito</p></div>
            <div className="bg-black/20 rounded-2xl py-2"><p className="text-white font-bold">{formatCOP(cartTotal)}</p><p className="text-[10px] text-emerald-100/70">en el carrito</p></div>
          </div>
          <AnimatePresence>
            {editingBudget && (
              <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                <div className="pt-4">
                  <MoneyInput value={budget} onChange={setBudget} prefix ariaLabel="Presupuesto del mercado" className="input-modern w-full text-lg font-bold" />
                  <div className="flex gap-2 mt-2 flex-wrap">
                    {BUDGET_PRESETS.map(b => <button key={b} onClick={() => setBudget(b)} className={`px-3 py-1.5 rounded-full text-xs font-semibold ${budget === b ? 'bg-emerald-400 text-black' : 'bg-black/30 text-emerald-100'}`}>{formatCOP(b)}</button>)}
                    <button onClick={() => setEditingBudget(false)} className="ml-auto px-3 py-1.5 rounded-full text-xs font-bold bg-white text-black">Listo</button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>

      {/* Agregar producto */}
      <motion.div data-tour="mk-composer" initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.06 }}
        className="mt-4 bg-surface border border-white/10 rounded-[28px] p-4 shadow-xl shadow-black/30">
        <div className="flex items-center justify-between mb-2">
          <p className="text-white font-bold">{editingId ? 'Editar producto' : '¿Qué vas a comprar?'}</p>
          {editingId && <button onClick={resetComposer} className="text-xs text-slate-400 flex items-center gap-1"><X size={12} /> Cancelar</button>}
        </div>
        <div className="relative">
          <ShoppingBasket size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-emerald-400" aria-hidden="true" />
          <input ref={nameRef} value={name} onChange={e => setName(e.target.value)} onKeyDown={e => e.key === 'Enter' && add()}
            placeholder="Ej: Arroz, leche, huevos…" aria-label="Nombre del producto" autoComplete="off"
            className="w-full h-14 pl-11 pr-4 rounded-2xl bg-white/5 border border-white/10 text-white text-base outline-none focus:border-emerald-400 transition-colors" />
        </div>
        <AnimatePresence>
          {suggestions.length > 0 && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="flex gap-2 overflow-x-auto pt-2 pb-1">
              {suggestions.map(k => (
                <button key={k.name} onClick={() => pick(k)} className="shrink-0 px-3 py-1.5 rounded-full bg-emerald-500/15 border border-emerald-400/30 text-emerald-200 text-xs">
                  {k.name} · {formatCOP(k.price)}
                </button>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
        <div className="flex items-stretch gap-2 mt-3">
          <div className="flex items-center bg-white/5 border border-white/10 rounded-2xl" aria-label="Cantidad">
            <motion.button whileTap={{ scale: 0.8 }} onClick={() => setQty(q => Math.max(1, q - 1))} aria-label="Uno menos" className="w-11 h-12 flex items-center justify-center text-slate-200"><Minus size={18} /></motion.button>
            <motion.span key={qty} initial={{ y: -8, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="w-7 text-center text-white font-bold text-lg">{qty}</motion.span>
            <motion.button whileTap={{ scale: 0.8 }} onClick={() => setQty(q => q + 1)} aria-label="Uno más" className="w-11 h-12 flex items-center justify-center text-slate-200"><Plus size={18} /></motion.button>
          </div>
          <MoneyInput value={price} onChange={setPrice} prefix placeholder="Precio c/u" className="flex-1 min-w-0 h-12 px-4 rounded-2xl bg-white/5 border border-white/10 text-white outline-none focus:border-emerald-400" />
          <motion.button whileTap={{ scale: 0.85 }} onClick={() => add()} aria-label={editingId ? 'Guardar producto' : 'Agregar producto'}
            className="w-12 h-12 shrink-0 rounded-2xl bg-gradient-to-br from-emerald-400 to-lime-400 flex items-center justify-center shadow-lg shadow-emerald-500/40">
            {editingId ? <Check size={22} className="text-black" /> : <Plus size={24} className="text-black" strokeWidth={3} />}
          </motion.button>
        </div>
        {price > 0 && qty > 1 && <p className="text-[11px] text-slate-400 mt-2">{qty} × {formatCOP(price)} = <strong className="text-white">{formatCOP(qty * price)}</strong></p>}
        {frequent.length > 0 && !name && (
          <div className="mt-3">
            <p className="text-[11px] text-slate-400 mb-1.5 flex items-center gap-1"><Sparkles size={11} className="text-emerald-400" /> Lo que más compras · toca para agregar</p>
            <div className="flex gap-2 overflow-x-auto pb-1">
              {frequent.map(k => (
                <motion.button whileTap={{ scale: 0.9 }} key={k.name} onClick={() => quickAdd(k)} className="shrink-0 px-3 py-2 rounded-2xl bg-white/5 border border-white/10 text-left">
                  <span className="block text-white text-xs font-semibold">{k.name}</span>
                  <span className="block text-[10px] text-slate-400">{formatCOP(k.price)}</span>
                </motion.button>
              ))}
            </div>
          </div>
        )}
      </motion.div>

      {/* Lista */}
      <div data-tour="mk-list" className="mt-5">
        {items.length === 0 ? (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-10">
            <motion.div animate={{ y: [0, -6, 0] }} transition={{ duration: 2.5, repeat: Infinity }} className="w-20 h-20 mx-auto rounded-3xl bg-gradient-to-br from-emerald-500 to-lime-400 flex items-center justify-center shadow-xl shadow-emerald-500/30">
              <ShoppingBasket size={36} className="text-white" />
            </motion.div>
            <p className="text-white font-semibold mt-4">Tu lista está vacía</p>
            <p className="text-slate-400 text-sm">Agrega el primer producto arriba.</p>
          </motion.div>
        ) : (
          <>
            {items.length > 6 && (
              <div className="flex justify-end mb-2">
                {showSearch
                  ? <input autoFocus value={search} onChange={e => setSearch(e.target.value)} onBlur={() => !search && setShowSearch(false)} placeholder="Buscar en la lista" className="input-modern w-full !py-2" />
                  : <button onClick={() => setShowSearch(true)} className="text-xs text-slate-400 flex items-center gap-1"><Search size={14} /> Buscar</button>}
              </div>
            )}
            {pending.length > 0 && <p className="text-xs font-bold text-slate-400 mb-2 tracking-wide">POR COMPRAR · {pending.length}</p>}
            <ul className="space-y-2"><AnimatePresence initial={false}>{filter(pending).map(i => itemCard(i))}</AnimatePresence></ul>
            {inCart.length > 0 && <p className="text-xs font-bold text-emerald-400 mt-5 mb-2 tracking-wide flex items-center gap-1"><Check size={13} /> EN EL CARRITO · {inCart.length}</p>}
            <ul className="space-y-2"><AnimatePresence initial={false}>{filter(inCart).map(i => itemCard(i))}</AnimatePresence></ul>
            <p className="text-center text-[10px] text-slate-500 mt-3">Desliza un producto a la izquierda para quitarlo</p>
          </>
        )}
      </div>

      {/* Barra fija para finalizar */}
      <AnimatePresence>
        {items.length > 0 && (
          <motion.div data-tour="mk-finish" initial={{ y: 120 }} animate={{ y: 0 }} exit={{ y: 120 }} transition={{ type: 'spring', damping: 24 }}
            className="fixed bottom-4 inset-x-4 max-w-md mx-auto z-40 bg-surface2/95 backdrop-blur-xl border border-emerald-400/30 rounded-3xl p-3 flex items-center gap-3 shadow-2xl shadow-black/60">
            <div className="flex-1 pl-2">
              <p className="text-[11px] text-slate-400">{inCart.length ? `En el carrito (${inCart.length})` : 'Total de la lista'}</p>
              <motion.p key={inCart.length ? cartTotal : total} initial={{ y: -6, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="text-white font-extrabold text-xl">{formatCOP(inCart.length ? cartTotal : total)}</motion.p>
            </div>
            <motion.button whileTap={{ scale: 0.95 }} onClick={finalize} className="px-5 h-12 rounded-2xl bg-gradient-to-r from-emerald-400 to-lime-400 text-black font-bold flex items-center gap-2">
              <Check size={18} strokeWidth={3} /> Finalizar
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Celebración al finalizar */}
      <AnimatePresence>
        {celebrate !== null && (
          <motion.div className="fixed inset-0 z-[140] flex items-center justify-center bg-black/60 backdrop-blur-sm" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setCelebrate(null)}>
            <motion.div initial={{ scale: 0.6, rotate: -6 }} animate={{ scale: 1, rotate: 0 }} transition={{ type: 'spring', damping: 12 }} className="bg-surface border border-emerald-400/40 rounded-[32px] p-8 text-center mx-6">
              <motion.div initial={{ scale: 0 }} animate={{ scale: [0, 1.3, 1] }} transition={{ delay: 0.15 }} className="w-20 h-20 mx-auto rounded-full bg-gradient-to-br from-emerald-400 to-lime-400 flex items-center justify-center">
                <Check size={42} className="text-black" strokeWidth={3} />
              </motion.div>
              <p className="text-white text-xl font-bold mt-4">¡Mercado listo!</p>
              <p className="text-emerald-300 text-3xl font-extrabold mt-1">{formatCOP(celebrate)}</p>
              <p className="text-slate-400 text-sm mt-2">Quedó registrado como gasto de Mercado en Finanzas.</p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
