/**
 * ════════════════════════════════════════════════════════════════════
 * 🔄 DEUDAS DEL HOGAR (sincronizadas con aprobación)
 * ────────────────────────────────────────────────────────────────────
 * Qué hace:
 *   1. Ofrecer: eliges qué deudas compartir con tu hogar ("o:" = oferta).
 *   2. Aprobar: la otra persona ve "Gato quiere compartir 2 deudas contigo"
 *      y solo si aprueba se crean en su Pagos ("d:" = deuda compartida).
 *   3. Pagar: cuando alguien paga una deuda compartida, al otro le llega
 *      "Chumpalumpa pagó el Crédito" y queda marcada ("p:" = pago).
 * Viaja por el mismo canal cifrado del mercado (householdSync.ts): el servidor
 * nunca ve nombres ni valores. Sin hogar, este archivo no hace nada.
 * Datos locales: localStorage 'mf_debt_sync' (documentos y respuestas).
 * ════════════════════════════════════════════════════════════════════
 */
import { db, type Bill } from '../../utils/database';
import { ownerLabel } from '../../utils/prefs';
import { notify, logActivity } from '../notificationService';
import { formatCOP } from '../../utils/format';

export interface SharedDebt { id: string; name: string; kind: Bill['kind']; category: string; amount: number; dueDay: number; totalInstallments?: number; paidInstallments?: number }
export interface DebtOffer { rev: number; id: string; from: string; device: string; debts: SharedDebt[]; status: 'pendiente' | 'aceptada' | 'rechazada'; answeredBy?: string }
interface DebtDoc { rev: number; debt: SharedDebt; by: string }
interface PayDoc { rev: number; billId: string; period: string; amount: number; paidAt: number; by: string; device: string }
type Doc = DebtOffer | DebtDoc | PayDoc;

interface State { docs: Record<string, Doc>; answered: Record<string, 'aceptada' | 'rechazada'>; asked?: number; hideCard?: boolean }
const KEY = 'mf_debt_sync';
const EVENT = 'mf:debt-sync';
const read = (): State => { try { return { docs: {}, answered: {}, ...JSON.parse(localStorage.getItem(KEY) || '{}') }; } catch { return { docs: {}, answered: {} }; } };
const write = (s: State) => { try { localStorage.setItem(KEY, JSON.stringify(s)); } catch { /* sin espacio */ } window.dispatchEvent(new Event(EVENT)); };
const deviceId = () => { try { return localStorage.getItem('mf_device') || 'local'; } catch { return 'local'; } };
const me = () => ownerLabel('yo');

// ── Puente con householdSync (sube las cajas que cambian) ──
type Listener = (keys: string[]) => void;
const listeners = new Set<Listener>();
export const onDebtChange = (fn: Listener) => { listeners.add(fn); return () => listeners.delete(fn); };
const commit = (s: State, keys: string[]) => { write(s); listeners.forEach(fn => fn(keys)); };

export const isDebtKey = (k: string) => /^[odp]:/.test(k);
export const getDebtDoc = (k: string) => read().docs[k] ?? null;
export const allDebtKeys = () => Object.keys(read().docs);
export const debtSyncEvent = EVENT;

const toShared = (b: Bill): SharedDebt => ({ id: b.id, name: b.name, kind: b.kind, category: b.category, amount: b.amount, dueDay: b.dueDay, totalInstallments: b.totalInstallments, paidInstallments: b.paidInstallments });
const isDebt = (b: Bill) => b.active && (b.kind === 'deuda' || b.kind === 'tarjeta');

/** Deudas de este celular que aún no se comparten. */
export const unsharedDebts = async () => (await db.bills.toArray()).filter(b => isDebt(b) && !b.shared);
/** Ofertas que me llegaron y no he respondido (o rechacé y puedo aceptar después). */
export const incomingOffers = (includeDeclined = false) => {
  const s = read();
  return Object.values(s.docs).filter((d): d is DebtOffer => 'debts' in d && d.device !== deviceId() && d.status === 'pendiente'
    && (!s.answered[d.id] || (includeDeclined && s.answered[d.id] === 'rechazada')));
};

/** 1. Ofrecer: marca las deudas como compartidas y deja la oferta para el hogar. */
export const offerDebts = async (bills: Bill[]) => {
  if (!bills.length) return;
  const s = read(); const now = Date.now();
  const id = crypto.randomUUID();
  const keys: string[] = [];
  for (const b of bills) {
    await db.bills.update(b.id, { shared: true, sharedBy: me() });
    s.docs[`d:${b.id}`] = { rev: now, debt: toShared(b), by: me() }; keys.push(`d:${b.id}`);
  }
  s.docs[`o:${id}`] = { rev: now, id, from: me(), device: deviceId(), debts: bills.map(toShared), status: 'pendiente' };
  keys.push(`o:${id}`);
  s.asked = now;
  commit(s, keys);
  window.dispatchEvent(new Event('mf:data-changed'));
  notify({ title: 'Solicitud enviada 🔄', message: `Cuando tu hogar la apruebe, ${bills.length === 1 ? 'la deuda queda sincronizada' : `las ${bills.length} deudas quedan sincronizadas`}.`, type: 'success' });
};

