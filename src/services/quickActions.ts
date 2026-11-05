/**
 * ⚡ ACCIONES RÁPIDAS (Inicio, Kai y notificaciones)
 * • Registrar el sueldo del día de pago con un toque.
 * • Saber si hoy es día de pago y aún no se anotó.
 * Todo se guarda solo en el celular.
 */
import { db, type Transaction } from '../utils/database';
import { todayISO } from '../utils/format';
import { getPlan, type BudgetPlan } from './budgetPlan';
import { haptic } from '../utils/haptics';
import { notify } from './notificationService';
import { formatCOP } from '../utils/format';
import { happyMoment } from './ratingService';

/** ¿Hoy es día de pago según el plan de Kai? (en meses cortos cuenta el último día) */
export const isPayday = (plan: BudgetPlan | null, ref = new Date()) => {
  if (!plan) return false;
  const last = new Date(ref.getFullYear(), ref.getMonth() + 1, 0).getDate();
  return plan.payDays.some(d => Math.min(d, last) === ref.getDate());
};
export const salaryPerPay = (plan: BudgetPlan) => Math.round(plan.income / Math.max(1, plan.payDays.length));

/** Hoy es día de pago y todavía no hay un ingreso anotado hoy. */
export const paydayPending = (tx: Transaction[], plan = getPlan()) => {
  if (!isPayday(plan)) return null;
  const today = todayISO();
  if (tx.some(t => t.type === 'income' && t.date === today)) return null;
  return salaryPerPay(plan!);
};

export const registerSalary = async (amount: number) => {
  await db.transactions.add({
    id: crypto.randomUUID(), date: todayISO(), type: 'income', category: 'Sueldo', amount,
    description: getPlan()?.freq === 'quincenal' ? 'Sueldo (quincena)' : 'Sueldo', createdAt: Date.now(),
  } as Transaction);
  window.dispatchEvent(new Event('mf:data-changed'));
  haptic('success');
  notify({ title: 'Sueldo registrado 💚', message: `${formatCOP(amount)} · tus anillos ya se actualizaron`, type: 'success' });
  happyMoment('sueldo');
};

export const openQuickAdd = (mode: 'expense' | 'income') => window.dispatchEvent(new CustomEvent('mf:quick-add', { detail: mode }));
