/**
 * ════════════════════════════════════════════════════════════════════
 * 🤖 ASISTENTE DE PRESUPUESTO CON KAI
 * ────────────────────────────────────────────────────────────────────
 * Pasos:
 *   1. Tu sueldo: cuánto entra y cuándo (mensual: un día; quincenal: dos días).
 *   2. Tus deudas: aproximadas, saldo y cuota. Se guardan en Pagos.
 *   3. Tu ahorro: % del sueldo con la plata exacta y qué es cada parte.
 *      3b. Si no alcanza: "No te preocupes", plan para ir liberando deuda.
 *   4. Tus presupuestos por categoría (editables).
 *   5. ¡Listo!
 * Se abre con el evento 'mf:open-assistant' (Inicio, Ajustes, Presupuestos).
 * Nada se guarda hasta tocar "Guardar mi plan". Todo queda en el celular.
 * ════════════════════════════════════════════════════════════════════
 */
import { useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Minus, Plus, Trash2, ChevronLeft } from 'lucide-react';
import { db, type Bill, type Transaction } from '../../utils/database';
import { getPrefs, setPrefs } from '../../utils/prefs';
import { formatCOP } from '../../utils/format';
import MoneyInput from '../ui/MoneyInput';
import { haptic } from '../../utils/haptics';
import { notify } from '../../services/notificationService';
import {
  getPlan, savePlan, splitIncome, payoffPlan, historyOf, suggestBudgets, cyclePayDay,
  type PayFreq, type BudgetRow,
} from '../../services/budgetPlan';
import { Shell, KaiSays, Bubble, BudgetRows, monthYear } from './parts';
import Kai from './Kai';

interface DebtDraft { key: string; name: string; emoji: string; balance: number; cuota: number; billId?: string; kind?: Bill['kind']; paid?: number }
const CHIPS: { name: string; emoji: string }[] = [
  { name: 'Tarjeta de crédito', emoji: '💳' }, { name: 'Crédito', emoji: '🏦' }, { name: 'Préstamo', emoji: '🤝' },
  { name: 'Celular', emoji: '📱' }, { name: 'Moto/Carro', emoji: '🏍️' }, { name: 'Otra', emoji: '🧾' },
];
const emojiFor = (name: string) => CHIPS.find(c => name.toLowerCase().includes(c.name.toLowerCase().split(' ')[0].split('/')[0]))?.emoji ?? '🧾';
const SEG = [
  { k: 'deudas', label: 'Deudas', color: '#FDA4AF', help: 'cuotas que ya debes pagar' },
  { k: 'necesidades', label: 'Necesidades', color: '#7DD3FC', help: 'arriendo, servicios, mercado, transporte' },
  { k: 'gustos', label: 'Gustos', color: '#C4A3D9', help: 'salidas, ropa, domicilios' },
  { k: 'ahorro', label: 'Ahorro', color: '#C6F432', help: 'para tus metas o emergencias' },
] as const;

function DayStepper({ label, value, onChange, min = 1, max = 31 }: { label: string; value: number; onChange: (d: number) => void; min?: number; max?: number }) {
  return (
    <div className="flex-1 rounded-2xl bg-[#0B1026] ring-1 ring-white/10 p-2 flex items-center justify-between">
      <button aria-label={`${label}: un día menos`} onClick={() => onChange(Math.max(min, value - 1))} className="w-9 h-9 rounded-xl bg-white/[0.07] flex items-center justify-center"><Minus size={16} /></button>
      <span className="text-center"><span className="block text-[10px] text-slate-400">{label}</span><span className="font-extrabold text-lg">Día {value}</span></span>
      <button aria-label={`${label}: un día más`} onClick={() => onChange(Math.min(max, value + 1))} className="w-9 h-9 rounded-xl bg-white/[0.07] flex items-center justify-center"><Plus size={16} /></button>
    </div>
  );
}

export default function BudgetAssistant() {
  const [open, setOpen] = useState(false);
  useEffect(() => {
    const on = () => setOpen(true);
    window.addEventListener('mf:open-assistant', on);
    return () => window.removeEventListener('mf:open-assistant', on);
  }, []);
  return <AnimatePresence>{open && <Wizard onClose={() => setOpen(false)} />}</AnimatePresence>;
}

