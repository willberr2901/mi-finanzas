import { db, type Bill, type BillPayment } from '../utils/database';
import { todayISO } from '../utils/format';

export const periodOf = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;

/** Fecha de vencimiento del pago en ese mes (si vence el 31 y el mes tiene 30, vence el 30). */
export const dueDateFor = (bill: Bill, year: number, month: number): Date => {
  const last = new Date(year, month + 1, 0).getDate();
  return new Date(year, month, Math.min(bill.dueDay, last));
};

export interface BillStatus {
  bill: Bill;
  dueDate: Date;
  daysLeft: number;      // negativo = vencido hace N días
  paid: boolean;
  payment?: BillPayment;
  state: 'pagado' | 'vencido' | 'hoy' | 'pronto' | 'pendiente';
}

const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate());

export const statusFor = (bill: Bill, payments: BillPayment[], ref = new Date()): BillStatus => {
  const dueDate = dueDateFor(bill, ref.getFullYear(), ref.getMonth());
  const daysLeft = Math.round((startOfDay(dueDate).getTime() - startOfDay(ref).getTime()) / 86400000);
  const payment = payments.find(p => p.billId === bill.id && p.period === periodOf(ref));
  const paid = !!payment;
  const state: BillStatus['state'] = paid ? 'pagado' : daysLeft < 0 ? 'vencido' : daysLeft === 0 ? 'hoy' : daysLeft <= 3 ? 'pronto' : 'pendiente';
  return { bill, dueDate, daysLeft, paid, payment, state };
};

export const loadBillStatuses = async (ref = new Date()): Promise<BillStatus[]> => {
  const [bills, payments] = await Promise.all([db.bills.toArray(), db.billPayments.where('period').equals(periodOf(ref)).toArray()]);
  return bills
    .filter(b => b.active)
    .map(b => statusFor(b, payments, ref))
    .sort((a, b) => a.dueDate.getTime() - b.dueDate.getTime());
};

/** Marca el pago del mes: lo guarda, lo registra como gasto en Finanzas y avanza la cuota si es deuda. */
export const payBill = async (bill: Bill, amount: number, ref = new Date(), paidBy?: 'yo' | 'pareja') => {
  const installment = bill.kind === 'deuda' ? (bill.paidInstallments ?? 0) + 1 : undefined;
  await db.transaction('rw', db.billPayments, db.transactions, db.bills, async () => {
    await db.billPayments.add({ id: crypto.randomUUID(), billId: bill.id, period: periodOf(ref), amount, paidAt: Date.now(), ...(paidBy ? { paidBy } : {}) });
    await db.transactions.add({
      id: crypto.randomUUID(),
      date: todayISO(),
      type: 'expense',
      amount,
      category: bill.category,
      description: installment && bill.totalInstallments ? `${bill.name} · cuota ${installment} de ${bill.totalInstallments}` : bill.name,
      createdAt: Date.now(),
    });
    if (bill.kind === 'deuda') {
      const done = !!bill.totalInstallments && installment! >= bill.totalInstallments;
      await db.bills.update(bill.id, { paidInstallments: installment, active: !done });
    }
  });
};

/** Deshace el pago del mes (por si se marcó por error). No borra el gasto ya registrado. */
export const unpayBill = async (status: BillStatus) => {
  if (!status.payment) return;
  await db.billPayments.delete(status.payment.id);
  if (status.bill.kind === 'deuda') {
    await db.bills.update(status.bill.id, { paidInstallments: Math.max(0, (status.bill.paidInstallments ?? 1) - 1), active: true });
  }
};

export const OWNER_LABEL: Record<Bill['owner'], string> = { yo: 'Yo', pareja: 'Mi pareja', compartido: 'Compartido' };

export const describeDue = (s: BillStatus): string => {
  if (s.paid) return 'Pagado';
  if (s.daysLeft < -1) return `Venció hace ${-s.daysLeft} días`;
  if (s.daysLeft === -1) return 'Venció ayer';
  if (s.daysLeft === 0) return 'Vence hoy';
  if (s.daysLeft === 1) return 'Vence mañana';
  return `En ${s.daysLeft} días`;
};

// ---------- Sincronización Finanzas → Pagos ----------
const norm = (s: string) => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9 ]/g, ' ').replace(/\s+/g, ' ').trim();

/** Busca un pago fijo que corresponda a un gasto (por nombre parecido o misma categoría única). */
export const findMatchingBill = async (description: string, category: string): Promise<Bill | null> => {
  const bills = (await db.bills.toArray()).filter(b => b.active);
  const d = norm(description);
  const byName = bills.find(b => { const n = norm(b.name); return n && (d.includes(n) || n.includes(d)); });
  if (byName) return byName;
  const sameCat = bills.filter(b => b.category === category);
  return sameCat.length === 1 && (category === 'Arriendo') ? sameCat[0] : null;
};

