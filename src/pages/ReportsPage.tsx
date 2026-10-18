/**
 * ════════════════════════════════════════════════════════════════════
 * 📊 PANTALLA REPORTES (solo administradora)
 * ────────────────────────────────────────────────────────────────────
 * Qué hace: muestra cuántas personas abrieron, instalaron y usan la app,
 *           desde qué tipo de celular, y cuántas llegaron por tu enlace.
 *           Son SOLO sumas anónimas: no hay nombres ni datos de nadie.
 * Cómo se entra: Ajustes → Acerca de → toca 7 veces la versión, o /reportes.
 *           Pide la clave de administradora una vez; luego queda en el menú.
 * Datos: services/statsService.ts → función stats_report del servidor.
 * ════════════════════════════════════════════════════════════════════
 */
import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { BarChart3, Download, Smartphone, Users, Home, KeyRound, RefreshCw, Link2, LogOut, Info, Pencil } from 'lucide-react';
import ModuleHeader from '../components/ui/ModuleHeader';
import { adminKey, fetchReport, forgetAdmin, myRefCode, type StatsReport } from '../services/statsService';
import { notify } from '../services/notificationService';

const NAMES_KEY = 'mf_ref_names';
const readNames = (): Record<string, string> => { try { return JSON.parse(localStorage.getItem(NAMES_KEY) || '{}'); } catch { return {}; } };
const PLATFORM: Record<string, string> = { android: 'Android', ios: 'iPhone', desktop: 'Computador', otro: 'Otro' };
const num = (n: number) => n.toLocaleString('es-CO');

