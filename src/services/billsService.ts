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
export const payBill = async (bill: Bill, amount: number, ref = new Date()) => {
  const installment = bill.kind === 'deuda' ? (bill.paidInstallments ?? 0) + 1 : undefined;
  await db.transaction('rw', db.billPayments, db.transactions, db.bills, async () => {
    await db.billPayments.add({ id: crypto.randomUUID(), billId: bill.id, period: periodOf(ref), amount, paidAt: Date.now() });
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
