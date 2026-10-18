/**
 * ════════════════════════════════════════════════════════════════════
 * 📲 INSTALAR LA APP EN EL CELULAR
 * ────────────────────────────────────────────────────────────────────
 * Qué hace:
 *  · Android/computador (Chrome, Edge): botón "Instalar ahora" → el celular
 *    pide permiso y la app queda en la pantalla de inicio. Un solo toque.
 *  · iPhone (Safari): guía paso a paso con dibujos (Compartir → Agregar a inicio).
 *  · Muestra una tarjetita "Instala la app" de vez en cuando (máx. cada 3 días).
 * Dónde se ve: Menú ☰ → "Descargar la app", Ajustes y la tarjetita de abajo.
 * Se abre desde cualquier parte con openInstall(). Montado en App.tsx.
 * ════════════════════════════════════════════════════════════════════
 */
import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Download, Share, PlusSquare, Check, ChevronRight, ChevronLeft, MoreVertical, Smartphone, Copy, X } from 'lucide-react';
import BottomSheet from '../ui/BottomSheet';
import AppLogo from '../ui/AppLogo';
import { notify } from '../../services/notificationService';
import { isStandalone } from '../../services/statsService';

// ═══ SECCIÓN: Captura del permiso de instalación del navegador ═══
type BIPEvent = Event & { prompt: () => Promise<void>; userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }> };
let deferred: BIPEvent | null = null;
if (typeof window !== 'undefined') {
  window.addEventListener('beforeinstallprompt', e => { e.preventDefault(); deferred = e as BIPEvent; window.dispatchEvent(new Event('mf:install-ready')); });
  window.addEventListener('appinstalled', () => { deferred = null; window.dispatchEvent(new Event('mf:install-ready')); });
}
export const openInstall = () => window.dispatchEvent(new Event('mf:open-install'));
export const canOfferInstall = () => !isStandalone();

const ua = () => navigator.userAgent;
const isIOS = () => /iphone|ipad|ipod/i.test(ua()) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
const isIOSSafari = () => isIOS() && !/crios|fxios|edgios|opios|instagram|fban|fbav|tiktok/i.test(ua());
const isInApp = () => /instagram|fban|fbav|tiktok|line\/|wv\)/i.test(ua());

/** Pide al navegador instalar la app. Devuelve true si la persona aceptó. */
export const promptInstall = async () => {
  if (!deferred) return false;
  await deferred.prompt();
  const { outcome } = await deferred.userChoice;
  deferred = null;
  return outcome === 'accepted';
};

// ═══ SECCIÓN: Dibujos de los pasos en iPhone ═══
const Phone = ({ children }: { children: React.ReactNode }) => (
  <div className="theme-dark mx-auto w-48 h-64 rounded-[28px] bg-[#0B1026] ring-4 ring-white/10 relative overflow-hidden shadow-2xl">
    <div className="absolute top-2 left-1/2 -translate-x-1/2 w-14 h-1.5 rounded-full bg-white/15" />
    {children}
  </div>
);
const Pulse = () => <motion.span className="absolute inset-0 rounded-xl ring-2 ring-brand-lime" animate={{ scale: [1, 1.12], opacity: [0.9, 0] }} transition={{ duration: 1.4, repeat: Infinity }} />;

const IOS_STEPS = [
  { title: 'Toca "Compartir"', text: 'Es el cuadrito con la flecha hacia arriba, en la barra de abajo de Safari.', art: (
    <Phone>
      <div className="absolute inset-x-3 top-8 space-y-2">{[70, 90, 55].map((w, i) => <div key={i} className="h-3 rounded bg-white/10" style={{ width: `${w}%` }} />)}</div>
      <div className="absolute bottom-0 inset-x-0 h-12 bg-white/[0.06] flex items-center justify-around px-3 text-slate-400">
        <ChevronLeft size={16} /><ChevronRight size={16} />
        <span className="relative w-9 h-9 rounded-xl bg-brand-lime/15 flex items-center justify-center text-brand-lime"><Share size={18} /><Pulse /></span>
        <span className="w-4 h-4 rounded border border-slate-500" /><span className="w-4 h-4 rounded border border-slate-500" />
      </div>
    </Phone>) },
  { title: 'Toca "Agregar a inicio"', text: 'Desliza la lista hacia arriba si no lo ves. También puede decir "Agregar a pantalla de inicio".', art: (
    <Phone>
      <div className="absolute inset-x-0 bottom-0 top-16 rounded-t-2xl bg-white/[0.08] p-3 space-y-2">
        {['Copiar', 'Agregar a favoritos'].map(t => <div key={t} className="h-8 rounded-lg bg-white/[0.06] px-2 flex items-center text-[10px] text-slate-400">{t}</div>)}
        <div className="relative h-8 rounded-lg bg-brand-lime/15 px-2 flex items-center justify-between text-[10px] text-white font-bold">Agregar a inicio <PlusSquare size={14} className="text-brand-lime" /><Pulse /></div>
        <div className="h-8 rounded-lg bg-white/[0.06] px-2 flex items-center text-[10px] text-slate-400">Imprimir</div>
      </div>
    </Phone>) },
  { title: 'Toca "Agregar"', text: '¡Listo! Mi Finanzas queda en tu pantalla de inicio y se abre como una app normal, a pantalla completa.', art: (
    <Phone>
      <div className="absolute inset-0 grid grid-cols-3 gap-3 p-5 pt-10 content-start">
        {Array.from({ length: 8 }).map((_, i) => <span key={i} className="w-10 h-10 rounded-xl bg-white/[0.07] mx-auto" />)}
        <motion.span initial={{ scale: 0 }} animate={{ scale: [0, 1.2, 1] }} transition={{ delay: 0.3 }} className="mx-auto flex flex-col items-center gap-1"><AppLogo size={40} animated={false} /><span className="text-[8px] text-white">Mi Finanzas</span></motion.span>
      </div>
    </Phone>) },
];