export default function ReportsPage() {
  const [key, setKey] = useState(adminKey() || '');
  const [data, setData] = useState<StatsReport | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [names, setNames] = useState(readNames);
  const [hover, setHover] = useState<number | null>(null);
  const mine = myRefCode();

  const load = async (k = key) => {
    if (!k.trim()) return;
    setLoading(true); setError('');
    try { setData(await fetchReport(k.trim())); }
    catch (e) { setError((e as Error).message === 'Clave incorrecta' ? 'Clave incorrecta' : 'No hay conexión con el servidor. Inténtalo de nuevo.'); }
    finally { setLoading(false); }
  };
  useEffect(() => { if (adminKey()) load(adminKey()!); }, []);

  // ═══ SECCIÓN: Cálculos del reporte ═══
  const view = useMemo(() => {
    if (!data) return null;
    const days: { day: string; app: number; web: number }[] = [];
    const end = new Date(data.today + 'T12:00:00');
    for (let i = 29; i >= 0; i--) {
      const d = new Date(end); d.setDate(d.getDate() - i);
      const iso = d.toISOString().slice(0, 10);
      const rows = data.daily.filter(r => r.day === iso && r.kind === 'active');
      days.push({ day: iso, app: rows.filter(r => r.mode === 'app').reduce((s, r) => s + r.n, 0), web: rows.filter(r => r.mode === 'web').reduce((s, r) => s + r.n, 0) });
    }
    const total = (d: { app: number; web: number }) => d.app + d.web;
    const today = days[days.length - 1];
    const last7 = days.slice(-7).reduce((s, d) => s + total(d), 0) / 7;
    const max = Math.max(1, ...days.map(total));
    const plat = (kind: string) => Object.entries(PLATFORM).map(([k, label]) => ({ label, n: data.byPlatform.filter(p => p.kind === kind && p.platform === k).reduce((s, p) => s + p.n, 0) })).filter(p => p.n > 0);
    const refs = new Map<string, { opens: number; installs: number }>();
    for (const r of data.byRef) { const cur = refs.get(r.ref) ?? { opens: 0, installs: 0 }; if (r.kind === 'first_open') cur.opens += r.n; else cur.installs += r.n; refs.set(r.ref, cur); }
    const refList = [...refs].map(([ref, v]) => ({ ref, ...v })).sort((a, b) => (b.ref === mine ? 1 : 0) - (a.ref === mine ? 1 : 0) || b.opens - a.opens);
    return { days, today, last7, max, total, platOpens: plat('first_open'), refList };
  }, [data, mine]);

  const rename = (ref: string) => {
    const n = window.prompt('¿De quién es este enlace? (solo se guarda en tu celular)', names[ref] || '');
    if (n === null) return;
    const next = { ...names, [ref]: n.trim().slice(0, 30) };
    setNames(next); try { localStorage.setItem(NAMES_KEY, JSON.stringify(next)); } catch { /* sin almacenamiento */ }
  };

  // ═══ SECCIÓN: Pantalla de clave ═══
  if (!data) return (
    <div className="pb-24">
      <ModuleHeader module="reportes" />
      <div className="theme-dark rounded-[28px] p-6 bg-gradient-to-br from-[#232C5A] via-[#141B3D] to-[#0B1026] ring-1 ring-lime-300/20 text-center">
        <span className="w-16 h-16 mx-auto rounded-3xl bg-brand-lime flex items-center justify-center"><KeyRound size={30} className="text-brand-ink" /></span>
        <p className="text-white text-lg font-extrabold mt-4">Solo para la administradora</p>
        <p className="text-slate-300 text-sm mt-1">Escribe tu clave de administradora para ver cuántas personas usan la app.</p>
        <input value={key} onChange={e => setKey(e.target.value)} onKeyDown={e => e.key === 'Enter' && load()} type="password" autoComplete="off" aria-label="Clave de administradora" placeholder="MF-…"
          className="mt-4 w-full h-12 px-4 rounded-2xl bg-white/[0.07] border border-white/10 text-white outline-none focus:border-brand-lime text-center tracking-wider" />
        {error && <p className="text-rose-300 text-xs mt-2 font-semibold">{error}</p>}
        <button onClick={() => load()} disabled={loading || !key.trim()} className="mt-3 w-full h-12 rounded-2xl bg-brand-lime text-brand-ink font-extrabold disabled:opacity-40">{loading ? 'Revisando…' : 'Ver reportes'}</button>
      </div>
    </div>
  );

  const v = view!;
  const T = data.totals;
  const sel = hover !== null ? v.days[hover] : v.today;
  const kpis = [
    { icon: Users, label: 'Personas que la abrieron', value: T.first_open ?? 0, sub: 'Primera vez en un celular' },
    { icon: Download, label: 'La instalaron', value: T.install ?? 0, sub: 'En la pantalla de inicio' },
    { icon: Smartphone, label: 'Activas hoy', value: v.total(v.today), sub: `Promedio 7 días: ${v.last7.toFixed(1)}` },
    { icon: Home, label: 'Hogares sincronizados', value: data.households, sub: 'Activos en 30 días' },
  ];

  // ═══ SECCIÓN: Reporte ═══
  return (
    <div className="pb-24">
      <ModuleHeader module="reportes" right={<button onClick={() => load()} aria-label="Actualizar" className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-slate-200"><RefreshCw size={17} className={loading ? 'animate-spin' : ''} /></button>} />

      <div className="grid grid-cols-2 gap-2.5">
        {kpis.map((k, i) => (
          <motion.div key={k.label} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
            className={`rounded-[22px] p-4 ${i === 0 ? 'theme-dark bg-gradient-to-br from-[#232C5A] to-[#0B1026] ring-1 ring-lime-300/25' : 'bg-surface border border-white/5'}`}>
            <k.icon size={18} className="text-brand-lime" />
            <p className="text-white text-3xl font-extrabold mt-2 tracking-tight">{num(k.value)}</p>
            <p className="text-white text-[12px] font-semibold leading-tight">{k.label}</p>
            <p className="text-[10px] text-slate-400 mt-0.5">{k.sub}</p>
          </motion.div>
        ))}
      </div>

      {/* Gráfica: personas activas por día (una sola serie) */}
      <div className="mt-4 rounded-[22px] bg-surface border border-white/5 p-4">
        <div className="flex items-baseline justify-between">
          <p className="text-white font-bold text-sm flex items-center gap-1.5"><BarChart3 size={15} className="text-brand-lime" /> Personas activas por día</p>
          <p className="text-[11px] text-slate-400">Últimos 30 días</p>
        </div>
        <p className="text-[12px] text-slate-300 mt-1 h-4">
          {new Date(sel.day + 'T12:00:00').toLocaleDateString('es-CO', { weekday: 'short', day: 'numeric', month: 'short' })}: <strong className="text-white">{v.total(sel)}</strong> {v.total(sel) === 1 ? 'persona' : 'personas'} <span className="text-slate-400">({sel.app} con la app instalada · {sel.web} en el navegador)</span>
        </p>
        <div className="mt-3 h-32 flex items-end gap-[2px]" role="img" aria-label="Gráfica de personas activas por día" onMouseLeave={() => setHover(null)}>
          {v.days.map((d, i) => {
            const h = (v.total(d) / v.max) * 100;
            return (
              <button key={d.day} onMouseEnter={() => setHover(i)} onFocus={() => setHover(i)} onClick={() => setHover(i)} aria-label={`${d.day}: ${v.total(d)} personas`}
                className="flex-1 h-full flex items-end group">
                <motion.span initial={{ height: 0 }} animate={{ height: `${Math.max(h, v.total(d) ? 4 : 1.5)}%` }} transition={{ delay: i * 0.012 }}
                  className={`w-full rounded-t-[4px] ${v.total(d) ? (hover === i || (hover === null && i === v.days.length - 1) ? 'bg-brand-lime' : 'bg-brand-lime/55') : 'bg-white/10'}`} />
              </button>
            );
          })}
        </div>
        <div className="flex justify-between text-[10px] text-slate-500 mt-1.5"><span>hace 30 días</span><span>hoy</span></div>
      </div>

      {/* Enlaces compartidos */}
      <div className="mt-4 rounded-[22px] bg-surface border border-white/5 p-4">
        <p className="text-white font-bold text-sm flex items-center gap-1.5"><Link2 size={15} className="text-brand-lime" /> Llegaron por un enlace compartido</p>
        <p className="text-[11px] text-slate-400 mt-0.5">Cada persona que comparte la app tiene su propio código. El tuyo es <strong className="text-white">{mine}</strong>.</p>
        {v.refList.length === 0 ? <p className="text-sm text-slate-400 mt-3">Aún nadie ha llegado por un enlace compartido.</p> : (
          <ul className="mt-3 divide-y divide-white/5">
            {v.refList.map(r => (
              <li key={r.ref} className="flex items-center gap-3 py-2.5">
                <span className="flex-1 min-w-0">
                  <span className="text-white text-sm font-semibold flex items-center gap-1.5">{r.ref === mine ? 'Tu enlace' : names[r.ref] || `Enlace ${r.ref}`}
                    {r.ref !== mine && <button onClick={() => rename(r.ref)} aria-label="Ponerle nombre" className="text-slate-500"><Pencil size={12} /></button>}</span>
                  <span className="block text-[11px] text-slate-400">{r.opens} {r.opens === 1 ? 'la abrió' : 'la abrieron'} · {r.installs} {r.installs === 1 ? 'la instaló' : 'la instalaron'}</span>
                </span>
                <span className="text-brand-lime font-extrabold">{r.opens}</span>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Plataformas */}
      {v.platOpens.length > 0 && (
        <div className="mt-4 rounded-[22px] bg-surface border border-white/5 p-4">
          <p className="text-white font-bold text-sm mb-3">¿Desde qué celular?</p>
          {v.platOpens.map(p => {
            const pct = Math.round((p.n / Math.max(1, T.first_open ?? 1)) * 100);
            return (
              <div key={p.label} className="mb-2.5">
                <div className="flex justify-between text-[12px]"><span className="text-slate-200">{p.label}</span><span className="text-white font-bold">{p.n} · {pct}%</span></div>
                <div className="h-2 rounded-full bg-white/10 mt-1 overflow-hidden"><motion.div className="h-full rounded-full bg-brand-lime" initial={{ width: 0 }} animate={{ width: `${pct}%` }} /></div>
              </div>
            );
          })}
        </div>
      )}

      <div className="mt-4 rounded-2xl bg-white/[0.03] ring-1 ring-white/10 p-3.5 text-[11px] text-slate-400 leading-relaxed flex gap-2">
        <Info size={14} className="shrink-0 mt-0.5 text-brand-lime" />
        <span>Son sumas anónimas: no sabemos quién es quién. Una persona que borra los datos del navegador o cambia de celular se cuenta como nueva, y quien apaga las estadísticas en Ajustes no se cuenta.</span>
      </div>
      <button onClick={() => { forgetAdmin(); setData(null); setKey(''); notify({ title: 'Saliste de Reportes', type: 'info', log: false }); }}
        className="mt-4 mx-auto flex items-center gap-1.5 text-xs text-slate-400 font-semibold"><LogOut size={13} /> Olvidar la clave en este celular</button>
    </div>
  );
}
