import { useState, useEffect } from 'react';
import { AreaChart, Area, ResponsiveContainer, XAxis } from 'recharts';
import { Plus, Pencil, ArrowUpRight, TrendingUp, X, Calendar, Clock } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface Account {
  id: string;
  name: string;
  bank: string;
  type: string;
  balance: number;
  rate: number;
}

export default function ProfitabilityPage() {
  // Estado inicial con los datos exactos de tu imagen de referencia
  const [accounts, setAccounts] = useState<Account[]>(() => {
    const saved = localStorage.getItem('rentabilidad_accounts_v2');
    return saved ? JSON.parse(saved) : [
      { id: '1', name: 'Cuenta Nu Bank', bank: 'Nu Bank', type: 'Cuenta de Ahorro', balance: 101234, rate: 9.25 }
    ];
  });

  const [selectedId, setSelectedId] = useState<string>(() => {
    const saved = localStorage.getItem('rentabilidad_selected_v2');
    return saved || '1';
  });

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({ name: '', bank: '', balance: '', rate: '' });

  // Seleccionar cuenta activa
  const selectedAccount = accounts.find(a => a.id === selectedId) || accounts[0];

  // Cálculos financieros reales
  const dailyRate = Math.pow(1 + selectedAccount.rate / 100, 1 / 365) - 1;
  const dailyInterest = selectedAccount.balance * dailyRate;
  const currentBalance = selectedAccount.balance + dailyInterest;

  // Guardar en localStorage
  useEffect(() => {
    localStorage.setItem('rentabilidad_accounts_v2', JSON.stringify(accounts));
    localStorage.setItem('rentabilidad_selected_v2', selectedId);
  }, [accounts, selectedId]);

  // Datos para gráfico de proyección 30 días (curva suave ascendente)
  const projectionData = Array.from({ length: 30 }, (_, i) => {
    const dayBalance = selectedAccount.balance * Math.pow(1 + dailyRate, i + 1);
    return {
      day: i === 0 ? 'Hoy' : i === 9 ? 'Día 10' : i === 19 ? 'Día 20' : i === 29 ? 'Día 30' : '',
      value: Math.round(dayBalance),
      fullDay: i + 1
    };
  });

  // Handlers
  const openModal = (account?: Account) => {
    if (account) {
      setEditingId(account.id);
      setFormData({ name: account.name, bank: account.bank, balance: account.balance.toString(), rate: account.rate.toString() });
    } else {
      setEditingId(null);
      setFormData({ name: '', bank: '', balance: '', rate: '' });
    }
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newAccount: Account = {
      id: editingId || Date.now().toString(),
      name: formData.name || 'Cuenta de Ahorro',
      bank: formData.bank || 'Banco',
      type: 'Cuenta de Ahorro',
      balance: parseFloat(formData.balance) || 0,
      rate: parseFloat(formData.rate) || 0
    };
    if (editingId) {
      setAccounts(prev => prev.map(a => a.id === editingId ? newAccount : a));
    } else {
      setAccounts(prev => [...prev, newAccount]);
      setSelectedId(newAccount.id);
    }
    setIsModalOpen(false);
  };

  const handleDelete = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (accounts.length > 1 && confirm('¿Eliminar esta cuenta?')) {
      const updated = accounts.filter(a => a.id !== id);
      setAccounts(updated);
      if (selectedId === id) setSelectedId(updated[0].id);
    }
  };

  const formatMoney = (val: number) => `$${val.toLocaleString('es-CO', { minimumFractionDigits: 2 })}`;

  return (
    <div className="min-h-screen bg-[#0A0F1C] text-white pb-24 font-sans">
      <div className="px-5 pt-6 space-y-4">
        
        {/* 🔝 HEADER */}
        <div className="flex justify-between items-start mb-2">
          <div>
            <h1 className="text-3xl font-bold text-white">Rentabilidad</h1>
            <p className="text-slate-400 text-sm mt-1">Crece tu dinero día a día</p>
          </div>
          <button onClick={() => openModal()} className="w-12 h-12 rounded-full bg-emerald-500 flex items-center justify-center text-black shadow-lg active:scale-95 transition">
            <Plus size={24} strokeWidth={3} />
          </button>
        </div>

        {/* 💰 TARJETA PRINCIPAL VERDE (Interés del Día) */}
        <div className="rounded-[28px] p-5 bg-gradient-to-br from-emerald-700 via-emerald-600 to-emerald-800 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-40 h-40 bg-white/10 blur-3xl rounded-full -mr-10 -mt-10" />
          
          <div className="relative z-10 flex justify-between items-start">
            <div className="flex-1">
              <p className="text-emerald-100 text-xs font-semibold uppercase tracking-wider">Interés generado hoy</p>
              <h2 className="text-5xl font-bold text-white mt-3 tracking-tight">{formatMoney(dailyInterest)}</h2>
              
              <div className="mt-6">
                <p className="text-emerald-100/70 text-xs">Tasa diaria (EA)</p>
                <p className="text-3xl font-bold text-emerald-200 mt-1">{selectedAccount.rate}%</p>
              </div>
            </div>

            {/* Mini gráfico a la derecha */}
            <div className="w-36 h-28 relative">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={projectionData.slice(0, 8)}>
                  <defs>
                    <linearGradient id="miniGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#6EE7B7" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#6EE7B7" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <Area type="monotone" dataKey="value" stroke="#6EE7B7" fill="url(#miniGrad)" strokeWidth={3} dot={false} />
                </AreaChart>
              </ResponsiveContainer>
              <div className="absolute bottom-0 right-0 bg-emerald-500/30 backdrop-blur-md px-3 py-1.5 rounded-lg border border-emerald-400/30">
                <span className="text-xs font-bold text-emerald-100">+{(dailyRate*100).toFixed(3)}% hoy ↑</span>
              </div>
            </div>
          </div>
        </div>

        {/* 🏦 CUENTA DE AHORRO */}
        <div className="rounded-[28px] p-5 bg-[#111827] border border-white/5">
          <div className="flex justify-between items-start mb-5">
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-semibold text-white">{selectedAccount.name}</h2>
                <button onClick={() => openModal(selectedAccount)} className="p-1.5 hover:bg-white/10 rounded-lg transition">
                  <Pencil size={18} className="text-blue-400" />
                </button>
              </div>
              <p className="text-emerald-400 text-sm mt-1">{selectedAccount.bank} • {selectedAccount.rate}% EA</p>
            </div>
            {accounts.length > 1 && (
              <button onClick={(e) => handleDelete(selectedAccount.id, e)} className="p-2 hover:bg-red-500/10 rounded-xl transition">
                <X size={18} className="text-red-400" />
              </button>
            )}
          </div>

          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-slate-400 text-sm">Saldo anterior</span>
              <span className="text-white font-medium">{formatMoney(selectedAccount.balance)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-400 text-sm">Interés generado hoy</span>
              <span className="text-emerald-400 font-semibold">+{formatMoney(dailyInterest)}</span>
            </div>
            <div className="border-t border-white/10 pt-4 flex justify-between items-center">
              <span className="text-white font-medium text-lg">Saldo actual</span>
              <span className="text-white font-bold text-2xl">{formatMoney(currentBalance)}</span>
            </div>
          </div>

          {/* Selector de cuentas */}
          {accounts.length > 1 && (
            <div className="mt-5 flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
              {accounts.map(acc => (
                <button key={acc.id} onClick={() => setSelectedId(acc.id)} 
                  className={`px-4 py-2 rounded-xl text-xs font-medium whitespace-nowrap transition ${selectedId === acc.id ? 'bg-emerald-500 text-black' : 'bg-white/5 text-slate-400 hover:bg-white/10'}`}>
                  {acc.name}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* 📋 RESUMEN DEL DÍA */}
        <div className="rounded-[28px] p-5 bg-[#111827] border border-white/5">
          <div className="flex justify-between items-center mb-5">
            <h3 className="text-lg font-semibold text-white">Resumen del día</h3>
            <div className="text-right">
              <p className="text-slate-400 text-xs">Hoy</p>
              <p className="text-white text-sm">{new Date().toLocaleDateString('es-CO', { day: '2-digit', month: 'long', year: 'numeric' })}</p>
            </div>
          </div>
          
          <div className="space-y-3">
            {[
              { label: 'Tasa diaria (EA)', value: `${selectedAccount.rate}%` },
              { label: 'Interés generado', value: formatMoney(dailyInterest), color: 'text-emerald-400' },
              { label: 'Saldo anterior', value: formatMoney(selectedAccount.balance) },
              { label: 'Saldo actual', value: formatMoney(currentBalance) },
            ].map((item, i) => (
              <div key={i} className="flex justify-between items-center py-2 border-b border-white/5 last:border-0">
                <span className="text-slate-400 text-sm">{item.label}</span>
                <span className={`font-medium ${item.color || 'text-white'}`}>{item.value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* 📈 PROYECCIÓN 30 DÍAS */}
        <div className="rounded-[28px] p-5 bg-[#111827] border border-white/5">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold text-white">Proyección 30 días</h3>
            <span className="text-emerald-400 font-bold">{formatMoney(selectedAccount.balance * Math.pow(1 + dailyRate, 30))}</span>
          </div>
          
          <div className="h-40 -ml-2 -mr-2">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={projectionData} margin={{ top: 5, right: 5, left: -10, bottom: 0 }}>
                <defs>
                  <linearGradient id="projGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10B981" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#10B981" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fill: '#64748B', fontSize: 11 }} interval="preserveStartEnd" />
                <Area type="monotone" dataKey="value" stroke="#10B981" fill="url(#projGrad)" strokeWidth={2.5} dot={{ fill: '#10B981', r: 4, strokeWidth: 0 }} activeDot={{ r: 6 }} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* 📜 HISTORIAL / ESTADÍSTICAS */}
        <div className="rounded-[28px] p-5 bg-[#111827] border border-white/5">
          <div className="flex border-b border-white/10 mb-4">
            <button className="flex-1 pb-3 text-emerald-400 font-semibold border-b-2 border-emerald-400">Historial</button>
            <button className="flex-1 pb-3 text-slate-500 font-medium">Estadísticas</button>
          </div>

          <p className="text-slate-400 text-xs mb-3">Viernes {new Date().toLocaleDateString('es-CO', { day: '2-digit', month: 'long' })}</p>
          
          <div className="flex items-center justify-between p-4 bg-white/[0.02] rounded-2xl border border-white/5">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-400">
                <TrendingUp size={24} />
              </div>
              <div>
                <h4 className="text-white font-semibold text-base">Interés diario generado</h4>
                <p className="text-slate-500 text-xs mt-0.5 flex items-center gap-1">
                  {selectedAccount.rate}% EA <span className="text-slate-600">•</span> 07:00 AM
                </p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-emerald-400 font-bold text-lg">+{formatMoney(dailyInterest)}</p>
            </div>
          </div>
        </div>
      </div>

      {/* 📝 MODAL AGREGAR/EDITAR */}
      <AnimatePresence>
        {isModalOpen && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
            <motion.div initial={{ y: 100 }} animate={{ y: 0 }} exit={{ y: 100 }} className="bg-[#111827] w-full sm:max-w-md rounded-t-3xl sm:rounded-3xl border border-white/10 p-6">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold text-white">{editingId ? 'Editar Cuenta' : 'Nueva Cuenta'}</h3>
                <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-white/10 rounded-full"><X size={20} /></button>
              </div>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="text-xs text-slate-400 uppercase font-bold mb-1 block">Entidad / Banco</label>
                  <input type="text" value={formData.bank} onChange={e => setFormData({...formData, bank: e.target.value})} placeholder="Ej: Nu Bank" className="w-full bg-[#0A0F1C] border border-white/10 rounded-xl px-4 py-3 text-white focus:border-emerald-500 outline-none" required />
                </div>
                <div>
                  <label className="text-xs text-slate-400 uppercase font-bold mb-1 block">Nombre de la cuenta</label>
                  <input type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} placeholder="Ej: Cuenta de Ahorro" className="w-full bg-[#0A0F1C] border border-white/10 rounded-xl px-4 py-3 text-white focus:border-emerald-500 outline-none" required />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs text-slate-400 uppercase font-bold mb-1 block">Saldo Actual</label>
                    <input type="number" value={formData.balance} onChange={e => setFormData({...formData, balance: e.target.value})} placeholder="101234" className="w-full bg-[#0A0F1C] border border-white/10 rounded-xl px-4 py-3 text-white focus:border-emerald-500 outline-none" required />
                  </div>
                  <div>
                    <label className="text-xs text-slate-400 uppercase font-bold mb-1 block">Tasa EA (%)</label>
                    <input type="number" step="0.01" value={formData.rate} onChange={e => setFormData({...formData, rate: e.target.value})} placeholder="9.25" className="w-full bg-[#0A0F1C] border border-white/10 rounded-xl px-4 py-3 text-white focus:border-emerald-500 outline-none" required />
                  </div>
                </div>
                <button type="submit" className="w-full bg-emerald-500 hover:bg-emerald-400 text-black font-bold py-3.5 rounded-xl mt-2 transition-colors">
                  {editingId ? 'Guardar Cambios' : 'Agregar Cuenta'}
                </button>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}