/**
 * ════════════════════════════════════════════════════════════════════
 * ☕ VENTANA "APÓYANOS" (aporte voluntario por Bre-B)
 * ────────────────────────────────────────────────────────────────────
 * Protagonista: Kai con su tintico (KaiCoffee.tsx); reacciona al valor elegido.
 * 3 pasos: 1) elegir valor (desde $100) → 2) pagar con la llave o el QR Bre-B
 * desde cualquier banco → 3) gracias + insignia "Aliado de Mi Finanzas".
 * Se abre desde el menú ☰ y, de vez en cuando, sola (regla en services/supportService.ts).
 * Es voluntario: no desbloquea nada. La plata llega directo a la cuenta, sin pasarela.
 * ════════════════════════════════════════════════════════════════════
 */
import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Copy, Check, ArrowLeft, Instagram } from 'lucide-react';
import { qrDataURL } from '../../utils/qr';
import { formatCOP } from '../../utils/format';
import MoneyInput from '../ui/MoneyInput';
import { notify } from '../../services/notificationService';
import { openInstagram } from '../social/Instagram';
import { IS_TEST } from '../../utils/env';
import { getHousehold } from '../../services/household/householdSync';
import { incomingOffers } from '../../services/household/debtSync';
import KaiCoffee, { KaiSays } from './KaiCoffee';
import Kai from '../assistant/Kai';
import { kaiSupportLine, SUPPORT_KEY, SUPPORT_QR, SUPPORT_AMOUNTS, MIN_SUPPORT, readSupport, shouldOfferSupport, countOpen, markAsked, markDismissed, markSupported, claimPromptSlot } from '../../services/supportService';

type Step = 'choose' | 'pay' | 'thanks';

