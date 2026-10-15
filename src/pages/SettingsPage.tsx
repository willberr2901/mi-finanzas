import { useRef, useState, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { User, Bell, ShieldCheck, Database, LifeBuoy, Info, ChevronRight, Fingerprint, Lock, KeyRound, Download, Upload, Trash2, CalendarDays, Sparkles, X, Check, Delete } from 'lucide-react';
import ModuleHeader from '../components/ui/ModuleHeader';
import { useSecurity, biometricSupported } from '../contexts/SecurityContext';
import { enableReminders, sendTestNotification } from '../services/alertsService';
import { exportBackup, importBackup } from '../services/backupService';
import { notify } from '../services/notificationService';
import { db } from '../utils/database';
import { resetTours } from '../components/tour/tourState';
import { APP_VERSION } from '../version';

const container = { hidden: {}, show: { transition: { staggerChildren: 0.06 } } };
const item = { hidden: { opacity: 0, y: 16 }, show: { opacity: 1, y: 0, transition: { type: 'spring' as const, damping: 22, stiffness: 220 } } };

const Section = ({ icon: Icon, title, gradient, children }: { icon: any; title: string; gradient: string; children: ReactNode }) => (
  <motion.section variants={item} className="bg-[#111827] border border-white/5 rounded-3xl overflow-hidden">
    <div className="flex items-center gap-3 px-4 pt-4 pb-2">
      <span className={`w-9 h-9 rounded-xl bg-gradient-to-br ${gradient} flex items-center justify-center shadow-md`}><Icon size={18} className="text-white" /></span>
      <h2 className="text-white font-bold">{title}</h2>
    </div>
    <div className="divide-y divide-white/5">{children}</div>
  </motion.section>
);

const Row = ({ icon: Icon, title, desc, right, onClick, danger }: { icon?: any; title: string; desc?: string; right?: ReactNode; onClick?: () => void; danger?: boolean }) => {
  const C: any = onClick ? 'button' : 'div';
  return (
    <C onClick={onClick} className={`w-full flex items-center gap-3 px-4 py-3.5 text-left ${onClick ? 'active:bg-white/5' : ''}`}>
      {Icon && <Icon size={18} className={danger ? 'text-red-400' : 'text-slate-400'} />}
      <span className="flex-1 min-w-0">
        <span className={`block text-sm font-medium ${danger ? 'text-red-300' : 'text-white'}`}>{title}</span>
        {desc && <span className="block text-[11px] text-slate-400 mt-0.5 leading-relaxed">{desc}</span>}
      </span>
      {right ?? (onClick ? <ChevronRight size={16} className="text-slate-600" /> : null)}
    </C>
  );
};

const Toggle = ({ on, onChange, label }: { on: boolean; onChange: (v: boolean) => void; label: string }) => (
  <button role="switch" aria-checked={on} aria-label={label} onClick={(e) => { e.stopPropagation(); onChange(!on); }}
    className={`w-12 h-7 rounded-full p-1 transition-colors ${on ? 'bg-emerald-500' : 'bg-slate-700'}`}>
    <motion.span layout className="block w-5 h-5 rounded-full bg-white shadow" style={{ marginLeft: on ? 20 : 0 }} />
  </button>
);

const Sheet = ({ title, onClose, children }: { title: string; onClose: () => void; children: ReactNode }) => (
  <motion.div className="fixed inset-0 z-[130] bg-black/70 backdrop-blur-sm flex items-end justify-center" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose}>
    <motion.div role="dialog" aria-modal="true" aria-label={title} onClick={e => e.stopPropagation()} className="w-full max-w-md bg-[#111827] border border-white/10 rounded-t-3xl p-6 pb-10"
      initial={{ y: 200 }} animate={{ y: 0 }} exit={{ y: 200 }} transition={{ type: 'spring', damping: 26, stiffness: 260 }}>
      <div className="flex items-center justify-between mb-4"><h2 className="text-white text-lg font-bold">{title}</h2>
        <button onClick={onClose} aria-label="Cerrar" className="p-2 text-slate-400"><X size={20} /></button></div>
      {children}
    </motion.div>
  </motion.div>
);

/** Teclado de PIN reutilizable. */
const PinPad = ({ value, onChange }: { value: string; onChange: (v: string) => void }) => (
  <div>
    <div className="flex justify-center gap-4 mb-5">{[0, 1, 2, 3].map(i => <span key={i} className={`w-4 h-4 rounded-full border-2 ${i < value.length ? 'bg-violet-400 border-violet-400' : 'border-slate-600'}`} />)}</div>
    <div className="grid grid-cols-3 gap-3">
      {['1', '2', '3', '4', '5', '6', '7', '8', '9', '', '0', '<'].map((d, i) => d === '' ? <span key={i} /> : (
        <motion.button key={i} whileTap={{ scale: 0.9 }} aria-label={d === '<' ? 'Borrar' : d}
          onClick={() => onChange(d === '<' ? value.slice(0, -1) : (value + d).slice(0, 4))}
          className={`h-14 rounded-2xl text-xl font-semibold ${d === '<' ? 'text-slate-300 flex items-center justify-center' : 'bg-white/5 border border-white/10 text-white'}`}>
          {d === '<' ? <Delete size={22} /> : d}
        </motion.button>
      ))}
    </div>
  </div>
);

