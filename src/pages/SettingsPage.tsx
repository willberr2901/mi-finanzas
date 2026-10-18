import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Bell, ShieldCheck, Database, LifeBuoy, Info, ChevronRight, Fingerprint, Lock, KeyRound, Download, Upload, Trash2, CalendarDays,
  Sparkles, X, Check, Delete, Users, Wallet, PiggyBank, AlarmClock, Palette, Moon, Sun, MonitorSmartphone, Heart, Wand2, CalendarPlus, Pencil,
} from 'lucide-react';
import ModuleHeader from '../components/ui/ModuleHeader';
import MoneyInput from '../components/ui/MoneyInput';
import { useSecurity, biometricSupported } from '../contexts/SecurityContext';
import { enableReminders, sendTestNotification } from '../services/alertsService';
import { activateDailyReminder, dailyGoogleCalendarLink, downloadDailyICS } from '../services/dailyReminder';
import { exportBackup, importBackup } from '../services/backupService';
import { notify } from '../services/notificationService';
import { db, type Transaction } from '../utils/database';
import { resetTours } from '../components/tour/tourState';
import { openShareApp } from '../components/share/ShareAppSheet';
import { usePrefs, cycleFor, cycleProgress, inCycle, ownerLabel, type ThemePref } from '../utils/prefs';
import { EXPENSE_CATEGORIES } from '../utils/categories';
import { formatCOP } from '../utils/format';
import { APP_VERSION } from '../version';

const container = { hidden: {}, show: { transition: { staggerChildren: 0.06 } } };
const item = { hidden: { opacity: 0, y: 16 }, show: { opacity: 1, y: 0, transition: { type: 'spring' as const, damping: 22, stiffness: 220 } } };

const Section = ({ icon: Icon, title, children, id }: { icon: any; title: string; children: ReactNode; id?: string }) => (
  <motion.section id={id} variants={item} className="bg-surface border border-white/5 rounded-3xl overflow-hidden scroll-mt-4">
    <div className="flex items-center gap-3 px-4 pt-4 pb-2">
      <span className="w-9 h-9 rounded-xl bg-gradient-to-br theme-dark from-[#232C5A] to-[#0E1430] ring-1 ring-white/10 flex items-center justify-center"><Icon size={18} className="text-brand-lime" /></span>
      <h2 className="text-white font-bold">{title}</h2>
    </div>
    <div className="divide-y divide-white/5">{children}</div>
  </motion.section>
);

const Row = ({ icon: Icon, title, desc, right, onClick, danger }: { icon?: any; title: string; desc?: ReactNode; right?: ReactNode; onClick?: () => void; danger?: boolean }) => {
  const C: any = onClick ? 'button' : 'div';
  return (
    <C onClick={onClick} className={`w-full flex items-center gap-3 px-4 py-3.5 text-left ${onClick ? 'active:bg-white/5' : ''}`}>
      {Icon && <Icon size={18} className={danger ? 'text-red-400 shrink-0' : 'text-slate-400 shrink-0'} />}
      <span className="flex-1 min-w-0">
        <span className={`block text-sm font-medium ${danger ? 'text-red-300' : 'text-white'}`}>{title}</span>
        {desc && <span className="block text-[11px] text-slate-400 mt-0.5 leading-relaxed">{desc}</span>}
      </span>
      {right ?? (onClick ? <ChevronRight size={16} className="text-slate-600 shrink-0" /> : null)}
    </C>
  );
};

const Toggle = ({ on, onChange, label }: { on: boolean; onChange: (v: boolean) => void; label: string }) => (
  <button role="switch" aria-checked={on} aria-label={label} onClick={(e) => { e.stopPropagation(); onChange(!on); }}
    className={`w-12 h-7 shrink-0 rounded-full p-1 transition-colors ${on ? 'bg-brand-lime' : 'bg-slate-700'}`}>
    <motion.span layout className={`block w-5 h-5 rounded-full shadow ${on ? 'bg-brand-ink' : 'bg-white'}`} style={{ marginLeft: on ? 20 : 0 }} />
  </button>
);