export default function SupportSheet({ ready }: { ready: boolean }) {
  const [open, setOpen] = useState(false);
  const [auto, setAuto] = useState(false);
  const [step, setStep] = useState<Step>('choose');
  const [amount, setAmount] = useState(2000);
  const [other, setOther] = useState(false);
  const [qr, setQr] = useState('');
  const [copied, setCopied] = useState(false);
  const [touched, setTouched] = useState(false);

  const show = (isAuto: boolean) => { setAuto(isAuto); setStep('choose'); setOther(false); setCopied(false); setTouched(false); setAmount(2000); setOpen(true); };

  useEffect(() => { countOpen(); }, []);
  useEffect(() => {
    const on = () => show(false);
    window.addEventListener('mf:open-support', on);
    return () => window.removeEventListener('mf:open-support', on);
  }, []);
  // De vez en cuando, sola (nunca junto a otra ventana)
  useEffect(() => {
    // En la app de pruebas sale en cada apertura para poder revisarla
    if (!ready || !(IS_TEST || shouldOfferSupport(readSupport()))) return;
    // Espera a que no haya otra ventana (bienvenida, novedades, deudas…) y sale con calma.
    // Revisa cada 4 s durante máx. 3 min; una sola ventana "sola" por apertura.
    let tries = 0, calm = 0;
    let t2: ReturnType<typeof setTimeout>;
    const attempt = () => {
      const debtWaiting = !!getHousehold() && incomingOffers(false).length > 0;  // primero la solicitud del hogar
      if (debtWaiting || document.querySelector('[role="dialog"]')) { calm = 0; if (++tries < 45) t2 = setTimeout(attempt, 4000); return; }
      if (++calm < 2) { t2 = setTimeout(attempt, 4000); return; }   // 2 revisiones seguidas sin ventanas
      if (!IS_TEST && !claimPromptSlot()) return;
      markAsked(); show(true);
    };
    t2 = setTimeout(attempt, 6000);
    return () => clearTimeout(t2);
  }, [ready]);
  useEffect(() => {
    if (step === 'pay' && !qr) qrDataURL(SUPPORT_QR, { margin: 1, width: 360, errorCorrectionLevel: 'M', color: { dark: '#0B1026', light: '#FFFFFF' } }).then(setQr).catch(() => {});
  }, [step, qr]);

  const close = () => { if (auto && step === 'choose') markDismissed(); setOpen(false); };
  const copy = async () => {
    try { await navigator.clipboard.writeText(SUPPORT_KEY); setCopied(true); setTimeout(() => setCopied(false), 2000); }
    catch { notify({ title: `La llave es ${SUPPORT_KEY}`, message: 'Cópiala a mano en tu banco.', type: 'info', log: false }); }
  };
  const goPay = () => {
    if (amount < MIN_SUPPORT) return notify({ title: `Desde ${formatCOP(MIN_SUPPORT)}`, message: 'Escribe un valor de $100 o más.', type: 'info', log: false });
    setStep('pay');
  };
  const done = () => { markSupported(); setStep('thanks'); };
  const line = kaiSupportLine(amount, touched);

  return createPortal(
    <AnimatePresence>
      {open && (
        <motion.div className="fixed inset-0 z-[150] bg-black/75 backdrop-blur-sm flex items-center justify-center p-5" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={close}>
          <motion.div role="dialog" aria-modal="true" aria-labelledby="support-title" onClick={e => e.stopPropagation()}
            initial={{ y: -60, scale: 0.9, opacity: 0, rotate: -2 }} animate={{ y: 0, scale: 1, opacity: 1, rotate: 0 }} exit={{ y: 40, opacity: 0 }} transition={{ type: 'spring', damping: 17, stiffness: 240 }}
            className="theme-dark relative w-full max-w-sm max-h-[92vh] overflow-y-auto rounded-[30px] bg-[#121938] border border-white/10 shadow-2xl shadow-black/60">

            {step === 'choose' && (<>
              <div className={`relative px-5 pt-4 pb-[104px] bg-gradient-to-br transition-colors ${line.mood === 'celebra' ? 'from-lime-200 via-brand-lime to-emerald-300' : 'from-amber-200 via-orange-300 to-pink-300'}`}>
                <div aria-hidden="true" className="pointer-events-none absolute -right-6 -top-8 w-32 h-32 rounded-full bg-white/30 blur-2xl" />
                <div className="relative z-10 flex items-center justify-between"><p className="relative text-[11px] font-extrabold tracking-widest text-[#2A0A1F]">💚 APOYA A MI FINANZAS</p>
                  <button onClick={close} aria-label="Cerrar" className="p-1 text-[#2A0A1F]/70"><X size={18} /></button></div>
              </div>
              <div className="relative z-10 -mt-[104px] flex justify-center"><motion.div initial={{ y: 30, scale: 0.7, opacity: 0 }} animate={{ y: 0, scale: 1, opacity: 1 }} transition={{ delay: 0.15, type: 'spring', damping: 13 }}><KaiCoffee mood={line.mood} size={132} /></motion.div></div>
              <div className="relative z-10 px-5 -mt-1"><KaiSays text={line.text} k={line.text} /></div>
              <div className="px-5 pb-5 pt-3 text-center">
                <h2 id="support-title" className="text-white text-xl font-extrabold leading-tight">Mi Finanzas es gratis<br /><span className="text-brand-lime">y lo seguirá siendo</span></h2>
                <p className="text-[13px] text-slate-300 mt-2">Si te ayuda, puedes apoyarnos con lo que quieras, desde $100. Nos ayuda a seguir mejorándola sin anuncios y sin pedir tus datos.</p>
                <div className="grid grid-cols-3 gap-2 mt-4">
                  {SUPPORT_AMOUNTS.map(v => (
                    <motion.button key={v} whileTap={{ scale: 0.93 }} onClick={() => { setAmount(v); setOther(false); setTouched(true); }} aria-pressed={!other && amount === v}
                      className={`h-12 rounded-2xl font-extrabold ${!other && amount === v ? 'bg-brand-lime text-brand-ink' : 'bg-white/[0.06] ring-1 ring-white/10 text-white'}`}>{formatCOP(v)}</motion.button>
                  ))}
                  <motion.button whileTap={{ scale: 0.93 }} onClick={() => { setOther(true); setAmount(0); setTouched(true); }} aria-pressed={other}
                    className={`h-12 rounded-2xl text-sm font-extrabold ${other ? 'bg-brand-lime text-brand-ink' : 'bg-white/[0.06] ring-1 ring-white/10 text-white'}`}>Otro valor</motion.button>
                </div>
                {other && <MoneyInput value={amount} onChange={setAmount} prefix placeholder="Desde $100" ariaLabel="Otro valor" className="mt-2 w-full h-12 px-4 rounded-2xl bg-white/5 border border-white/10 text-white text-center font-bold outline-none focus:border-brand-lime" />}
                <motion.button whileTap={{ scale: 0.96 }} onClick={goPay} className="mt-4 w-full py-3.5 rounded-2xl bg-brand-lime text-brand-ink font-extrabold">
                  {amount >= MIN_SUPPORT ? `Apoyar con ${formatCOP(amount)} por Bre-B` : 'Apoyar por Bre-B'}
                </motion.button>
                {auto && <button onClick={close} className="mt-2 w-full h-11 text-sm font-bold text-slate-400">Ahora no</button>}
                <p className="text-[11px] text-slate-500 mt-2">Es voluntario: no se desbloquea nada ni cambia la app.</p>
              </div>
            </>)}

            {step === 'pay' && (
              <div className="p-5">
                <div className="flex items-center justify-between">
                  <button onClick={() => setStep('choose')} aria-label="Volver" className="p-1 -ml-1 text-slate-300"><ArrowLeft size={20} /></button>
                  <button onClick={close} aria-label="Cerrar" className="p-1 text-slate-300"><X size={20} /></button>
                </div>
                <div className="flex items-center gap-2 mt-1"><span className="shrink-0"><Kai mood="normal" size={56} still title="Kai" /></span><p className="relative rounded-2xl rounded-tl-[4px] bg-[#fff] text-[#0B1026] px-3 py-2 text-[13px] font-bold">Son 3 pasos, yo te acompaño 👇</p></div>
                <p className="text-[11px] font-extrabold tracking-widest text-slate-400 mt-2">APOYAR CON {formatCOP(amount)}</p>
                <h2 id="support-title" className="text-white text-xl font-extrabold leading-tight mt-1">Desde tu banco, <span className="text-brand-lime">en 3 pasos</span></h2>
                <div className="mt-4 p-4 rounded-2xl bg-white/[0.05] ring-1 ring-brand-lime/40">
                  <p className="text-[11px] font-extrabold tracking-widest text-slate-400">LLAVE BRE-B</p>
                  <div className="flex items-center justify-between gap-2 mt-1">
                    <span className="text-2xl font-extrabold text-white tracking-wide">{SUPPORT_KEY}</span>
                    <motion.button whileTap={{ scale: 0.92 }} onClick={copy} className="px-3 h-9 rounded-xl bg-brand-lime text-brand-ink text-sm font-extrabold flex items-center gap-1.5">{copied ? <><Check size={15} strokeWidth={3} /> Copiada</> : <><Copy size={15} /> Copiar</>}</motion.button>
                  </div>
                </div>
                <ol className="mt-4 space-y-2.5 text-sm text-slate-200">
                  {[<>Abre la app de tu banco o billetera</>, <>Entra a <b className="text-white">Bre-B → enviar con llave</b></>, <>Pega la llave y escribe <b className="text-white">{formatCOP(amount)}</b></>].map((t, i) => (
                    <li key={i} className="flex items-center gap-3"><span className="w-7 h-7 shrink-0 rounded-full bg-brand-lime text-brand-ink text-sm font-extrabold flex items-center justify-center">{i + 1}</span><span>{t}</span></li>
                  ))}
                </ol>
                <div className="mt-4 p-4 rounded-2xl bg-white text-center">
                  {qr ? <img src={qr} alt="Código QR Bre-B para apoyar a Mi Finanzas" className="w-52 h-52 mx-auto" /> : <div className="w-52 h-52 mx-auto rounded-lg bg-slate-200 animate-pulse" />}
                  <p className="text-[#0B1026] text-[13px] font-semibold mt-2">O escanea este código desde la app de tu banco</p>
                  <p className="text-slate-500 text-[11px]">Código QR Bre-B de la llave {SUPPORT_KEY}</p>
                </div>
                <motion.button whileTap={{ scale: 0.96 }} onClick={done} className="mt-4 w-full py-3.5 rounded-2xl bg-brand-lime text-brand-ink font-extrabold">Ya apoyé 💚</motion.button>
                <p className="text-[11px] text-slate-500 text-center mt-2">Sin comisiones: Bre-B es gratis e inmediato.</p>
              </div>
            )}

            {step === 'thanks' && (
              <div className="p-6 text-center">
                <motion.div initial={{ scale: 0.3, y: 30 }} animate={{ scale: 1, y: 0 }} transition={{ type: 'spring', damping: 10 }} className="relative flex justify-center">
                  {[...Array(16)].map((_, i) => (
                    <motion.i key={i} aria-hidden="true" className="absolute w-2 h-3.5 rounded-[2px]" style={{ background: ['#C6F432', '#F9A8D4', '#7DD3FC', '#FBBF24'][i % 4], left: `${(i * 37) % 100}%`, top: 0 }}
                      initial={{ y: -20, opacity: 0, rotate: 0 }} animate={{ y: [-20, 150], opacity: [0, 1, 1, 0], rotate: 360 }} transition={{ duration: 2.2, delay: (i % 8) * 0.12, repeat: 2 }} />
                  ))}
                  <Kai mood="celebra" size={160} title="Kai celebrando" />
                </motion.div>
                <h2 id="support-title" className="text-white text-2xl font-extrabold mt-3">¡Gracias por <span className="text-brand-lime">apoyarnos!</span></h2>
                <p className="text-sm text-slate-300 mt-2">Kai está feliz 🤖💚 Tu aporte nos ayuda a mantener Mi Finanzas gratis, sin anuncios y sin pedir tus datos.</p>
                <div className="mt-5 p-3 rounded-2xl bg-gradient-to-br from-amber-200/20 to-brand-lime/10 ring-1 ring-amber-200/40 text-left flex items-center gap-3">
                  <span className="shrink-0 w-12 h-12 rounded-full bg-[radial-gradient(#FDE68A,#F59E0B)] flex items-center justify-center"><Kai mood="feliz" size={38} still title="Kai" /></span>
                  <span><span className="block text-white font-extrabold text-sm">Insignia "Aliado de Mi Finanzas"</span>
                  <span className="block text-[12px] text-slate-400 mt-0.5">Aparece en tu menú como agradecimiento (solo en tu celular).</span></span>
                </div>
                <button onClick={() => { openInstagram(); }} className="mt-5 w-full h-12 rounded-2xl bg-white/[0.07] ring-1 ring-white/10 text-white font-bold flex items-center justify-center gap-2"><Instagram size={18} /> Síguenos en Instagram</button>
                <motion.button whileTap={{ scale: 0.96 }} onClick={() => setOpen(false)} className="mt-2 w-full py-3.5 rounded-2xl bg-brand-lime text-brand-ink font-extrabold">Volver a la app</motion.button>
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body,
  );
}
