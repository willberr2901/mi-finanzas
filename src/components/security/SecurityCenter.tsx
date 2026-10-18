/**
 * ════════════════════════════════════════════════════════════════════
 * 🛡️ PANTALLA "TU PRIVACIDAD Y TU SEGURIDAD"
 * ────────────────────────────────────────────────────────────────────
 * Qué hace: antes de entrar (una vez), explica que no guardamos datos y
 *           cómo la app se protege de los ataques más comunes. Revisa en vivo
 *           la conexión, la dirección oficial, el cifrado y el PIN.
 * Dónde se ve: al entrar por primera vez (y una vez tras la v1.8),
 *              Menú ☰ → "Centro de seguridad" y Ajustes → Seguridad.
 * Si cambias los textos: que sigan siendo verdad (ver docs/SEGURIDAD.md).
 * Montado en App.tsx. Se abre con openSecurityCenter().
 * ════════════════════════════════════════════════════════════════════
 */
import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ShieldCheck, Lock, UserX, Smartphone, KeyRound, Globe, Code2, FileWarning, Frame, Link2Off, BarChart3, Check, AlertTriangle, ChevronDown } from 'lucide-react';
import { securityStatus, OFFICIAL_HOSTS } from '../../utils/hardening';
import { statsEnabled, setStatsEnabled } from '../../services/statsService';
import { useSecurity } from '../../contexts/SecurityContext';
import { useNavigate } from 'react-router-dom';

export const INTRO_KEY = 'mf_security_intro_v1';
export const securityIntroSeen = () => { try { return localStorage.getItem(INTRO_KEY) === '1'; } catch { return true; } };
export const openSecurityCenter = () => window.dispatchEvent(new Event('mf:open-security'));

// ═══ SECCIÓN: De qué te protege (lista en lenguaje sencillo) ═══
const PROTECTIONS = [
  { icon: Code2, t: 'Código inyectado (XSS)', d: 'La app solo acepta código propio. Si alguien intenta meter un programa en un texto o enlace, el navegador lo bloquea.' },
  { icon: Globe, t: 'Páginas falsas o clonadas', d: `Si abres una copia desde otra dirección, la app te avisa en rojo. La oficial es ${OFFICIAL_HOSTS[0]}.` },
  { icon: Frame, t: 'Marcos invisibles (clickjacking)', d: 'Nadie puede meter la app dentro de otra página para engañarte y que toques botones.' },
  { icon: Link2Off, t: 'Robo por enlaces o rastreo', d: 'La app no envía de qué página vienes y nunca pone tus datos en la dirección web.' },
  { icon: FileWarning, t: 'Archivos maliciosos', d: 'Los respaldos se revisan antes de abrirse y los reportes de Excel no ejecutan fórmulas escondidas.' },
  { icon: KeyRound, t: 'Adivinar tu PIN', d: 'El PIN se guarda cifrado (nunca tal cual) y tras varios intentos fallidos la app se bloquea un rato.' },
  { icon: Lock, t: 'Espiar el hogar sincronizado', d: 'La lista compartida viaja cifrada de extremo a extremo (AES-256). Ni el servidor ni nosotros la podemos leer.' },
  { icon: ShieldCheck, t: 'Librerías con fallas conocidas', d: 'Revisamos las piezas de la app contra la lista pública de fallas y quitamos las que no se usan.' },
];