const Sheet = ({ title, subtitle, onClose, children, tall }: { title: string; subtitle?: string; onClose: () => void; children: ReactNode; tall?: boolean }) => (
  <motion.div className="fixed inset-0 z-[130] bg-black/70 backdrop-blur-sm flex items-end justify-center" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose}>
    <motion.div role="dialog" aria-modal="true" aria-label={title} onClick={e => e.stopPropagation()}
      className={`w-full max-w-md bg-surface2 border-t border-white/10 rounded-t-[30px] flex flex-col ${tall ? 'h-[88vh]' : 'max-h-[88vh]'}`}
      initial={{ y: 300 }} animate={{ y: 0 }} exit={{ y: 300 }} transition={{ type: 'spring', damping: 26, stiffness: 260 }}>
      <div className="w-10 h-1.5 rounded-full bg-white/15 mx-auto mt-3" />
      <div className="flex items-start justify-between px-6 pt-3 pb-3">
        <div><h2 className="text-white text-lg font-bold">{title}</h2>{subtitle && <p className="text-xs text-slate-400 mt-0.5">{subtitle}</p>}</div>
        <button onClick={onClose} aria-label="Cerrar" className="p-2 -mr-2 text-slate-400"><X size={20} /></button>
      </div>
      <div className="px-6 pb-8 overflow-y-auto flex-1">{children}</div>
    </motion.div>
  </motion.div>
);

