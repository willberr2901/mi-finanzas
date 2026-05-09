import { useState, useEffect } from 'react';
import { Plus, Trash2, DollarSign, Save, X, ChevronDown, ChevronUp, History, Edit } from 'lucide-react';
import { notify } from '../services/notificationService';
import { secureStorage } from '../utils/security';

interface ProfitAccount {
  id: string;
  entityName: string;
  accountType: string;
  initialAmount: number;
  annualRate: number;
  createdAt: string;
  history: Array<{ date: string; balance: number; interest: number }>;
}

const BANKS = ['Bancolombia','Davivienda','Banco de Bogotá','BBVA','Falabella','Nequi','Daviplata','Nu Bank','RappiPay','Bancóldex','BAC Credomatic','Colpatria','Citibank','Deutsche Bank','Girobank','Interbank','Itaú','JPMorgan Chase','Kasba','Mercantil','Pibank','Scotiabank','Sudameris','Urbano','Wurbancard','Otro'];
const ACCOUNT_TYPES = ['Cuenta de Ahorros','CDT','Fondo de Inversión','Cuenta Corriente'];

export default function ProfitabilityPage() {
  const [accounts, setAccounts] = useState<ProfitAccount[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [historyId, setHistoryId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  
  const [entityName, setEntityName] = useState('');
  const [accountType, setAccountType] = useState('Cuenta de Ahorros');
  const [initialAmount, setInitialAmount] = useState('');
  const [annualRate, setAnnualRate] = useState('');

  // Cargar datos al iniciar
  useEffect(() => {
    const saved = secureStorage.getItem('profitAccounts');
    if (saved && Array.isArray(saved)) {
      setAccounts(saved);
    }
  }, []);

  // Guardar datos cuando cambian
  useEffect(() => {
    if (accounts.length > 0) secureStorage.setItem('profitAccounts', accounts);
  }, [accounts]);

  // Actualizar historial diario y notificación
  useEffect(() => {
    if (accounts.length === 0) return;
    const today = new Date().toLocaleDateString('es-CO');
    
    setAccounts(prev => prev.map(acc => {
      const dailyInterest = (acc.initialAmount * (acc.annualRate / 100)) / 365;
      const newBalance = acc.initialAmount + dailyInterest;
      let updatedHistory = acc.history || [];
      const todayEntry = updatedHistory.find(h => h.date === today);
      
      if (!todayEntry) {
        updatedHistory.push({ date: today, balance: newBalance, interest: dailyInterest });
      } else {
        todayEntry.balance = newBalance;
        todayEntry.interest = dailyInterest;
      }
      
      // Mantener últimos 60 días
      updatedHistory = updatedHistory.slice(-60);
      return { ...acc, history: updatedHistory };
    }));

    // Notificación única por día
    if (!sessionStorage.getItem(`notif_profit_${today}`)) {
      const totalDaily = accounts.reduce((sum, acc) => sum + ((acc.initialAmount * (acc.annualRate / 100)) / 365), 0);
      if (totalDaily > 0) {
        notify({ title: '💰 Ganancia de Hoy', message: `Aprox. $${totalDaily.toLocaleString('es-CO', {minimumFractionDigits: 2})} en intereses.`, type: 'success' });
        sessionStorage.setItem(`notif_profit_${today}`, 'true');
      }
    }
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!entityName || !initialAmount || !annualRate) {
      notify({ title: '❌ Error', message: 'Completa todos los campos correctamente.', type: 'error' });
      return;
    }

    const amount = parseFloat(initialAmount.replace(/[^0-9.-]+/g, ''));
    const rate = parseFloat(annualRate);

    if (isNaN(amount) || isNaN(rate) || amount <= 0 || rate < 0) {
      notify({ title: '❌ Error', message: 'Monto y tasa deben ser números positivos.', type: 'error' });
      return;
    }

    const payload = { entityName, accountType, initialAmount: amount, annualRate: rate };
    const today = new Date().toLocaleDateString('es-CO');
    const dailyInterest = (amount * (rate / 100)) / 365;

    if (editingId) {
      setAccounts(prev => prev.map(acc => 
        acc.id === editingId 
          ? { ...acc, ...payload, history: [{ date: today, balance: amount + dailyInterest, interest: dailyInterest }, ...(acc.history || [])].slice(-60) }
          : acc
      ));
      notify({ title: '✅ Cuenta Actualizada', message: entityName, type: 'success' });
    } else {
      const newAcc: ProfitAccount = {
        ...payload,
        id: Date.now().toString(),
        createdAt: new Date().toISOString(),
        history: [{ date: today, balance: amount + dailyInterest, interest: dailyInterest }]
      };
      setAccounts(prev => [...prev, newAcc]);
      notify({ title: '✅ Cuenta Agregada', message: entityName, type: 'success' });
    }

    resetForm();
    setIsModalOpen(false);
  };

  const handleEdit = (acc: ProfitAccount) => {
    setEntityName(acc.entityName);
    setAccountType(acc.accountType);
    setInitialAmount(acc.initialAmount.toString());
    setAnnualRate(acc.annualRate.toString());
    setEditingId(acc.id);
    setIsModalOpen(true);
  };

  const handleDelete = (id: string) => {
    if (confirm('¿Eliminar esta cuenta y su historial?')) {
      setAccounts(prev => prev.filter(a => a.id !== id));
      notify({ title: '🗑️ Eliminada', message: 'Cuenta eliminada correctamente.', type: 'info' });
    }
  };

  const resetForm = () => {
    setEntityName('');
    setAccountType('Cuenta de Ahorros');
    setInitialAmount('');
    setAnnualRate('');
    setEditingId(null);
  };

  const getMetrics = (a: ProfitAccount) => {
    const dailyInterest = (a.initialAmount * (a.annualRate / 100)) / 365;
    const lastEntry = a.history && a.history.length > 1 ? a.history[a.history.length - 2] : null;
    const hasHistory = a.history && a.history.length >= 2;
    
    return {
      dailyInterest,
      hasHistory,
      previousBalance: hasHistory ? lastEntry?.balance || a.initialAmount - dailyInterest : a.initialAmount - dailyInterest,
      currentBalance: a.initialAmount + dailyInterest
    };
  };

  const proj = (amt: number, rate: number) => {
    const r: Array<{m: number, int: number, bal: number}> = [];
    let bal = amt;
    const mr = rate / 100 / 12;
    for(let i = 1; i <= 12; i++) {
      const int = bal * mr;
      bal += int;
      r.push({ m: i, int, bal });
    }
    return r;
  };

  return (
    <div className="p-4 pb-28 space-y-6">
      <div className="flex justify-between items-center">
        <div><h1 className="text-2xl font-bold text-white">Rentabilidad</h1><p className="text-slate-400 text-sm">Crece tu dinero día a día</p></div>
        <button onClick={() => setIsModalOpen(true)} className="bg-emerald-500 text-black p-3 rounded-full shadow-lg hover:scale-105 transition"><Plus size={24}/></button>
      </div>

      <div className="bg-gradient-to-br from-emerald-900 to-teal-900 rounded-2xl p-5 border border-emerald-500/30 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/20 rounded-full blur-xl -mr-8 -mt-8"></div>
        <p className="text-emerald-300 text-xs font-bold uppercase tracking-wider mb-1">Interés Generado HOY</p>
        <p className="text-4xl font-bold text-white">${accounts.reduce((s, a) => s + ((a.initialAmount * (a.annualRate / 100)) / 365), 0).toLocaleString('es-CO', {minimumFractionDigits: 2})}</p>
        <p className="text-xs text-emerald-400/80 mt-1">{accounts.length} cuenta(s) activa(s)</p>
      </div>

      {accounts.length === 0 ? (
        <div className="text-center py-12 opacity-60"><DollarSign size={48} className="mx-auto mb-4 text-slate-600"/><p className="text-slate-400">No tienes cuentas configuradas.</p><button onClick={() => setIsModalOpen(true)} className="mt-4 text-emerald-400 font-semibold">Agregar primera cuenta</button></div>
      ) : (
        <div className="space-y-4">
          {accounts.map(a => {
            const m = getMetrics(a);
            return (
              <div key={a.id} className="bg-slate-800/50 rounded-2xl p-4 border border-white/10">
                <div className="flex justify-between items-start mb-3">
                  <div><h3 className="font-bold text-white">{a.entityName}</h3><p className="text-xs text-slate-400">{a.accountType} • <span className="text-emerald-400">{a.annualRate}% EA</span></p></div>
                  <div className="flex gap-2">
                    <button onClick={() => handleEdit(a)} className="text-blue-400 p-1"><Edit size={16}/></button>
                    <button onClick={() => handleDelete(a.id)} className="text-red-400 p-1"><Trash2 size={16}/></button>
                  </div>
                </div>
                
                <div className="bg-black/30 rounded-xl p-3 mb-3 space-y-2">
                  {m.hasHistory ? (
                    <>
                      <div className="flex justify-between text-sm"><span className="text-slate-400">Saldo Anterior</span><span>${m.previousBalance.toLocaleString('es-CO', {minimumFractionDigits: 2})}</span></div>
                      <div className="flex justify-center"><ChevronDown className="text-emerald-500 rotate-90" size={14}/></div>
                    </>
                  ) : (
                    <div className="text-center text-xs text-slate-500 mb-1">Cuenta nueva • Sin registro anterior</div>
                  )}
                  <div className="flex justify-between text-sm"><span className="text-emerald-400 font-bold">Saldo Actual</span><span className="font-bold text-white">${m.currentBalance.toLocaleString('es-CO', {minimumFractionDigits: 2})}</span></div>
                  <div className="pt-2 border-t border-white/10 flex justify-between text-xs"><span className="text-slate-500 uppercase">Interés Hoy</span><span className="text-emerald-400 font-bold">+${m.dailyInterest.toLocaleString('es-CO', {minimumFractionDigits: 2})}</span></div>
                </div>

                <div className="flex gap-2">
                  <button onClick={() => setExpandedId(expandedId === a.id ? null : a.id)} className="flex-1 text-xs text-slate-400 bg-white/5 py-2 rounded-lg flex items-center justify-center gap-1 hover:bg-white/10">
                    {expandedId === a.id ? <ChevronUp size={12}/> : <ChevronDown size={12}/>} {expandedId === a.id ? 'Ocultar' : 'Proyección 12M'}
                  </button>
                  <button onClick={() => setHistoryId(historyId === a.id ? null : a.id)} className="flex-1 text-xs text-slate-400 bg-white/5 py-2 rounded-lg flex items-center justify-center gap-1 hover:bg-white/10">
                    <History size={12}/> {historyId === a.id ? 'Ocultar' : 'Historial'}
                  </button>
                </div>

                {expandedId === a.id && (
                  <div className="mt-3 bg-black/30 rounded-lg p-3 overflow-x-auto">
                    <table className="w-full text-xs">
                      <thead className="text-slate-500 border-b border-white/10"><tr><th className="py-1">Mes</th><th className="text-right py-1">Interés</th><th className="text-right py-1">Saldo</th></tr></thead>
                      <tbody>{proj(a.initialAmount, a.annualRate).map(r => <tr key={r.m} className="border-b border-white/5"><td className="py-1">{r.m}</td><td className="text-right text-emerald-400">+${r.int.toLocaleString('es-CO', {maximumFractionDigits: 2})}</td><td className="text-right text-white">${r.bal.toLocaleString('es-CO', {maximumFractionDigits: 2})}</td></tr>)}</tbody>
                    </table>
                  </div>
                )}
                {historyId === a.id && a.history.length > 0 && (
                  <div className="mt-3 bg-black/30 rounded-lg p-3 max-h-40 overflow-y-auto">
                    <table className="w-full text-xs">
                      <thead className="text-slate-500 border-b border-white/10"><tr><th className="py-1">Fecha</th><th className="text-right py-1">Interés</th><th className="text-right py-1">Saldo</th></tr></thead>
                      <tbody>{[...a.history].reverse().slice(0, 15).map((h, i) => <tr key={i} className="border-b border-white/5"><td className="py-1">{h.date}</td><td className="text-right text-emerald-400">+${h.interest.toLocaleString('es-CO', {maximumFractionDigits: 2})}</td><td className="text-right text-white">${h.balance.toLocaleString('es-CO', {maximumFractionDigits: 2})}</td></tr>)}</tbody>
                    </table>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/90 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4 backdrop-blur-sm">
          <div className="bg-slate-900 w-full sm:max-w-md rounded-t-2xl sm:rounded-2xl border border-slate-700 shadow-2xl h-[90vh] sm:h-auto flex flex-col">
            <div className="flex justify-between items-center p-4 border-b border-slate-800 flex-shrink-0">
              <h2 className="text-xl font-bold text-white">{editingId ? 'Editar Cuenta' : 'Nueva Cuenta'}</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-white"><X size={24}/></button>
            </div>

            <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-4 space-y-4">
              <div><label className="block text-xs text-slate-400 mb-1 uppercase font-bold">Entidad Financiera</label><select value={entityName} onChange={e => setEntityName(e.target.value)} className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-3 text-white focus:ring-2 focus:ring-emerald-500 outline-none appearance-none"><option value="">Selecciona un banco...</option>{BANKS.map(b => <option key={b} value={b}>{b}</option>)}</select></div>
              <div><label className="block text-xs text-slate-400 mb-1 uppercase font-bold">Tipo de Producto</label><select value={accountType} onChange={e => setAccountType(e.target.value)} className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-3 text-white focus:ring-2 focus:ring-emerald-500 outline-none appearance-none">{ACCOUNT_TYPES.map(t => <option key={t} value={t}>{t}</option>)}</select></div>
              <div><label className="block text-xs text-slate-400 mb-1 uppercase font-bold">Monto Actual ($)</label><input type="number" placeholder="Ej: 1000000" value={initialAmount} onChange={e => setInitialAmount(e.target.value)} className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-3 text-white focus:ring-2 focus:ring-emerald-500 outline-none"/></div>
              <div><label className="block text-xs text-slate-400 mb-1 uppercase font-bold">Tasa Anual (%)</label><input type="number" step="0.01" placeholder="Ej: 9.5" value={annualRate} onChange={e => setAnnualRate(e.target.value)} className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-3 text-white focus:ring-2 focus:ring-emerald-500 outline-none"/></div>
            </form>

            <div className="p-4 border-t border-slate-800 bg-slate-900 flex-shrink-0 rounded-b-2xl">
              <button type="submit" className="w-full bg-gradient-to-r from-emerald-500 to-teal-500 text-black font-bold py-4 px-6 rounded-xl shadow-lg hover:shadow-emerald-500/20 transition-all active:scale-95 flex items-center justify-center gap-2">
                <Save size={20}/> {editingId ? 'Actualizar Cuenta' : 'Guardar Configuración'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}