// @vitest-environment happy-dom
/**
 * ✅ PRUEBAS DEL ASISTENTE DE PRESUPUESTO (Kai)
 * Revisa que el reparto del sueldo, el plan para liberar deuda y los
 * presupuestos sugeridos den cuentas correctas.
 */
import { describe, expect, test } from 'vitest';
import { splitIncome, payoffPlan, suggestBudgets, historyOf, nextPayDate, cyclePayDay } from '../services/budgetPlan';
import type { Transaction } from '../utils/database';

describe('Reparto del sueldo', () => {
  test('el ejemplo del diseño: $2.800.000, deudas $780.000, ahorro 10%', () => {
    const s = splitIncome(2_800_000, 780_000, 10);
    expect(s.fits).toBe(true);
    expect(s.ahorro).toBe(280_000);
    expect(s.necesidades).toBe(1_176_000);
    expect(s.gustos).toBe(564_000);
    expect(s.deudas + s.necesidades + s.gustos + s.ahorro).toBe(2_800_000);
  });
  test('si las deudas se comen el sueldo, no alcanza y no propone ahorro', () => {
    const s = splitIncome(1_500_000, 900_000, 10);
    expect(s.fits).toBe(false);
    expect(s.ahorro).toBe(0);
  });
  test('el ahorro nunca pasa de lo que queda libre', () => {
    const s = splitIncome(2_000_000, 700_000, 30);
    expect(s.ahorro).toBeLessThanOrEqual(s.free);
    expect(s.gustos).toBeGreaterThanOrEqual(0);
  });
});

describe('Plan para liberar deuda', () => {
  test('dice en orden cuándo termina cada deuda y la cuota liberada acelera las demás', () => {
    const start = new Date(2026, 10, 1);
    const plan = payoffPlan([
      { name: 'Crédito', balance: 6_000_000, cuota: 420_000 },
      { name: 'Celular', balance: 900_000, cuota: 110_000 },
      { name: 'Tarjeta', balance: 1_800_000, cuota: 250_000 },
    ], start);
    expect(plan.map(p => p.name)).toEqual(['Tarjeta', 'Celular', 'Crédito']);
    expect(plan[0].months).toBe(8);              // 1.800.000 / 250.000 → 8 cuotas
    expect(plan[1].months).toBe(9);              // 900.000 / 110.000 → 9 cuotas
    expect(plan[2].months).toBeLessThan(Math.ceil(6_000_000 / 420_000)); // sin bola de nieve serían 15
  });
});

describe('Presupuesto por categoría', () => {
  const tx: Transaction[] = [];
  const add = (date: string, category: string, amount: number) => tx.push({ id: `${date}${category}`, date, type: 'expense', category, amount, description: '', createdAt: 1 } as Transaction);
  add('2026-08-10', 'Mercado', 620_000); add('2026-09-10', 'Mercado', 580_000); add('2026-10-10', 'Mercado', 600_000);
  add('2026-10-12', 'Arriendo', 900_000);
  const ref = new Date(2026, 10, 2);
  test('según lo que gastas: promedio de 3 meses menos 10%', () => {
    const h = historyOf(tx, 1, ref);
    expect(h.cycles).toBe(3);
    const rows = suggestBudgets('promedio', { hist: h, income: 2_800_000 });
    expect(rows.find(r => r.cat === 'Mercado')).toMatchObject({ avg: 600_000, value: 540_000 });
    expect(rows.find(r => r.cat === 'Arriendo')).toBeUndefined(); // el arriendo no lleva límite
  });
  test('50/30/20 sin historia reparte en categorías típicas', () => {
    const rows = suggestBudgets('503020', { hist: historyOf([], 1, ref), income: 2_000_000 });
    const gustos = rows.filter(r => ['Alimentación', 'Entretenimiento', 'Otros'].includes(r.cat)).reduce((a, r) => a + r.value, 0);
    expect(Math.abs(gustos - 600_000)).toBeLessThanOrEqual(3000);
  });
});

describe('Días de pago', () => {
  test('quincenal 15 y 30: el próximo pago después del 16 es el 30', () => {
    expect(nextPayDate([15, 30], new Date(2026, 10, 16)).getDate()).toBe(30);
    expect(nextPayDate([15, 30], new Date(2026, 1, 20)).getDate()).toBe(28); // febrero
    expect(cyclePayDay([30, 15])).toBe(15);
  });
});