// ═══ SECCIÓN: Hoja principal + tarjetita automática ═══
const NUDGE_KEY = 'mf_install_nudge';

export default function InstallAppSheet({ ready }: { ready: boolean }) {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState(0);
  const [, tick] = useState(0);
  const [nudge, setNudge] = useState(false);

  useEffect(() => {
    const onOpen = () => { setOpen(true); setStep(0); setNudge(false); };
    const onReady = () => tick(t => t + 1);
    window.addEventListener('mf:open-install', onOpen);
    window.addEventListener('mf:install-ready', onReady);
    return () => { window.removeEventListener('mf:open-install', onOpen); window.removeEventListener('mf:install-ready', onReady); };
  }, []);

  // Tarjetita: solo en el navegador, después de la bienvenida, máximo cada 3 días.
  useEffect(() => {
    if (!ready || isStandalone()) return;
    const last = Number(localStorage.getItem(NUDGE_KEY) || 0);
    if (Date.now() - last < 3 * 86400000) return;
    const t = setTimeout(() => setNudge(true), 6000);
    return () => clearTimeout(t);
  }, [ready]);
  const closeNudge = () => { setNudge(false); try { localStorage.setItem(NUDGE_KEY, String(Date.now())); } catch { /* sin almacenamiento */ } };

  const install = async () => {
    const ok = await promptInstall();
    if (ok) { notify({ title: '¡Mi Finanzas instalada!', message: 'Búscala en la pantalla de inicio de tu celular.', type: 'success' }); setOpen(false); closeNudge(); }
  };
  const copy = async () => {
    try { await navigator.clipboard.writeText(location.origin); notify({ title: 'Enlace copiado', message: 'Pégalo en Safari.', type: 'success', log: false }); } catch { /* sin portapapeles */ }
  };

  const installed = isStandalone();
  const S = IOS_STEPS[step];

  return (
    <>
      <AnimatePresence>
        {nudge && !open && (
          <motion.div initial={{ y: 140, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 140, opacity: 0 }} transition={{ type: 'spring', damping: 24 }}
            className="theme-dark fixed bottom-24 inset-x-4 max-w-md mx-auto z-[60] rounded-3xl p-3.5 bg-gradient-to-br from-[#232C5A] via-[#141B3D] to-[#0B1026] ring-1 ring-brand-lime/30 shadow-2xl flex items-center gap-3">
            <AppLogo size={44} animated={false} />
            <div className="flex-1 min-w-0">
              <p className="text-white text-sm font-extrabold">Instala Mi Finanzas</p>
              <p className="text-[11px] text-slate-300 leading-snug">Ábrela como una app, a pantalla completa y sin internet.</p>
            </div>
            <button onClick={openInstall} className="px-3.5 h-10 rounded-xl bg-brand-lime text-brand-ink text-xs font-extrabold">Instalar</button>
            <button onClick={closeNudge} aria-label="Ahora no" className="p-1 text-slate-400"><X size={16} /></button>
          </motion.div>
        )}
      </AnimatePresence>

      <BottomSheet open={open} onClose={() => { setOpen(false); closeNudge(); }} title="Descarga la app" subtitle="Gratis, sin tienda y sin registro" icon={<Download size={22} />} labelId="install-title">
        {installed ? (
          <div className="text-center py-6">
            <span className="w-16 h-16 mx-auto rounded-3xl bg-brand-lime flex items-center justify-center"><Check size={32} className="text-brand-ink" strokeWidth={3} /></span>
            <p className="text-white font-bold mt-3">Ya tienes la app instalada</p>
            <p className="text-slate-400 text-sm">Estás usándola desde tu pantalla de inicio.</p>
          </div>
        ) : deferred ? (
          <div className="text-center">
            <motion.div initial={{ scale: 0.6, rotate: -8 }} animate={{ scale: 1, rotate: 0 }} transition={{ type: 'spring', damping: 12 }} className="flex justify-center"><AppLogo size={76} /></motion.div>
            <p className="text-white text-lg font-extrabold mt-3">Un toque y listo</p>
            <p className="text-slate-300 text-sm mt-1 max-w-xs mx-auto">Tu celular te pedirá permiso. Acéptalo y Mi Finanzas quedará en tu pantalla de inicio.</p>
            <button onClick={install} className="mt-5 w-full h-14 rounded-2xl bg-brand-lime text-brand-ink font-extrabold text-base flex items-center justify-center gap-2 active:scale-[0.98]"><Download size={20} /> Instalar ahora</button>
            <ul className="mt-4 grid grid-cols-3 gap-2 text-[11px] text-slate-300">
              {['Pantalla completa', 'Funciona sin internet', 'Ocupa muy poco'].map(t => <li key={t} className="rounded-xl bg-white/[0.05] ring-1 ring-white/10 py-2 px-1">{t}</li>)}
            </ul>
          </div>
        ) : isIOS() ? (
          isIOSSafari() ? (
            <div>
              <AnimatePresence mode="wait">
                <motion.div key={step} initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }} transition={{ duration: 0.22 }}>
                  {S.art}
                  <p className="text-[11px] text-brand-lime font-bold uppercase tracking-widest text-center mt-4">Paso {step + 1} de {IOS_STEPS.length}</p>
                  <p className="text-white text-lg font-extrabold text-center">{S.title}</p>
                  <p className="text-slate-300 text-sm text-center mt-1 max-w-xs mx-auto">{S.text}</p>
                </motion.div>
              </AnimatePresence>
              <div className="flex justify-center gap-1.5 mt-4">{IOS_STEPS.map((_, i) => <span key={i} className={`h-1.5 rounded-full transition-all ${i === step ? 'w-6 bg-brand-lime' : 'w-1.5 bg-white/20'}`} />)}</div>
              <div className="grid grid-cols-2 gap-2 mt-4">
                <button onClick={() => setStep(s => Math.max(0, s - 1))} disabled={step === 0} className="h-12 rounded-2xl bg-white/[0.07] ring-1 ring-white/10 text-white font-bold text-sm disabled:opacity-30">Atrás</button>
                <button onClick={() => step < IOS_STEPS.length - 1 ? setStep(s => s + 1) : setOpen(false)} className="h-12 rounded-2xl bg-brand-lime text-brand-ink font-extrabold text-sm">{step < IOS_STEPS.length - 1 ? 'Siguiente' : '¡Entendido!'}</button>
              </div>
            </div>
          ) : (
            <div className="text-center">
              <Smartphone size={40} className="mx-auto text-brand-lime" />
              <p className="text-white font-bold mt-3">Ábrela en Safari</p>
              <p className="text-slate-300 text-sm mt-1">En iPhone, las apps como esta solo se instalan desde Safari. Copia el enlace, ábrelo en Safari y toca este botón otra vez.</p>
              <button onClick={copy} className="mt-4 w-full h-12 rounded-2xl bg-brand-lime text-brand-ink font-extrabold flex items-center justify-center gap-2"><Copy size={18} /> Copiar enlace</button>
            </div>
          )
        ) : (
          <div>
            {isInApp() && <p className="mb-3 text-[12px] text-amber-300 bg-amber-400/10 ring-1 ring-amber-400/30 rounded-xl p-3">Estás dentro de otra app (Instagram, TikTok…). Toca los tres puntos y elige "Abrir en Chrome" para poder instalarla.</p>}
            <p className="text-white font-bold">Instálala desde el menú del navegador</p>
            <ol className="mt-3 space-y-2.5">
              {[
                { icon: <MoreVertical size={18} />, t: 'Toca los tres puntos ⋮', d: 'Arriba a la derecha en Chrome.' },
                { icon: <Download size={18} />, t: 'Toca "Instalar app"', d: 'O "Agregar a la pantalla principal".' },
                { icon: <Check size={18} />, t: 'Confirma con "Instalar"', d: 'Queda en tu pantalla de inicio.' },
              ].map((s, i) => (
                <li key={i} className="flex items-center gap-3 rounded-2xl bg-white/[0.05] ring-1 ring-white/10 p-3">
                  <span className="w-9 h-9 rounded-xl bg-brand-lime text-brand-ink flex items-center justify-center font-extrabold">{i + 1}</span>
                  <span className="flex-1"><span className="block text-white text-sm font-bold">{s.t}</span><span className="block text-[11px] text-slate-400">{s.d}</span></span>
                  <span className="text-brand-lime">{s.icon}</span>
                </li>
              ))}
            </ol>
          </div>
        )}
      </BottomSheet>
    </>
  );
}
