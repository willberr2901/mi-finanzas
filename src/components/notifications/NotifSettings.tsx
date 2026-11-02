/**
 * ════════════════════════════════════════════════════════════════════
 * ⚙️ ¿QUÉ TE AVISAMOS? (pantalla de ajustes de notificaciones)
 * ────────────────────────────────────────────────────────────────────
 * Cada aviso con su interruptor y su hora, horas de silencio y cómo registrar
 * movimientos desde el mensaje del banco (Compartir → Mi Finanzas).
 * Se abre desde la campana y desde Ajustes → Recordatorios.
 * Nota honesta: en el celular la hora es aproximada; el sistema decide el
 * momento exacto en que revisa (Chrome Android con la app instalada).
 * ════════════════════════════════════════════════════════════════════
 */
import { useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { motion } from 'framer-motion';
import { X } from 'lucide-react';
import { useNotifPrefs, getDaily, setDaily, type NotifPrefs } from '../../services/notifPrefs';
import { enableReminders, sendTestNotification, remindersSupported } from '../../services/alertsService';
import { haptic } from '../../utils/haptics';

function Switch({ on, onChange, label }: { on: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <button role="switch" aria-checked={on} aria-label={label} onClick={() => { onChange(!on); haptic('light'); }}
      className={`relative w-11 h-[26px] rounded-full shrink-0 transition-colors ${on ? 'bg-brand-lime' : 'bg-white/15'}`}>
      <motion.span layout transition={{ type: 'spring', damping: 22, stiffness: 400 }} className={`absolute top-[3px] w-5 h-5 rounded-full ${on ? 'right-[3px] bg-brand-ink' : 'left-[3px] bg-slate-300'}`} />
    </button>
  );
}

function Row({ emoji, title, desc, on, onToggle, time, onTime }: { emoji: string; title: string; desc: ReactNode; on: boolean; onToggle: (v: boolean) => void; time?: string; onTime?: (t: string) => void }) {
  return (
    <div className="flex items-center gap-3 py-3 border-b border-white/[0.06] last:border-0">
      <span className="text-xl w-7 text-center" aria-hidden="true">{emoji}</span>
      <div className="flex-1 min-w-0"><p className="text-white text-[14px] font-bold">{title}</p><p className="text-[11.5px] text-slate-400 leading-snug">{desc}</p></div>
      {time !== undefined && onTime && <input type="time" value={time} disabled={!on} onChange={e => onTime(e.target.value)} aria-label={`Hora de ${title}`}
        className="w-[78px] rounded-lg bg-white/[0.07] ring-1 ring-white/10 px-1.5 py-1 text-[12px] font-extrabold text-brand-lime disabled:opacity-40 [color-scheme:dark]" />}
      <Switch on={on} onChange={onToggle} label={title} />
    </div>
  );
}

export default function NotifSettings({ onClose }: { onClose: () => void }) {
  const [p, set] = useNotifPrefs();
  const [daily, setD] = useState(getDaily());
  const [perm, setPerm] = useState<NotificationPermission | 'none'>(remindersSupported() ? Notification.permission : 'none');
  const upd = <K extends keyof NotifPrefs>(k: K, patch: Partial<NotifPrefs[K]>) => set({ [k]: { ...p[k], ...patch } } as Partial<NotifPrefs>);
  const updDaily = (r: Partial<typeof daily>) => { const n = { ...daily, ...r }; setD(n); setDaily(n); };

  return createPortal(
    <motion.div className="theme-dark fixed inset-0 z-[180] bg-black/70 backdrop-blur-sm flex items-end sm:items-center justify-center" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose}>
      <motion.div role="dialog" aria-modal="true" aria-labelledby="notif-set-title" onClick={e => e.stopPropagation()}
        className="w-full max-w-md max-h-[92vh] overflow-y-auto rounded-t-[30px] sm:rounded-[30px] bg-[#121938] ring-1 ring-white/10 px-5 pt-5 pb-[max(20px,env(safe-area-inset-bottom))] text-white"
        initial={{ y: 60 }} animate={{ y: 0 }} exit={{ y: 60 }} transition={{ type: 'spring', damping: 26, stiffness: 260 }}>
        <div className="flex items-start justify-between">
          <div><h2 id="notif-set-title" className="text-[21px] font-extrabold">¿Qué te avisamos?</h2><p className="text-[12px] text-slate-400">Tú eliges qué y a qué hora.</p></div>
          <button onClick={onClose} aria-label="Cerrar" className="w-9 h-9 rounded-xl bg-white/[0.07] flex items-center justify-center"><X size={18} /></button>
        </div>

        {perm !== 'granted' && (
          <div className="mt-3 rounded-2xl bg-violet-500/10 ring-1 ring-violet-400/30 p-3.5">
            <p className="text-[13px] font-bold">Activa los avisos en el celular</p>
            <p className="text-[11.5px] text-slate-300 mt-0.5">{perm === 'denied' ? 'Están bloqueados: actívalos en Ajustes del celular → Apps → Chrome → Notificaciones.' : 'Sin permiso solo los verás dentro de la app (en la campana).'}</p>
            {perm === 'default' && <button onClick={async () => setPerm(await enableReminders())} className="mt-2.5 w-full py-2.5 rounded-xl bg-brand-lime text-brand-ink text-sm font-extrabold">Activar avisos</button>}
          </div>
        )}

        <div className="mt-2">
          <Row emoji="💚" title="Día de pago" desc="Registrar tu sueldo con un toque (sale del plan de Kai)" on={p.payday.on} onToggle={v => upd('payday', { on: v })} time={p.payday.time} onTime={t => upd('payday', { time: t })} />
          <Row emoji="📅" title="Pagos y cuotas" desc={<>2 días antes y el mismo día · botón <b className="text-white">Ya lo pagué</b></>} on={p.bills.on} onToggle={v => upd('bills', { on: v })} time={p.bills.time} onTime={t => upd('bills', { time: t })} />
          <Row emoji="🕗" title="¿Gastaste algo hoy?" desc="Solo si ese día no anotaste nada" on={daily.enabled} onToggle={v => updDaily({ enabled: v })} time={daily.time} onTime={t => updDaily({ time: t })} />
          <Row emoji="🎯" title="Presupuestos" desc="Al llegar al 80% y al 100%" on={p.budget.on} onToggle={v => upd('budget', { on: v })} />
          <Row emoji="📊" title="Resumen semanal" desc="Domingos: cuánto gastaste vs. la semana anterior" on={p.weekly.on} onToggle={v => upd('weekly', { on: v })} time={p.weekly.time} onTime={t => upd('weekly', { time: t })} />
          <Row emoji="🤖" title="Consejos de Kai" desc="Deuda terminada, meta cerca y ánimo" on={p.kai.on} onToggle={v => upd('kai', { on: v })} />
          <Row emoji="🔕" title="Horas de silencio" desc="Nada entre 10 p. m. y 7 a. m." on={p.quiet.on} onToggle={v => upd('quiet', { on: v })} />
        </div>

        <div className="mt-3 rounded-2xl bg-[#141B3A] ring-1 ring-brand-lime/30 p-3.5">
          <p className="text-[13.5px] font-bold">📩 Desde el mensaje del banco</p>
          <p className="text-[12px] text-slate-300 mt-1 leading-relaxed">En el SMS o la notificación del banco toca <b className="text-white">Compartir → Mi Finanzas</b>. Kai lee “Compra por $45.000 en D1” y lo deja listo para guardar. <span className="text-slate-400">(Con la app instalada en Android.)</span></p>
        </div>
        <p className="text-[10.5px] text-slate-500 mt-3 leading-relaxed">La hora es aproximada: el celular decide el momento exacto en que revisa. Todo se calcula dentro de tu celular; nada sale de él.</p>
        {perm === 'granted' && <button onClick={() => sendTestNotification()} className="mt-2 text-xs text-brand-lime font-bold">Enviar una notificación de prueba</button>}
      </motion.div>
    </motion.div>,
    document.body,
  );
}
