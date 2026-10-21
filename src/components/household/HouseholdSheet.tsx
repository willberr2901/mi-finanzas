/**
 * ════════════════════════════════════════════════════════════════════
 * 🏠 PANTALLA "HOGAR SINCRONIZADO" (crear, invitar con QR, unirse, salir)
 * ────────────────────────────────────────────────────────────────────
 * Qué hace: crea el hogar, muestra el QR de invitación, escanea el QR de
 *           otro celular y permite salir o borrar el hogar del servidor.
 * Dónde se ve: chip "Hogar" en Mercado y Ajustes → Hogar sincronizado.
 * Se abre desde cualquier parte con openHousehold(). Montado en App.tsx.
 * La lógica está en services/household/householdSync.ts.
 * ════════════════════════════════════════════════════════════════════
 */
import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import QRCode from 'qrcode';
import { Home, Users, QrCode, Link2, ShieldCheck, RefreshCw, LogOut, Trash2, Share2, Lock, Wifi, WifiOff, Camera } from 'lucide-react';
import BottomSheet from '../ui/BottomSheet';
import { askConfirm } from '../ui/ConfirmDialog';
import { notify } from '../../services/notificationService';
import { useHousehold, createHousehold, inviteLink, parseInvite, joinHousehold, leaveHousehold, deleteHouseholdFromServer, syncNow, renameHousehold, type SyncStatus } from '../../services/household/householdSync';
import { ownerLabel } from '../../utils/prefs';

// ═══ SECCIÓN: Abrir desde cualquier parte ═══
export const openHousehold = () => window.dispatchEvent(new Event('mf:open-household'));
/** Llega un enlace de invitación (/hogar#k=…): pregunta y une este celular. */
export const handleInvite = async (text: string) => {
  const inv = parseInvite(text);
  if (!inv) { notify({ title: 'Invitación no válida', message: 'Pide que te envíen otra vez el código del hogar.', type: 'error' }); return false; }
  const ok = await askConfirm({
    title: `¿Unirte a "${inv.name}"?`,
    message: 'Verás y editarás la misma lista de mercado en vivo. Lo que ya tengas en tu lista se unirá a la del hogar. Tus finanzas siguen solo en tu celular.',
    icon: 'home', confirmText: 'Sí, unirme', cancelText: 'Ahora no',
  });
  if (!ok) return false;
  await joinHousehold(inv);
  notify({ title: `Te uniste a ${inv.name}`, message: 'La lista del mercado ya está sincronizada.', type: 'hogar' });
  return true;
};

const ago = (t: number | null) => {
  if (!t) return '';
  const m = Math.round((Date.now() - t) / 60000);
  return m < 1 ? 'ahora' : m < 60 ? `hace ${m} min` : `hace ${Math.round(m / 60)} h`;
};
export const statusText = (s: SyncStatus, last: number | null) =>
  ({ off: 'Sin hogar', connecting: 'Conectando…', syncing: 'Sincronizando…', ok: `Sincronizado ${ago(last)}`, offline: 'Sin internet · se enviará al volver', error: 'Reintentando…' })[s];

