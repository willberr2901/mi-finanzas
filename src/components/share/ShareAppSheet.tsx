/**
 * ════════════════════════════════════════════════════════════════════
 * 💚 RECOMENDAR LA APP
 * ────────────────────────────────────────────────────────────────────
 * Qué hace: Mensaje para WhatsApp, copiar o código QR con el enlace de la app.
 * Dónde se ve: Menú y Ajustes → Recomendar.
 * Si lo cambias: Solo afecta cómo se comparte la app.
 * ════════════════════════════════════════════════════════════════════
 */
import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import QRCode from 'qrcode';
import { X, Copy, Check, Share2, Heart, QrCode } from 'lucide-react';
import AppLogo from '../ui/AppLogo';
import { notify } from '../../services/notificationService';

/** Abre la hoja para recomendar la app desde cualquier parte. */
export const openShareApp = () => window.dispatchEvent(new Event('mf:share-app'));

const COUNT_KEY = 'mf_shares';
const appUrl = () => window.location.origin;
const message = () =>
  `Te recomiendo Mi Finanzas 💚 Organiza el mercado, los pagos fijos y los gastos de la casa en un solo lugar. Es gratis, sin registro y tus datos quedan solo en tu celular.\n\n👉 ${appUrl()}`;

const WhatsAppIcon = () => (
  <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true"><path fill="currentColor" d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2Zm0 18.2a8.2 8.2 0 0 1-4.2-1.2l-.3-.2-3 .8.8-2.9-.2-.3A8.2 8.2 0 1 1 12 20.2Zm4.5-6.1c-.2-.1-1.5-.7-1.7-.8-.2-.1-.4-.1-.6.1l-.8 1c-.1.2-.3.2-.5.1a6.7 6.7 0 0 1-3.3-2.9c-.2-.4.2-.4.7-1.3.1-.2 0-.3 0-.4l-.8-1.8c-.2-.5-.4-.4-.6-.4h-.5a1 1 0 0 0-.7.3 3 3 0 0 0-.9 2.2 5.2 5.2 0 0 0 1.1 2.7 11.8 11.8 0 0 0 4.5 4c1.7.7 2.3.8 3.2.7.5-.1 1.5-.6 1.7-1.2.2-.6.2-1.1.1-1.2l-.4-.2Z"/></svg>
);

