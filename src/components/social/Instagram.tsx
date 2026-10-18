/**
 * ════════════════════════════════════════════════════════════════════
 * 📸 SÍGUENOS EN INSTAGRAM (@mifinanzas_app)
 * ────────────────────────────────────────────────────────────────────
 * Qué hace: botón con el ícono de Instagram (en los colores de la app) que abre el perfil, y una
 *           tarjetita de "¡Lo lograste! Síguenos" cuando alguien cumple un logro
 *           (por ejemplo, su primer mercado). La tarjeta sale máximo una vez por logro.
 * Dónde se ve: Menú ☰, Ajustes → Acerca de y tras los logros.
 * Si cambias de usuario de Instagram: cambia INSTAGRAM_USER.
 * Para mostrar la tarjeta desde otro lugar: celebrateWithInstagram('id-del-logro', 'Texto').
 * ════════════════════════════════════════════════════════════════════
 */
import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Instagram } from 'lucide-react';

export const INSTAGRAM_USER = 'mifinanzas_app';
export const INSTAGRAM_URL = `https://www.instagram.com/${INSTAGRAM_USER}/`;
export const openInstagram = () => window.open(INSTAGRAM_URL, '_blank', 'noopener,noreferrer');

/** Ícono de Instagram (de la librería de íconos) sobre un cuadro con los colores de la app. */
export function InstagramIcon({ size = 36 }: { size?: number }) {
  return (
    <span style={{ width: size, height: size, borderRadius: size * 0.28 }}
      className="inline-flex items-center justify-center shrink-0 bg-brand-lime shadow-md shadow-lime-400/20" aria-hidden="true">
      <Instagram size={size * 0.56} className="text-brand-ink" strokeWidth={2.3} />
    </span>
  );
}

const SEEN = 'mf_ig_moments';
/** Pide mostrar la tarjeta de logro (una sola vez por id). */
export const celebrateWithInstagram = (id: string, title: string) => {
  try {
    const seen: string[] = JSON.parse(localStorage.getItem(SEEN) || '[]');
    if (seen.includes(id) || localStorage.getItem('mf_ig_followed')) return;
    localStorage.setItem(SEEN, JSON.stringify([...seen, id]));
  } catch { return; }
  window.dispatchEvent(new CustomEvent('mf:ig-moment', { detail: title }));
};

/** Tarjeta de logro con invitación a seguir la cuenta. Montada en App.tsx. */
export function InstagramMoment() {
  const [title, setTitle] = useState<string | null>(null);
  useEffect(() => {
    const on = (e: Event) => setTimeout(() => setTitle((e as CustomEvent).detail), 3600);
    window.addEventListener('mf:ig-moment', on);
    return () => window.removeEventListener('mf:ig-moment', on);
  }, []);
  const follow = () => { openInstagram(); try { localStorage.setItem('mf_ig_followed', '1'); } catch { /* sin almacenamiento */ } setTitle(null); };

  return (
    <AnimatePresence>
      {title && (
        <motion.div initial={{ y: 160, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 160, opacity: 0 }} transition={{ type: 'spring', damping: 22 }}
          className="theme-dark fixed bottom-24 inset-x-4 max-w-md mx-auto z-[65] rounded-3xl p-4 bg-gradient-to-br from-[#232C5A] via-[#141B3D] to-[#0B1026] ring-1 ring-brand-lime/30 shadow-2xl">
          <button onClick={() => setTitle(null)} aria-label="Cerrar" className="absolute right-3 top-3 p-1 text-slate-400"><X size={16} /></button>
          <div className="flex items-center gap-3 pr-6">
            <motion.span initial={{ rotate: -20, scale: 0 }} animate={{ rotate: 0, scale: 1 }} transition={{ type: 'spring', damping: 10, delay: 0.15 }}><InstagramIcon size={48} /></motion.span>
            <div>
              <p className="text-white font-extrabold text-[15px] leading-tight">{title}</p>
              <p className="text-slate-300 text-[12px] mt-0.5">Síguenos en Instagram para trucos de ahorro y novedades de la app.</p>
            </div>
          </div>
          <button onClick={follow} className="mt-3 w-full h-11 rounded-2xl bg-brand-lime text-brand-ink font-extrabold text-sm">Seguir a @{INSTAGRAM_USER}</button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
