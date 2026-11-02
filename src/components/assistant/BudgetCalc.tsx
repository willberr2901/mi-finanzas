/**
 * ════════════════════════════════════════════════════════════════════
 * 🧮 CALCULADORA DE PRESUPUESTO ("Arma tu presupuesto en un toque")
 * ────────────────────────────────────────────────────────────────────
 * Paso 1: elige cómo calcularlo:
 *   • Según lo que gastas (recomendado): promedio de los últimos 3 meses − 10%.
 *   • Regla 50·30·20: 50% necesidades, 30% gustos, 20% ahorro del sueldo.
 *   • Lo escribo yo: abre Ajustes → Presupuestos.
 * Paso 2: ves el resultado por categoría, lo ajustas y lo guardas.
 * Se abre con el evento 'mf:open-budget-calc'.
 * ════════════════════════════════════════════════════════════════════
 */
import { useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { db, type Transaction } from '../../utils/database';
import { getPrefs, setPrefs, cycleFor, inCycle } from '../../utils/prefs';
import { formatCOP } from '../../utils/format';
import MoneyInput from '../ui/MoneyInput';
import { haptic } from '../../utils/haptics';
import { notify } from '../../services/notificationService';
import { getPlan, historyOf, suggestBudgets, type BudgetMethod, type BudgetRow } from '../../services/budgetPlan';
import { Shell, KaiSays, BudgetRows } from './parts';

export default function BudgetCalc() {
  const [open, setOpen] = useState(false);
  useEffect(() => {
    const on = () => setOpen(true);
    window.addEventListener('mf:open-budget-calc', on);
    return () => window.removeEventListener('mf:open-budget-calc', on);
  }, []);
  return <AnimatePresence>{open && <Calc onClose={() => setOpen(false)} />}</AnimatePresence>;
}

const MONTHS = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
const MONTHS_LONG = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];