export default function ShareAppSheet() {
  const [open, setOpen] = useState(false);
  const [qr, setQr] = useState('');
  const [showQr, setShowQr] = useState(false);
  const [copied, setCopied] = useState(false);
  const [count, setCount] = useState(() => Number(localStorage.getItem(COUNT_KEY) || 0));

  useEffect(() => {
    const on = () => { setOpen(true); setShowQr(false); setCopied(false); };
    window.addEventListener('mf:share-app', on);
    return () => window.removeEventListener('mf:share-app', on);
  }, []);

  useEffect(() => {
    if (!open || qr) return;
    QRCode.toDataURL(appUrl(), { margin: 1, width: 520, errorCorrectionLevel: 'H', color: { dark: '#0B1026', light: '#FFFFFF' } }).then(setQr).catch(() => {});
  }, [open, qr]);

  const bump = () => { const n = count + 1; setCount(n); try { localStorage.setItem(COUNT_KEY, String(n)); } catch { /* sin almacenamiento */ } };

  const whatsapp = () => { bump(); window.open(`https://wa.me/?text=${encodeURIComponent(message())}`, '_blank', 'noopener'); };
  const nativeShare = async () => {
    try { await navigator.share({ title: 'Mi Finanzas', text: message() }); bump(); }
    catch { /* la persona canceló */ }
  };
  const copy = async () => {
    try { await navigator.clipboard.writeText(message()); setCopied(true); bump(); notify({ title: 'Mensaje copiado', message: 'Pégalo en WhatsApp, Instagram o donde quieras.', type: 'success' }); setTimeout(() => setCopied(false), 2200); }
    catch { notify({ title: 'No se pudo copiar', message: appUrl(), type: 'info' }); }
  };
  const canShare = typeof navigator !== 'undefined' && 'share' in navigator;

  return (
    <AnimatePresence>
      {open && (
        <motion.div className="fixed inset-0 z-[140] bg-black/70 backdrop-blur-sm flex items-end justify-center" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setOpen(false)}>
          <motion.div role="dialog" aria-modal="true" aria-labelledby="share-title" onClick={e => e.stopPropagation()}
            className="w-full max-w-md bg-surface2 rounded-t-[32px] border-t border-white/10 p-5 pb-8 relative overflow-hidden"
            initial={{ y: 420 }} animate={{ y: 0 }} exit={{ y: 420 }} transition={{ type: 'spring', damping: 26, stiffness: 260 }}>
            <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-72 h-72 rounded-full bg-brand-lime/15 blur-3xl pointer-events-none" aria-hidden="true" />
            <div className="relative w-10 h-1.5 rounded-full bg-white/15 mx-auto mb-4" />
            <button onClick={() => setOpen(false)} aria-label="Cerrar" className="absolute right-4 top-4 p-2 text-slate-400"><X size={20} /></button>

            <div className="relative flex flex-col items-center text-center">
              <motion.div initial={{ scale: 0.6, rotate: -10 }} animate={{ scale: 1, rotate: 0 }} transition={{ type: 'spring', damping: 12 }}><AppLogo size={64} /></motion.div>
              <h2 id="share-title" className="text-white text-xl font-extrabold mt-3">Recomienda Mi Finanzas</h2>
              <p className="text-sm text-slate-300 mt-1 max-w-xs">Ayuda a alguien a ordenar las cuentas de su casa. Es gratis y sin registro.</p>
            </div>

            <AnimatePresence mode="wait" initial={false}>
              {showQr ? (
                <motion.div key="qr" initial={{ opacity: 0, scale: 0.92 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.92 }} className="relative mt-5 flex flex-col items-center">
                  <div className="relative p-3 rounded-3xl bg-[#fff] shadow-[0_20px_60px_-20px_rgba(198,244,50,.45)]">
                    {qr ? <img src={qr} alt="Código QR para abrir Mi Finanzas" className="w-56 h-56" /> : <div className="w-56 h-56" />}
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none"><div className="p-1.5 rounded-2xl bg-[#fff]"><AppLogo size={44} animated={false} /></div></div>
                  </div>
                  <p className="text-xs text-slate-400 mt-3">Que lo escaneen con la cámara del celular</p>
                  <button onClick={() => setShowQr(false)} className="mt-3 text-xs text-slate-300 underline">Volver</button>
                </motion.div>
              ) : (
                <motion.div key="opts" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="relative mt-5 space-y-2.5">
                  <div className="rounded-2xl bg-white/[0.05] ring-1 ring-white/10 p-3.5 text-left">
                    <p className="text-[11px] uppercase tracking-wider text-slate-500 font-bold mb-1">Mensaje</p>
                    <p className="text-[13px] text-slate-200 whitespace-pre-line leading-relaxed">{message()}</p>
                  </div>
                  <button onClick={whatsapp} className="w-full py-3.5 rounded-2xl bg-[#25D366] text-[#062b16] font-extrabold flex items-center justify-center gap-2 active:scale-[0.98] transition-transform"><WhatsAppIcon /> Enviar por WhatsApp</button>
                  <div className="grid grid-cols-3 gap-2">
                    {canShare && <button onClick={nativeShare} className="py-3 rounded-2xl bg-white/[0.07] ring-1 ring-white/10 text-white text-xs font-bold flex flex-col items-center gap-1"><Share2 size={18} className="text-brand-lime" />Compartir</button>}
                    <button onClick={copy} className="py-3 rounded-2xl bg-white/[0.07] ring-1 ring-white/10 text-white text-xs font-bold flex flex-col items-center gap-1">{copied ? <Check size={18} className="text-brand-lime" /> : <Copy size={18} className="text-brand-lime" />}{copied ? 'Copiado' : 'Copiar'}</button>
                    <button onClick={() => { setShowQr(true); bump(); }} className={`py-3 rounded-2xl bg-white/[0.07] ring-1 ring-white/10 text-white text-xs font-bold flex flex-col items-center gap-1 ${canShare ? '' : 'col-span-2'}`}><QrCode size={18} className="text-brand-lime" />Código QR</button>
                  </div>
                  {count > 0 && (
                    <p className="text-center text-xs text-slate-400 pt-1 flex items-center justify-center gap-1"><Heart size={12} className="text-rose-400" fill="currentColor" /> Has recomendado la app {count} {count === 1 ? 'vez' : 'veces'}. ¡Gracias!</p>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