export default function SecurityCenter({ autoIntro, onIntroDone }: { autoIntro: boolean; onIntroDone: () => void }) {
  const [open, setOpen] = useState(false);
  const [intro, setIntro] = useState(false);
  const [stats, setStats] = useState(statsEnabled());
  const [more, setMore] = useState(false);
  const { isSetup } = useSecurity();
  const navigate = useNavigate();
  const st = securityStatus();

  useEffect(() => { if (autoIntro) { setIntro(true); setOpen(true); } }, [autoIntro]);
  useEffect(() => {
    const on = () => { setIntro(false); setOpen(true); };
    window.addEventListener('mf:open-security', on);
    return () => window.removeEventListener('mf:open-security', on);
  }, []);

  const close = () => {
    setOpen(false);
    if (intro) { try { localStorage.setItem(INTRO_KEY, '1'); } catch { /* sin almacenamiento */ } onIntroDone(); }
  };
  const toggleStats = () => { setStatsEnabled(!stats); setStats(!stats); };

  const checks = [
    { ok: st.https, t: 'Conexión segura (HTTPS)' },
    { ok: st.officialHost, t: 'Dirección oficial' },
    { ok: st.webCrypto, t: 'Cifrado del navegador disponible' },
    { ok: st.notFramed, t: 'Sin marcos sospechosos' },
    { ok: isSetup, t: isSetup ? 'App protegida con PIN' : 'PIN sin activar (recomendado)', warn: !isSetup },
  ];

  return createPortal(
    <AnimatePresence>
      {open && (
        <motion.div className="fixed inset-0 z-[170] bg-appbg/95 backdrop-blur-md overflow-y-auto" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
          <motion.div role="dialog" aria-modal="true" aria-labelledby="sec-title" className="max-w-md mx-auto px-5 pt-10 pb-10"
            initial={{ y: 30, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ type: 'spring', damping: 24 }}>

            {/* Escudo animado */}
            <div className="relative mx-auto w-24 h-24">
              <motion.span className="absolute inset-0 rounded-[30px] bg-brand-lime/25 blur-xl" animate={{ scale: [1, 1.15, 1] }} transition={{ duration: 2.4, repeat: Infinity }} />
              <motion.span initial={{ scale: 0, rotate: -15 }} animate={{ scale: 1, rotate: 0 }} transition={{ type: 'spring', damping: 11, delay: 0.1 }}
                className="relative w-24 h-24 rounded-[30px] bg-brand-lime flex items-center justify-center shadow-2xl"><ShieldCheck size={48} className="text-brand-ink" strokeWidth={2.2} /></motion.span>
            </div>
            <h2 id="sec-title" className="text-white text-2xl font-extrabold text-center mt-5 leading-tight">Tu privacidad y tu seguridad</h2>
            <p className="text-slate-300 text-sm text-center mt-2">Antes de empezar, esto es lo que debes saber.</p>

            {/* Lo principal */}
            <div className="mt-6 space-y-2.5">
              {[
                { icon: UserX, t: 'No guardamos tus datos', d: 'Sin cuentas, sin correo, sin teléfono, sin cédula. No vendemos ni vemos nada tuyo.' },
                { icon: Smartphone, t: 'Tus finanzas viven en tu celular', d: 'Ingresos, gastos, pagos, deudas y metas nunca salen de este celular.' },
                { icon: Lock, t: 'El hogar va cifrado', d: 'Si compartes la lista del mercado, viaja cifrada de extremo a extremo. Solo tu familia la puede leer.' },
                { icon: ShieldCheck, t: 'Protegida contra ataques comunes', d: 'Código inyectado, páginas falsas, marcos invisibles, archivos maliciosos y más.' },
              ].map((c, i) => (
                <motion.div key={c.t} initial={{ opacity: 0, x: -14 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.15 + i * 0.07 }}
                  className="flex gap-3 p-3.5 rounded-2xl bg-surface border border-white/10">
                  <span className="w-10 h-10 shrink-0 rounded-xl bg-brand-lime/15 ring-1 ring-brand-lime/30 flex items-center justify-center"><c.icon size={19} className="text-brand-lime" /></span>
                  <span><span className="block text-white text-sm font-bold">{c.t}</span><span className="block text-[12px] text-slate-400 leading-snug mt-0.5">{c.d}</span></span>
                </motion.div>
              ))}
            </div>

            {/* Revisión en vivo */}
            <div className="mt-5 rounded-2xl bg-surface border border-white/10 p-4">
              <p className="text-white text-sm font-bold mb-2">Revisión de este celular</p>
              <ul className="space-y-1.5">
                {checks.map(c => (
                  <li key={c.t} className="flex items-center gap-2 text-[13px]">
                    {c.ok ? <span className="w-5 h-5 rounded-full bg-brand-lime flex items-center justify-center"><Check size={12} className="text-brand-ink" strokeWidth={3.5} /></span>
                      : <span className="w-5 h-5 rounded-full bg-amber-400 flex items-center justify-center"><AlertTriangle size={11} className="text-[#1a1203]" strokeWidth={3} /></span>}
                    <span className={c.ok ? 'text-slate-200' : 'text-amber-300 font-semibold'}>{c.t}</span>
                    {c.warn && <button onClick={() => { close(); navigate('/ajustes'); }} className="ml-auto text-[11px] font-bold text-brand-lime">Activar</button>}
                  </li>
                ))}
              </ul>
            </div>

            {/* De qué te protege */}
            <button onClick={() => setMore(m => !m)} aria-expanded={more} className="mt-4 w-full flex items-center justify-between px-1 text-sm font-bold text-white">
              ¿De qué te protege exactamente? <motion.span animate={{ rotate: more ? 180 : 0 }}><ChevronDown size={18} className="text-slate-400" /></motion.span>
            </button>
            <AnimatePresence initial={false}>
              {more && (
                <motion.ul initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden mt-2 space-y-2">
                  {PROTECTIONS.map(p => (
                    <li key={p.t} className="flex gap-3 p-3 rounded-2xl bg-white/[0.03] ring-1 ring-white/10">
                      <p.icon size={17} className="text-brand-lime mt-0.5 shrink-0" />
                      <span><span className="block text-white text-[13px] font-bold">{p.t}</span><span className="block text-[12px] text-slate-400 leading-snug">{p.d}</span></span>
                    </li>
                  ))}
                  <li className="text-[11px] text-slate-500 px-1">Ninguna app es 100% invulnerable: tu mejor defensa extra es activar el PIN y no compartir tu celular desbloqueado.</li>
                </motion.ul>
              )}
            </AnimatePresence>

            {/* Estadísticas anónimas */}
            <button onClick={toggleStats} role="switch" aria-checked={stats} className="mt-4 w-full flex items-center gap-3 p-3.5 rounded-2xl bg-surface border border-white/10 text-left">
              <BarChart3 size={18} className="text-brand-lime shrink-0" />
              <span className="flex-1"><span className="block text-white text-sm font-semibold">Estadísticas anónimas</span><span className="block text-[11px] text-slate-400 leading-snug">Solo contamos cuántas personas usan la app (un +1 al día). Nada que te identifique.</span></span>
              <span className={`w-11 h-6 shrink-0 rounded-full p-0.5 transition-colors ${stats ? 'bg-brand-lime' : 'bg-white/15'}`}><span className={`block w-5 h-5 rounded-full bg-[#fff] shadow transition-transform ${stats ? 'translate-x-5' : ''}`} /></span>
            </button>

            <button onClick={close} className="mt-6 w-full h-14 rounded-2xl bg-brand-lime text-brand-ink font-extrabold text-base active:scale-[0.98]">
              {intro ? 'Entendido, entrar' : 'Cerrar'}
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body,
  );
}
