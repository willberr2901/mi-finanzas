/**
 * ════════════════════════════════════════════════════════════════════
 * 💚 SALUD FINANCIERA (puntaje de 0 a 100, explicado)
 * ────────────────────────────────────────────────────────────────────
 * Qué hace: califica el ciclo actual (de tu día de pago al siguiente) con 4 partes
 *           fáciles de entender, y dice qué es lo que más te ayudaría a mejorar:
 *   1. Ahorro (35%)        → cuánto te queda de lo que entró. Ideal: 20% o más.
 *   2. Pagos al día (25%)  → de los pagos fijos que ya vencieron, cuántos pagaste.
 *   3. Gustos (20%)        → cuánto de tus ingresos se va en gustos. Ideal: 30% o menos.
 *   4. Deudas (20%)        → cuánto de tus ingresos se va en cuotas. Ideal: 20% o menos.
 * Si una parte no tiene datos (por ejemplo, no tienes pagos fijos), no cuenta y el
 * puntaje se reparte entre las demás. Sin ingresos registrados no se puede calcular.
 * Dónde se ve: Inicio → tarjeta "Salud financiera" (tócala para ver el detalle).
 * Todo se calcula en el celular.
 * ════════════════════════════════════════════════════════════════════
 */
import type { BillStatus } from './billsService';

export interface HealthPart { id: 'ahorro' | 'pagos' | 'gustos' | 'deudas'; label: string; score: number; weight: number; detail: string; tip: string }
export interface HealthResult {
  total: number | null;          // null = faltan ingresos para calcular
  label: string;
  color: string;
  parts: HealthPart[];
  /** La parte que más subiría tu puntaje si la mejoras. */
  focus: HealthPart | null;
}

const clamp = (v: number) => Math.max(0, Math.min(100, Math.round(Number.isFinite(v) ? v : 0)));
const pct = (n: number) => `${Math.round(n)}%`;

export const healthLabel = (t: number | null) => t === null ? 'Faltan tus ingresos' : t >= 80 ? 'Excelente' : t >= 60 ? 'Vas por buen camino' : t >= 40 ? 'Puedes mejorar' : 'Necesita atención';
export const healthColor = (t: number | null) => t === null ? '#8A93B8' : t >= 80 ? '#C6F432' : t >= 60 ? '#A3E64F' : t >= 40 ? '#FBBF24' : '#F87171';

export function computeHealth(data: { income: number; expense: number; gustos: number; bills: BillStatus[] }): HealthResult {
  const { income, expense, gustos, bills } = data;
  const parts: HealthPart[] = [];

  if (income > 0) {
    // 1. Ahorro
    const rate = ((income - expense) / income) * 100;
    parts.push({
      id: 'ahorro', label: 'Ahorro', weight: 35,
      score: clamp(rate >= 20 ? 100 : rate >= 0 ? 40 + rate * 3 : 40 + rate * 2),
      detail: rate >= 0 ? `Te queda el ${pct(rate)} de lo que entró` : `Gastaste ${pct(-rate)} más de lo que entró`,
      tip: rate >= 20 ? '¡Muy bien! Sigue separando tu ahorro apenas te paguen.' : 'Separa un ahorro apenas te paguen, aunque sea el 10%. La meta es llegar al 20%.',
    });
    // 3. Gustos
    const g = (gustos / income) * 100;
    parts.push({
      id: 'gustos', label: 'Gustos', weight: 20,
      score: clamp(g <= 30 ? 100 : g >= 60 ? 20 : 100 - ((g - 30) / 30) * 80),
      detail: `Los gustos son el ${pct(g)} de tus ingresos (ideal: hasta 30%)`,
      tip: g <= 30 ? 'Tus gustos están en un buen nivel.' : 'Revisa domicilios, salidas y compras por antojo: ahí suele estar la plata que se escapa.',
    });
    // 4. Deudas (cuotas de créditos y tarjetas)
    const debtMonthly = bills.filter(b => b.bill.kind === 'deuda' || b.bill.kind === 'tarjeta').reduce((a, b) => a + (b.payment?.amount ?? b.bill.amount), 0);
    const d = (debtMonthly / income) * 100;
    parts.push({
      id: 'deudas', label: 'Deudas', weight: 20,
      score: debtMonthly === 0 ? 100 : clamp(d <= 20 ? 100 : d >= 50 ? 10 : 100 - ((d - 20) / 30) * 90),
      detail: debtMonthly === 0 ? 'Sin cuotas de créditos ni tarjetas 🎉' : `Tus cuotas son el ${pct(d)} de tus ingresos (ideal: hasta 20%)`,
      tip: d <= 20 ? 'Tus deudas están bajo control.' : 'Abona primero a la deuda con el interés más alto y evita sacar crédito nuevo.',
    });
  }

  // 2. Pagos al día (no necesita ingresos)
  const due = bills.filter(b => b.paid || b.daysLeft < 0);
  if (due.length) {
    const paid = due.filter(b => b.paid).length;
    const late = due.filter(b => !b.paid);
    parts.push({
      id: 'pagos', label: 'Pagos al día', weight: 25,
      score: clamp((paid / due.length) * 100),
      detail: late.length ? `${late.length} ${late.length === 1 ? 'pago vencido' : 'pagos vencidos'}: ${late.slice(0, 2).map(b => b.bill.name).join(', ')}` : `Pagaste a tiempo ${paid === 1 ? 'tu pago' : `tus ${paid} pagos`} de este mes`,
      tip: late.length ? `Ponte al día con ${late[0].bill.name} para no pagar intereses de mora.` : 'Vas al día con tus pagos. ¡Así se hace!',
    });
  }

  // Orden fijo para mostrar
  const order = ['ahorro', 'pagos', 'gustos', 'deudas'];
  parts.sort((a, b) => order.indexOf(a.id) - order.indexOf(b.id));

  if (income <= 0) return { total: null, label: healthLabel(null), color: healthColor(null), parts, focus: null };
  const w = parts.reduce((a, p) => a + p.weight, 0);
  const total = clamp(parts.reduce((a, p) => a + p.score * p.weight, 0) / w);
  // Lo que más subiría el puntaje: la parte con más puntos "perdidos" (según su peso)
  const focus = [...parts].sort((a, b) => (100 - b.score) * b.weight - (100 - a.score) * a.weight)[0];
  return { total, label: healthLabel(total), color: healthColor(total), parts, focus: focus && focus.score < 100 ? focus : null };
}
