/**
 * ════════════════════════════════════════════════════════════════════
 * 🪙 CONTAR MI ALCANCÍA (pantalla completa)
 * ────────────────────────────────────────────────────────────────────
 * Dos formas de contar, que se suman en el mismo conteo:
 *   • Montoncitos: torrecitas de 10 monedas → toca ＋ por cada una; las que
 *     sobran van en "Sueltas". Exacto al 100 %.
 *   • Foto: la app busca las monedas en la foto (dentro del celular) y dice de
 *     cuánto es cada una; tocas una moneda para corregirla y "Sumar al conteo".
 * Al final: "Guardar en mi meta" suma el total a una meta de ahorro.
 * El conteo a medias se recuerda en este celular (localStorage 'mf_alcancia').
 * Lógica: services/coinCounter.ts · Se abre desde Finanzas → Metas.
 * ════════════════════════════════════════════════════════════════════
 */
import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Plus, Minus, Camera, ImageIcon, Loader2, RotateCcw, ChevronDown, Check } from 'lucide-react';
import { COINS, emptyCounts, coinsOf, totals, splitTen, detectCoins, type Counts, type CoinValue, type FoundCoin } from '../../services/coinCounter';
import { formatCOP } from '../../utils/format';
import { db, type SavingsGoal } from '../../utils/database';
import { notify } from '../../services/notificationService';
import MoneyInput from '../ui/MoneyInput';

const DRAFT = 'mf_alcancia';
const COLOR: Record<CoinValue, { ring: string; core: string; ui: string }> = {
  1000: { ring: '#C9A44C', core: '#C3C9D1', ui: '#C6F432' },
  500: { ring: '#C3C9D1', core: '#C9A44C', ui: '#7DD3FC' },
  200: { ring: '#C3C9D1', core: '#C3C9D1', ui: '#E2E8F0' },
  100: { ring: '#C9A44C', core: '#C9A44C', ui: '#FB923C' },
  50: { ring: '#B8C0CA', core: '#B8C0CA', ui: '#F9A8D4' },
};
const NEXT: Record<CoinValue, CoinValue | null> = { 1000: 500, 500: 200, 200: 100, 100: 50, 50: null };

