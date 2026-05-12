import { useState, useEffect } from 'react';
import { AreaChart, Area, ResponsiveContainer, XAxis } from 'recharts';
import { Plus, Pencil, ArrowUpRight, TrendingUp, X, Trash2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface Account {
  id: string;
  name: string;
  type: string;
  balance: number;
  rate: number;
}

export default function ProfitabilityPage() {
  // 1. Estado inicial con localStorage
  const [accounts, setAccounts] = useState<Account[]>(() => {
    const saved = localStorage.getItem('rentabilidad_accounts');
    return saved ? JSON.parse(saved) : [
      { id: '1', name: 'Cuenta Nu Bank', type: 'Cuenta de Ahorro', balance: 101234, rate: 9.25 }
    ];
  });

  const [selectedAccount, setSelectedAccount] = useState<Account>(accounts[0]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({ name: '', type: 'Cuenta de Ahorro', balance: '', rate: '' });

  // 2. Guardar en localStorage y actualizar selección
  useEffect(() => {
    localStorage.setItem('rentabilidad_accounts', JSON.stringify(accounts));
    if (accounts.length > 0 && !accounts.find(a => a.id === selectedAccount?.id)) {
      setSelectedAccount(accounts[0]);
    }
  }, [accounts]);

  // 3. Cálculo financiero real
  const dailyRate = Math.pow(1 + selectedAccount.rate / 100, 1 / 365) - 1;
  const dailyInterest = selectedAccount.balance * dailyRate;
  const currentBalance = selectedAccount.balance + dailyInterest;

  // Datos dinámicos para el gráfico
  const projectionData = Array.from({ length: 7 }, (_, i) => {
    const dayBalance = selectedAccount.balance * Math.pow(1 + dailyRate, i + 1);
    return { day: `Día ${i + 1}`, value: Math.round(dayBalance) };
  });

  // 4. Handlers
  const openModal = (account?: Account) => {
    if (account) {
      setEditingId(account.id);
      setFormData({ name: account.name, type: account.type, balance: account.balance.toString(), rate: account.rate.toString() });
    } else {
      setEditingId(null);
      setFormData({ name: '', type: 'Cuenta de Ahorro', balance: '', rate: '' });
    }
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newAccount: Account = {
      id: editingId || Date.now().toString(),
      name: formData.name || 'Cuenta de Ahorro',
      type: formData.type,
      balance: parseFloat(formData.balance) || 0,
      rate: parseFloat(formData.rate) || 0
    };
    if (editingId) {
      setAccounts(prev => prev.map(a => a.id === editingId ? newAccount : a));
    } else {
      setAccounts(prev => [...prev, newAccount]);
    }
    setIsModalOpen(false);
  };

  const handleDelete = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (accounts.length > 1 && confirm('¿Eliminar esta cuenta?')) {
      setAccounts(prev => prev.filter(a => a.id !== id));
    }
  };

  return (
    <div className="min-h-screen bg-[#0A0F1C] text-white pb-24 font-sans selection:bg-emerald-500/30">
      <div className="px-5 pt-6 space-y-5">
        
        {/* 🔝 HEADER */}
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Rentabilidad</h1>
            <p className="text-slate-400 text-sm mt-1">Crece tu dinero día a día</p>
          </div>
          <button onClick={() => openModal()} className="w-12 h-12 rounded-full bg-emerald-500 flex items-center justify-center text-black shadow-[0_0_20px_rgba(16,185,129,0.4)] active:scale-95 transition-transform">
            <Plus size={24} strokeWidth={3} />
          </button>
        </motion.div>

        {/* 💰 TARJETA PRINCIPAL */}
        <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.1 }}
          className="rounded-[28px] p-5 bg-gradient-to-br from-emerald-800 via-emerald-700 to-emerald-900 border border-emerald-500/20 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-40 h-40 bg-white/5 blur-3xl rounded-full -mr-10 -mt-10" />
          <div className="relative z-10 flex justify-between items-start">
            <div>
              <p className="text-emerald-200 text-xs font-semibold uppercase tracking-wider">Interés generado hoy</p>
              <h2 className="text-4xl font-bold text-white mt-2 tracking-tight">${dailyInterest.toLocaleString('es-CO', { minimumFractionDigits: 2 })}</h2>
              <div className="mt-4">
                <p className="text-emerald-200/70 text-xs">Tasa diaria (EA)</p>
                <p className="text-2xl font-bold text-emerald-300 mt-1">{selectedAccount.rate}%</p>
              </div>
            </div>
            <div className="w-32 h-20">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={projectionData}>
                  <defs>
                    <linearGradient id="miniGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#34D399" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#34D399" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <Area type="monotone" dataKey="value" stroke="#34D399" fill="url(#miniGrad)" strokeWidth={2} dot={false} />
                </AreaChart>
              </ResponsiveContainer>
              <div className="absolute bottom-0 right-0 bg-emerald-500/20 backdrop-blur-md px-2 py-1 rounded-lg border border-emerald-500/30">
                <span className="text-xs font-bold text-emerald-300">+{(dailyRate*100).toFixed(3)}% hoy ↑</span>
              </div>
            </div>
          </div>
        </motion.div>

        {/* 🏦 CUENTA DE AHORRO (Dinámica) */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
          className="rounded-[28px] p-5 bg-[#111827] border border-white/5">
          <div className="flex justify-between items-start mb-6">
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-semibold text-white">{selectedAccount.name}</h2>
                <button onClick={() => openModal(selectedAccount)} className="p-1 hover:bg-white/10 rounded-lg transition"><Pencil size={16} className="text-blue-400" /></button>
              </div>
              <p className="text-emerald-400 text-sm mt-1">{selectedAccount.type} • {selectedAccount.rate}% EA</p>
            </div>
            {accounts.length > 1 && (
              <button onClick={(e) => handleDelete(selectedAccount.id, e)} className="p-2 hover:bg-red-500/10 rounded-xl transition"><Trash2 size={18} className="text-red-400" /></button>
            )}
          </div>

          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-slate-400 text-sm">Saldo anterior</span>
              <span className="text-white font-medium">${selectedAccount.balance.toLocaleString('es-CO', { minimumFractionDigits: 2 })}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-400 text-sm">Interés generado hoy</span>
              <span className="text-emerald-400 font-semibold">+${dailyInterest.toLocaleString('es-CO', { minimumFractionDigits: 2 })}</span>
            </div>
            <div className="border-t border-white/10 pt-4 flex justify-between items-center">
              <span className="text-white font-medium">Saldo actual</span>
              <span className="text-white font-bold text-xl">${currentBalance.toLocaleString('es-CO', { minimumFractionDigits: 2 })}</span>
            </div>
          </div>

          {/* Selector de cuentas si hay más de una */}
          {accounts.length > 1 && (
            <div className="mt-5 flex gap-2 overflow-x-auto pb-2">
              {accounts.map(acc => (
                <button key={acc.id} onClick={() => setSelectedAccount(acc)} 
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition ${selectedAccount.id === acc.id ? 'bg-emerald-500 text-black' : 'bg-white/5 text-slate-400 hover:bg-white/10'}`}>
                  {acc.name}
                </button>
              ))}
            </div>
          )}
        </motion.div>

        {/* 📈 PROYECCIÓN 30 DÍAS */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
          className="rounded-[28px] p-5 bg-[#111827] border border-white/5">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold text-white">Proyección 30 días</h3>
            <span className="text-emerald-400 font-bold">${(selectedAccount.balance * Math.pow(1 + dailyRate, 30)).toLocaleString('es-CO', { minimumFractionDigits: 2 })}</span>
          </div>
          <div className="h-40 -ml-4">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={projectionData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="projGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10B981" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#10B981" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fill: '#64748B', fontSize: 10 }} />
                <Area type="monotone" dataKey="value" stroke="#10B981" fill="url(#projGrad)" strokeWidth={2} dot={{ fill: '#10B981', r: 3 }} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* 📜 HISTORIAL */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
          className="rounded-[28px] p-5 bg-[#111827] border border-white/5">
          <div className="flex border-b border-white/10 mb-4">
            <button className="flex-1 pb-3 text-emerald-400 font-semibold border-b-2 border-emerald-400">Historial</button>
            <button className="flex-1 pb-3 text-slate-500 font-medium">Estadísticas</button>
          </div>
          <div className="space-y-1">
            <p className="text-slate-400 text-xs mb-3">Hoy</p>
            <div className="flex items-center justify-between p-3 hover:bg-white/5 rounded-xl transition-colors">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-400">
                  <TrendingUp size={20} />
                </div>
                <div>
                  <h4 className="text-white font-medium text-sm">Interés diario generado</h4>
                  <p className="text-slate-500 text-xs mt-0.5">{selectedAccount.rate}% EA • 07:00 AM</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-emerald-400 font-bold text-sm">+${dailyInterest.toLocaleString('es-CO', { minimumFractionDigits: 2 })}</p>
              </div>
            </div>
          </div>
        </motion.div>
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
                  <label className="text-xs text-slate-400 uppercase font-bold mb-1 block">Entidad / Nombre</label>
                  <input type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} placeholder="Ej: Nu Bank" className="w-full bg-[#0A0F1C] border border-white/10 rounded-xl px-4 py-3 text-white focus:border-emerald-500 outline-none" required />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs text-slate-400 uppercase font-bold mb-1 block">Saldo Actual</label>
                    <input type="number" value={formData.balance} onChange={e => setFormData({...formData, balance: e.target.value})} placeholder="100000" className="w-full bg-[#0A0F1C] border border-white/10 rounded-xl px-4 py-3 text-white focus:border-emerald-500 outline-none" required />
                  </div>
                  <div>
                    <label className="text-xs text-slate-400 uppercase font-bold mb-1 block">Tasa EA (%)</label>
                    <input type="number" step="0.01" value={formData.rate} onChange={e => setFormData({...formData, rate: e.target.value})} placeholder="9.25" className="w-full bg-[#0A0F1C] border border-white/10 rounded-xl px-4 py-3 text-white focus:border-emerald-500 outline-none" required />
                  </div>
                </div>
                <button type="submit" className="w-full bg-emerald-500 hover:bg-emerald-400 text-black font-bold py-3 rounded-xl mt-2 transition-colors">
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