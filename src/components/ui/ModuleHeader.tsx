/**
 * ════════════════════════════════════════════════════════════════════
 * 🔝 ENCABEZADO DE CADA MÓDULO
 * ────────────────────────────────────────────────────────────────────
 * Qué hace: Menú ☰, ícono del módulo, nombre, botón Guíame, botón extra (ej. Hogar) y campana.
 * Dónde se ve: Arriba de cada pantalla.
 * Si lo cambias: Cambia el encabezado de TODAS las pantallas.
 * ════════════════════════════════════════════════════════════════════
 */
import { createContext, useContext, type ReactNode } from 'react';
import { motion } from 'framer-motion';
import { Menu, Sparkles } from 'lucide-react';
import { MODULES } from '../../utils/modules';
import { useTour } from '../tour/Tour';
import NotificationBell from '../notifications/NotificationBell';

export const AppMenuContext = createContext<{ openMenu: () => void }>({ openMenu: () => {} });

/** Encabezado de cada módulo: menú, ícono propio animado, nombre, ayuda y notificaciones. */
export default function ModuleHeader({ module, title, subtitle, right }: { module: keyof typeof MODULES; title?: string; subtitle?: string; right?: ReactNode }) {
  const m = MODULES[module];
  const Icon = m.icon;
  const { openMenu } = useContext(AppMenuContext);
  const { start } = useTour();

  return (
    <div className="flex items-center gap-3 mb-5">
      <button data-tour="menu" onClick={openMenu} aria-label="Abrir menú" className="w-10 h-10 shrink-0 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-slate-200 active:scale-95 transition-transform">
        <Menu size={20} />
      </button>
      <motion.div
        initial={{ scale: 0.5, rotate: -15, opacity: 0 }} animate={{ scale: 1, rotate: 0, opacity: 1 }} transition={{ type: 'spring', damping: 12, stiffness: 220 }}
        className={`w-11 h-11 shrink-0 rounded-2xl bg-gradient-to-br ${m.gradient} flex items-center justify-center shadow-lg ${m.glow}`}>
        <motion.span animate={{ y: [0, -2, 0] }} transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }} className="flex">
          <Icon size={22} className="text-brand-lime" strokeWidth={2.2} />
        </motion.span>
      </motion.div>
      <motion.div className="flex-1 min-w-0" initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.08 }}>
        <div className="flex items-center gap-1.5">
          <h1 className="text-xl font-bold text-white truncate">{title ?? m.label}</h1>
          <button onClick={() => start()} aria-label={`Guíame en ${m.label}`} title="Guíame"
            className="shrink-0 flex items-center gap-1 text-[10px] font-bold text-violet-200 bg-violet-500/15 border border-violet-400/30 rounded-full px-2 py-0.5 active:scale-95">
            <Sparkles size={11} />{!right && ' Guíame'}
          </button>
        </div>
        <p className="text-xs text-slate-400 truncate">{subtitle ?? m.tagline}</p>
      </motion.div>
      {right}
      <NotificationBell />
    </div>
  );
}