/** "Ahora no" en la pregunta inicial: no vuelve a salir sola (queda el botón en Pagos). */
export const markAsked = () => { const s = read(); s.asked = Date.now(); write(s); };
export const wasAsked = () => !!read().asked;
export const hideSyncCard = () => { const s = read(); s.hideCard = true; write(s); };
export const syncCardHidden = () => !!read().hideCard;

/** 2. Responder una oferta. Si se acepta, las deudas se crean en mi Pagos. */
export const answerOffer = async (offer: DebtOffer, accept: boolean) => {
  const s = read();
  s.answered[offer.id] = accept ? 'aceptada' : 'rechazada';
  if (!accept) { write(s); return; }
  for (const d of offer.debts) {
    const exists = await db.bills.get(d.id);
    if (!exists) await db.bills.add({ ...d, owner: 'compartido', active: true, createdAt: Date.now(), shared: true, sharedBy: offer.from } as Bill);
    else await db.bills.update(d.id, { shared: true, sharedBy: offer.from });
  }
  const upd: DebtOffer = { ...offer, rev: Date.now(), status: 'aceptada', answeredBy: me() };
  s.docs[`o:${offer.id}`] = upd;
  commit(s, [`o:${offer.id}`]);
  window.dispatchEvent(new Event('mf:data-changed'));
  notify({ title: 'Deudas sincronizadas 🔄', message: `Ya ves las de ${offer.from} en Pagos. Cuando alguno pague, el otro lo verá.`, type: 'success' });
};

/** 3. Pago local de una deuda compartida → se avisa al hogar. (Lo llama billsService.payBill) */
export const sharePayment = (bill: Bill, period: string, amount: number) => {
  if (!bill.shared) return;
  const s = read(); const id = crypto.randomUUID();
  s.docs[`p:${id}`] = { rev: Date.now(), billId: bill.id, period, amount, paidAt: Date.now(), by: me(), device: deviceId() };
  commit(s, [`p:${id}`]);
};

/** Llegó algo del hogar: lo aplica y avisa bonito. Devuelve las ofertas nuevas (para el popup). */
export const applyDebtRemote = async (docs: { key: string; value: any }[]) => {
  const s = read(); const fresh: DebtOffer[] = [];
  for (const { key, value } of docs) {
    if (!value || typeof value.rev !== 'number') continue;
    const cur = s.docs[key];
    if (cur && cur.rev >= value.rev) continue;
    s.docs[key] = value;
    if (key.startsWith('o:')) {
      const o = value as DebtOffer;
      if (o.device !== deviceId() && o.status === 'pendiente' && !s.answered[o.id]) fresh.push(o);
      if (o.device === deviceId() && o.status === 'aceptada' && o.answeredBy) {
        notify({ title: `${o.answeredBy} aprobó tus deudas 🤝`, message: 'Ya están sincronizadas con tu hogar.', type: 'hogar', log: false });
        logActivity({ title: `${o.answeredBy} aprobó sincronizar tus deudas`, message: o.debts.map(d => d.name).join(', '), link: '/pagos' });
      }
    } else if (key.startsWith('p:')) {
      const p = value as PayDoc;
      if (p.device === deviceId()) continue;
      const bill = await db.bills.get(p.billId);
      if (!bill) continue;   // no acepté esa deuda: no se aplica
      const done = await db.billPayments.where('[billId+period]').equals([p.billId, p.period]).count();
      if (!done) {
        await db.billPayments.add({ id: crypto.randomUUID(), billId: p.billId, period: p.period, amount: p.amount, paidAt: p.paidAt, paidBy: 'pareja', paidByName: p.by } as any);
        if (bill.kind === 'deuda') {
          const n = (bill.paidInstallments ?? 0) + 1;
          await db.bills.update(bill.id, { paidInstallments: n, active: !(bill.totalInstallments && n >= bill.totalInstallments) });
        }
        notify({ title: `${p.by} pagó ${bill.name} ✅`, message: `${formatCOP(p.amount)} · ya quedó marcado aquí también.`, type: 'hogar', log: false });
        logActivity({ title: `${p.by} pagó ${bill.name}`, message: `${formatCOP(p.amount)} · ya quedó marcado aquí también.`, link: '/pagos' });
      }
    }
  }
  write(s);
  if (fresh.length) window.dispatchEvent(new CustomEvent('mf:debt-offer', { detail: fresh[0] }));
  window.dispatchEvent(new Event('mf:data-changed'));
  return fresh;
};
