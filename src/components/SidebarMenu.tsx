/**
 * ════════════════════════════════════════════════════════════════════
 * ☰ MENÚ LATERAL
 * ────────────────────────────────────────────────────────────────────
 * Qué hace: Lista de módulos, recomendar la app y bloquear.
 * Dónde se ve: Botón ☰ arriba a la izquierda en cada módulo.
 * Si lo cambias: Cambia la navegación de toda la app. Los módulos salen de utils/modules.ts.
 * ════════════════════════════════════════════════════════════════════
 */
import { motion, AnimatePresence } from 'framer-motion';
import { X, Lock, Heart, ChevronRight, Download, ShieldCheck } from 'lucide-react';
import { openInstall, canOfferInstall } from './pwa/InstallAppSheet';
import { openSecurityCenter } from './security/SecurityCenter';
import { InstagramIcon, openInstagram, INSTAGRAM_USER } from './social/Instagram';
import { adminKey } from '../services/statsService';
import { openShareApp } from './share/ShareAppSheet';
import { useNavigate, useLocation } from 'react-router-dom';
import { MODULES } from '../utils/modules';
import { APP_VERSION } from '../version';
import AppLogo from './ui/AppLogo';

const GROUPS: { title: string; items: (keyof typeof MODULES)[] }[] = [
  { title: 'Principal', items: ['inicio', 'mercado', 'finanzas', 'pagos'] },
  { title: 'Herramientas', items: ['escaner', 'facturas'] },
  { title: 'Cuenta', items: ['ajustes', 'legal'] },
];
// Reportes solo aparece en el celular de la administradora (cuando ya puso su clave).
const groups = () => adminKey() ? [...GROUPS.slice(0, 2), { title: 'Administración', items: ['reportes'] as (keyof typeof MODULES)[] }, GROUPS[2]] : GROUPS;

/** Menú hamburguesa: se desliza desde la izquierda con todos los módulos. */
export default function SidebarMenu({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const name = localStorage.getItem('miFinanzasUserName');

  const go = (path: string) => { navigate(path); onClose(); };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div className="fixed inset-0 z-[110] bg-black/60 backdrop-blur-sm" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} />
          <motion.nav aria-label="Menú principal"
            className="fixed top-0 left-0 bottom-0 z-[111] w-[82%] max-w-xs bg-surface2 border-r border-white/10 flex flex-col"
            initial={{ x: '-100%' }} animate={{ x: 0 }} exit={{ x: '-100%' }} transition={{ type: 'spring', damping: 26, stiffness: 260 }}>
            <div className="p-5 pb-4 border-b border-white/5">
              <div className="flex items-start justify-between">
                <AppLogo size={48} />
                <button onClick={onClose} aria-label="Cerrar menú" className="p-2 -mr-2 text-slate-400 hover:text-white"><X size={20} /></button>
              </div>
              <p className="text-white font-bold text-lg mt-3">Mi Finanzas</p>
              <p className="text-slate-400 text-sm">{name ? `Hola, ${name}` : 'Tu hogar en orden'}</p>
            </div>

            <div className="flex-1 overflow-y-auto p-3 space-y-4">
              {groups().map((g, gi) => (
                <div key={g.title}>
                  <p className="px-3 text-[10px] uppercase tracking-widest text-slate-500 font-bold mb-1">{g.title}</p>
                  {g.items.map((k, i) => {
                    const m = MODULES[k]; const Icon = m.icon; const active = pathname === m.path;
                    return (
                      <motion.button key={k} onClick={() => go(m.path)}
                        initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.05 + (gi * 4 + i) * 0.035 }}
                        className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-2xl text-left transition-colors ${active ? 'bg-white/10' : 'hover:bg-white/5'}`}>
                        <span className={`w-9 h-9 rounded-xl bg-gradient-to-br ${m.gradient} flex items-center justify-center shadow-md ${m.glow}`}><Icon size={18} className="text-brand-lime" /></span>
                        <span className="flex-1 min-w-0">
                          <span className={`block text-sm font-semibold ${active ? m.accent : 'text-white'}`}>{m.label}</span>
                          <span className="block text-[11px] text-slate-400 truncate">{m.tagline}</span>
                        </span>
                      </motion.button>
                    );
                  })}
                </div>
              ))}
              <div className="pt-1 space-y-2">
              {canOfferInstall() && (
                <motion.button onClick={() => { onClose(); setTimeout(openInstall, 180); }}
                  initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
                  className="theme-dark w-full flex items-center gap-3 p-3 rounded-2xl bg-gradient-to-r from-[#232C5A] to-[#0B1026] ring-1 ring-brand-lime/40 text-left active:scale-[0.98] transition-transform">
                  <span className="w-9 h-9 rounded-xl bg-brand-lime flex items-center justify-center"><Download size={18} className="text-brand-ink" /></span>
                  <span className="flex-1 min-w-0">
                    <span className="block text-sm font-bold text-white">Descargar la app</span>
                    <span className="block text-[11px] text-slate-300">Instálala en tu celular en segundos</span>
                  </span>
                  <ChevronRight size={16} className="text-slate-400" />
                </motion.button>
              )}
              <div className="grid grid-cols-2 gap-2">
                <button onClick={() => { onClose(); openInstagram(); }} className="flex items-center gap-2 p-2.5 rounded-2xl bg-white/[0.05] ring-1 ring-white/10 text-left active:scale-[0.98]">
                  <InstagramIcon size={30} />
                  <span className="min-w-0"><span className="block text-[12px] font-bold text-white">Síguenos</span><span className="block text-[10px] text-slate-400 truncate">@{INSTAGRAM_USER}</span></span>
                </button>
                <button onClick={() => { onClose(); setTimeout(openSecurityCenter, 180); }} className="flex items-center gap-2 p-2.5 rounded-2xl bg-white/[0.05] ring-1 ring-white/10 text-left active:scale-[0.98]">
                  <span className="w-[30px] h-[30px] rounded-[9px] bg-white/10 flex items-center justify-center"><ShieldCheck size={17} className="text-brand-lime" /></span>
                  <span className="min-w-0"><span className="block text-[12px] font-bold text-white">Seguridad</span><span className="block text-[10px] text-slate-400 truncate">Cómo te protege</span></span>
                </button>
              </div>
              <motion.button onClick={() => { onClose(); setTimeout(openShareApp, 180); }}
                initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}
                className="w-full flex items-center gap-3 p-3 rounded-2xl bg-gradient-to-r from-brand-lime/15 to-transparent ring-1 ring-brand-lime/25 text-left active:scale-[0.98] transition-transform">
                <span className="w-9 h-9 rounded-xl bg-brand-lime flex items-center justify-center"><Heart size={18} className="text-brand-ink" fill="currentColor" /></span>
                <span className="flex-1 min-w-0">
                  <span className="block text-sm font-bold text-white">Recomienda la app</span>
                  <span className="block text-[11px] text-slate-400">Compártela por WhatsApp o QR</span>
                </span>
                <ChevronRight size={16} className="text-slate-400" />
              </motion.button>
            </div>
            </div>

            <div className="p-4 border-t border-white/5 text-[11px] text-slate-500 flex items-center gap-2">
              <Lock size={12} className="text-emerald-400" /> Tus finanzas viven solo en tu celular · v{APP_VERSION}
            </div>
          </motion.nav>
        </>
      )}
    </AnimatePresence>
  );
}