/** Categorías que normalmente son pagos de cada mes. */
export const RECURRING_CATEGORIES = new Set(['Arriendo', 'Servicios', 'Deudas']);

/** Marca el pago del mes de ese gasto (sin crear otro gasto: ya se registró en Finanzas). */
export const markPaidFromTransaction = async (bill: Bill, amount: number, date: Date) => {
  const period = periodOf(date);
  const exists = await db.billPayments.where('[billId+period]').equals([bill.id, period]).first();
  if (exists) return false;
  await db.billPayments.add({ id: crypto.randomUUID(), billId: bill.id, period, amount, paidAt: Date.now() });
  if (bill.kind === 'deuda') {
    const installment = (bill.paidInstallments ?? 0) + 1;
    await db.bills.update(bill.id, { paidInstallments: installment, active: !(bill.totalInstallments && installment >= bill.totalInstallments) });
  }
  return true;
};

/** Crea un pago mensual a partir de un gasto registrado en Finanzas y lo deja pagado ese mes. */
export const createBillFromTransaction = async (name: string, category: string, amount: number, date: Date, owner: Bill['owner'] = 'compartido') => {
  const kind: Bill['kind'] = /tarjeta/i.test(name) ? 'tarjeta' : 'fijo';
  const bill: Bill = { id: crypto.randomUUID(), name, kind, category: kind === 'tarjeta' ? 'Deudas' : category, amount, dueDay: date.getDate(), owner, active: true, createdAt: Date.now() };
  await db.bills.add(bill);
  await db.billPayments.add({ id: crypto.randomUUID(), billId: bill.id, period: periodOf(date), amount, paidAt: Date.now() });
  return bill;
};

// ---------- Recordatorios en el calendario del celular ----------
const pad = (n: number) => String(n).padStart(2, '0');
const ymd = (d: Date) => `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}`;

const nextDue = (bill: Bill) => {
  const t = new Date();
  const thisMonth = dueDateFor(bill, t.getFullYear(), t.getMonth());
  return thisMonth >= new Date(t.getFullYear(), t.getMonth(), t.getDate()) ? thisMonth : dueDateFor(bill, t.getFullYear(), t.getMonth() + 1);
};

/** Enlace para crear el recordatorio mensual en Google Calendar (se abre la app del calendario). */
export const googleCalendarLink = (bill: Bill) => {
  const d = nextDue(bill);
  const end = new Date(d); end.setDate(end.getDate() + 1);
  const day = bill.dueDay >= 29 ? -1 : bill.dueDay; // fin de mes cuando el día no existe en todos los meses
  const p = new URLSearchParams({
    action: 'TEMPLATE',
    text: `Pagar ${bill.name}`,
    dates: `${ymd(d)}/${ymd(end)}`,
    details: `Recordatorio de Mi Finanzas. Valor aprox: $${Math.round(bill.amount).toLocaleString('es-CO')}. Márcalo como pagado en la app.`,
    recur: `RRULE:FREQ=MONTHLY;BYMONTHDAY=${day}`,
  });
  return `https://calendar.google.com/calendar/render?${p.toString()}`;
};

/** Archivo .ics con todos los pagos, cada uno repitiéndose cada mes y con aviso un día antes. */
export const buildICS = (bills: Bill[]) => {
  const stamp = new Date().toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
  const events = bills.filter(b => b.active).map(b => {
    const d = nextDue(b);
    const end = new Date(d); end.setDate(end.getDate() + 1);
    const day = b.dueDay >= 29 ? -1 : b.dueDay;
    return [
      'BEGIN:VEVENT', `UID:${b.id}@mi-finanzas`, `DTSTAMP:${stamp}`,
      `DTSTART;VALUE=DATE:${ymd(d)}`, `DTEND;VALUE=DATE:${ymd(end)}`,
      `RRULE:FREQ=MONTHLY;BYMONTHDAY=${day}`,
      `SUMMARY:Pagar ${b.name}`,
      `DESCRIPTION:Recordatorio de Mi Finanzas. Valor aprox: $${Math.round(b.amount).toLocaleString('es-CO')}`,
      'BEGIN:VALARM', 'ACTION:DISPLAY', `DESCRIPTION:Mañana vence ${b.name}`, 'TRIGGER:-PT15H', 'END:VALARM',
      'BEGIN:VALARM', 'ACTION:DISPLAY', `DESCRIPTION:Hoy vence ${b.name}`, 'TRIGGER:PT9H', 'END:VALARM',
      'END:VEVENT',
    ].join('\r\n');
  });
  return ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Mi Finanzas//ES', 'CALSCALE:GREGORIAN', ...events, 'END:VCALENDAR'].join('\r\n');
};
