/**
 * ════════════════════════════════════════════════════════════════════
 * 💬 REPORTES → OPINIONES (solo administradora)
 * ────────────────────────────────────────────────────────────────────
 * Qué muestra: promedio de estrellas, cuántas opiniones positivas (4-5),
 *   neutrales (3) y negativas (1-2), en qué parte de la app comentan más,
 *   y la lista de comentarios con filtros. Cada comentario se puede marcar
 *   como Revisado o Resuelto. Botón para descargar todo en Excel.
 * Datos: services/feedbackService.ts (requiere la clave de administradora).
 * ════════════════════════════════════════════════════════════════════
 */
import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { Star, ThumbsUp, ThumbsDown, Minus, Download, Loader2, MessageSquare, Smile, Wrench, CheckCircle2, Eye } from 'lucide-react';
import { listFeedback, markFeedback, areaLabel, type FeedbackItem } from '../../services/feedbackService';
import { downloadXlsx } from '../../utils/xlsx';
import { notify } from '../../services/notificationService';

type Filter = 'todas' | 'positivas' | 'neutrales' | 'negativas' | 'nuevas';
const mood = (r: number) => r >= 4 ? 'positivas' : r === 3 ? 'neutrales' : 'negativas';
const PLATFORM: Record<string, string> = { android: 'Android', ios: 'iPhone', desktop: 'Computador', otro: 'Otro' };
const STATUS = { nuevo: { label: 'Nuevo', cls: 'bg-brand-lime text-brand-ink' }, revisado: { label: 'Revisado', cls: 'bg-sky-400/20 text-sky-200' }, resuelto: { label: 'Resuelto', cls: 'bg-emerald-500/20 text-emerald-300' } };

const Stars = ({ n, size = 14 }: { n: number; size?: number }) => (
  <span className="inline-flex gap-0.5" aria-label={`${n} de 5 estrellas`}>
    {[1, 2, 3, 4, 5].map(i => <Star key={i} size={size} className={i <= n ? 'text-brand-lime' : 'text-white/20'} fill={i <= n ? 'currentColor' : 'none'} />)}
  </span>
);

