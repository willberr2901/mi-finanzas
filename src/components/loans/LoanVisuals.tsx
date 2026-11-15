/**
 * ════════════════════════════════════════════════════════════════════
 * 🎨 PRÉSTAMOS v2 · piezas visuales
 * ────────────────────────────────────────────────────────────────────
 * Colores fijos para que se entienda de un vistazo:
 *   🟢 VERDE  = abono (la deuda baja)
 *   🔴 ROJO   = le presté / me prestó más (la deuda sube)
 *   🟣 MORADO = préstamo inicial
 * Aquí viven: anillo de % pagado, gráfica de cómo subió y bajó la deuda,
 * línea de tiempo del historial y la imagen "Estado de cuenta" para WhatsApp.
 * ════════════════════════════════════════════════════════════════════
 */
import { motion } from 'framer-motion';
import { formatCOP } from '../../utils/format';
import { loanHistory, totalOf, paidOf, leftOf, type Loan, type LoanEvent, type LoanEventKind } from '../../services/loansService';

export const GREEN = '#22C55E';
export const RED = '#F43F5E';
export const PURPLE = '#6366F1';
export const colorOf = (k: LoanEventKind) => (k === 'abono' ? GREEN : k === 'mas' ? RED : PURPLE);

export const fmtDay = (d: string, year = false) => new Date(`${d}T12:00:00`).toLocaleDateString('es-CO', { day: 'numeric', month: 'short', ...(year ? { year: 'numeric' } : {}) });
export const fmtHour = (at?: number) => (at ? new Date(at).toLocaleTimeString('es-CO', { hour: 'numeric', minute: '2-digit' }) : '');

/** Anillo de cuánto se ha pagado. */
export function PaidRing({ pct, size = 64, color = GREEN, children }: { pct: number; size?: number; color?: string; children?: React.ReactNode }) {
  const r = size / 2 - 6, c = 2 * Math.PI * r;
  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90" aria-hidden="true">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgba(255,255,255,.10)" strokeWidth="7" />
        <motion.circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth="7" strokeLinecap="round" strokeDasharray={c}
          initial={{ strokeDashoffset: c }} animate={{ strokeDashoffset: c * (1 - pct / 100) }} transition={{ duration: 0.8, ease: 'easeOut' }} />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">{children}</div>
    </div>
  );
}

/** Gráfica: cómo subió (rojo) y bajó (verde) la deuda. */
export function BalanceChart({ events }: { events: LoanEvent[] }) {
  const ev = events.slice(-10);
  if (ev.length < 2) return null;
  const W = 320, H = 96, pad = 14;
  const max = Math.max(...ev.map(e => e.after), 1);
  const x = (i: number) => pad + (i * (W - pad * 2)) / (ev.length - 1);
  const y = (v: number) => H - 14 - (v / max) * (H - 30);
  return (
    <svg viewBox={`0 0 ${W} ${H + 14}`} className="w-full" role="img" aria-label="Gráfica de cómo ha cambiado la deuda">
      {ev.slice(1).map((e, i) => (
        <motion.line key={e.id} x1={x(i)} y1={y(ev[i].after)} x2={x(i + 1)} y2={y(e.after)} stroke={colorOf(e.kind)} strokeWidth="4" strokeLinecap="round"
          initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ delay: 0.15 * i, duration: 0.35 }} />
      ))}
      {ev.map((e, i) => <circle key={e.id} cx={x(i)} cy={y(e.after)} r="5.5" fill={i === 0 ? '#fff' : colorOf(e.kind)} stroke="#0B1026" strokeWidth="2" />)}
      {ev.map((e, i) => (i === 0 || i === ev.length - 1 || ev.length <= 5) && (
        <text key={`t${e.id}`} x={x(i)} y={H + 10} textAnchor={i === 0 ? 'start' : i === ev.length - 1 ? 'end' : 'middle'} fontSize="10" fontWeight="700" fill="#94A3C8">{fmtDay(e.date)}</text>
      ))}
    </svg>
  );
}

const TITLE: Record<LoanEventKind, [string, string]> = { abono: ['Abonó', 'Abonaste'], mas: ['Le prestaste más', 'Te prestó más'], inicio: ['Préstamo inicial', 'Préstamo inicial'] };
const ICON: Record<LoanEventKind, string> = { abono: '↓', mas: '↑', inicio: '★' };

