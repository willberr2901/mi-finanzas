/**
 * ════════════════════════════════════════════════════════════════════
 * ☕ APÓYANOS (aportes voluntarios por Bre-B)
 * ────────────────────────────────────────────────────────────────────
 * Qué hace: datos de la llave Bre-B de Gato para recibir aportes voluntarios
 *           (desde $100, sin comisión, directo a la cuenta) y la regla de cuándo
 *           ofrecer "Apóyanos" sin ser intensos.
 * Cuándo se ofrece solo (shouldOfferSupport):
 *   • Primera vez: cuando la persona ya lleva 5 días usando la app y la abrió 5 veces o más.
 *   • Si dice "Ahora no": se espera cada vez más → 14, 30, 60 y luego 120 días.
 *   • Si dice "Ya apoyé": no se vuelve a ofrecer en 180 días.
 *   • Nunca el mismo día en que salió otra ventana (encuesta, síguenos, novedades…).
 * Siempre se puede abrir desde el menú ☰ → Apóyanos.
 * Datos: solo en el celular (localStorage 'mf_support'). La app no sabe si pagó: es voluntario.
 * Para cambiar la llave o el QR: SUPPORT_KEY y SUPPORT_QR (el QR es el texto oficial que genera el banco).
 * ════════════════════════════════════════════════════════════════════
 */
export const SUPPORT_KEY = '@WBR617';
export const SUPPORT_BANK = 'Nu';
/** Contenido exacto del QR Bre-B de la llave (verificado con su código de control CRC). */
export const SUPPORT_QR = '00020101021126290014CO.COM.RBM.LLA0407@wbr61749250014CO.COM.RBM.RED0103RBM50310013CO.COM.RBM.CU0110000000000051220013CO.COM.RBM.CA010105204000053031705802CO59010600106101062270710CC4006D149080200110363180270016CO.COM.RBM.CANAL0103APP81250015CO.COM.RBM.CIVA01020282260014CO.COM.RBM.IVA01040.0083270015CO.COM.RBM.BASE01040.0084250015CO.COM.RBM.CINC01020285260014CO.COM.RBM.INC01040.0090430016CO.COM.RBM.TRXID0119000000Rt6lWnaGTmuIY91460014CO.COM.RBM.SEC0124kq2StfW5Q/P5vQESHHe1Du0/6304255A';
export const SUPPORT_AMOUNTS = [1000, 2000, 5000, 10000, 20000];
export const MIN_SUPPORT = 100;

const DAY = 86400000;
const BACKOFF_DAYS = [14, 30, 60, 120];
export interface SupportState { firstSeen: number; opens: number; dismissals: number; lastAsk: number; supportedAt: number }
const KEY = 'mf_support';
export const readSupport = (): SupportState => {
  try { return { firstSeen: Date.now(), opens: 0, dismissals: 0, lastAsk: 0, supportedAt: 0, ...JSON.parse(localStorage.getItem(KEY) || '{}') }; }
  catch { return { firstSeen: Date.now(), opens: 0, dismissals: 0, lastAsk: 0, supportedAt: 0 }; }
};
const write = (s: SupportState) => { try { localStorage.setItem(KEY, JSON.stringify(s)); } catch { /* sin almacenamiento */ } };

/** Regla de cuándo ofrecer "Apóyanos" (función pura, se prueba en __tests__/apoyanos.test.ts). */
export function shouldOfferSupport(s: SupportState, now = Date.now()): boolean {
  if (s.supportedAt) return now - s.supportedAt >= 180 * DAY;
  if (s.dismissals === 0) return s.lastAsk === 0 && now - s.firstSeen >= 5 * DAY && s.opens >= 5;
  const wait = BACKOFF_DAYS[Math.min(s.dismissals - 1, BACKOFF_DAYS.length - 1)];
  return now - s.lastAsk >= wait * DAY;
}

/** Una apertura de la app (una por sesión). */
export const countOpen = () => {
  try { if (sessionStorage.getItem('mf_support_open')) return; sessionStorage.setItem('mf_support_open', '1'); } catch { return; }
  const s = readSupport(); if (!localStorage.getItem(KEY)) s.firstSeen = Date.now();
  write({ ...s, opens: s.opens + 1 });
};
export const markAsked = () => write({ ...readSupport(), lastAsk: Date.now() });
export const markDismissed = () => { const s = readSupport(); write({ ...s, dismissals: s.dismissals + 1, lastAsk: Date.now() }); };
export const markSupported = () => write({ ...readSupport(), supportedAt: Date.now(), dismissals: 0 });
export const isAlly = () => readSupport().supportedAt > 0;

/** Una sola ventana "de invitación" por sesión (Apóyanos, Síguenos, encuesta…). */
export const claimPromptSlot = () => { try { if (sessionStorage.getItem('mf_prompt_slot')) return false; sessionStorage.setItem('mf_prompt_slot', '1'); return true; } catch { return false; } };

/** Abrir la ventana desde cualquier parte (menú, Ajustes…). */
export const openSupport = () => window.dispatchEvent(new Event('mf:open-support'));
