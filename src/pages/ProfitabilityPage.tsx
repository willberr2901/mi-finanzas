import { useState, useEffect } from 'react';
import { Plus, Trash2, Edit, ChevronDown, ChevronUp, History } from 'lucide-react';
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

  useEffect(() => {
    const saved = secureStorage.getItem('profitAccounts');
    if (saved && Array.isArray(saved)) setAccounts(saved);
  }, []);

  useEffect(() => {
    if (accounts.length > 0) secureStorage.setItem('profitAccounts', accounts);
  }, [accounts]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!entityName || !initialAmount || !annualRate) {
      notify({ title: '❌ Error', message: 'Completa todos los campos.', type: 'error' }); return;
    }
    const amt = parseFloat(initialAmount.replace(/[^0-9.-]+/g,''));
    const rate = parseFloat(annualRate);
    if (isNaN(amt) || isNaN(rate) || amt <= 0 || rate < 0) {
      notify({ title: '❌ Error', message: 'Valores inválidos.', type: 'error' }); return;
    }

    const today = new Date().toLocaleDateString('es-CO');
    const dailyInterest = (amt * (rate / 100)) / 365;
    const payload = { entityName, accountType, initialAmount: amt, annualRate: rate };

    if (editingId) {
      setAccounts(prev => prev.map(a => 
        a.id === editingId ? { ...a, ...payload, history: [{ date: today, balance: amt + dailyInterest, interest: dailyInterest }, ...(a.history || [])].slice(-60) } : a
      ));
      notify({ title: '✅ Actualizada', message: entityName, type: 'success' });
    } else {
      const newAcc: ProfitAccount = {
        ...payload, id: Date.now().toString(), createdAt: new Date().toISOString(),
        history: [{ date: today, balance: amt + dailyInterest, interest: dailyInterest }]
      };
      setAccounts(prev => [...prev, newAcc]);
      notify({ title: '✅ Agregada', message: entityName, type: 'success' });
    }
    resetForm();
    setIsModalOpen(false);
  };

  const handleEdit = (a: ProfitAccount) => {
    setEntityName(a.entityName); setAccountType(a.accountType);
    setInitialAmount(a.initialAmount.toString()); setAnnualRate(a.annualRate.toString());
    setEditingId(a.id); setIsModalOpen(true);
  };

  const handleDelete = (id: string) => {
    if (confirm('¿Eliminar?')) { setAccounts(prev => prev.filter(a => a.id !== id)); notify({ title: '🗑️ Eliminada', type: 'info' }); }
  };

  const resetForm = () => { setEntityName(''); setAccountType('Cuenta de Ahorros'); setInitialAmount(''); setAnnualRate(''); setEditingId(null); };

  const getMetrics = (a: ProfitAccount) => {
    const daily = (a.initialAmount * (a.annualRate/100))/365;
    return { daily, currentBalance: a.initialAmount + daily };
  };

  const proj = (amt: number, rate: number) => {
    const r: any[] = []; let bal = amt; const mr = rate/100/12;
    for(let i=1;i<=12;i++){ const int = bal*mr; bal+=int; r.push({m:i,int,bal}); }
    return r;
  };

  return (
    <div className="p-0 space-y-6">
      <div className="flex justify-between items-center mb-6">
        <div><h1 className="text-2xl font-bold text-white">Rentabilidad</h1><p className="text-slate-400 text-sm">Crece tu dinero día a día</p></div>
        <button onClick={()=>{resetForm(); setIsModalOpen(true)}} className="bg-emerald-500 text-black p-3 rounded-full shadow-lg hover:scale-105 transition"><Plus size={24}/></button>
      </div>

      <div className="bg-gradient-to-br from-emerald-900 to-teal-900 rounded-2xl p-5 border border-emerald-500/30 relative overflow-hidden mb-6">
        <p className="text-emerald-300 text-xs font-bold uppercase tracking-wider mb-1">Interés Generado HOY</p>
        <p className="text-4xl font-bold text-white">${accounts.reduce((s, a) => s + ((a.initialAmount * (a.annualRate / 100)) / 365), 0).toLocaleString('es-CO', {minimumFractionDigits: 2})}</p>
      </div>

      {accounts.length === 0 ? (
        <div className="text-center py-12 opacity-60"><p className="text-slate-400">No tienes cuentas.</p><button onClick={()=>{resetForm(); setIsModalOpen(true)}} className="mt-4 text-emerald-400 font-semibold">Agregar cuenta</button></div>
      ) : (
        <div className="space-y-4">
          {accounts.map(a => {
            const m = getMetrics(a);
            return (
              <div key={a.id} className="bg-[#111827] rounded-2xl p-4 border border-white/5">
                <div className="flex justify-between items-start mb-3">
                  <div><h3 className="font-bold text-white">{a.entityName}</h3><p className="text-xs text-slate-400">{a.accountType} • <span className="text-emerald-400">{a.annualRate}% EA</span></p></div>
                  <div className="flex gap-2">
                    <button onClick={()=>handleEdit(a)} className="text-blue-400 p-1"><Edit size={16}/></button>
                    <button onClick={()=>handleDelete(a.id)} className="text-red-400 p-1"><Trash2 size={16}/></button>
                  </div>
                </div>
                <div className="bg-black/20 rounded-xl p-3 mb-3 space-y-2">
                  <div className="flex justify-between text-sm"><span className="text-emerald-400 font-bold">Saldo Actual</span><span className="font-bold text-white">${m.currentBalance.toLocaleString('es-CO', {minimumFractionDigits: 2})}</span></div>
                  <div className="pt-2 border-t border-white/10 flex justify-between text-xs"><span className="text-slate-500 uppercase">Interés Hoy</span><span className="text-emerald-400 font-bold">+${m.daily.toLocaleString('es-CO', {minimumFractionDigits: 2})}</span></div>
                </div>
                <div className="flex gap-2">
                  <button onClick={()=>setExpandedId(expandedId===a.id?null:a.id)} className="flex-1 text-xs text-slate-400 bg-white/5 py-2 rounded-lg">{expandedId===a.id?'Ocultar':'Proyección 12M'}</button>
                </div>
                {expandedId===a.id && (
                  <div className="mt-3 bg-black/30 rounded-lg p-3 overflow-x-auto">
                    <table className="w-full text-xs"><thead className="text-slate-500 border-b border-white/10"><tr><th className="py-1">Mes</th><th className="text-right py-1">Saldo</th></tr></thead>
                    <tbody>{proj(a.initialAmount,a.annualRate).map(r=><tr key={r.m} className="border-b border-white/5"><td className="py-1">{r.m}</td><td className="text-right text-white">${r.bal.toLocaleString('es-CO', {maximumFractionDigits: 2})}</td></tr>)}</tbody></table>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/90 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4 backdrop-blur-sm">
          <div className="bg-[#111827] w-full sm:max-w-md rounded-t-2xl sm:rounded-2xl border border-white/10 h-[90vh] sm:h-auto flex flex-col">
            <div className="flex justify-between items-center p-4 border-b border-white/5"><h2 className="text-xl font-bold text-white">{editingId?'Editar Cuenta':'Nueva Cuenta'}</h2><button onClick={()=>setIsModalOpen(false)} className="text-slate-400">X</button></div>
            <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-4 space-y-4">
              <div><label className="block text-xs text-slate-400 mb-1 uppercase font-bold">Entidad</label><select value={entityName} onChange={e=>setEntityName(e.target.value)} className="w-full bg-[#0F172A] border border-white/10 rounded-xl px-3 py-3 text-white outline-none focus:border-violet-500"><option value="">Selecciona...</option>{BANKS.map(b=><option key={b} value={b}>{b}</option>)}</select></div>
              <div><label className="block text-xs text-slate-400 mb-1 uppercase font-bold">Monto ($)</label><input type="number" value={initialAmount} onChange={e=>setInitialAmount(e.target.value)} className="w-full bg-[#0F172A] border border-white/10 rounded-xl px-3 py-3 text-white outline-none focus:border-violet-500"/></div>
              <div><label className="block text-xs text-slate-400 mb-1 uppercase font-bold">Tasa Anual (%)</label><input type="number" step="0.01" value={annualRate} onChange={e=>setAnnualRate(e.target.value)} className="w-full bg-[#0F172A] border border-white/10 rounded-xl px-3 py-3 text-white outline-none focus:border-violet-500"/></div>
              <button type="submit" className="w-full bg-gradient-to-r from-emerald-500 to-teal-500 text-black font-bold py-4 rounded-xl mt-4">Guardar</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}