/** Línea de tiempo, del más nuevo al más viejo, agrupada por mes. */
export function Timeline({ events, meDeben }: { events: LoanEvent[]; meDeben: boolean }) {
  const list = events.slice().reverse();
  let month = '';
  return (
    <div>
      {list.map((e, i) => {
        const m = new Date(`${e.date}T12:00:00`).toLocaleDateString('es-CO', { month: 'long', year: 'numeric' }).toUpperCase();
        const head = m !== month ? (month = m) : null;
        const col = colorOf(e.kind);
        return (
          <div key={e.id}>
            {head && <p className="text-[11px] font-extrabold tracking-[1.5px] text-slate-400 mt-3 mb-2">{head}</p>}
            <motion.div initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.04 * i }} className="relative flex gap-3 pb-3">
              {i < list.length - 1 && <span className="absolute left-[15px] top-8 -bottom-1 w-0.5 bg-white/10" aria-hidden="true" />}
              <span className="w-8 h-8 rounded-full flex items-center justify-center text-[15px] font-black text-[#fff] shrink-0" style={{ background: col, boxShadow: `0 0 0 4px ${col}33` }} aria-hidden="true">{ICON[e.kind]}</span>
              <div className="flex-1 min-w-0 rounded-2xl px-3 py-2" style={{ background: `${col}17`, border: `1px solid ${col}55` }}>
                <div className="flex justify-between gap-2">
                  <span className="text-[13.5px] font-extrabold text-white">{TITLE[e.kind][meDeben ? 0 : 1]}</span>
                  <span className="text-[14px] font-extrabold" style={{ color: col }}>{e.kind === 'abono' ? '−' : '+'}{formatCOP(e.amount)}</span>
                </div>
                <div className="flex justify-between gap-2 text-[11px] text-slate-400 mt-0.5">
                  <span className="truncate">{fmtDay(e.date)}{e.at ? ` · ${fmtHour(e.at)}` : ''}{e.note ? ` · ${e.note}` : ''}</span>
                  <span className="shrink-0">quedó <b className="text-white">{formatCOP(e.after)}</b></span>
                </div>
              </div>
            </motion.div>
          </div>
        );
      })}
    </div>
  );
}

// ═══ Imagen "Estado de cuenta" (se dibuja en el celular, no sale a ningún servidor) ═══
export async function statementImage(l: Loan): Promise<Blob | null> {
  const ev = loanHistory(l).slice().reverse();
  const W = 1080, rowH = 112, top = 470, H = top + ev.length * rowH + 150;
  const cv = document.createElement('canvas'); cv.width = W; cv.height = H;
  const g = cv.getContext('2d'); if (!g) return null;
  const font = (w: number, s: number) => `${w} ${s}px Inter, system-ui, sans-serif`;
  const rr = (x: number, y: number, w: number, h: number, r: number, fill: string) => { g.beginPath(); g.roundRect(x, y, w, h, r); g.fillStyle = fill; g.fill(); };
  g.fillStyle = '#0B1026'; g.fillRect(0, 0, W, H);
  rr(40, 40, W - 80, H - 80, 48, '#FFFFFF');
  g.fillStyle = '#64748B'; g.font = font(800, 30); g.fillText('ESTADO DE CUENTA', 90, 120);
  g.fillStyle = '#0B1026'; g.font = font(800, 52); g.fillText(`${l.reason || 'Préstamo'} · ${l.person}`.slice(0, 32), 90, 185);
  g.fillStyle = '#64748B'; g.font = font(600, 28); g.fillText(`Generado el ${new Date().toLocaleDateString('es-CO', { day: 'numeric', month: 'short', year: 'numeric' })} · ${fmtHour(Date.now())}`, 90, 232);
  const boxes: [string, number, string, string, string][] = [['PRESTADO', totalOf(l), '#F1F5F9', '#64748B', '#0B1026'], ['ABONADO', paidOf(l), '#DCFCE7', '#15803D', '#15803D'], [l.dir === 'meDeben' ? 'TE DEBE' : 'DEBES', leftOf(l), '#0B1026', '#C6F432', '#FFFFFF']];
  boxes.forEach(([t, v, bg, tc, vc], i) => { const bx = 90 + i * 310; rr(bx, 280, 290, 140, 28, bg); g.fillStyle = tc; g.font = font(800, 26); g.fillText(t, bx + 26, 330); g.fillStyle = vc; g.font = font(800, 42); g.fillText(formatCOP(v), bx + 26, 390); });
  ev.forEach((e, i) => {
    const y = top + i * rowH, col = e.kind === 'abono' ? '#15803D' : e.kind === 'mas' ? '#E11D48' : '#4F46E5';
    g.fillStyle = col; g.font = font(800, 34); g.fillText(`${ICON[e.kind]}  ${e.kind === 'abono' ? 'Abono' : e.kind === 'mas' ? 'Préstamo adicional' : 'Préstamo inicial'}`, 90, y + 50);
    g.textAlign = 'right'; g.fillText(`${e.kind === 'abono' ? '−' : '+'}${formatCOP(e.amount)}`, W - 90, y + 50);
    g.fillStyle = '#64748B'; g.font = font(600, 26); g.fillText(`quedó ${formatCOP(e.after)}`, W - 90, y + 88);
    g.textAlign = 'left'; g.fillText(`${fmtDay(e.date, true)}${e.at ? ' · ' + fmtHour(e.at) : ''}${e.note ? ' · ' + e.note : ''}`.slice(0, 48), 90, y + 88);
    g.strokeStyle = '#CBD5E1'; g.setLineDash([8, 8]); g.beginPath(); g.moveTo(90, y + rowH - 4); g.lineTo(W - 90, y + rowH - 4); g.stroke(); g.setLineDash([]);
  });
  g.fillStyle = '#64748B'; g.font = font(600, 26); g.textAlign = 'center'; g.fillText('Hecho con Mi Finanzas · cuentas claras, amistades largas 💚', W / 2, H - 80);
  return new Promise(res => cv.toBlob(b => res(b), 'image/png'));
}