export default function SettingsPage() {
  const sec = useSecurity();
  const [name, setName] = useState(localStorage.getItem('miFinanzasUserName') || '');
  const [perm, setPerm] = useState<NotificationPermission | 'none'>('Notification' in window ? Notification.permission : 'none');
  const [sheet, setSheet] = useState<null | 'pin' | 'removePin' | 'export' | 'import' | 'delete'>(null);
  const [pinStep, setPinStep] = useState<'first' | 'confirm'>('first');
  const [pin1, setPin1] = useState(''); const [pin2, setPin2] = useState('');
  const [pass, setPass] = useState(''); const [pass2, setPass2] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [confirmText, setConfirmText] = useState('');
  const [busy, setBusy] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const saveName = () => {
    if (name.trim()) localStorage.setItem('miFinanzasUserName', name.trim()); else localStorage.removeItem('miFinanzasUserName');
    notify({ title: 'Nombre guardado', message: name.trim() || 'Sin nombre', type: 'success' });
  };

  const closeSheet = () => { setSheet(null); setPin1(''); setPin2(''); setPinStep('first'); setPass(''); setPass2(''); setFile(null); setConfirmText(''); };

  const onPinChange = async (v: string) => {
    if (pinStep === 'first') { setPin1(v); if (v.length === 4) setTimeout(() => setPinStep('confirm'), 200); return; }
    setPin2(v);
    if (v.length === 4) {
      if (v === pin1) { await sec.setupPin(v); notify({ title: 'PIN activado', message: 'La app pedirá tu PIN al abrirla.', type: 'success' }); closeSheet(); }
      else { notify({ title: 'Los PIN no coinciden', message: 'Intenta de nuevo.', type: 'error' }); setPin1(''); setPin2(''); setPinStep('first'); }
    }
  };

  const onRemovePin = async (v: string) => {
    setPin1(v);
    if (v.length === 4) {
      if (await sec.verifyPin(v)) { sec.removePin(); notify({ title: 'PIN desactivado', type: 'info' }); closeSheet(); }
      else { notify({ title: 'PIN incorrecto', type: 'error' }); setPin1(''); }
    }
  };

  const doExport = async () => {
    if (pass.length < 6) return notify({ title: 'Contraseña muy corta', message: 'Usa al menos 6 caracteres.', type: 'error' });
    if (pass !== pass2) return notify({ title: 'Las contraseñas no coinciden', type: 'error' });
    setBusy(true);
    try { await exportBackup(pass); notify({ title: 'Respaldo cifrado descargado', message: 'Guárdalo en Drive o donde quieras. Sin la contraseña nadie lo puede abrir.', type: 'success', duration: 6000 }); closeSheet(); }
    finally { setBusy(false); }
  };

  const doImport = async () => {
    if (!file || !pass) return;
    setBusy(true);
    try {
      const date = await importBackup(file, pass);
      notify({ title: 'Respaldo restaurado', message: `Datos del ${new Date(date).toLocaleDateString('es-CO')}. La app se recargará.`, type: 'success' });
      setTimeout(() => window.location.reload(), 1500);
    } catch (e: any) { notify({ title: 'No se pudo restaurar', message: e.message, type: 'error' }); }
    finally { setBusy(false); }
  };

  const doDelete = async () => {
    try { db.close(); await db.delete(); } catch { /* ya no existe */ }
    localStorage.clear(); sessionStorage.clear();
    try { const keys = await caches.keys(); await Promise.all(keys.filter(k => k.startsWith('mf-')).map(k => caches.delete(k))); } catch { /* sin caché */ }
    notify({ title: 'Todo se borró de este celular', message: 'La app se reiniciará.', type: 'info' });
    setTimeout(() => window.location.replace('/'), 1500);
  };

  return (
    <div className="pb-28">
      <ModuleHeader module="ajustes" />
      <motion.div variants={container} initial="hidden" animate="show" className="space-y-4">

        <Section icon={User} title="Perfil" gradient="from-violet-600 to-indigo-500">
          <div className="flex items-center gap-3 px-4 py-4">
            <span className="w-14 h-14 rounded-2xl bg-gradient-to-br from-violet-500 to-cyan-400 flex items-center justify-center text-brand-ink text-2xl font-bold">{(name || '?').trim()[0]?.toUpperCase()}</span>
            <div className="flex-1">
              <label className="text-[11px] text-slate-400">¿Cómo te saludamos?</label>
              <div className="flex gap-2 mt-1">
                <input value={name} onChange={e => setName(e.target.value)} maxLength={24} placeholder="Tu nombre o apodo" className="input-modern flex-1 !py-2" />
                <button onClick={saveName} aria-label="Guardar nombre" className="px-3 rounded-xl bg-violet-600 text-brand-ink"><Check size={18} /></button>
              </div>
              <p className="text-[10px] text-slate-500 mt-1">Queda solo en este celular.</p>
            </div>
          </div>
        </Section>

        <Section icon={Bell} title="Notificaciones" gradient="from-fuchsia-500 to-violet-600">
          <Row title={perm === 'granted' ? 'Avisos en el celular: activados' : 'Avisos en el celular'}
            desc={perm === 'granted' ? 'Te avisamos 2 días antes, el día del pago y si algo se vence.' : perm === 'denied' ? 'Bloqueados. Actívalos en Ajustes del celular → Apps → Chrome → Notificaciones.' : 'Actívalos para que no se te pase ninguna fecha de pago.'}
            right={perm === 'granted' ? <span className="text-emerald-400 text-xs font-bold">ACTIVOS</span> : perm === 'default' ? <button onClick={async () => setPerm(await enableReminders())} className="px-3 py-1.5 rounded-xl bg-fuchsia-600 text-brand-ink text-xs font-bold">Activar</button> : undefined} />
          {perm === 'granted' && <Row icon={Sparkles} title="Enviar notificación de prueba" onClick={() => sendTestNotification()} />}
          <Link to="/pagos" className="block"><Row icon={CalendarDays} title="Recordatorios en el calendario" desc="Desde Pagos agrega todos tus vencimientos al calendario del celular: avisan aunque no abras la app." right={<ChevronRight size={16} className="text-slate-600" />} /></Link>
        </Section>

        <Section icon={ShieldCheck} title="Seguridad" gradient="from-emerald-600 to-teal-500">
          <Row icon={KeyRound} title={sec.isSetup ? 'PIN de acceso activado' : 'Proteger con PIN'}
            desc={sec.isSetup ? 'La app pide tu PIN al abrirla. Se guarda cifrado (hash PBKDF2), nunca el número.' : 'Pide un PIN de 4 dígitos cada vez que abras la app.'}
            right={<Toggle on={sec.isSetup} label="PIN de acceso" onChange={v => setSheet(v ? 'pin' : 'removePin')} />} />
          {sec.isSetup && biometricSupported() && (
            <Row icon={Fingerprint} title="Desbloquear con huella o rostro" desc="Usa el sensor de tu celular. La huella nunca sale del celular."
              right={<Toggle on={sec.biometricEnabled} label="Huella" onChange={async v => {
                if (v) notify(await sec.enableBiometric() ? { title: 'Huella activada', type: 'success' } : { title: 'No se pudo activar la huella', message: 'Tu celular o navegador no lo permite.', type: 'error' });
                else sec.disableBiometric();
              }} />} />
          )}
          {sec.isSetup && (
            <Row icon={Lock} title="Bloqueo automático" desc="Al salir de la app, pedir PIN después de:"
              right={<select value={sec.autoLockMinutes} onChange={e => sec.setAutoLockMinutes(Number(e.target.value))} className="bg-slate-800 text-white text-xs rounded-lg px-2 py-1.5 border border-white/10" aria-label="Tiempo de bloqueo automático">
                <option value={0}>Inmediato</option><option value={1}>1 min</option><option value={5}>5 min</option><option value={15}>15 min</option>
              </select>} />
          )}
          {sec.isSetup && <Row icon={Lock} title="Bloquear ahora" onClick={() => sec.lockNow()} />}
          <Link to="/legal" className="block"><Row icon={ShieldCheck} title="Privacidad y términos" desc="Sin registro y sin servidores: tus datos viven solo en este celular." right={<ChevronRight size={16} className="text-slate-600" />} /></Link>
        </Section>

        <Section icon={Database} title="Tus datos" gradient="from-blue-600 to-cyan-500">
          <Row icon={Download} title="Descargar respaldo cifrado" desc="Un archivo protegido con contraseña (AES-256). Guárdalo en Drive por si cambias de celular." onClick={() => setSheet('export')} />
          <Row icon={Upload} title="Restaurar un respaldo" desc="Recupera tus datos desde un archivo .mfbackup." onClick={() => setSheet('import')} />
          <Link to="/finanzas" className="block"><Row icon={Download} title="Reportes en PDF o Excel" desc="En Finanzas → Reportes." right={<ChevronRight size={16} className="text-slate-600" />} /></Link>
          <Row icon={Trash2} danger title="Borrar todos mis datos" desc="Elimina todo de este celular para siempre." onClick={() => setSheet('delete')} />
        </Section>

        <Section icon={LifeBuoy} title="Ayuda" gradient="from-amber-500 to-orange-500">
          <Row icon={Sparkles} title="Ver de nuevo las guías" desc="Te mostramos otra vez, botón por botón, para qué sirve cada cosa." onClick={() => { resetTours(); notify({ title: 'Guías reiniciadas', message: 'Abre cualquier módulo y te guiaremos.', type: 'success' }); }} />
          <Row icon={Sparkles} title="Ver la bienvenida otra vez" onClick={() => { localStorage.removeItem('miFinanzasWelcomeDone'); window.location.replace('/'); }} />
        </Section>

        <Section icon={Info} title="Acerca de" gradient="from-slate-500 to-slate-700">
          <Row title="Mi Finanzas" desc={`Versión ${APP_VERSION} · Hecho en Colombia`} />
        </Section>
      </motion.div>

      <AnimatePresence>
        {sheet === 'pin' && (
          <Sheet title={pinStep === 'first' ? 'Crea tu PIN de 4 dígitos' : 'Repite tu PIN'} onClose={closeSheet}>
            <p className="text-slate-400 text-sm mb-5 text-center">{pinStep === 'first' ? 'Lo pediremos al abrir la app.' : 'Para confirmar que lo escribiste bien.'}</p>
            <PinPad value={pinStep === 'first' ? pin1 : pin2} onChange={onPinChange} />
          </Sheet>
        )}
        {sheet === 'removePin' && (
          <Sheet title="Escribe tu PIN para quitarlo" onClose={closeSheet}><PinPad value={pin1} onChange={onRemovePin} /></Sheet>
        )}
        {sheet === 'export' && (
          <Sheet title="Respaldo cifrado" onClose={closeSheet}>
            <p className="text-slate-400 text-sm mb-4">Crea una contraseña para proteger el archivo. <strong className="text-white">Si la olvidas, el respaldo no se puede abrir.</strong></p>
            <input type="password" value={pass} onChange={e => setPass(e.target.value)} placeholder="Contraseña (mínimo 6)" className="input-modern w-full mb-2" autoComplete="new-password" />
            <input type="password" value={pass2} onChange={e => setPass2(e.target.value)} placeholder="Repite la contraseña" className="input-modern w-full mb-4" autoComplete="new-password" />
            <button disabled={busy} onClick={doExport} className="btn-primary w-full">{busy ? 'Cifrando…' : 'Descargar respaldo'}</button>
          </Sheet>
        )}
        {sheet === 'import' && (
          <Sheet title="Restaurar respaldo" onClose={closeSheet}>
            <p className="text-slate-400 text-sm mb-4">Reemplaza los datos actuales de este celular por los del respaldo.</p>
            <input ref={fileRef} type="file" accept=".mfbackup,application/octet-stream,application/json" className="hidden" onChange={e => setFile(e.target.files?.[0] ?? null)} />
            <button onClick={() => fileRef.current?.click()} className="w-full p-4 rounded-2xl border border-dashed border-white/20 text-sm text-slate-300 mb-3">{file ? file.name : 'Elegir archivo .mfbackup'}</button>
            <input type="password" value={pass} onChange={e => setPass(e.target.value)} placeholder="Contraseña del respaldo" className="input-modern w-full mb-4" autoComplete="current-password" />
            <button disabled={busy || !file || !pass} onClick={doImport} className="btn-primary w-full disabled:opacity-50">{busy ? 'Restaurando…' : 'Restaurar'}</button>
          </Sheet>
        )}
        {sheet === 'delete' && (
          <Sheet title="¿Borrar todo?" onClose={closeSheet}>
            <p className="text-slate-300 text-sm mb-4">Se eliminan movimientos, mercado, pagos, metas, facturas, PIN y ajustes de este celular. <strong className="text-red-300">No se puede deshacer.</strong> Te recomendamos descargar un respaldo antes.</p>
            <label className="text-xs text-slate-400">Escribe <strong className="text-white">BORRAR</strong> para confirmar</label>
            <input value={confirmText} onChange={e => setConfirmText(e.target.value)} className="input-modern w-full mt-1 mb-4" autoCapitalize="characters" />
            <button disabled={confirmText.trim().toUpperCase() !== 'BORRAR'} onClick={doDelete} className="w-full py-3.5 rounded-2xl bg-red-600 text-white font-bold disabled:opacity-40">Borrar todo para siempre</button>
          </Sheet>
        )}
      </AnimatePresence>
    </div>
  );
}