/** Teclado de PIN reutilizable. */
const PinPad = ({ value, onChange }: { value: string; onChange: (v: string) => void }) => (
  <div>
    <div className="flex justify-center gap-4 mb-5">{[0, 1, 2, 3].map(i => <span key={i} className={`w-4 h-4 rounded-full border-2 ${i < value.length ? 'bg-brand-lime border-brand-lime' : 'border-slate-600'}`} />)}</div>
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

type SheetId = null | 'pin' | 'removePin' | 'export' | 'import' | 'delete' | 'names' | 'payday' | 'budgets' | 'daily';

const THEMES: { id: ThemePref; label: string; icon: any }[] = [
  { id: 'dark', label: 'Oscuro', icon: Moon }, { id: 'light', label: 'Claro', icon: Sun }, { id: 'system', label: 'Automático', icon: MonitorSmartphone },
];

export default function SettingsPage() {
  const sec = useSecurity();
  const [prefs, setPrefs] = usePrefs();
  const [params, setParams] = useSearchParams();
  const [name, setName] = useState(localStorage.getItem('miFinanzasUserName') || '');
  const [partner, setPartner] = useState(prefs.names.pareja);
  const [perm, setPerm] = useState<NotificationPermission | 'none'>('Notification' in window ? Notification.permission : 'none');
  const [sheet, setSheet] = useState<SheetId>(null);
  const [pinStep, setPinStep] = useState<'first' | 'confirm'>('first');
  const [pin1, setPin1] = useState(''); const [pin2, setPin2] = useState('');
  const [pass, setPass] = useState(''); const [pass2, setPass2] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [confirmText, setConfirmText] = useState('');
  const [busy, setBusy] = useState(false);
  const [payDay, setPayDay] = useState(prefs.payDay);
  const [draftBudgets, setDraftBudgets] = useState<Record<string, number>>(prefs.budgets);
  const [txs, setTxs] = useState<Transaction[]>([]);
  const [time, setTime] = useState(prefs.reminder.time);
  const fileRef = useRef<HTMLInputElement>(null);

  // Enlaces directos: /ajustes?s=presupuestos abre la hoja de presupuestos.
  useEffect(() => {
    const s = params.get('s');
    if (s === 'presupuestos') openSheet('budgets');
    if (s) { params.delete('s'); setParams(params, { replace: true }); }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => { db.transactions.toArray().then(setTxs).catch(() => {}); }, []);

  const cycle = cycleFor(new Date(), prefs.payDay);
  const previewCycle = cycleFor(new Date(), payDay);
  const previewLeft = cycleProgress(previewCycle).left;

  // Gasto por categoría en el ciclo actual y promedio de los 3 ciclos anteriores (para sugerir).
  const { spentNow, avgPrev } = useMemo(() => {
    const now = new Map<string, number>(); const prev = new Map<string, number>();
    const prevCycles = [1, 2, 3].map(i => cycleFor(new Date(), prefs.payDay, -i));
    let cyclesWithData = 0;
    for (const c of prevCycles) {
      const list = txs.filter(t => t.type === 'expense' && inCycle(t.date, c));
      if (list.length) cyclesWithData++;
      for (const t of list) prev.set(t.category, (prev.get(t.category) ?? 0) + t.amount);
    }
    for (const t of txs) if (t.type === 'expense' && inCycle(t.date, cycle)) now.set(t.category, (now.get(t.category) ?? 0) + t.amount);
    const avg = new Map<string, number>();
    prev.forEach((v, k) => avg.set(k, v / Math.max(1, cyclesWithData)));
    return { spentNow: now, avgPrev: avg };
  }, [txs, prefs.payDay, cycle.startISO]);

  const activeBudgets = Object.values(prefs.budgets).filter(v => v > 0);
  const draftTotal = Object.values(draftBudgets).reduce((a, v) => a + (v || 0), 0);

  function openSheet(id: SheetId) {
    if (id === 'names') { setName(localStorage.getItem('miFinanzasUserName') || ''); setPartner(prefs.names.pareja); }
    if (id === 'payday') setPayDay(prefs.payDay);
    if (id === 'budgets') setDraftBudgets(prefs.budgets);
    if (id === 'daily') setTime(prefs.reminder.time);
    setSheet(id);
  }
  const closeSheet = () => { setSheet(null); setPin1(''); setPin2(''); setPinStep('first'); setPass(''); setPass2(''); setFile(null); setConfirmText(''); };

  const saveNames = () => {
    if (name.trim()) localStorage.setItem('miFinanzasUserName', name.trim()); else localStorage.removeItem('miFinanzasUserName');
    setPrefs({ names: { yo: name.trim(), pareja: partner.trim() } });
    notify({ title: 'Nombres guardados', message: `${name.trim() || 'Yo'}${partner.trim() ? ` y ${partner.trim()}` : ''}`, type: 'success' });
    closeSheet();
  };

  const savePayDay = () => {
    setPrefs({ payDay });
    notify({ title: 'Día de pago guardado', message: payDay === 1 ? 'Tus cuentas van por mes calendario.' : `Tu ciclo va del ${previewCycle.label}.`, type: 'success' });
    window.dispatchEvent(new Event('mf:data-changed'));
    closeSheet();
  };

  const suggestBudgets = () => {
    if (!avgPrev.size) { notify({ title: 'Aún no hay suficientes datos', message: 'Cuando tengas un ciclo completo de gastos podremos sugerirte límites.', type: 'info' }); return; }
    const next: Record<string, number> = { ...draftBudgets };
    avgPrev.forEach((v, k) => { if (v > 0) next[k] = Math.ceil(v / 10000) * 10000; });
    setDraftBudgets(next);
    notify({ title: 'Sugerencia lista', message: 'Basada en lo que gastaste en tus últimos ciclos. Ajústala a tu gusto.', type: 'success' });
  };

  const saveBudgets = () => {
    const clean = Object.fromEntries(Object.entries(draftBudgets).filter(([, v]) => v > 0));
    setPrefs({ budgets: clean });
    window.dispatchEvent(new Event('mf:data-changed'));
    notify({ title: Object.keys(clean).length ? 'Presupuestos guardados' : 'Presupuestos quitados', message: Object.keys(clean).length ? `${Object.keys(clean).length} categorías · ${formatCOP(Object.values(clean).reduce((a, v) => a + v, 0))} en total` : undefined, type: 'success' });
    closeSheet();
  };

  const toggleDaily = async (on: boolean) => {
    if (on) {
      const res = await activateDailyReminder();
      if (res !== 'unsupported') setPerm(res);
      setPrefs({ reminder: { ...prefs.reminder, enabled: true } });
      notify(res === 'granted'
        ? { title: 'Recordatorio diario activado', message: `Te recordaremos a las ${fmtTime(prefs.reminder.time)}. Para que suene siempre, agrégalo también al calendario.`, type: 'success', duration: 6000 }
        : { title: 'Recordatorio activado en la app', message: 'Las notificaciones están bloqueadas: agrégalo al calendario para que suene aunque no abras la app.', type: 'info', duration: 6000 });
    } else {
      setPrefs({ reminder: { ...prefs.reminder, enabled: false } });
    }
  };

  const saveDaily = () => {
    setPrefs({ reminder: { enabled: true, time } });
    if (!prefs.reminder.enabled) toggleDaily(true);
    else notify({ title: 'Hora guardada', message: `Te recordaremos a las ${fmtTime(time)}.`, type: 'success' });
    closeSheet();
  };

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

  const meName = ownerLabel('yo', prefs);
  const partnerName = prefs.names.pareja.trim();
  const initial = (localStorage.getItem('miFinanzasUserName') || meName || '?').trim()[0]?.toUpperCase();

  return (
    <div className="pb-28">
      <ModuleHeader module="ajustes" />
      <motion.div variants={container} initial="hidden" animate="show" className="space-y-4">

        {/* Perfil del hogar */}
        <motion.div variants={item} className="relative overflow-hidden rounded-[28px] p-5 bg-gradient-to-br theme-dark from-[#232C5A] via-[#141B3D] to-[#0B1026] ring-1 ring-lime-300/20">
          <div className="absolute -top-16 -right-12 w-48 h-48 rounded-full bg-lime-300/15 blur-3xl" aria-hidden="true" />
          <div className="relative flex items-center gap-4">
            <div className="flex -space-x-3">
              <span className="w-14 h-14 rounded-2xl bg-brand-lime text-brand-ink text-2xl font-extrabold flex items-center justify-center ring-4 ring-[#141B3D]">{initial}</span>
              {partnerName && <span className="w-14 h-14 rounded-2xl bg-[#8792C4] text-brand-ink text-2xl font-extrabold flex items-center justify-center ring-4 ring-[#141B3D]">{partnerName[0].toUpperCase()}</span>}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-white font-extrabold text-lg truncate">{partnerName ? `${meName} & ${partnerName}` : meName === 'Yo' ? 'Tu hogar' : meName}</p>
              <p className="text-xs text-slate-300">{cycle.isCalendar ? 'Cuentas por mes calendario' : `Ciclo: ${cycle.label}`}</p>
            </div>
            <button onClick={() => openSheet('names')} aria-label="Editar nombres" className="p-2.5 rounded-xl bg-white/[0.08] ring-1 ring-white/10 text-white"><Pencil size={16} /></button>
          </div>
          <div className="relative grid grid-cols-3 gap-2 mt-4">
            {[
              { label: 'Día de pago', value: prefs.payDay === 1 ? '1°' : `${prefs.payDay}`, onClick: () => openSheet('payday') },
              { label: 'Presupuestos', value: String(activeBudgets.length), onClick: () => openSheet('budgets') },
              { label: 'Recordatorio', value: prefs.reminder.enabled ? fmtTime(prefs.reminder.time) : 'No', onClick: () => openSheet('daily') },
            ].map(k => (
              <button key={k.label} onClick={k.onClick} className="rounded-2xl bg-white/[0.06] ring-1 ring-white/10 py-2.5 text-center active:scale-95 transition-transform">
                <p className="text-brand-lime font-extrabold">{k.value}</p>
                <p className="text-[10px] text-slate-300">{k.label}</p>
              </button>
            ))}
          </div>
        </motion.div>

        {/* Recomendar */}
        <motion.button variants={item} onClick={openShareApp} className="w-full flex items-center gap-3 p-4 rounded-3xl bg-gradient-to-r from-brand-lime/20 via-brand-lime/10 to-transparent ring-1 ring-brand-lime/30 text-left active:scale-[0.99] transition-transform">
          <span className="w-11 h-11 rounded-2xl bg-brand-lime flex items-center justify-center shrink-0"><Heart size={20} className="text-brand-ink" fill="currentColor" /></span>
          <span className="flex-1 min-w-0">
            <span className="block text-white font-bold">Recomienda Mi Finanzas</span>
            <span className="block text-xs text-slate-300">Compártela por WhatsApp o con un código QR</span>
          </span>
          <ChevronRight size={18} className="text-slate-300" />
        </motion.button>

        <Section icon={Users} title="Tu hogar">
          <Row icon={Users} title="Nombres del hogar" desc={partnerName ? `${meName} y ${partnerName} · se usan en Pagos y reportes` : 'Cambia "Yo" y "Mi pareja" por sus nombres'} onClick={() => openSheet('names')} />
        </Section>

        <Section icon={Wallet} title="Tu dinero" id="dinero">
          <Row icon={CalendarDays} title="Día de pago" desc={prefs.payDay === 1 ? 'Mes calendario (del 1 al último día)' : `Tu ciclo va del ${cycle.label}`} onClick={() => openSheet('payday')} />
          <Row icon={PiggyBank} title="Presupuestos por categoría" desc={activeBudgets.length ? `${activeBudgets.length} categorías · ${formatCOP(activeBudgets.reduce((a, v) => a + v, 0))} por ciclo` : 'Pon un límite y te avisamos al 80% y al 100%'} onClick={() => openSheet('budgets')} />
        </Section>

        <Section icon={Bell} title="Recordatorios">
          <Row icon={Bell} title={perm === 'granted' ? 'Avisos de pagos: activados' : 'Avisos de pagos en el celular'}
            desc={perm === 'granted' ? 'Te avisamos 2 días antes, el día del pago y si algo se vence.' : perm === 'denied' ? 'Bloqueados. Actívalos en Ajustes del celular → Apps → Chrome → Notificaciones.' : 'Actívalos para que no se te pase ninguna fecha de pago.'}
            right={perm === 'granted' ? <span className="text-brand-lime text-xs font-bold">ACTIVOS</span> : perm === 'default' ? <button onClick={async () => setPerm(await enableReminders())} className="px-3 py-1.5 rounded-xl bg-brand-lime text-brand-ink text-xs font-bold">Activar</button> : undefined} />
          <Row icon={AlarmClock} title="Recordatorio diario de gastos"
            desc={prefs.reminder.enabled ? <>Todos los días a las <button onClick={() => openSheet('daily')} className="text-brand-lime font-bold underline underline-offset-2">{fmtTime(prefs.reminder.time)}</button>, si no has anotado nada.</> : 'Un aviso diario para que no se te olvide anotar lo que gastas.'}
            right={<Toggle on={prefs.reminder.enabled} label="Recordatorio diario" onChange={toggleDaily} />} />
          {prefs.reminder.enabled && <Row icon={CalendarPlus} title="Agregarlo al calendario" desc="Recomendado: suena siempre, aunque no abras la app." onClick={() => openSheet('daily')} />}
          {perm === 'granted' && <Row icon={Sparkles} title="Enviar notificación de prueba" onClick={() => sendTestNotification()} />}
          <Link to="/pagos" className="block"><Row icon={CalendarDays} title="Pagos en el calendario" desc="Desde Pagos agrega tus vencimientos al calendario del celular." right={<ChevronRight size={16} className="text-slate-600" />} /></Link>
        </Section>

        <Section icon={Palette} title="Apariencia">
          <div className="p-4">
            <div className="grid grid-cols-3 gap-2" role="radiogroup" aria-label="Tema">
              {THEMES.map(t => {
                const active = prefs.theme === t.id;
                return (
                  <button key={t.id} role="radio" aria-checked={active} onClick={() => setPrefs({ theme: t.id })}
                    className={`relative rounded-2xl p-2 pb-2.5 ring-2 transition-all ${active ? 'ring-brand-lime bg-white/[0.06]' : 'ring-white/10'}`}>
                    <div className={`h-16 rounded-xl overflow-hidden flex flex-col gap-1 p-1.5 ${t.id === 'light' ? 'theme-swatch-light' : t.id === 'dark' ? 'theme-swatch-dark' : 'theme-swatch-auto'}`}>
                      <span className="h-3 w-3/4 rounded bg-[#C6F432]" />
                      <span className="h-2 w-full rounded swatch-line" />
                      <span className="h-2 w-2/3 rounded swatch-line" />
                    </div>
                    <span className="mt-2 flex items-center justify-center gap-1 text-xs font-bold text-white"><t.icon size={13} />{t.label}</span>
                    {active && <span className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-brand-lime flex items-center justify-center"><Check size={12} className="text-brand-ink" strokeWidth={3} /></span>}
                  </button>
                );
              })}
            </div>
            <p className="text-[11px] text-slate-400 mt-3">"Automático" usa el tema de tu celular.</p>
          </div>
        </Section>

        <Section icon={ShieldCheck} title="Seguridad">
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

        <Section icon={Database} title="Tus datos">
          <Row icon={Download} title="Descargar respaldo cifrado" desc="Un archivo protegido con contraseña (AES-256). Guárdalo en Drive por si cambias de celular." onClick={() => setSheet('export')} />
          <Row icon={Upload} title="Restaurar un respaldo" desc="Recupera tus datos desde un archivo .mfbackup." onClick={() => setSheet('import')} />
          <Link to="/finanzas" className="block"><Row icon={Download} title="Reportes en PDF o Excel" desc="En Finanzas → Reportes." right={<ChevronRight size={16} className="text-slate-600" />} /></Link>
          <Row icon={Trash2} danger title="Borrar todos mis datos" desc="Elimina todo de este celular para siempre." onClick={() => setSheet('delete')} />
        </Section>

        <Section icon={LifeBuoy} title="Ayuda">
          <Row icon={Sparkles} title="Ver de nuevo las guías" desc="Te mostramos otra vez, botón por botón, para qué sirve cada cosa." onClick={() => { resetTours(); notify({ title: 'Guías reiniciadas', message: 'Abre cualquier módulo y te guiaremos.', type: 'success' }); }} />
          <Row icon={Sparkles} title="Ver la bienvenida otra vez" onClick={() => { localStorage.removeItem('miFinanzasWelcomeDone'); sessionStorage.removeItem('mf_welcomed'); window.location.replace('/'); }} />
        </Section>

        <Section icon={Info} title="Acerca de">
          <Row title="Mi Finanzas" desc={`Versión ${APP_VERSION} · Hecho en Colombia`} />
        </Section>
      </motion.div>

      <AnimatePresence>
        {sheet === 'names' && (
          <Sheet title="Nombres del hogar" subtitle="Se usan en Pagos, reportes y en tu saludo." onClose={closeSheet}>
            <label className="block text-xs text-slate-400 mb-1">Tu nombre o apodo</label>
            <input value={name} onChange={e => setName(e.target.value)} maxLength={24} placeholder="Ej: Gato" className="input-modern w-full mb-3" />
            <label className="block text-xs text-slate-400 mb-1">Nombre de tu pareja o de quien comparte gastos</label>
            <input value={partner} onChange={e => setPartner(e.target.value)} maxLength={24} placeholder="Ej: Chumpi (opcional)" className="input-modern w-full mb-4" />
            <p className="text-[11px] text-slate-400 mb-2">Así se verá al asignar un pago:</p>
            <div className="flex flex-wrap gap-2 mb-5">
              {[name.trim() || 'Yo', partner.trim() || 'Mi pareja', 'Compartido'].map(l => <span key={l} className="px-3 py-1.5 rounded-full bg-white/[0.07] ring-1 ring-white/10 text-sm text-white">{l}</span>)}
            </div>
            <button onClick={saveNames} className="btn-primary w-full">Guardar nombres</button>
          </Sheet>
        )}

        {sheet === 'payday' && (
          <Sheet title="¿Qué día te pagan?" subtitle="Tus cuentas del mes empiezan ese día, así cuadran con tu sueldo." onClose={closeSheet}>
            <div className="grid grid-cols-3 gap-2 mb-3">
              {[{ d: 1, l: 'Mes calendario' }, { d: 15, l: 'Día 15' }, { d: 30, l: 'Día 30' }].map(o => (
                <button key={o.d} onClick={() => setPayDay(o.d)} className={`py-2.5 rounded-xl text-xs font-bold ring-1 ${payDay === o.d ? 'bg-brand-lime text-brand-ink ring-brand-lime' : 'bg-white/[0.05] text-white ring-white/10'}`}>{o.l}</button>
              ))}
            </div>
            <div className="grid grid-cols-7 gap-1.5 mb-4" role="radiogroup" aria-label="Día del mes">
              {Array.from({ length: 31 }, (_, i) => i + 1).map(d => (
                <button key={d} role="radio" aria-checked={payDay === d} onClick={() => setPayDay(d)}
                  className={`h-10 rounded-xl text-sm font-semibold transition-colors ${payDay === d ? 'bg-brand-lime text-brand-ink' : 'bg-white/[0.05] text-slate-200'}`}>{d}</button>
              ))}
            </div>
            <div className="rounded-2xl bg-white/[0.05] ring-1 ring-white/10 p-3.5 mb-5">
              <p className="text-xs text-slate-400">Tu ciclo actual</p>
              <p className="text-white font-bold">{previewCycle.isCalendar ? `${previewCycle.label[0].toUpperCase()}${previewCycle.label.slice(1)} (mes calendario)` : previewCycle.label}</p>
              <p className="text-[11px] text-slate-400 mt-0.5">{previewCycle.isCalendar ? `Faltan ${previewLeft} días para fin de mes` : `Faltan ${previewLeft} días para tu próximo pago`}{payDay > 28 ? ' · en meses más cortos se usa el último día' : ''}</p>
            </div>
            <button onClick={savePayDay} className="btn-primary w-full">Guardar día de pago</button>
          </Sheet>
        )}

        {sheet === 'budgets' && (
          <Sheet tall title="Presupuestos por categoría" subtitle={`Límite por ciclo (${cycle.isCalendar ? cycle.label : cycle.label}). Deja en blanco las que no quieras limitar.`} onClose={closeSheet}>
            <div className="sticky top-0 z-10 -mx-6 px-6 pb-3 bg-surface2">
              <div className="flex items-center gap-2">
                <div className="flex-1 rounded-2xl bg-white/[0.05] ring-1 ring-white/10 px-3.5 py-2.5">
                  <p className="text-[11px] text-slate-400">Total presupuestado</p>
                  <p className="text-brand-lime font-extrabold text-lg">{formatCOP(draftTotal)}</p>
                </div>
                <button onClick={suggestBudgets} className="h-full px-3.5 py-3 rounded-2xl bg-white/[0.07] ring-1 ring-white/10 text-white text-xs font-bold flex flex-col items-center gap-1"><Wand2 size={16} className="text-brand-lime" />Sugerir</button>
              </div>
            </div>
            <div className="space-y-2.5">
              {EXPENSE_CATEGORIES.map(cat => {
                const limit = draftBudgets[cat] || 0;
                const spent = spentNow.get(cat) ?? 0;
                const pct = limit ? Math.min(100, (spent / limit) * 100) : 0;
                const avg = avgPrev.get(cat);
                return (
                  <div key={cat} className={`rounded-2xl p-3 ring-1 ${limit ? 'bg-white/[0.06] ring-brand-lime/25' : 'bg-white/[0.03] ring-white/10'}`}>
                    <div className="flex items-center gap-3">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-white">{cat}</p>
                        <p className="text-[11px] text-slate-400">Este ciclo: {formatCOP(spent)}{avg ? ` · promedio ${formatCOP(avg)}` : ''}</p>
                      </div>
                      <div className="w-32 shrink-0"><MoneyInput value={limit} onChange={v => setDraftBudgets(b => ({ ...b, [cat]: v }))} prefix placeholder="Sin límite" ariaLabel={`Límite para ${cat}`} className="input-modern !py-2 !px-3 text-sm text-right" /></div>
                    </div>
                    {limit > 0 && <div className="h-1.5 rounded-full bg-white/[0.07] overflow-hidden mt-2.5"><div className={`h-full rounded-full ${pct >= 100 ? 'bg-rose-400' : pct >= 80 ? 'bg-amber-400' : 'bg-brand-lime'}`} style={{ width: `${pct}%` }} /></div>}
                  </div>
                );
              })}
            </div>
            <div className="sticky bottom-0 -mx-6 px-6 pt-3 bg-gradient-to-t from-surface2 via-surface2 to-transparent">
              <button onClick={saveBudgets} className="btn-primary w-full">Guardar presupuestos</button>
            </div>
          </Sheet>
        )}

        {sheet === 'daily' && (
          <Sheet title="Recordatorio diario" subtitle="Te avisamos si a esa hora no has anotado nada." onClose={closeSheet}>
            <label className="block text-xs text-slate-400 mb-1">¿A qué hora?</label>
            <div className="grid grid-cols-4 gap-2 mb-3">
              {['12:30', '18:00', '20:00', '21:30'].map(t => (
                <button key={t} onClick={() => setTime(t)} className={`py-2.5 rounded-xl text-xs font-bold ring-1 ${time === t ? 'bg-brand-lime text-brand-ink ring-brand-lime' : 'bg-white/[0.05] text-white ring-white/10'}`}>{fmtTime(t)}</button>
              ))}
            </div>
            <input type="time" value={time} onChange={e => setTime(e.target.value || '20:00')} className="input-modern w-full mb-4" aria-label="Hora del recordatorio" />
            <button onClick={saveDaily} className="btn-primary w-full mb-5">Guardar · {fmtTime(time)}</button>
            <div className="rounded-2xl bg-white/[0.05] ring-1 ring-white/10 p-4">
              <p className="text-white font-bold text-sm flex items-center gap-2"><CalendarPlus size={16} className="text-brand-lime" />Para que suene siempre</p>
              <p className="text-[11px] text-slate-400 mt-1 mb-3">El celular puede dormir la app. Agrega el recordatorio a tu calendario y sonará todos los días a las {fmtTime(time)}.</p>
              <div className="grid grid-cols-2 gap-2">
                <a href={dailyGoogleCalendarLink(time)} target="_blank" rel="noopener noreferrer" className="py-2.5 rounded-xl bg-white/[0.08] ring-1 ring-white/10 text-white text-xs font-bold text-center">Google Calendar</a>
                <button onClick={() => downloadDailyICS(time)} className="py-2.5 rounded-xl bg-white/[0.08] ring-1 ring-white/10 text-white text-xs font-bold">iPhone / otro</button>
              </div>
            </div>
          </Sheet>
        )}

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

function fmtTime(t: string) {
  const [h, m] = t.split(':').map(Number);
  if (!Number.isFinite(h)) return t;
  const suffix = h >= 12 ? 'p. m.' : 'a. m.';
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return `${h12}:${String(m || 0).padStart(2, '0')} ${suffix}`;
}