export default function FeedbackReport({ adminKey }: { adminKey: string }) {
  const [items, setItems] = useState<FeedbackItem[] | null>(null);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState<Filter>('todas');

  const load = () => { setError(''); listFeedback(adminKey).then(setItems).catch(() => setError('No se pudieron cargar las opiniones. Revisa tu conexión.')); };
  useEffect(load, [adminKey]);

  // ═══ SECCIÓN: Consolidado ═══
  const stats = useMemo(() => {
    const list = items ?? [];
    const n = list.length;
    const avg = n ? list.reduce((s, i) => s + i.rating, 0) / n : 0;
    const dist = [5, 4, 3, 2, 1].map(r => ({ r, c: list.filter(i => i.rating === r).length }));
    const pos = list.filter(i => i.rating >= 4).length, neu = list.filter(i => i.rating === 3).length, neg = list.filter(i => i.rating <= 2).length;
    const areas = new Map<string, { c: number; sum: number }>();
    list.forEach(i => { const a = areas.get(i.area) ?? { c: 0, sum: 0 }; a.c++; a.sum += i.rating; areas.set(i.area, a); });
    return { n, avg, dist, pos, neu, neg, nuevos: list.filter(i => i.status === 'nuevo').length, areas: [...areas].sort((a, b) => b[1].c - a[1].c) };
  }, [items]);

  const shown = (items ?? []).filter(i => filter === 'todas' ? true : filter === 'nuevas' ? i.status === 'nuevo' : mood(i.rating) === filter);

  const mark = async (i: FeedbackItem, status: FeedbackItem['status']) => {
    setItems(list => list?.map(x => x.id === i.id ? { ...x, status } : x) ?? null);
    try { await markFeedback(adminKey, i.id, status); } catch { notify({ title: 'No se pudo guardar', type: 'error', log: false }); load(); }
  };

  const exportExcel = () => {
    const list = items ?? [];
    downloadXlsx(`opiniones-mi-finanzas-${new Date().toISOString().slice(0, 10)}`, [
      {
        name: 'Resumen', title: 'Mi Finanzas · Opiniones de los usuarios',
        columns: [{ header: 'Indicador', width: 30 }, { header: 'Valor', type: 'number', width: 14 }],
        rows: [['Opiniones recibidas', stats.n], ['Promedio de estrellas', stats.avg.toFixed(1).replace('.', ',') + ' de 5'], ['Positivas (4-5)', stats.pos], ['Neutrales (3)', stats.neu], ['Negativas (1-2)', stats.neg], ['Sin revisar', stats.nuevos], [],
          ...stats.areas.map(([a, v]) => [`${areaLabel(a)} (opiniones)`, v.c])],
      },
      {
        name: 'Opiniones', title: 'Detalle de opiniones',
        columns: [{ header: 'Fecha', type: 'date', width: 12 }, { header: 'Estrellas', type: 'number', width: 9 }, { header: 'Tipo', width: 11 }, { header: 'Parte de la app', width: 16 }, { header: 'Lo que más le gusta', type: 'longtext', width: 45 }, { header: 'Qué mejoraría', type: 'longtext', width: 45 }, { header: 'Nombre (opcional)', width: 18 }, { header: 'Celular', width: 11 }, { header: 'Versión', width: 9 }, { header: 'Estado', width: 10 }],
        rows: list.map(i => [i.created_at.slice(0, 10), i.rating, mood(i.rating).replace(/s$/, ''), areaLabel(i.area), i.liked, i.improve, i.alias || 'Anónimo', PLATFORM[i.platform] ?? i.platform, i.app_version, STATUS[i.status].label]),
      },
    ]);
  };

  if (error) return <p className="text-center text-rose-300 text-sm py-8">{error}</p>;
  if (!items) return <div className="py-12 flex justify-center"><Loader2 className="animate-spin text-brand-lime" /></div>;
  if (!items.length) return (
    <div className="text-center py-12">
      <span className="w-16 h-16 mx-auto rounded-3xl bg-white/[0.05] ring-1 ring-white/10 flex items-center justify-center"><MessageSquare className="text-slate-400" size={28} /></span>
      <p className="text-white font-semibold mt-3">Aún no hay opiniones</p>
      <p className="text-slate-400 text-sm mt-1 max-w-[17rem] mx-auto">La app se las pide a las personas después de unos días de uso. También pueden enviarlas desde el menú → "Danos tu opinión".</p>
    </div>
  );

  return (
    <div>
      {/* Promedio + reparto */}
      <div className="theme-dark rounded-[24px] p-5 bg-gradient-to-br from-[#232C5A] via-[#141B3D] to-[#0B1026] ring-1 ring-lime-300/25 flex gap-5 items-center">
        <div className="text-center">
          <p className="text-white text-5xl font-extrabold tracking-tight">{stats.avg.toFixed(1)}</p>
          <Stars n={Math.round(stats.avg)} />
          <p className="text-[11px] text-slate-300 mt-1">{stats.n} {stats.n === 1 ? 'opinión' : 'opiniones'}</p>
        </div>
        <div className="flex-1 space-y-1">
          {stats.dist.map(d => (
            <div key={d.r} className="flex items-center gap-2 text-[11px] text-slate-300">
              <span className="w-3">{d.r}</span>
              <div className="flex-1 h-2 rounded-full bg-white/10 overflow-hidden"><motion.div className="h-full rounded-full bg-brand-lime" initial={{ width: 0 }} animate={{ width: `${stats.n ? (d.c / stats.n) * 100 : 0}%` }} /></div>
              <span className="w-5 text-right">{d.c}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2 mt-3">
        {[{ k: 'positivas', icon: ThumbsUp, n: stats.pos, label: 'Positivas', cls: 'text-emerald-300' }, { k: 'neutrales', icon: Minus, n: stats.neu, label: 'Neutrales', cls: 'text-slate-200' }, { k: 'negativas', icon: ThumbsDown, n: stats.neg, label: 'Negativas', cls: 'text-rose-300' }].map(c => (
          <button key={c.k} onClick={() => setFilter(filter === c.k ? 'todas' : c.k as Filter)} className={`rounded-2xl p-3 text-left border ${filter === c.k ? 'border-brand-lime/60 bg-brand-lime/10' : 'border-white/5 bg-surface'}`}>
            <c.icon size={16} className={c.cls} />
            <p className="text-white text-2xl font-extrabold mt-1">{c.n}</p>
            <p className="text-[11px] text-slate-400">{c.label}</p>
          </button>
        ))}
      </div>

      {stats.areas.length > 0 && (
        <div className="mt-3 rounded-2xl bg-surface border border-white/5 p-4">
          <p className="text-white text-sm font-bold mb-2">¿Sobre qué parte opinan?</p>
          {stats.areas.map(([a, v]) => (
            <div key={a} className="flex items-center justify-between py-1 text-[13px]">
              <span className="text-slate-200">{areaLabel(a)}</span>
              <span className="flex items-center gap-2 text-slate-400">{v.c} · <Stars n={Math.round(v.sum / v.c)} size={11} /></span>
            </div>
          ))}
        </div>
      )}

      {/* Filtros + Excel */}
      <div className="flex items-center gap-1.5 mt-4 overflow-x-auto pb-1">
        {(['todas', 'nuevas', 'positivas', 'neutrales', 'negativas'] as Filter[]).map(f => (
          <button key={f} onClick={() => setFilter(f)} className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-bold capitalize ${filter === f ? 'bg-brand-lime text-brand-ink' : 'bg-white/[0.06] text-slate-300 ring-1 ring-white/10'}`}>
            {f}{f === 'nuevas' && stats.nuevos ? ` · ${stats.nuevos}` : ''}
          </button>
        ))}
        <button onClick={exportExcel} className="ml-auto shrink-0 px-3 py-1.5 rounded-full text-xs font-bold bg-white/[0.06] text-brand-lime ring-1 ring-brand-lime/30 flex items-center gap-1"><Download size={13} /> Excel</button>
      </div>

      {/* Lista de comentarios */}
      <ul className="mt-3 space-y-2.5">
        {shown.map((i, n) => (
          <motion.li key={i.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: Math.min(n, 10) * 0.03 }} className="rounded-2xl bg-surface border border-white/5 p-4">
            <div className="flex items-center justify-between gap-2">
              <span className="flex items-center gap-2 min-w-0">
                <span className="w-8 h-8 shrink-0 rounded-xl bg-white/[0.07] flex items-center justify-center text-white text-xs font-extrabold">{(i.alias || '?').slice(0, 1).toUpperCase()}</span>
                <span className="min-w-0"><span className="block text-white text-sm font-bold truncate">{i.alias || 'Anónimo'}</span>
                  <span className="block text-[10px] text-slate-400">{new Date(i.created_at).toLocaleDateString('es-CO', { day: 'numeric', month: 'short', year: 'numeric' })} · {areaLabel(i.area)} · {PLATFORM[i.platform] ?? i.platform}</span></span>
              </span>
              <span className={`shrink-0 text-[10px] font-bold px-2 py-0.5 rounded-full ${STATUS[i.status].cls}`}>{STATUS[i.status].label}</span>
            </div>
            <div className="mt-2"><Stars n={i.rating} /></div>
            {i.liked && <p className="mt-2 text-[13px] text-slate-200 flex gap-2"><Smile size={15} className="text-emerald-300 shrink-0 mt-0.5" /><span><span className="text-slate-400">Le gusta: </span>{i.liked}</span></p>}
            {i.improve && <p className="mt-1.5 text-[13px] text-slate-200 flex gap-2"><Wrench size={15} className="text-amber-300 shrink-0 mt-0.5" /><span><span className="text-slate-400">Mejoraría: </span>{i.improve}</span></p>}
            {!i.liked && !i.improve && <p className="mt-2 text-[12px] text-slate-500">Solo dejó su calificación.</p>}
            <div className="flex gap-2 mt-3">
              {i.status !== 'revisado' && <button onClick={() => mark(i, 'revisado')} className="px-3 py-1.5 rounded-xl bg-white/[0.06] ring-1 ring-white/10 text-[11px] font-bold text-slate-200 flex items-center gap-1"><Eye size={12} /> Revisado</button>}
              {i.status !== 'resuelto' && <button onClick={() => mark(i, 'resuelto')} className="px-3 py-1.5 rounded-xl bg-emerald-500/15 ring-1 ring-emerald-400/30 text-[11px] font-bold text-emerald-300 flex items-center gap-1"><CheckCircle2 size={12} /> Resuelto</button>}
              {i.status !== 'nuevo' && <button onClick={() => mark(i, 'nuevo')} className="px-3 py-1.5 rounded-xl text-[11px] font-bold text-slate-400">Volver a nuevo</button>}
            </div>
          </motion.li>
        ))}
        {!shown.length && <p className="text-center text-sm text-slate-400 py-6">No hay opiniones con este filtro.</p>}
      </ul>
    </div>
  );
}