// ═══ SECCIÓN: Chip para encabezados ═══
export function HouseholdChip() {
  const { household, status, online } = useHousehold();
  const live = status === 'ok' || status === 'syncing';
  return (
    <button onClick={openHousehold} aria-label={household ? `Hogar ${household.name}: ${statusText(status, null)}` : 'Sincronizar con mi hogar'}
      className={`relative w-10 h-10 shrink-0 rounded-xl flex items-center justify-center border active:scale-95 transition-transform ${household ? 'bg-brand-lime/10 border-brand-lime/40 text-brand-lime' : 'bg-white/5 border-white/10 text-slate-200'}`}>
      {household ? <Users size={18} /> : <Home size={18} />}
      {household
        ? <span className={`absolute -top-1 -right-1 min-w-[16px] h-4 px-1 rounded-full border-2 border-appbg text-[9px] font-extrabold flex items-center justify-center ${live ? 'bg-emerald-400 text-brand-ink' : status === 'offline' ? 'bg-slate-400 text-brand-ink' : 'bg-amber-400 text-brand-ink'}`}>{online > 1 ? online : ''}</span>
        : <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-brand-lime text-brand-ink text-[11px] font-black leading-none flex items-center justify-center border-2 border-appbg">+</span>}
    </button>
  );
}

// ═══ SECCIÓN: Escáner de QR con la cámara (si el celular lo permite) ═══
function QrScanner({ onResult, onCancel }: { onResult: (t: string) => void; onCancel: () => void }) {
  const video = useRef<HTMLVideoElement>(null);
  const [error, setError] = useState('');
  useEffect(() => {
    let stream: MediaStream | null = null, stop = false;
    const BD = (window as any).BarcodeDetector;
    if (!BD) { setError('Tu celular no permite escanear aquí. Abre la cámara del celular, escanea el QR y toca el enlace.'); return; }
    (async () => {
      try {
        stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
        if (!video.current) return;
        video.current.srcObject = stream; await video.current.play();
        const det = new BD({ formats: ['qr_code'] });
        while (!stop) {
          const codes = await det.detect(video.current).catch(() => []);
          if (codes[0]?.rawValue) { onResult(codes[0].rawValue); break; }
          await new Promise(r => setTimeout(r, 250));
        }
      } catch { setError('No pudimos abrir la cámara. Revisa el permiso o pega el enlace de invitación.'); }
    })();
    return () => { stop = true; stream?.getTracks().forEach(t => t.stop()); };
  }, []);
  return (
    <div className="text-center">
      {error ? <p className="text-sm text-slate-300 py-4">{error}</p> : (
        <div className="relative mx-auto w-64 h-64 rounded-3xl overflow-hidden bg-black ring-2 ring-brand-lime/50">
          <video ref={video} playsInline muted className="w-full h-full object-cover" />
          <motion.div className="absolute inset-x-6 h-0.5 bg-brand-lime shadow-[0_0_12px_rgb(var(--brand))]" animate={{ top: ['15%', '85%', '15%'] }} transition={{ duration: 2.4, repeat: Infinity }} />
        </div>
      )}
      <button onClick={onCancel} className="mt-3 text-xs text-slate-300 underline">Volver</button>
    </div>
  );
}

// ═══ SECCIÓN: Hoja principal ═══
export default function HouseholdSheet() {
  const [open, setOpen] = useState(false);
  const [view, setView] = useState<'main' | 'scan' | 'paste'>('main');
  const [name, setName] = useState('');
  const [paste, setPaste] = useState('');
  const [qr, setQr] = useState('');
  const [busy, setBusy] = useState(false);
  const { household, status, lastSync, online } = useHousehold();

  useEffect(() => {
    const on = () => { setOpen(true); setView('main'); };
    window.addEventListener('mf:open-household', on);
    return () => window.removeEventListener('mf:open-household', on);
  }, []);
  useEffect(() => { if (!name) setName(`Casa de ${ownerLabel('yo')}`); }, [open]);
  useEffect(() => {
    if (!household) { setQr(''); return; }
    QRCode.toDataURL(inviteLink(), { margin: 1, width: 520, errorCorrectionLevel: 'M', color: { dark: '#0B1026', light: '#FFFFFF' } }).then(setQr).catch(() => {});
  }, [household?.key]);

  const create = async () => {
    setBusy(true);
    try { await createHousehold(name); notify({ title: 'Hogar creado', message: 'Ahora invita a tu familia con el código QR.', type: 'hogar' }); }
    finally { setBusy(false); }
  };
  const joinFrom = async (text: string) => { setView('main'); if (await handleInvite(text)) setPaste(''); };
  const share = async () => {
    const text = `Únete a nuestro hogar "${household?.name}" en Mi Finanzas para compartir la lista del mercado 🛒\n${inviteLink()}`;
    try { if ('share' in navigator) { await navigator.share({ text }); return; } } catch { return; }
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank', 'noopener');
  };
  const leave = async () => {
    if (await askConfirm({ title: '¿Salir del hogar?', message: 'Este celular deja de sincronizar. Tu lista y tu historial se quedan aquí.', icon: 'home', tone: 'danger', confirmText: 'Sí, salir' })) {
      leaveHousehold(); notify({ title: 'Saliste del hogar', type: 'info' });
    }
  };
  const wipe = async () => {
    if (!await askConfirm({ title: '¿Borrar el hogar del servidor?', message: 'Se borran todas las cajas cifradas del servidor y este celular sale del hogar. Si otro celular sigue en el hogar, volverá a subir su copia: para cerrarlo del todo, que todos salgan.', icon: 'trash', tone: 'danger', confirmText: 'Sí, borrar' })) return;
    try { await deleteHouseholdFromServer(); notify({ title: 'Hogar borrado del servidor', message: 'Tus datos siguen en este celular.', type: 'success' }); }
    catch { notify({ title: 'No se pudo borrar', message: 'Revisa tu internet e inténtalo de nuevo.', type: 'error' }); }
  };

  const Privacy = () => (
    <div className="rounded-2xl bg-white/[0.04] ring-1 ring-white/10 p-3.5 mt-4">
      <p className="text-white text-sm font-bold flex items-center gap-2"><ShieldCheck size={16} className="text-brand-lime" /> Cifrado de extremo a extremo</p>
      <ul className="text-[12px] text-slate-300 mt-2 space-y-1.5 leading-snug">
        <li className="flex gap-2"><Lock size={13} className="text-brand-lime mt-0.5 shrink-0" />Todo se cifra en el celular. El servidor solo guarda "cajas cerradas" que nadie más puede abrir, ni nosotros.</li>
        <li className="flex gap-2"><Lock size={13} className="text-brand-lime mt-0.5 shrink-0" />Sin cuentas, correos ni teléfonos. La llave está solo en el QR.</li>
        <li className="flex gap-2"><Lock size={13} className="text-brand-lime mt-0.5 shrink-0" />Se comparte la lista del mercado, el historial de compras y los precios. Tus finanzas, deudas y pagos NO salen de tu celular.</li>
        <li className="flex gap-2"><Lock size={13} className="text-brand-lime mt-0.5 shrink-0" />Si nadie usa el hogar en 60 días, se borra solo del servidor.</li>
      </ul>
    </div>
  );

  return (
    <BottomSheet open={open} onClose={() => setOpen(false)} title={household ? household.name : 'Hogar sincronizado'}
      subtitle={household ? statusText(status, lastSync) : 'Comparte la lista del mercado en vivo'} icon={household ? <Users size={22} /> : <Home size={22} />} labelId="household-title">
      {view === 'scan' ? <QrScanner onResult={joinFrom} onCancel={() => setView('main')} /> :
       view === 'paste' ? (
        <div>
          <p className="text-sm text-slate-300 mb-2">Pega aquí el enlace de invitación que te enviaron:</p>
          <textarea value={paste} onChange={e => setPaste(e.target.value)} rows={3} aria-label="Enlace de invitación" placeholder="https://…/hogar#k=…"
            className="w-full p-3 rounded-2xl bg-white/5 border border-white/10 text-white text-sm outline-none focus:border-brand-lime" />
          <div className="grid grid-cols-2 gap-2 mt-3">
            <button onClick={() => setView('main')} className="py-3 rounded-2xl bg-white/[0.07] ring-1 ring-white/10 text-white text-sm font-bold">Volver</button>
            <button onClick={() => joinFrom(paste)} disabled={!paste.trim()} className="py-3 rounded-2xl bg-brand-lime text-brand-ink text-sm font-bold disabled:opacity-40">Unirme</button>
          </div>
        </div>
       ) : household ? (
        <div>
          <div className="flex items-center justify-between rounded-2xl bg-white/[0.04] ring-1 ring-white/10 px-3.5 py-2.5">
            <span className="flex items-center gap-2 text-sm text-white font-semibold">
              {status === 'offline' ? <WifiOff size={16} className="text-slate-400" /> : <Wifi size={16} className="text-emerald-300" />}
              {online > 1 ? `${online} celulares en línea` : 'Solo este celular en línea'}
            </span>
            <button onClick={async () => { await syncNow(); notify({ title: 'Lista sincronizada', type: 'hogar', log: false }); }} className="text-xs font-bold text-brand-lime flex items-center gap-1"><RefreshCw size={13} className={status === 'syncing' ? 'animate-spin' : ''} /> Sincronizar</button>
          </div>
          <div className="mt-4 flex flex-col items-center">
            <div className="p-3 rounded-3xl bg-[#fff] shadow-[0_20px_60px_-20px_rgba(198,244,50,.45)]">
              {qr ? <img src={qr} alt="Código QR para unirse al hogar" className="w-52 h-52" /> : <div className="w-52 h-52" />}
            </div>
            <p className="text-sm text-white font-bold mt-3 flex items-center gap-1.5"><QrCode size={15} className="text-brand-lime" /> Invita a alguien de tu hogar</p>
            <p className="text-xs text-slate-400 text-center max-w-xs mt-1">Que escanee este código desde Mi Finanzas → Mercado → Hogar → Escanear, o con la cámara del celular.</p>
            <button onClick={share} className="mt-3 px-4 py-2.5 rounded-2xl bg-white/[0.07] ring-1 ring-white/10 text-white text-xs font-bold flex items-center gap-1.5"><Share2 size={14} className="text-brand-lime" /> Enviar invitación</button>
            <p className="text-[10px] text-amber-300/90 text-center max-w-xs mt-2">Compártelo solo con personas de tu hogar: quien tenga el código puede ver y editar la lista.</p>
          </div>
          <label className="block mt-4 text-[11px] text-slate-400">Nombre del hogar
            <input defaultValue={household.name} onBlur={e => renameHousehold(e.target.value)} className="mt-1 w-full h-11 px-3 rounded-xl bg-white/5 border border-white/10 text-white text-sm outline-none focus:border-brand-lime" />
          </label>
          <Privacy />
          <div className="grid grid-cols-2 gap-2 mt-4">
            <button onClick={leave} className="py-3 rounded-2xl bg-white/[0.07] ring-1 ring-white/10 text-white text-xs font-bold flex items-center justify-center gap-1.5"><LogOut size={14} /> Salir del hogar</button>
            <button onClick={wipe} className="py-3 rounded-2xl bg-rose-500/10 ring-1 ring-rose-400/30 text-rose-300 text-xs font-bold flex items-center justify-center gap-1.5"><Trash2 size={14} /> Borrar del servidor</button>
          </div>
        </div>
       ) : (
        <div>
          <div className="theme-dark rounded-[24px] p-5 bg-gradient-to-br from-[#232C5A] via-[#141B3D] to-[#0B1026] ring-1 ring-lime-300/20">
            <p className="text-white font-extrabold text-base">Una sola lista para toda la casa</p>
            <p className="text-slate-300 text-[13px] mt-1 leading-snug">Tú agregas "leche" y a tu familia le aparece al instante. Si alguien compra algo, se tacha en todos los celulares.</p>
          </div>
          <label className="block mt-4 text-[11px] text-slate-400">Nombre de tu hogar
            <input value={name} onChange={e => setName(e.target.value)} maxLength={40} className="mt-1 w-full h-12 px-4 rounded-2xl bg-white/5 border border-white/10 text-white outline-none focus:border-brand-lime" />
          </label>
          <button onClick={create} disabled={busy} className="mt-3 w-full h-14 rounded-2xl bg-brand-lime text-brand-ink font-extrabold flex items-center justify-center gap-2 disabled:opacity-50 active:scale-[0.98]"><Home size={19} /> {busy ? 'Creando…' : 'Crear mi hogar'}</button>
          <p className="text-center text-[11px] text-slate-400 mt-4 mb-2">¿Ya te invitaron?</p>
          <div className="grid grid-cols-2 gap-2">
            <button onClick={() => setView('scan')} className="py-3 rounded-2xl bg-white/[0.07] ring-1 ring-white/10 text-white text-xs font-bold flex items-center justify-center gap-1.5"><Camera size={15} className="text-brand-lime" /> Escanear QR</button>
            <button onClick={() => setView('paste')} className="py-3 rounded-2xl bg-white/[0.07] ring-1 ring-white/10 text-white text-xs font-bold flex items-center justify-center gap-1.5"><Link2 size={15} className="text-brand-lime" /> Pegar enlace</button>
          </div>
          <Privacy />
        </div>
       )}
    </BottomSheet>
  );
}