function Wizard({ onClose }: { onClose: () => void }) {
  const navigate = useNavigate();
  const prev = getPlan();
  const prefs = getPrefs();
  const name = (() => { try { return localStorage.getItem('miFinanzasUserName') || ''; } catch { return ''; } })();
  const [step, setStep] = useState(0);
  const [income, setIncome] = useState(prev?.income ?? 0);
  const [freq, setFreq] = useState<PayFreq>(prev?.freq ?? 'mensual');
  const [day1, setDay1] = useState(prev?.freq === 'mensual' ? prev.payDays[0] : prefs.payDay > 1 ? prefs.payDay : 30);
  const [q1, setQ1] = useState(prev?.freq === 'quincenal' ? prev.payDays[0] : 15);
  const [q2, setQ2] = useState(prev?.freq === 'quincenal' ? prev.payDays[1] : 30);
  const [debts, setDebts] = useState<DebtDraft[]>([]);
  const [noDebts, setNoDebts] = useState(false);
  const [pct, setPct] = useState(prev?.savingsPct ?? 10);
  const [tx, setTx] = useState<Transaction[]>([]);
  const [rows, setRows] = useState<BudgetRow[]>([]);
  const [saving, setSaving] = useState(false);

  // Carga las deudas que ya están en Pagos y los movimientos (para promedios)
  useEffect(() => {
    Promise.all([db.bills.toArray(), db.transactions.toArray()]).then(([b, t]) => {
      setTx(t);
      setDebts(b.filter(x => x.active && (x.kind === 'deuda' || x.kind === 'tarjeta')).map(x => ({
        key: x.id, billId: x.id, kind: x.kind, name: x.name, emoji: x.kind === 'tarjeta' ? '💳' : emojiFor(x.name), cuota: x.amount, paid: x.paidInstallments ?? 0,
        balance: x.kind === 'deuda' ? Math.max(0, (x.totalInstallments ?? 0) - (x.paidInstallments ?? 0)) * x.amount : 0,
      })));
    }).catch(() => {});
  }, []);

  const payDays = freq === 'mensual' ? [day1] : [q1, q2];
  const hist = useMemo(() => historyOf(tx, cyclePayDay(payDays), new Date()), [tx, payDays.join(',')]); // eslint-disable-line react-hooks/exhaustive-deps
  const realDebts = debts.filter(d => d.cuota > 0);
  const debtMonthly = realDebts.reduce((a, d) => a + d.cuota, 0);
  const split = splitIncome(income, debtMonthly, pct, hist.cycles ? hist.needs : undefined);
  const effPct = Math.min(pct, split.maxPct);
  const plan = useMemo(() => payoffPlan(realDebts.map(d => ({ name: d.name, balance: d.balance || d.cuota * 12, cuota: d.cuota }))), [JSON.stringify(realDebts)]); // eslint-disable-line react-hooks/exhaustive-deps
  const hello = name ? `¡Hola ${name}!` : '¡Hola!';
  const fmtDays = freq === 'mensual' ? `el ${day1} de cada mes` : `el ${q1} y el ${q2}`;

  const addDebt = (c: { name: string; emoji: string }) => { haptic('light'); setNoDebts(false); setDebts(d => [...d, { key: crypto.randomUUID(), name: c.name, emoji: c.emoji, balance: 0, cuota: 0 }]); };
  const patch = (key: string, p: Partial<DebtDraft>) => setDebts(d => d.map(x => (x.key === key ? { ...x, ...p } : x)));

  const goBudgets = () => {
    const fixed = Math.max(hist.byCat.get('Arriendo') ?? 0, 0);
    setRows(suggestBudgets('plan', { hist, income, split: splitIncome(income, debtMonthly, split.fits ? effPct : 0, hist.cycles ? hist.needs : undefined), fixed }));
    setStep(3);
  };

  const save = async () => {
    if (saving) return; setSaving(true);
    try {
      savePlan({ income, freq, payDays, savingsPct: split.fits ? effPct : 0, mode: split.fits ? 'ahorro' : 'deuda', createdAt: Date.now() });
      setPrefs({ payDay: cyclePayDay(payDays), budgets: Object.fromEntries(rows.filter(r => r.value > 0).map(r => [r.cat, r.value])) });
      // Deudas → Pagos (nuevas se crean; las que ya estaban se actualizan)
      for (const d of realDebts) {
        const left = d.balance > 0 ? Math.ceil(d.balance / d.cuota) : 0;
        if (d.billId) {
          const upd: Partial<Bill> = { amount: d.cuota };
          if (d.kind === 'deuda' && left) upd.totalInstallments = (d.paid ?? 0) + left;
          await db.bills.update(d.billId, upd);
        } else {
          await db.bills.add({
            id: crypto.randomUUID(), name: d.name.trim() || 'Deuda', kind: 'deuda', category: 'Deudas', amount: d.cuota,
            dueDay: payDays[0], owner: 'yo', totalInstallments: left || 12, paidInstallments: 0, active: true, createdAt: Date.now(),
          });
        }
      }
      window.dispatchEvent(new Event('mf:data-changed'));
      haptic('success');
      setStep(4);
    } catch {
      notify({ title: 'No se pudo guardar', message: 'Intenta de nuevo.', type: 'error' });
    } finally { setSaving(false); }
  };

  const back = step > 0 && step < 4 ? <button onClick={() => setStep(s => s - 1)} className="h-14 w-14 shrink-0 rounded-2xl bg-white/[0.07] ring-1 ring-white/10 flex items-center justify-center" aria-label="Atrás"><ChevronLeft size={22} /></button> : null;
  const Primary = ({ children, onClick, disabled }: { children: React.ReactNode; onClick: () => void; disabled?: boolean }) => (
    <div className="flex gap-2">{back}<motion.button whileTap={{ scale: 0.97 }} disabled={disabled} onClick={onClick} className="flex-1 h-14 rounded-2xl bg-brand-lime text-brand-ink font-extrabold text-[16px] disabled:opacity-40">{children}</motion.button></div>
  );

  // ── Paso 1: sueldo ──
  if (step === 0) return (
    <Shell label="Paso 1 · Tu sueldo" step={0} steps={4} onClose={onClose} footer={<Primary disabled={income <= 0} onClick={() => setStep(1)}>Siguiente</Primary>}>
      <KaiSays mood={income > 0 ? 'feliz' : 'normal'}>{hello} Soy <b>Kai</b> y te ayudo a armar tu presupuesto en 3 pasos. Primero, <b>¿cuánto te entra y cuándo te pagan?</b></KaiSays>
      <div className="mt-4 rounded-[22px] bg-[#141B3A] ring-1 ring-white/10 p-4 space-y-4">
        <label className="block">
          <span className="text-[13px] text-slate-300">¿Cuánto te entra al mes? (aproximado)</span>
          <MoneyInput value={income} onChange={setIncome} prefix placeholder="$ 0" ariaLabel="Cuánto te entra al mes"
            className="mt-1.5 w-full rounded-2xl bg-[#0B1026] ring-1 ring-brand-lime/40 focus:ring-brand-lime outline-none px-4 py-3.5 font-extrabold text-xl" />
        </label>
        <div>
          <p className="text-[13px] text-slate-300">¿Cada cuánto te pagan?</p>
          <div className="grid grid-cols-2 gap-2 mt-1.5" role="radiogroup" aria-label="Frecuencia de pago">
            {(['mensual', 'quincenal'] as PayFreq[]).map(f => (
              <button key={f} role="radio" aria-checked={freq === f} onClick={() => { setFreq(f); haptic('light'); }}
                className={`h-12 rounded-2xl font-bold transition-colors ${freq === f ? 'bg-brand-lime text-brand-ink' : 'bg-white/[0.06] ring-1 ring-white/10'}`}>{f === 'mensual' ? 'Mensual' : 'Quincenal'}</button>
            ))}
          </div>
        </div>
        <div>
          <p className="text-[13px] text-slate-300">{freq === 'mensual' ? '¿Qué día te pagan?' : '¿Qué días te pagan?'}</p>
          <div className="flex gap-2 mt-1.5">
            {freq === 'mensual' ? <DayStepper label="Te pagan el" value={day1} onChange={setDay1} />
              : <><DayStepper label="Primera" value={q1} onChange={v => setQ1(Math.min(v, q2 - 1))} max={30} /><DayStepper label="Segunda" value={q2} onChange={v => setQ2(Math.max(v, q1 + 1))} min={2} /></>}
          </div>
          <p className="text-[11px] text-slate-500 mt-1.5">{freq === 'mensual' ? 'Un solo día (por ejemplo el 28).' : 'Las dos fechas (por ejemplo 15 y 30).'} En meses cortos se usa el último día.</p>
        </div>
      </div>
      {income > 0 && (
        <div className="flex gap-2.5 items-start mt-4"><Kai mood="feliz" size={40} /><div className="flex-1"><Bubble small>
          {freq === 'quincenal' ? <>Perfecto: te llegan <b>{formatCOP(Math.round(income / 2))}</b> el {q1} y <b>{formatCOP(Math.round(income / 2))}</b> el {q2}.</> : <>Perfecto: te llegan <b>{formatCOP(income)}</b> {fmtDays}.</>} Así te digo cuánto puedes gastar entre pago y pago.
        </Bubble></div></div>
      )}
    </Shell>
  );

  // ── Paso 2: deudas ──
  if (step === 1) return (
    <Shell label="Paso 2 · Tus deudas" step={1} steps={4} onClose={onClose} footer={<Primary disabled={!noDebts && debts.length > 0 && realDebts.length === 0} onClick={() => setStep(2)}>{debts.length || noDebts ? 'Siguiente' : 'No tengo deudas'}</Primary>}>
      <KaiSays mood="normal" size={110}>Ahora, <b>¿qué deudas tienes?</b> No tiene que ser exacto: con lo que recuerdes calculo cuánto puedes ahorrar.</KaiSays>
      <div className="flex flex-wrap gap-2 mt-4">
        {CHIPS.map(c => <button key={c.name} onClick={() => addDebt(c)} className="px-3.5 py-2 rounded-full bg-white/[0.06] ring-1 ring-white/15 text-[13px] font-bold active:scale-95 transition-transform">+ {c.name}</button>)}
      </div>
      <div className="space-y-2.5 mt-4">
        <AnimatePresence initial={false}>
          {debts.map(d => (
            <motion.div key={d.key} layout initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, x: -40 }} className="rounded-[20px] bg-[#141B3A] ring-1 ring-white/10 p-3">
              <div className="flex items-center gap-2.5">
                <span className="text-2xl" aria-hidden="true">{d.emoji}</span>
                <input value={d.name} onChange={e => patch(d.key, { name: e.target.value })} aria-label="Nombre de la deuda" className="flex-1 min-w-0 bg-transparent font-bold text-[15px] outline-none border-b border-transparent focus:border-white/20" />
                <button onClick={() => setDebts(x => x.filter(y => y.key !== d.key))} aria-label={`Quitar ${d.name}`} className="w-8 h-8 rounded-xl bg-white/[0.05] flex items-center justify-center text-slate-400"><Trash2 size={15} /></button>
              </div>
              <div className="grid grid-cols-2 gap-2 mt-2.5">
                <label className="block"><span className="text-[11px] text-slate-400">Debes (aprox.)</span>
                  <MoneyInput value={d.balance} onChange={v => patch(d.key, { balance: v })} prefix placeholder="$ 0" ariaLabel={`Saldo de ${d.name}`} className="mt-1 w-full rounded-xl bg-[#0B1026] ring-1 ring-white/10 focus:ring-brand-lime outline-none px-3 py-2.5 font-bold" /></label>
                <label className="block"><span className="text-[11px] text-slate-400">Cuota al mes</span>
                  <MoneyInput value={d.cuota} onChange={v => patch(d.key, { cuota: v })} prefix placeholder="$ 0" ariaLabel={`Cuota de ${d.name}`} className="mt-1 w-full rounded-xl bg-[#0B1026] ring-1 ring-white/10 focus:ring-brand-lime outline-none px-3 py-2.5 font-bold" /></label>
              </div>
              {d.billId && <p className="text-[10.5px] text-slate-500 mt-1.5">Ya estaba en Pagos: se actualiza con estos valores.</p>}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
      {debts.length === 0 && (
        <button onClick={() => { setNoDebts(true); setStep(2); }} className="w-full mt-4 rounded-[20px] p-4 bg-emerald-400/10 ring-1 ring-emerald-300/30 text-left">
          <p className="font-bold">🎉 No tengo deudas</p><p className="text-[12px] text-slate-300">Pasamos directo a tu ahorro.</p>
        </button>
      )}
      {realDebts.length > 0 && (
        <>
          <div className="mt-4 rounded-[20px] p-4 bg-rose-400/10 ring-1 ring-rose-300/30 flex items-center justify-between">
            <span className="font-bold">Pagas en deudas al mes</span><span className="font-extrabold text-xl text-rose-300">{formatCOP(debtMonthly)}</span>
          </div>
          <p className="text-[11px] text-slate-500 text-center mt-2">Se guardan en Pagos para avisarte antes de cada cuota.</p>
        </>
      )}
    </Shell>
  );

  // ── Paso 3: ahorro (o plan para liberar deuda) ──
  if (step === 2) {
    if (!split.fits) {
      const first = plan[0];
      return (
        <Shell label="Paso 3 · Tu plan" step={2} steps={4} onClose={onClose} footer={<Primary onClick={goBudgets}>Crear mi plan</Primary>}>
          <KaiSays mood="calma" size={120}>Con tus deudas, hoy te quedan <b>{formatCOP(Math.max(0, split.free))}</b> después de lo básico. <b>No te preocupes 💚</b>: primero vamos liberando deuda y ese dinero se vuelve tu ahorro.</KaiSays>
          {plan.length > 0 && (
            <div className="mt-4 rounded-[22px] bg-[#141B3A] ring-1 ring-white/10 p-4">
              <p className="font-extrabold">🧭 Tu plan para liberar deuda</p>
              <div className="mt-3 space-y-3">
                {plan.map((p, i) => (
                  <motion.div key={p.name + i} initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.15 + i * 0.1 }} className="flex items-center gap-3">
                    <span className={`w-8 h-8 rounded-full flex items-center justify-center font-extrabold text-sm text-brand-ink ${['bg-brand-lime', 'bg-sky-300', 'bg-pink-300', 'bg-amber-300'][i % 4]}`}>{i + 1}</span>
                    <div className="flex-1 min-w-0"><p className="font-bold truncate">{p.name}</p><p className="text-[11px] text-slate-400">{i === 0 ? 'Es la primera que terminas' : 'Le sumas lo que liberaste antes'}</p></div>
                    <span className="text-[13px] font-extrabold text-brand-lime">{monthYear(p.date)}</span>
                  </motion.div>
                ))}
              </div>
            </div>
          )}
          {first && <div className="mt-3 rounded-[20px] p-4 bg-brand-lime/10 ring-1 ring-brand-lime/40 text-[14px]">Cuando termines <b>{first.name}</b> ({monthYear(first.date)}) liberas <b className="text-brand-lime">{formatCOP(first.cuota)}/mes</b> → ese será tu primer ahorro.</div>}
          <div className="flex gap-2.5 items-start mt-3"><Kai mood="feliz" size={40} /><div className="flex-1"><Bubble small>Te aviso cada vez que termines una deuda para mover esa plata al ahorro. ¡Vas a ver el avance en tus anillos! 🎯</Bubble></div></div>
        </Shell>
      );
    }
    const parts = { deudas: split.deudas, necesidades: split.necesidades, gustos: split.gustos, ahorro: split.ahorro };
    const tip = effPct === 0 ? 'Aunque sea un 1% cuenta. Lo importante es crear el hábito.' : effPct < 10 ? 'Empezar poquito está muy bien. Cuando termines una deuda lo subimos.' : effPct < 20 ? <>Lo ideal es <b>20%</b>, pero empezar con {effPct}% está muy bien. Lo importante es separarlo <b>apenas te paguen</b>.</> : <>¡Excelente! <b>{effPct}%</b> es lo que recomiendan los expertos. Sepáralo apenas te paguen.</>;
    return (
      <Shell label="Paso 3 · Tu ahorro" step={2} steps={4} onClose={onClose} footer={<Primary onClick={goBudgets}>Siguiente</Primary>}>
        <KaiSays mood={effPct >= 10 ? 'feliz' : 'normal'} size={110}><b>¿Qué porcentaje de tu sueldo quieres ahorrar?</b> Mueve la barra y te digo cuánto es.</KaiSays>
        <div className="mt-4 rounded-[22px] bg-[#141B3A] ring-1 ring-white/10 p-5 text-center">
          <motion.p key={effPct} initial={{ scale: 0.85, opacity: 0.4 }} animate={{ scale: 1, opacity: 1 }} className="text-[52px] leading-none font-extrabold text-brand-lime">{effPct}%</motion.p>
          <p className="text-lg font-extrabold mt-2">= {formatCOP(split.ahorro)} al mes</p>
          <p className="text-[12px] text-slate-400">≈ {formatCOP(split.ahorro * 12)} en un año</p>
          <input type="range" min={0} max={split.maxPct} step={1} value={effPct} onChange={e => { setPct(Number(e.target.value)); haptic('light'); }} aria-label="Porcentaje de ahorro"
            className="w-full mt-4 accent-[#C6F432]" />
          <div className="flex justify-between text-[11px] text-slate-500"><span>0%</span><span>Máximo hoy: {split.maxPct}%</span></div>
        </div>
        <p className="font-bold mt-4 mb-2">Así se repartiría tu sueldo:</p>
        <div className="h-3.5 rounded-full overflow-hidden flex bg-white/5">
          {SEG.map(s => <motion.div key={s.k} style={{ background: s.color }} animate={{ width: `${(parts[s.k] / Math.max(1, income)) * 100}%` }} transition={{ type: 'spring', damping: 22 }} />)}
        </div>
        <div className="mt-3 space-y-1.5">
          {SEG.map(s => (
            <p key={s.k} className="text-[13px] text-slate-300"><span style={{ color: s.color }} className="font-extrabold">● {s.label} {Math.round((parts[s.k] / Math.max(1, income)) * 100)}% · {formatCOP(parts[s.k])}</span> — {s.help}</p>
          ))}
        </div>
        {hist.cycles > 0 && <p className="text-[11px] text-slate-500 mt-2">Las necesidades salen de lo que gastaste en tus últimos {hist.cycles === 1 ? 'mes' : `${hist.cycles} meses`}.</p>}
        <div className="flex gap-2.5 items-start mt-3"><Kai mood="feliz" size={40} /><div className="flex-1"><Bubble small>💡 {tip}</Bubble></div></div>
      </Shell>
    );
  }

  // ── Paso 4: presupuestos ──
  if (step === 3) {
    const total = rows.reduce((a, r) => a + r.value, 0);
    return (
      <Shell label="Paso 4 · Tus presupuestos" step={3} steps={4} onClose={onClose} footer={<Primary disabled={saving} onClick={save}>{saving ? 'Guardando…' : 'Guardar mi plan'}</Primary>}>
        <KaiSays mood="pensando" size={100}>Con eso armé <b>tus límites por categoría</b>. Toca un valor para cambiarlo.</KaiSays>
        <div className="mt-4"><BudgetRows rows={rows} onChange={setRows} /></div>
        <p className="text-[11px] text-slate-500 mt-2.5">Arriendo y deudas no llevan límite: ya están en Pagos.</p>
        <div className="mt-3 rounded-[20px] p-4 bg-[#141B3A] ring-1 ring-brand-lime/30 flex items-center justify-between">
          <span className="font-bold">Total para gastar en el mes</span><span className="font-extrabold text-lg text-brand-lime">{formatCOP(total)}</span>
        </div>
      </Shell>
    );
  }

  // ── ¡Listo! ──
  return (
    <Shell label="¡Plan listo!" step={4} steps={4} onClose={onClose}
      footer={<motion.button whileTap={{ scale: 0.97 }} onClick={() => { onClose(); navigate('/'); }} className="w-full h-14 rounded-2xl bg-brand-lime text-brand-ink font-extrabold text-[16px]">Ver mis anillos</motion.button>}>
      <div className="pt-4"><KaiSays mood="celebra" size={170}><b>¡Listo{name ? `, ${name}` : ''}!</b> Tu plan quedó guardado. Desde hoy tus anillos de Inicio siguen este plan y te aviso si te acercas a un límite.</KaiSays></div>
      <div className="grid grid-cols-2 gap-2.5 mt-4">
        {[
          ['💰 Sueldo', formatCOP(income)], ['📅 Te pagan', freq === 'mensual' ? `Día ${day1}` : `Días ${q1} y ${q2}`],
          split.fits ? ['🐷 Ahorro', `${effPct}% · ${formatCOP(split.ahorro)}`] : ['🧭 Plan', 'Liberar deuda'], ['🎯 Presupuestos', `${rows.filter(r => r.value > 0).length} categorías`],
        ].map(([k, v]) => <div key={k} className="rounded-2xl bg-[#141B3A] ring-1 ring-white/10 p-3"><p className="text-[11px] text-slate-400">{k}</p><p className="font-extrabold">{v}</p></div>)}
      </div>
    </Shell>
  );
}
