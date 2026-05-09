import { useState, useEffect } from 'react';
import { Plus, Trash2, Download, Bell, Target, TrendingUp, TrendingDown } from 'lucide-react';
import type { Transaction, SavingsGoal } from '../utils/database';
import { notify } from '../services/notificationService';
import { db, migrateData } from '../utils/database';
import { format } from 'date-fns';
import { generateFinancialReport } from '../services/exportService';

const CATEGORIES = ['Alimentación', 'Transporte', 'Servicios', 'Entretenimiento', 'Salud', 'Hogar', 'Inversiones', 'Otros'];

export default function FinancePage() {
  const [activeTab, setActiveTab] = useState<'transactions' | 'goals' | 'export'>('transactions');
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [goals, setGoals] = useState<SavingsGoal[]>([]);
  const [pushEnabled, setPushEnabled] = useState(false);
  const [loading, setLoading] = useState(true);

  const [txDate, setTxDate] = useState(new Date().toISOString().split('T')[0]);
  const [txType, setTxType] = useState<'income' | 'expense'>('expense');
  const [txAmount, setTxAmount] = useState('');
  const [txCategory, setTxCategory] = useState(CATEGORIES[0]);
  const [txDesc, setTxDesc] = useState('');

  const [goalName, setGoalName] = useState('');
  const [goalTarget, setGoalTarget] = useState('');
  const [goalDeadline, setGoalDeadline] = useState('');

  useEffect(() => {
    initializePage();
  }, []);

  const initializePage = async () => {
    try {
      setLoading(true);
      await migrateData();
      await loadData();
      await checkPushPermission();
    } catch (err) {
      console.error('Error al inicializar Finanzas:', err);
      notify({ title: '⚠️ Error de carga', message: 'No se pudo cargar la base de datos local.', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const loadData = async () => {
    try {
      const txs = await db.transactions.toArray();
      const gals = await db.goals.toArray();
      const settings = await db.settings.get('global');
      
      setTransactions(txs.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
      setGoals(gals);
      if (settings?.pushEnabled) setPushEnabled(true);
    } catch (err) {
      console.error('Error al cargar datos:', err);
    }
  };

  const checkPushPermission = async () => {
    if ('Notification' in window) {
      const permission = Notification.permission;
      if (permission === 'granted') {
        setPushEnabled(true);
        scheduleDailyCheck();
      } else if (permission !== 'denied') {
        const granted = await Notification.requestPermission();
        if (granted === 'granted') {
          setPushEnabled(true);
          await db.settings.update('global', { pushEnabled: true });
          scheduleDailyCheck();
        }
      }
    }
  };

  const scheduleDailyCheck = () => {
    const check = setInterval(async () => {
      const now = new Date();
      if (now.getHours() === 20 && now.getMinutes() === 0) {
        const today = format(now, 'yyyy-MM-dd');
        const todayTx = transactions.filter(t => t.date === today);
        const expenses = todayTx.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
        if (expenses > 0 && Notification.permission === 'granted') {
          new Notification('📊 Resumen Diario', { body: `Gastos de hoy: $${expenses.toLocaleString('es-CO')}` });
        }
      }
    }, 60000 * 10);
    return () => clearInterval(check);
  };

  const handleAddTransaction = async () => {
    if (!txAmount || !txDesc) { notify({ title: '❌ Error', message: 'Completa monto y descripción.', type: 'error' }); return; }
    const newTx: Transaction = {
      id: crypto.randomUUID(),
      date: txDate,
      type: txType,
      amount: parseFloat(txAmount),
      category: txCategory,
      description: txDesc
    };
    await db.transactions.add(newTx);
    await loadData();
    resetTxForm();
    notify({ title: '✅ Registrado', message: `${txType === 'income' ? 'Ingreso' : 'Gasto'}: $${txAmount}`, type: 'success' });
  };

  const resetTxForm = () => {
    setTxDate(new Date().toISOString().split('T')[0]);
    setTxAmount('');
    setTxDesc('');
    setTxType('expense');
  };

  const handleAddGoal = async () => {
    if (!goalName || !goalTarget || !goalDeadline) { notify({ title: '❌ Error', message: 'Completa todos los campos.', type: 'error' }); return; }
    const newGoal: SavingsGoal = {
      id: crypto.randomUUID(),
      name: goalName,
      targetAmount: parseFloat(goalTarget),
      currentAmount: 0,
      deadline: goalDeadline,
      createdAt: new Date().toISOString()
    };
    await db.goals.add(newGoal);
    await loadData();
    setGoalName(''); setGoalTarget(''); setGoalDeadline('');
    notify({ title: '🎯 Meta creada', message: goalName, type: 'success' });
  };

  const handleDeleteTx = async (id: string) => { await db.transactions.delete(id); await loadData(); };
  const handleDeleteGoal = async (id: string) => { await db.goals.delete(id); await loadData(); };

  const calculateGoalProgress = (g: SavingsGoal) => {
    const daysLeft = Math.max(1, Math.ceil((new Date(g.deadline).getTime() - Date.now()) / 86400000));
    const remaining = Math.max(0, g.targetAmount - g.currentAmount);
    return { progress: g.targetAmount > 0 ? (g.currentAmount / g.targetAmount) * 100 : 0, dailyNeed: remaining / daysLeft, daysLeft };
  };

  if (loading) return <div className="flex h-screen items-center justify-center text-emerald-400">Cargando datos financieros...</div>;

  return (
    <div className="p-4 pb-24 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-white">Finanzas</h1>
        <button onClick={() => checkPushPermission()} className={`p-2 rounded-full ${pushEnabled ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-800 text-slate-400'}`}>
          <Bell size={20} />
        </button>
      </div>

      <div className="flex gap-2 bg-slate-900/50 p-1 rounded-xl">
        {(['transactions', 'goals', 'export'] as const).map(tab => (
          <button key={tab} onClick={() => setActiveTab(tab)} className={`flex-1 py-2 text-xs font-medium rounded-lg transition-all ${activeTab === tab ? 'bg-emerald-500 text-black' : 'text-slate-400 hover:text-white'}`}>
            {tab === 'transactions' ? '💰 Movimientos' : tab === 'goals' ? '🎯 Metas' : '📤 Reportes'}
          </button>
        ))}
      </div>

      {activeTab === 'transactions' && (
        <>
          <div className="space-y-3 bg-slate-900/50 p-4 rounded-2xl border border-white/5">
            <div className="grid grid-cols-2 gap-2">
              <input type="date" value={txDate} onChange={e => setTxDate(e.target.value)} className="input-modern" />
              <select value={txType} onChange={e => setTxType(e.target.value as 'income' | 'expense')} className="input-modern">
                <option value="expense">💸 Gasto</option>
                <option value="income">💵 Ingreso</option>
              </select>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <input type="number" placeholder="Monto" value={txAmount} onChange={e => setTxAmount(e.target.value)} className="input-modern" />
              <select value={txCategory} onChange={e => setTxCategory(e.target.value)} className="input-modern">
                {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <input type="text" placeholder="Descripción" value={txDesc} onChange={e => setTxDesc(e.target.value)} className="input-modern" />
            <button onClick={handleAddTransaction} className="btn-primary w-full flex items-center justify-center gap-2">
              <Plus size={18} /> Registrar Movimiento
            </button>
          </div>

          <div className="space-y-2">
            {transactions.length > 0 ? transactions.map(tx => (
              <div key={tx.id} className="glass-panel p-3 flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${tx.type === 'income' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'}`}>
                    {tx.type === 'income' ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
                  </div>
                  <div>
                    <p className="text-white font-medium">{tx.description}</p>
                    <p className="text-xs text-slate-400">{tx.category} • {format(new Date(tx.date), 'dd/MM/yy')}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`font-bold ${tx.type === 'income' ? 'text-emerald-400' : 'text-red-400'}`}>
                    {tx.type === 'income' ? '+' : '-'}${tx.amount.toLocaleString('es-CO')}
                  </span>
                  <button onClick={() => handleDeleteTx(tx.id)} className="text-slate-500 hover:text-red-400"><Trash2 size={14} /></button>
                </div>
              </div>
            )) : <p className="text-center text-slate-500 py-8">No hay movimientos registrados</p>}
          </div>
        </>
      )}

      {activeTab === 'goals' && (
        <>
          <div className="space-y-3 bg-slate-900/50 p-4 rounded-2xl border border-white/5">
            <input type="text" placeholder="Nombre de la meta" value={goalName} onChange={e => setGoalName(e.target.value)} className="input-modern" />
            <div className="grid grid-cols-2 gap-2">
              <input type="number" placeholder="Monto objetivo" value={goalTarget} onChange={e => setGoalTarget(e.target.value)} className="input-modern" />
              <input type="date" value={goalDeadline} onChange={e => setGoalDeadline(e.target.value)} className="input-modern" />
            </div>
            <button onClick={handleAddGoal} className="btn-primary w-full flex items-center justify-center gap-2">
              <Target size={18} /> Crear Meta
            </button>
          </div>

          <div className="space-y-4">
            {goals.length > 0 ? goals.map(g => {
              const { progress, dailyNeed, daysLeft } = calculateGoalProgress(g);
              return (
                <div key={g.id} className="glass-panel p-4">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h3 className="text-white font-bold">{g.name}</h3>
                      <p className="text-xs text-slate-400">Meta: ${g.targetAmount.toLocaleString('es-CO')} • {daysLeft} días restantes</p>
                    </div>
                    <button onClick={() => handleDeleteGoal(g.id)} className="text-slate-500 hover:text-red-400"><Trash2 size={14} /></button>
                  </div>
                  <div className="w-full bg-slate-800 rounded-full h-2 mb-2">
                    <div className="bg-emerald-500 h-2 rounded-full transition-all" style={{ width: `${progress}%` }} />
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-400">Progreso: {progress.toFixed(1)}%</span>
                    <span className="text-emerald-400">Necesitas ahorrar: ${dailyNeed.toLocaleString('es-CO')}/día</span>
                  </div>
                </div>
              );
            }) : <p className="text-center text-slate-500 py-8">No hay metas activas</p>}
          </div>
        </>
      )}

      {activeTab === 'export' && (
        <div className="space-y-4">
          <button onClick={() => generateFinancialReport(transactions, goals, 'pdf')} className="btn-primary w-full flex items-center justify-center gap-2">
            <Download size={18} /> Exportar PDF
          </button>
          <button onClick={() => generateFinancialReport(transactions, goals, 'csv')} className="w-full bg-slate-800 hover:bg-slate-700 text-white font-bold py-3 px-6 rounded-xl transition-all flex items-center justify-center gap-2">
            <Download size={18} /> Exportar CSV
          </button>
          <p className="text-xs text-slate-500 text-center">Los reportes incluyen movimientos, metas y resumen financiero.</p>
        </div>
      )}
    </div>
  );
}