function CoinDot({ v, size = 30 }: { v: CoinValue; size?: number }) {
  const c = COLOR[v];
  return <span aria-hidden="true" className="shrink-0 rounded-full" style={{ width: size, height: size, background: c.core, boxShadow: `inset 0 0 0 ${size * 0.22}px ${c.ring}, 0 2px 4px #0006` }} />;
}
function Tower({ v }: { v: CoinValue }) {
  const w = v === 1000 ? 30 : v === 500 ? 27 : 24;
  return (
    <motion.div initial={{ y: -12, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="flex flex-col items-center justify-end">
      {Array.from({ length: 10 }, (_, i) => <div key={i} style={{ width: w, height: 5, marginTop: -1.5, borderRadius: '50%/100%', background: COLOR[v].ring, borderTop: '1px solid #fff6', boxShadow: '0 1px 0 #0006' }} />)}
    </motion.div>
  );
}

const readDraft = (): { counts: Counts; bills: number } => {
  try { const d = JSON.parse(localStorage.getItem(DRAFT) || ''); return { counts: { ...emptyCounts(), ...d.counts }, bills: Number(d.bills) || 0 }; } catch { return { counts: emptyCounts(), bills: 0 }; }
};

export default function PiggyCounter({ open, onClose, goals, onSaved }: { open: boolean; onClose: () => void; goals: SavingsGoal[]; onSaved: () => void }) {
  const [tab, setTab] = useState<'stacks' | 'photo'>('stacks');
  const [counts, setCounts] = useState<Counts>(() => readDraft().counts);
  const [bills, setBills] = useState(() => readDraft().bills);
  const [more, setMore] = useState(false);
  const [saving, setSaving] = useState(false);
  const [goalId, setGoalId] = useState('');
  // Foto
  const [photo, setPhoto] = useState<{ url: string; w: number; h: number } | null>(null);
  const [found, setFound] = useState<FoundCoin[]>([]);
  const [busy, setBusy] = useState(false);
  const [batches, setBatches] = useState(0);
  const camRef = useRef<HTMLInputElement>(null), galRef = useRef<HTMLInputElement>(null);

  useEffect(() => { try { localStorage.setItem(DRAFT, JSON.stringify({ counts, bills })); } catch { /* sin almacenamiento */ } }, [counts, bills]);
  useEffect(() => { if (open && !goalId && goals[0]) setGoalId(goals[0].id); }, [open, goals, goalId]);

  const t = totals(counts, bills);
  const setC = (v: CoinValue, patch: Partial<{ stacks: number; loose: number }>) =>
    setCounts(c => ({ ...c, [v]: { stacks: Math.max(0, patch.stacks ?? c[v].stacks), loose: Math.max(0, Math.min(999, patch.loose ?? c[v].loose)) } }));

  // ═══ SECCIÓN: Foto → monedas ═══
  const onFile = async (f?: File) => {
    if (!f) return;
    setBusy(true); setFound([]);
    try {
      const bmp = await createImageBitmap(f);
      const k = Math.min(1, 900 / Math.max(bmp.width, bmp.height));
      const w = Math.round(bmp.width * k), h = Math.round(bmp.height * k);
      const cv = document.createElement('canvas'); cv.width = w; cv.height = h;
      const ctx = cv.getContext('2d')!; ctx.drawImage(bmp, 0, 0, w, h);
      setPhoto({ url: cv.toDataURL('image/jpeg', 0.85), w, h });
      await new Promise(r => setTimeout(r, 60)); // deja pintar el "Contando…"
      const res = detectCoins(ctx.getImageData(0, 0, w, h));
      setFound(res);
      if (!res.length) notify({ title: 'No encontré monedas', message: 'Riega las monedas en una sola capa y toma la foto desde arriba, con buena luz.', type: 'info', log: false });
    } catch { notify({ title: 'No pude leer la foto', message: 'Intenta con otra foto.', type: 'error', log: false }); }
    finally { setBusy(false); if (camRef.current) camRef.current.value = ''; if (galRef.current) galRef.current.value = ''; }
  };
  const cycle = (i: number) => setFound(fs => fs.flatMap((f, j) => j !== i ? [f] : NEXT[f.value] ? [{ ...f, value: NEXT[f.value]! }] : []));
  const photoCount = (v: CoinValue) => found.filter(f => f.value === v).length;
  const addPhoto = () => {
    setCounts(c => {
      const n = { ...c };
      for (const k of COINS) { const add = photoCount(k.value); if (add) n[k.value] = splitTen(coinsOf(c[k.value]) + add); }
      return n;
    });
    notify({ title: `Sumé ${found.length} monedas`, message: 'Si te quedan más, toma otra foto (otra tanda).', type: 'success', log: false });
    setBatches(b => b + 1); setFound([]); setPhoto(null); setTab('stacks');
  };

  // ═══ SECCIÓN: Guardar en una meta ═══
  const save = async () => {
    if (!t.amount) return notify({ title: 'Aún no hay nada contado', type: 'info', log: false });
    setSaving(true);
    try {
      const g = goals.find(x => x.id === goalId);
      if (g) await db.goals.update(g.id, { currentAmount: g.currentAmount + t.amount });
      else {
        const d = new Date(); d.setFullYear(d.getFullYear() + 1);
        await db.goals.add({ id: crypto.randomUUID(), name: 'Alcancía', targetAmount: t.amount, currentAmount: t.amount, deadline: d.toISOString().slice(0, 10), createdAt: new Date().toISOString() });
      }
      notify({ title: `¡${formatCOP(t.amount)} guardados!`, message: g ? `Abonados a "${g.name}"` : 'Creé la meta "Alcancía" con este valor', type: 'success' });
      setCounts(emptyCounts()); setBills(0); setBatches(0);
      onSaved(); onClose();
    } finally { setSaving(false); }
  };
  const reset = () => { setCounts(emptyCounts()); setBills(0); setFound([]); setPhoto(null); setBatches(0); };

  const coinCard = (v: CoinValue, big = true) => {
    const c = counts[v], k = COINS.find(x => x.value === v)!, ui = COLOR[v].ui;
    return (
      <div key={v} className={`rounded-[22px] bg-white/[0.05] ring-1 ring-white/10 ${big ? 'p-4' : 'p-3'}`}>
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2.5 min-w-0"><CoinDot v={v} size={big ? 32 : 24} />
            <div className="min-w-0"><p className="text-white font-extrabold text-[15px]">Monedas de {k.label}</p><p className="text-[11px] text-slate-400 truncate">{k.look}</p></div></div>
          <p className="font-extrabold text-lg shrink-0" style={{ color: ui }}>{formatCOP(coinsOf(c) * v)}</p>
        </div>
        {big && <div className="flex gap-1.5 items-end h-[52px] mt-2 overflow-hidden" aria-hidden="true">{Array.from({ length: Math.min(c.stacks, 12) }, (_, i) => <Tower key={i} v={v} />)}{c.stacks > 12 && <span className="text-xs text-slate-400 font-bold mb-1">+{c.stacks - 12}</span>}</div>}
        <div className="flex items-center gap-2 mt-2">
          <motion.button whileTap={{ scale: 0.88 }} onClick={() => setC(v, { stacks: c.stacks - 1 })} aria-label={`Quitar un montoncito de ${k.label}`} className="w-12 h-12 rounded-2xl bg-white/[0.08] flex items-center justify-center text-white"><Minus size={20} /></motion.button>
          <div className="flex-1 text-center"><p className="text-2xl font-extrabold text-white leading-none">{c.stacks}</p><p className="text-[11px] text-slate-400 mt-1">montoncitos de 10</p></div>
          <motion.button whileTap={{ scale: 0.88 }} onClick={() => setC(v, { stacks: c.stacks + 1 })} aria-label={`Agregar un montoncito de ${k.label}`} className="w-12 h-12 rounded-2xl flex items-center justify-center text-brand-ink" style={{ background: ui }}><Plus size={22} strokeWidth={3} /></motion.button>
        </div>
        <div className="flex items-center justify-between mt-3 text-[13px]">
          <span className="text-slate-300">Sueltas <span className="text-slate-500">(menos de 10)</span></span>
          <div className="flex items-center gap-1.5">
            <button onClick={() => setC(v, { loose: c.loose - 1 })} aria-label="Una suelta menos" className="w-8 h-8 rounded-xl bg-white/[0.08] flex items-center justify-center"><Minus size={14} /></button>
            <input inputMode="numeric" aria-label={`Monedas sueltas de ${k.label}`} value={c.loose || ''} placeholder="0" onChange={e => setC(v, { loose: Number(e.target.value.replace(/\D/g, '')) || 0 })}
              className="w-12 h-8 text-center rounded-xl bg-white/5 border border-white/10 text-white font-bold outline-none focus:border-brand-lime" />
            <button onClick={() => setC(v, { loose: c.loose + 1 })} aria-label="Una suelta más" className="w-8 h-8 rounded-xl bg-white/[0.08] flex items-center justify-center"><Plus size={14} /></button>
          </div>
        </div>
        <p className="text-[11px] text-slate-500 mt-1.5">{coinsOf(c)} monedas en total</p>
      </div>
    );
  };

  return createPortal(
    <AnimatePresence>
      {open && (
        <motion.div role="dialog" aria-modal="true" aria-labelledby="piggy-title" className="theme-dark fixed inset-0 z-[140] bg-[#0B1026] flex flex-col"
          initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 30 }}>
          <div className="flex items-center justify-between px-4 pt-[max(16px,env(safe-area-inset-top))] pb-2">
            <div><p className="text-[11px] font-extrabold tracking-widest text-slate-400">METAS · ALCANCÍA</p><h2 id="piggy-title" className="text-white text-xl font-extrabold">Contar mi alcancía</h2></div>
            <div className="flex items-center gap-1">
              {t.coins > 0 && <button onClick={reset} aria-label="Empezar de cero" className="p-2 text-slate-400"><RotateCcw size={18} /></button>}
              <button onClick={onClose} aria-label="Cerrar" className="p-2 text-slate-300"><X size={22} /></button>
            </div>
          </div>
          <div role="tablist" className="mx-4 grid grid-cols-2 gap-1.5 p-1.5 rounded-[18px] bg-white/[0.04] ring-1 ring-white/10">
            {([['stacks', '🪙 Montoncitos'], ['photo', '📸 Foto']] as const).map(([id, label]) => (
              <button key={id} role="tab" aria-selected={tab === id} onClick={() => setTab(id)} className="relative h-10 rounded-[14px] text-sm font-extrabold">
                {tab === id && <motion.span layoutId="piggy-tab" className="absolute inset-0 rounded-[14px] bg-brand-lime" />}
                <span className={`relative ${tab === id ? 'text-brand-ink' : 'text-slate-300'}`}>{label}</span>
              </button>
            ))}
          </div>

          <div className="flex-1 overflow-y-auto px-4 pt-3 pb-4 space-y-3">
            {tab === 'stacks' && (<>
              <p className="text-[12.5px] text-slate-400">Separa por color, arma torrecitas de <b className="text-white">10 monedas</b> y toca <b className="text-white">＋</b> por cada una.{batches > 0 && <span className="text-brand-lime font-bold"> Ya sumaste {batches} foto{batches > 1 ? 's' : ''}.</span>}</p>
              {coinCard(1000)}
              {coinCard(500)}
              <button onClick={() => setMore(m => !m)} className="w-full flex items-center justify-between px-4 py-3 rounded-2xl bg-white/[0.04] ring-1 ring-white/10 text-sm text-slate-200 font-bold">
                Otras monedas ($200, $100, $50) y billetes <ChevronDown size={18} className={`transition-transform ${more ? 'rotate-180' : ''}`} />
              </button>
              {more && (<div className="space-y-2.5">
                {coinCard(200, false)}{coinCard(100, false)}{coinCard(50, false)}
                <div className="rounded-[22px] bg-white/[0.05] ring-1 ring-white/10 p-3">
                  <p className="text-white font-extrabold text-[15px]">💵 Billetes</p><p className="text-[11px] text-slate-400 mb-2">Escribe cuánto suman los billetes</p>
                  <MoneyInput value={bills} onChange={setBills} prefix placeholder="$0" ariaLabel="Total en billetes" className="w-full h-11 px-3 rounded-xl bg-white/5 border border-white/10 text-white outline-none focus:border-brand-lime" />
                </div>
              </div>)}
            </>)}

            {tab === 'photo' && (<>
              <input ref={camRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={e => onFile(e.target.files?.[0])} />
              <input ref={galRef} type="file" accept="image/*" className="hidden" onChange={e => onFile(e.target.files?.[0])} />
              {!photo && !busy && (<>
                <div className="space-y-2">
                  {[['🫓', 'Riega las monedas', 'En una mesa, en una sola capa, sin que se monten'], ['☀️', 'Buena luz', 'Foto desde arriba, sin sombras fuertes'], ['🧮', 'Si son muchas', 'Por tandas de 40-60: cada foto se suma al conteo'], ['👆', 'Tú revisas', 'Toca una moneda si la marqué mal']].map(([e, ti, d]) => (
                    <div key={ti} className="flex gap-3 items-center p-3 rounded-2xl bg-white/[0.05]"><span className="text-2xl">{e}</span><div><p className="text-white text-sm font-extrabold">{ti}</p><p className="text-[12px] text-slate-400">{d}</p></div></div>
                  ))}
                </div>
                <motion.button whileTap={{ scale: 0.96 }} onClick={() => camRef.current?.click()} className="w-full py-3.5 rounded-2xl bg-brand-lime text-brand-ink font-extrabold flex items-center justify-center gap-2"><Camera size={19} /> Tomar foto</motion.button>
                <button onClick={() => galRef.current?.click()} className="w-full h-12 rounded-2xl bg-white/[0.07] ring-1 ring-white/10 text-white font-bold flex items-center justify-center gap-2"><ImageIcon size={18} /> Elegir de la galería</button>
                <p className="text-[11px] text-slate-500 text-center">🔒 La foto se revisa dentro de tu celular. No se envía a ningún lado.</p>
                <p className="text-[11px] text-amber-300/90 text-center">Función nueva: el conteo por foto es aproximado. Si las monedas están amontonadas, usa Montoncitos.</p>
              </>)}
              {busy && <div className="py-16 flex flex-col items-center gap-3 text-slate-300"><Loader2 className="animate-spin text-brand-lime" size={32} /> Contando monedas…</div>}
              {photo && !busy && (<>
                <div className="relative rounded-2xl overflow-hidden ring-1 ring-white/10">
                  <img src={photo.url} alt="Foto de las monedas" className="w-full block" />
                  <svg viewBox={`0 0 ${photo.w} ${photo.h}`} className="absolute inset-0 w-full h-full">
                    {found.map((f, i) => (
                      <g key={i} onClick={() => cycle(i)} style={{ cursor: 'pointer' }}>
                        <circle cx={f.x} cy={f.y} r={f.r} fill="transparent" stroke={COLOR[f.value].ui} strokeWidth={Math.max(2, photo.w / 300)} />
                        <text x={f.x} y={f.y - f.r - 2} textAnchor="middle" fontSize={Math.max(9, f.r * 0.5)} fontWeight={800} fill={COLOR[f.value].ui} stroke="#0B1026" strokeWidth={2.5} paintOrder="stroke">{f.value === 1000 ? '1.000' : f.value}</text>
                      </g>
                    ))}
                  </svg>
                </div>
                <p className="text-[12px] text-slate-400 text-center">Encontré <b className="text-white">{found.length}</b> monedas. Toca una para cambiarla (la última opción la quita).</p>
                <div className="grid grid-cols-5 gap-1.5">
                  {COINS.map(k => <div key={k.value} className="rounded-xl bg-white/[0.05] py-2 text-center"><p className="text-lg font-extrabold" style={{ color: COLOR[k.value].ui }}>{photoCount(k.value)}</p><p className="text-[10px] text-slate-400">{k.label}</p></div>)}
                </div>
                <div className="flex gap-2">
                  <button onClick={() => { setPhoto(null); setFound([]); }} className="flex-1 h-12 rounded-2xl bg-white/[0.07] ring-1 ring-white/10 text-white font-bold">Repetir foto</button>
                  <motion.button whileTap={{ scale: 0.96 }} onClick={addPhoto} disabled={!found.length} className="flex-1 h-12 rounded-2xl bg-brand-lime text-brand-ink font-extrabold flex items-center justify-center gap-1.5 disabled:opacity-40"><Check size={18} strokeWidth={3} /> Sumar al conteo</motion.button>
                </div>
              </>)}
            </>)}
          </div>

          {/* Total y guardar */}
          <div className="px-4 pt-3 pb-[max(16px,env(safe-area-inset-bottom))] border-t border-white/10 bg-[#0B1026]">
            <div className="flex items-end justify-between gap-3">
              <div><p className="text-[11px] font-extrabold tracking-widest text-slate-400">TU ALCANCÍA TIENE</p>
                <motion.p key={t.amount} initial={{ scale: 1.08 }} animate={{ scale: 1 }} className="text-[32px] font-extrabold text-brand-lime leading-tight">{formatCOP(t.amount)}</motion.p>
                <p className="text-[11px] text-slate-400">{t.coins} monedas{bills ? ` + ${formatCOP(bills)} en billetes` : ''}</p></div>
              {goals.length > 0 && (
                <select value={goalId} onChange={e => setGoalId(e.target.value)} aria-label="Meta donde guardar" className="max-w-[45%] h-10 px-2 rounded-xl bg-white/5 border border-white/10 text-white text-xs">
                  {goals.map(g => <option key={g.id} value={g.id}>🎯 {g.name}</option>)}
                </select>
              )}
            </div>
            <motion.button whileTap={{ scale: 0.97 }} onClick={save} disabled={saving || !t.amount} className="mt-3 w-full py-3.5 rounded-2xl bg-brand-lime text-brand-ink font-extrabold disabled:opacity-40">
              {goals.length ? 'Guardar en mi meta' : 'Guardar como meta "Alcancía"'}
            </motion.button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body,
  );
}
