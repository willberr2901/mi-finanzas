/**
 * ════════════════════════════════════════════════════════════════════
 * 💰 PANTALLA FINANZAS
 * ────────────────────────────────────────────────────────────────────
 * Qué hace: Pestañas: Movimientos (ingresos y gastos), Metas de ahorro y Reportes (PDF/Excel).
 * Dónde se ve: Menú → Finanzas.
 * Si lo cambias: Los movimientos se guardan en utils/database.ts (tabla transactions).
 * ════════════════════════════════════════════════════════════════════
 */
import { useState, useEffect } from 'react';
import { Plus, Trash2, Target, TrendingUp, TrendingDown, Pencil, PiggyBank, FileText, FileSpreadsheet, Loader2 } from 'lucide-react';
import MoneyInput from '../components/ui/MoneyInput';
import { formatCOP, todayISO, parseLocalDate } from '../utils/format';
import type { Transaction, SavingsGoal } from '../utils/database';
import { notify } from '../services/notificationService';
import { db, migrateData } from '../utils/database';
import { format } from 'date-fns';
import { availablePeriods, periodLabel } from '../services/reportPeriods';
import { triggerLocalRules, type RuleAlert } from '../services/financialIntelligence';

import { EXPENSE_CATEGORIES, INCOME_CATEGORIES, guessCategory, segmentOf, SEGMENT_INFO } from '../utils/categories';
import { getPrefs, cycleFor, inCycle } from '../utils/prefs';
import { usePageTour } from '../components/tour/Tour';
import ModuleHeader from '../components/ui/ModuleHeader';
import NewBadge from '../components/ui/NewBadge';
import { motion, AnimatePresence } from 'framer-motion';
import { findMatchingBill, markPaidFromTransaction, createBillFromTransaction, RECURRING_CATEGORIES } from '../services/billsService';
import { askConfirm } from '../components/ui/ConfirmDialog';

const categoriesFor = (t: 'income' | 'expense'): readonly string[] => (t === 'income' ? INCOME_CATEGORIES : EXPENSE_CATEGORIES);