function Calc({ onClose }: { onClose: () => void }) {
  const navigate = useNavigate();
  const prefs = getPrefs();
  const plan = getPlan();
  const [tx, setTx] = useState<Transaction[]>([]);
  const [method, setMethod] = useState<BudgetMethod | 'manual'>('promedio');
  const [step, setStep] = useState(0);
  const [rows, setRows] = useState<BudgetRow[]>([]);
  const [income, setIncome] = useState(plan?.income ?? 0);
  useEffect(() => { db.transactions.toArray().then(setTx).catch(() => {}); }, []);

  const hist = useMemo(() => historyOf(tx, prefs.payDay), [tx, prefs.payDay]);
  // Si no hay plan, el sueldo sale del promedio de ingresos de los últimos ciclos
  useEffect(() => {
    if (income || !tx.length) return;
    let sum = 0, n = 0;
    for (let i = 1; i <= 3; i++) { const c = cycleFor(new Date(), prefs.payDay, -i); const v = tx.filter(t => t.type === 'income' && inCycle(t.date, c)).reduce((a, t) => a + t.amount, 0); if (v) { sum += v; n++; } }
    if (n) setIncome(Math.round(sum / n / 1000) * 1000);
  }, [tx]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { if (tx.length && hist.cycles === 0 && method === 'promedio') setMethod('503020'); }, [tx.length, hist.cycles]); // eslint-disable-line react-hooks/exhaustive-deps

  const past = [3, 2, 1].map(i => cycleFor(new Date(), prefs.payDay, -i));
  const ex = (() => {
    const cat = hist.byCat.has('Mercado') ? 'Mercado' : [...hist.byCat.keys()].find(k => k !== 'Arriendo' && k !== 'Deudas');
    if (!cat) return null;
    const vals = past.map(c => tx.filter(t => t.type === 'expense' && t.category === cat && inCycle(t.date, c)).reduce((a, t) => a + t.amount, 0));
    const avg = hist.byCat.get(cat) ?? 0;
    return { cat, vals, avg, value: Math.round((avg * 0.9) / 1000) * 1000 };
  })();

  const calc = () => {
    if (method === 'manual') { onClose(); navigate('/ajustes?s=presupuestos'); return; }
    haptic('light');
    setRows(suggestBudgets(method, { hist, income }));
    setStep(1);
  };
  const save = () => {
    const budgets = Object.fromEntries(rows.filter(r => r.value > 0).map(r => [r.cat, r.value]));
    setPrefs({ budgets });
    window.dispatchEvent(new Event('mf:data-changed'));
    haptic('success');
    notify({ title: 'Presupuesto guardado', message: `${Object.keys(budgets).length} categorías · ${formatCOP(Object.values(budgets).reduce((a, v) => a + v, 0))}`, type: 'success' });
    onClose();
  };

  if (step === 1) {
    const saves = method === 'promedio' ? rows.reduce((a, r) => a + Math.max(0, r.avg - r.value), 0) : Math.round(income * 0.2);
    const cyc = cycleFor(new Date(), prefs.payDay);
    return (
      <Shell label="Presupuestos · Paso 2 de 2" step={1} steps={2} onClose={onClose}
        footer={<div className="flex gap-2"><button onClick={() => setStep(0)} className="h-14 px-4 rounded-2xl bg-white/[0.07] ring-1 ring-white/10 font-bold">Atrás</button><motion.button whileTap={{ scale: 0.97 }} onClick={save} className="flex-1 h-14 rounded-2xl bg-brand-lime text-brand-ink font-extrabold text-[16px]">Guardar presupuesto</motion.button></div>}>
        <h2 className="text-[26px] leading-tight font-extrabold mt-1">Tu presupuesto<br /><span className="text-brand-lime">de {cyc.isCalendar ? MONTHS_LONG[cyc.start.getMonth()] : 'este ciclo'}</span></h2>
        <p className="text-[13px] text-slate-300 mt-1.5">{method === 'promedio' ? `Calculado con lo que gastaste en ${past.map(c => c.short).join(', ')}.` : `Con la regla 50·30·20 sobre ${formatCOP(income)}.`} Toca un valor para cambiarlo.</p>
        <div className="mt-4"><BudgetRows rows={rows} onChange={setRows} /></div>
        <p className="text-[11px] text-slate-500 mt-2.5">Arriendo y deudas no llevan límite: ya están en Pagos.</p>
        <div className="mt-3 rounded-[20px] p-4 bg-[#141B3A] ring-1 ring-brand-lime/30 flex items-center justify-between">
          <span className="font-bold">{method === 'promedio' ? 'Ahorrarías al mes' : 'Para ahorrar (20%)'}</span><span className="font-extrabold text-xl text-brand-lime">+{formatCOP(saves)}</span>
        </div>
        <p className="text-[11px] text-slate-500 text-center mt-2">Cada mes te proponemos ajustarlo según cómo te fue.</p>
      </Shell>
    );
  }

  return (
    <Shell label="Presupuestos · Paso 1 de 2" step={0} steps={2} onClose={onClose}
      footer={<motion.button whileTap={{ scale: 0.97 }} disabled={method === '503020' && !income} onClick={calc} className="w-full h-14 rounded-2xl bg-brand-lime text-brand-ink font-extrabold text-[16px] disabled:opacity-40">{method === 'manual' ? 'Escribirlos yo' : 'Calcular mi presupuesto'}</motion.button>}>
      <KaiSays mood="pensando" size={96}><b>Arma tu presupuesto en un toque.</b> Elige cómo lo calculo. Después puedes ajustar cada valor.</KaiSays>
      <div className="space-y-3 mt-4" role="radiogroup" aria-label="Cómo calcular el presupuesto">
        <Option method={method} onPick={setMethod} id="promedio" title="📈 Según lo que gastas" tag={hist.cycles ? 'RECOMENDADO' : undefined} disabled={!hist.cycles}>
          <p className="text-[13px] text-slate-300 mt-1">Tomo tu <b className="text-white">promedio de los últimos 3 meses</b> en cada categoría y le quito un <b className="text-white">10%</b> para que ahorres un poquito.</p>
          {ex ? (
            <div className="mt-2.5 rounded-2xl bg-[#0B1026] p-3 text-[12.5px] text-slate-300">
              <p className="text-slate-400">Ejemplo · {ex.cat}</p>
              <p>{past.map((c, i) => `${MONTHS[c.start.getMonth()][0].toUpperCase()}${MONTHS[c.start.getMonth()].slice(1)} ${Math.round(ex.vals[i] / 1000)}k`).join(' · ')}</p>
              <p>Promedio <b className="text-white">{formatCOP(ex.avg)}</b> − 10% = <b className="text-brand-lime">{formatCOP(ex.value)}</b></p>
            </div>
          ) : <p className="text-[12px] text-amber-300 mt-2">Necesito al menos un mes con gastos registrados.</p>}
        </Option>
        <Option method={method} onPick={setMethod} id="503020" title="⚖️ Regla 50 · 30 · 20">
          <p className="text-[13px] text-slate-300 mt-1">De lo que te entra al mes:</p>
          <div className="h-3 rounded-full overflow-hidden flex mt-2"><span className="w-1/2 bg-sky-300" /><span className="w-[30%] bg-pink-300" /><span className="w-1/5 bg-brand-lime" /></div>
          <p className="text-[12px] mt-1.5"><span className="text-sky-300">50% necesidades</span> · <span className="text-pink-300">30% gustos</span> · <span className="text-brand-lime">20% ahorro</span></p>
          {income > 0 ? <p className="text-[12px] text-slate-400 mt-1">Con {formatCOP(income)}: necesidades {formatCOP(income * 0.5)} · gustos {formatCOP(income * 0.3)} · ahorro {formatCOP(income * 0.2)}</p>
            : method === '503020' && (
              <div className="mt-2" onClick={e => e.stopPropagation()}>
                <MoneyInput value={income} onChange={setIncome} prefix placeholder="¿Cuánto te entra al mes?" ariaLabel="Cuánto te entra al mes" className="w-full rounded-xl bg-[#0B1026] ring-1 ring-white/15 focus:ring-brand-lime outline-none px-3 py-2.5 font-bold" />
              </div>
            )}
        </Option>
        <Option method={method} onPick={setMethod} id="manual" title="✍️ Lo escribo yo"><p className="text-[13px] text-slate-300 mt-1">Pones el límite de cada categoría a mano.</p></Option>
      </div>
    </Shell>
  );
}

function Option({ id, title, tag, children, disabled, method, onPick }: { id: BudgetMethod | 'manual'; title: string; tag?: string; children?: React.ReactNode; disabled?: boolean; method: string; onPick: (id: BudgetMethod | 'manual') => void }) {
  return (
    <div role="radio" tabIndex={disabled ? -1 : 0} aria-checked={method === id} aria-disabled={disabled}
      onClick={() => { if (!disabled) { onPick(id); haptic('light'); } }} onKeyDown={e => { if (!disabled && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); onPick(id); } }}
      className={`w-full text-left rounded-[22px] p-4 transition-colors cursor-pointer ${disabled ? 'opacity-45' : ''} ${method === id ? 'bg-brand-lime/[0.07] ring-2 ring-brand-lime' : 'bg-[#141B3A] ring-1 ring-white/10'}`}>
      <p className="font-extrabold text-[16px] flex items-center gap-2 flex-wrap">{title}{tag && <span className="text-[10px] font-extrabold tracking-wide bg-brand-lime text-brand-ink rounded-full px-2 py-0.5">{tag}</span>}</p>
      {children}
    </div>
  );
}