export default function FinancePage() {
  const [activeTab, setActiveTab] = useState<'transactions' | 'goals' | 'export'>('transactions');
  const [reportPeriod, setReportPeriod] = useState(() => todayISO().slice(0, 7));
  const [exporting, setExporting] = useState<'pdf' | 'csv' | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [goals, setGoals] = useState<SavingsGoal[]>([]);
  const [loading, setLoading] = useState(true);

  const [txDate, setTxDate] = useState(todayISO());
  const [txType, setTxType] = useState<'income' | 'expense'>('expense');
  const [txAmount, setTxAmount] = useState(0);
  const [editingTxId, setEditingTxId] = useState<string | null>(null);
  const [lastAddedId, setLastAddedId] = useState<string | null>(null);
  usePageTour('finanzas', [
    { target: 'fin-tabs', title: 'Tres secciones', text: 'Movimientos para registrar lo que entra y sale, Metas para tus ahorros y Reportes para descargar todo en PDF o Excel.' },
    { target: 'fin-form', title: 'Registra un movimiento', text: 'Elige si es gasto o ingreso, escribe el monto y una descripción corta. Toca "Registrar movimiento" y listo.' },
    { target: 'fin-desc', title: 'Se clasifica solo', text: 'Mientras escribes ("Arriendo", "Uber", "Netflix") la app elige la categoría y el grupo: obligatorio, necesario, gusto o ahorro. Si es arriendo o un servicio, te ofrece programarlo cada mes en Pagos.' },
  ]);
  const [recurringAsk, setRecurringAsk] = useState<{ name: string; category: string; amount: number; date: Date } | null>(null);
  const [txCategory, setTxCategory] = useState<string>('Mercado');
  const [categoryTouched, setCategoryTouched] = useState(false);
  const [txDesc, setTxDesc] = useState('');

  const [goalName, setGoalName] = useState('');
  const [goalTarget, setGoalTarget] = useState(0);
  const [depositGoalId, setDepositGoalId] = useState<string | null>(null);
  const [depositAmount, setDepositAmount] = useState(0);
  const [goalDeadline, setGoalDeadline] = useState('');

  useEffect(() => {
    initializePage();
    const onChange = () => { loadData(); };
    window.addEventListener('mf:data-changed', onChange);
    return () => window.removeEventListener('mf:data-changed', onChange);
  }, []);

  const initializePage = async () => {
    try {
      setLoading(true);
      await migrateData();
      await loadData();
    } catch (err) {
      console.error('Error inicialización:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadData = async () => {
    try {
      const txs = await db.transactions.toArray();
      const gals = await db.goals.toArray();
      setTransactions(txs.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
      setGoals(gals);
    } catch {}
  };

  // ═══ SECCIÓN: Guardar, editar y borrar movimientos y metas ═══
  const handleAddTransaction = async () => {
    if (!txAmount || !txDesc.trim()) { notify({ title: 'Faltan datos', message: 'Completa el monto y la descripción.', type: 'error' }); return; }

    if (editingTxId) {
      await db.transactions.update(editingTxId, { date: txDate, type: txType, amount: txAmount, category: txCategory, description: txDesc.trim() });
      await loadData();
      resetTxForm();
      notify({ title: 'Movimiento actualizado', message: `${txDesc.trim()}: ${formatCOP(txAmount)}`, type: 'success' });
      return;
    }

    const newTx: Transaction = {
      id: crypto.randomUUID(),
      date: txDate,
      type: txType,
      amount: txAmount,
      category: txCategory,
      description: txDesc.trim(),
      createdAt: Date.now()
    };
    await db.transactions.add(newTx);

    const updatedTx = await db.transactions.toArray();
    const alerts: RuleAlert[] = triggerLocalRules(newTx, updatedTx);
    alerts.forEach((alert: RuleAlert) => notify({ title: 'Aviso', message: alert.message, type: alert.type as any }));

    setLastAddedId(newTx.id);
    await loadData();
    resetTxForm();
    notify({ title: `${txType === 'income' ? 'Ingreso' : 'Gasto'} registrado`, message: `${newTx.description}: ${formatCOP(newTx.amount)}`, type: 'success' });

    // Sincroniza con Pagos: si es un pago del mes, lo marca; si parece recurrente, ofrece programarlo.
    if (newTx.type === 'expense') {
      const when = parseLocalDate(newTx.date);
      const bill = await findMatchingBill(newTx.description, newTx.category);
      if (bill) {
        if (await markPaidFromTransaction(bill, newTx.amount, when)) {
          notify({ title: `${bill.name} quedó pagado`, message: `Lo marcamos en Pagos para ${when.toLocaleDateString('es-CO', { month: 'long' })}.`, type: 'info' });
          window.dispatchEvent(new Event('mf:data-changed'));
        }
      } else if (RECURRING_CATEGORIES.has(newTx.category)) {
        setRecurringAsk({ name: newTx.description, category: newTx.category, amount: newTx.amount, date: when });
      }
    }
  };

  const confirmRecurring = async () => {
    if (!recurringAsk) return;
    const b = await createBillFromTransaction(recurringAsk.name, recurringAsk.category, recurringAsk.amount, recurringAsk.date);
    notify({ title: 'Pago programado cada mes', message: `${b.name} · día ${b.dueDay}. Lo verás en el calendario de Pagos.`, type: 'success' });
    window.dispatchEvent(new Event('mf:data-changed'));
    setRecurringAsk(null);
  };

  const handleEditTx = (tx: Transaction) => {
    setEditingTxId(tx.id);
    setTxDate(tx.date); setTxType(tx.type); setTxAmount(tx.amount); setTxCategory(tx.category); setTxDesc(tx.description); setCategoryTouched(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const resetTxForm = () => { setTxDate(todayISO()); setTxAmount(0); setTxDesc(''); setTxType('expense'); setTxCategory('Mercado'); setCategoryTouched(false); setEditingTxId(null); };

  // Clasifica sola la categoría según lo que se escribe en la descripción.
  const onDescChange = (v: string) => {
    setTxDesc(v);
    if (!categoryTouched) { const g = guessCategory(v, txType); if (g) setTxCategory(g); }
  };
  const onTypeChange = (t: 'income' | 'expense') => {
    setTxType(t);
    if (!categoriesFor(t).includes(txCategory)) setTxCategory(guessCategory(txDesc, t) ?? categoriesFor(t)[0]);
  };

  const handleDeposit = async (g: SavingsGoal) => {
    if (!depositAmount) return;
    await db.goals.update(g.id, { currentAmount: g.currentAmount + depositAmount });
    await loadData();
    notify({ title: 'Abono a tu meta', message: `${formatCOP(depositAmount)} para ${g.name}`, type: 'success' });
    setDepositGoalId(null); setDepositAmount(0);
  };

  const handleAddGoal = async () => {
    if (!goalName.trim() || !goalTarget || !goalDeadline) { notify({ title: 'Faltan datos', message: 'Completa nombre, monto y fecha.', type: 'error' }); return; }
    const newGoal: SavingsGoal = { id: crypto.randomUUID(), name: goalName, targetAmount: goalTarget, currentAmount: 0, deadline: goalDeadline, createdAt: new Date().toISOString() };
    await db.goals.add(newGoal);
    await loadData();
    setGoalName(''); setGoalTarget(0); setGoalDeadline('');
    notify({ title: 'Meta creada', message: goalName, type: 'success' });
  };

  const handleDeleteTx = async (id: string) => { await db.transactions.delete(id); await loadData(); };
  const handleDeleteGoal = async (id: string) => { await db.goals.delete(id); await loadData(); };

  const calculateGoalProgress = (g: SavingsGoal) => {
    const daysLeft = Math.max(1, Math.ceil((new Date(g.deadline).getTime() - Date.now()) / 86400000));
    const remaining = Math.max(0, g.targetAmount - g.currentAmount);
    return { progress: g.targetAmount > 0 ? (g.currentAmount / g.targetAmount) * 100 : 0, dailyNeed: remaining / daysLeft, daysLeft };
  };

  const cycle = cycleFor(new Date(), getPrefs().payDay);
  const SEGS = ['obligatorio', 'necesario', 'gusto', 'ahorro'] as const;
  const monthSplit = transactions
    .filter(t => t.type === 'expense' && inCycle(t.date, cycle))
    .reduce((acc, t) => { const seg = segmentOf('expense', t.category) as typeof SEGS[number]; acc[seg] = (acc[seg] || 0) + t.amount; return acc; }, { obligatorio: 0, necesario: 0, gusto: 0, ahorro: 0 } as Record<typeof SEGS[number], number>);
  const monthTotal = SEGS.reduce((s, k) => s + monthSplit[k], 0);
  // Resumen del mes (ciclo de pago): lo que entró − lo que salió = lo que queda
  const cycleTx = transactions.filter(t => inCycle(t.date, cycle));
  const cycleIncome = cycleTx.filter(t => t.type === 'income').reduce((a, t) => a + t.amount, 0);
  const cycleExpense = cycleTx.filter(t => t.type === 'expense').reduce((a, t) => a + t.amount, 0);
  const cycleLeft = cycleIncome - cycleExpense;

  if (loading) return <div className="flex h-screen items-center justify-center text-emerald-400">Sincronizando datos locales...</div>;

  return (
    <div className="pb-24 space-y-6">
      <ModuleHeader module="finanzas" />

      <div data-tour="fin-tabs" className="flex gap-2 bg-slate-900/50 p-1 rounded-xl">
        {(['transactions', 'goals', 'export'] as const).map(tab => (
          <button key={tab} onClick={() => setActiveTab(tab)} className={`flex-1 py-2 text-xs font-medium rounded-lg transition-all ${activeTab === tab ? 'bg-emerald-500 text-black' : 'text-slate-400 hover:text-white'}`}>
            {tab === 'transactions' ? '💰 Movimientos' : tab === 'goals' ? '🎯 Metas' : '📤 Reportes'}
          </button>
        ))}
      </div>

      {/* ═══ SECCIÓN: Pestaña Movimientos (formulario + lista) ═══ */}
      {activeTab === 'transactions' && (
        <>
          {/* Resumen: Ingresos − Gastos = Te queda */}
          <div data-tour="fin-summary" className="card-modern p-4">
            <p className="text-[11px] font-bold tracking-wider text-slate-400 uppercase flex items-center gap-2">Tu mes · {cycle.label} <NewBadge id="fin-tu-mes" /></p>
            <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2 mt-3 text-center">
              <div className="min-w-0"><p className="text-[11px] text-slate-400 flex items-center justify-center gap-1"><TrendingUp size={12} className="text-emerald-400" /> Ingresos</p><p className="text-base font-extrabold text-emerald-400 truncate">{formatCOP(cycleIncome)}</p></div>
              <span className="text-slate-500 font-bold" aria-hidden="true">−</span>
              <div className="min-w-0"><p className="text-[11px] text-slate-400 flex items-center justify-center gap-1"><TrendingDown size={12} className="text-red-400" /> Gastos</p><p className="text-base font-extrabold text-red-400 truncate">{formatCOP(cycleExpense)}</p></div>
            </div>
            <div className="mt-3 pt-3 border-t border-white/10 flex items-center justify-between gap-2">
              <span className="text-sm text-slate-300 font-semibold">{cycleLeft >= 0 ? 'Te queda' : 'Te pasaste por'}</span>
              <span className={`text-2xl font-extrabold ${cycleLeft >= 0 ? 'text-brand-lime' : 'text-red-400'}`}>{formatCOP(Math.abs(cycleLeft))}</span>
            </div>
            {cycleIncome > 0 && <div className="mt-2 h-2 rounded-full bg-slate-800 overflow-hidden" aria-hidden="true"><div className={`h-full rounded-full ${cycleLeft >= 0 ? 'bg-emerald-400' : 'bg-red-400'}`} style={{ width: `${Math.min(100, (cycleExpense / cycleIncome) * 100)}%` }} /></div>}
            {cycleIncome > 0 && <p className="text-[11px] text-slate-400 mt-1">Has gastado el {Math.round((cycleExpense / cycleIncome) * 100)}% de lo que entró</p>}
            {cycleIncome === 0 && <p className="text-[11px] text-slate-400 mt-2">Registra tus ingresos del mes (sueldo, recargos…) para ver cuánto te queda.</p>}
          </div>
          <div data-tour="fin-form" className="space-y-3 bg-slate-900/50 p-4 rounded-2xl border border-white/5">
            <div className="grid grid-cols-2 gap-2">
              <input type="date" value={txDate} onChange={e => setTxDate(e.target.value)} className="input-modern" />
              <select value={txType} onChange={e => onTypeChange(e.target.value as 'income' | 'expense')} className="input-modern">
                <option value="expense">💸 Gasto</option>
                <option value="income">💵 Ingreso</option>
              </select>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <MoneyInput value={txAmount} onChange={setTxAmount} placeholder="Monto" prefix className="input-modern" />
              <select value={txCategory} onChange={e => { setTxCategory(e.target.value); setCategoryTouched(true); }} className="input-modern" aria-label="Categoría">
                {!categoriesFor(txType).includes(txCategory) && <option value={txCategory}>{txCategory}</option>}
                {categoriesFor(txType).map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <input data-tour="fin-desc" type="text" placeholder="Descripción (ej: Arriendo, Luz, Uber)" value={txDesc} onChange={e => onDescChange(e.target.value)} className="input-modern" />
            {txType === 'expense' && (
              <p className="text-[11px] text-slate-400 -mt-1">Se clasifica como <span className={SEGMENT_INFO[segmentOf('expense', txCategory) as 'obligatorio'].color}>{SEGMENT_INFO[segmentOf('expense', txCategory) as 'obligatorio'].label}</span> · {txCategory}</p>
            )}
            <button onClick={handleAddTransaction} className="btn-primary w-full flex items-center justify-center gap-2">
              {editingTxId ? <Pencil size={18} /> : <Plus size={18} />} {editingTxId ? 'Guardar cambios' : 'Registrar movimiento'}
            </button>
            {editingTxId && <button onClick={resetTxForm} className="w-full text-xs text-slate-400 py-1">Cancelar edición</button>}
          </div>

          {monthTotal > 0 && (
            <div data-tour="fin-segments" className="bg-slate-900/50 p-4 rounded-2xl border border-white/5">
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs text-slate-400">{cycle.isCalendar ? 'Gastos de este mes por segmento' : `Gastos del ciclo (${cycle.label}) por segmento`}</p>
              </div>
              <div className="flex h-2.5 rounded-full overflow-hidden bg-slate-800">
                {SEGS.map(k => <div key={k} className={`${SEGMENT_INFO[k].bar} transition-all duration-700`} style={{ width: `${(monthSplit[k] / monthTotal) * 100}%` }} />)}
              </div>
              <div className="grid grid-cols-2 gap-x-3 gap-y-1 text-xs mt-2">
                {SEGS.filter(k => monthSplit[k] > 0).map(k => (
                  <span key={k} className={SEGMENT_INFO[k].color}>{SEGMENT_INFO[k].short} {formatCOP(monthSplit[k])}</span>
                ))}
              </div>
            </div>
          )}

          <div className="space-y-2">
            <AnimatePresence initial={false}>
            {transactions.length > 0 ? transactions.map(tx => (
              <motion.div key={tx.id} layout
                initial={{ opacity: 0, y: -16, scale: 0.96 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, x: 80, height: 0, marginTop: 0, paddingTop: 0, paddingBottom: 0 }}
                transition={{ type: 'spring', damping: 22, stiffness: 260 }}
                className={`glass-panel p-3 flex justify-between items-center ${tx.id === lastAddedId ? 'ring-2 ring-emerald-400/60 animate-[pulse_1.2s_ease-in-out_2]' : ''}`}>
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${tx.type === 'income' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'}`}>
                    {tx.type === 'income' ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
                  </div>
                  <div>
                    <p className="text-white font-medium">{tx.description}</p>
                    <p className="text-xs text-slate-400">{tx.category}{tx.type === 'expense' ? ` · ${SEGMENT_INFO[segmentOf('expense', tx.category) as 'obligatorio'].short}` : ''} • {format(parseLocalDate(tx.date), 'dd/MM/yy')}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`font-bold ${tx.type === 'income' ? 'text-emerald-400' : 'text-red-400'}`}>
                    {tx.type === 'income' ? '+' : '-'}{formatCOP(tx.amount)}
                  </span>
                  <button onClick={() => handleEditTx(tx)} aria-label={`Editar ${tx.description}`} className="text-slate-400 hover:text-blue-400 p-2"><Pencil size={16} /></button>
                  <button onClick={async () => { if (await askConfirm({ title: `¿Eliminar ${tx.description}?`, message: `${tx.type === 'income' ? 'Ingreso' : 'Gasto'} de ${formatCOP(tx.amount)}. Esto no se puede deshacer.`, icon: 'trash', tone: 'danger', confirmText: 'Sí, eliminar' })) handleDeleteTx(tx.id); }} aria-label={`Eliminar ${tx.description}`} className="text-slate-400 hover:text-red-400 p-2"><Trash2 size={16} /></button>
                </div>
              </motion.div>
            )) : <p className="text-center text-slate-500 py-8">Aún no hay movimientos. Registra tu primer ingreso o gasto arriba.</p>}
            </AnimatePresence>
          </div>
        </>
      )}

      {/* ═══ SECCIÓN: Pestaña Metas de ahorro ═══ */}
      {activeTab === 'goals' && (
        <>
          <div className="space-y-3 bg-slate-900/50 p-4 rounded-2xl border border-white/5">
            <input type="text" placeholder="Nombre de la meta" value={goalName} onChange={e => setGoalName(e.target.value)} className="input-modern" />
            <div className="grid grid-cols-2 gap-2">
              <MoneyInput value={goalTarget} onChange={setGoalTarget} placeholder="Monto objetivo" prefix className="input-modern" />
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
                      <p className="text-xs text-slate-400">Meta: {formatCOP(g.targetAmount)} • {daysLeft} días restantes</p>
                    </div>
                    <button onClick={() => handleDeleteGoal(g.id)} className="text-slate-500 hover:text-red-400"><Trash2 size={14} /></button>
                  </div>
                  <div className="w-full bg-slate-800 rounded-full h-2 mb-2">
                    <div className="bg-emerald-500 h-2 rounded-full transition-all" style={{ width: `${Math.min(progress, 100)}%` }} />
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-400">Progreso: {progress.toFixed(1)}%</span>
                    <span className="text-emerald-400">{progress >= 100 ? '¡Meta cumplida!' : `Ahorra ${formatCOP(dailyNeed)}/día`}</span>
                  </div>
                  <p className="text-xs text-slate-400 mt-1">Llevas {formatCOP(g.currentAmount)} de {formatCOP(g.targetAmount)}</p>
                  {depositGoalId === g.id ? (
                    <div className="flex gap-2 mt-3">
                      <MoneyInput value={depositAmount} onChange={setDepositAmount} placeholder="¿Cuánto abonas?" prefix className="input-modern flex-1" />
                      <button onClick={() => handleDeposit(g)} className="btn-primary px-4">Abonar</button>
                    </div>
                  ) : (
                    <button onClick={() => { setDepositGoalId(g.id); setDepositAmount(0); }} className="mt-3 w-full flex items-center justify-center gap-2 text-sm text-emerald-400 border border-emerald-500/30 rounded-xl py-2 hover:bg-emerald-500/10">
                      <PiggyBank size={16} /> Abonar a esta meta
                    </button>
                  )}
                </div>
              );
            }) : <p className="text-center text-slate-500 py-8">No hay metas activas</p>}
          </div>
        </>
      )}

      {/* ═══ SECCIÓN: Pestaña Reportes (PDF / Excel) ═══ */}
      {activeTab === 'export' && (() => {
        const periods = availablePeriods(transactions);
        const monthTx = transactions.filter(t => t.date?.startsWith(reportPeriod));
        const inc = monthTx.filter(t => t.type === 'income').reduce((a, t) => a + t.amount, 0);
        const exp = monthTx.filter(t => t.type === 'expense').reduce((a, t) => a + t.amount, 0);
        const run = async (f: 'pdf' | 'csv') => { setExporting(f); try { const { generateFinancialReport } = await import('../services/exportService'); await generateFinancialReport(reportPeriod, f); } catch (e) { console.error(e); notify({ title: 'No se pudo generar', message: 'Intenta de nuevo.', type: 'error' }); } finally { setExporting(null); } };
        return (
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
          <div className="card-modern p-4">
            <p className="text-sm font-bold text-white mb-1">Reporte del mes</p>
            <p className="text-xs text-slate-400 mb-3">Incluye tus métricas, en qué se fue la plata, pagos fijos, tarjetas, deudas, metas, mercado y todos los movimientos.</p>
            <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1">
              {periods.map(p => (
                <button key={p} onClick={() => setReportPeriod(p)} className={`shrink-0 px-3 py-2 rounded-xl text-xs font-bold border transition-all ${reportPeriod === p ? 'bg-lime-300 text-slate-900 border-lime-300' : 'border-white/10 text-slate-300 bg-white/5'}`}>{periodLabel(p)}</button>
              ))}
            </div>
            <div className="grid grid-cols-3 gap-2 mt-3 text-center">
              <div className="rounded-xl bg-white/5 py-2"><p className="text-[10px] text-slate-400">Ingresos</p><p className="text-sm font-bold text-emerald-300">{formatCOP(inc)}</p></div>
              <div className="rounded-xl bg-white/5 py-2"><p className="text-[10px] text-slate-400">Gastos</p><p className="text-sm font-bold text-rose-300">{formatCOP(exp)}</p></div>
              <div className="rounded-xl bg-white/5 py-2"><p className="text-[10px] text-slate-400">Movimientos</p><p className="text-sm font-bold text-white">{monthTx.length}</p></div>
            </div>
          </div>
          <button disabled={!!exporting} onClick={() => run('pdf')} className="btn-primary w-full flex items-center justify-center gap-2 disabled:opacity-60">
            {exporting === 'pdf' ? <Loader2 size={18} className="animate-spin" /> : <FileText size={18} />} Descargar reporte PDF
          </button>
          <button disabled={!!exporting} onClick={() => run('csv')} className="w-full bg-slate-800 hover:bg-slate-700 text-white font-bold py-3 px-6 rounded-xl transition-all flex items-center justify-center gap-2 disabled:opacity-60">
            {exporting === 'csv' ? <Loader2 size={18} className="animate-spin" /> : <FileSpreadsheet size={18} />} Descargar en Excel
          </button>
        </motion.div>
        );
      })()}
      <AnimatePresence>
        {recurringAsk && (
          <motion.div className="fixed inset-0 z-[95] bg-black/70 backdrop-blur-sm flex items-end justify-center" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setRecurringAsk(null)}>
            <motion.div onClick={e => e.stopPropagation()} role="dialog" aria-modal="true" aria-labelledby="rec-title"
              className="w-full max-w-md bg-surface border border-white/10 rounded-t-3xl p-6 pb-10" initial={{ y: 120 }} animate={{ y: 0 }} exit={{ y: 120 }} transition={{ type: 'spring', damping: 24, stiffness: 260 }}>
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center mb-3 shadow-lg shadow-amber-500/30">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" aria-hidden="true"><rect x="3" y="5" width="18" height="16" rx="3"/><path d="M3 10h18M8 3v4M16 3v4M12 14v3"/></svg>
              </div>
              <h2 id="rec-title" className="text-white text-lg font-bold">¿{recurringAsk.name} se paga cada mes?</h2>
              <p className="text-slate-400 text-sm mt-1">Si dices que sí, lo programamos el día <strong className="text-white">{recurringAsk.date.getDate()}</strong> de cada mes en el calendario de Pagos. Cada mes solo te preguntaremos si ya lo pagaste.</p>
              <div className="flex flex-col gap-2 mt-5">
                <button onClick={confirmRecurring} className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-500 text-black font-bold">Sí, programarlo cada mes</button>
                <button onClick={() => setRecurringAsk(null)} className="w-full py-3 rounded-2xl border border-white/15 text-white">No, fue un gasto de una sola vez</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}