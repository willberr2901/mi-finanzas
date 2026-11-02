/** Pruebas del resumen de fin de mes. */
import { describe, expect, test } from 'vitest';
import { buildRecap } from '../services/monthRecap';
import type { Transaction } from '../utils/database';

let n = 0;
const t = (type: 'income' | 'expense', amount: number, category: string): Transaction => ({ id: String(n++), date: '2026-10-10', type, amount, category, description: category, createdAt: 0 } as Transaction);

describe('Resumen de fin de mes', () => {
  const prev = [t('income', 3000000, 'Sueldo'), t('expense', 600000, 'Mercado'), t('expense', 200000, 'Salidas')];
  const cur = [t('income', 3000000, 'Sueldo'), t('expense', 500000, 'Mercado'), t('expense', 450000, 'Salidas'), t('expense', 1100000, 'Arriendo')];

  test('suma ingresos, gastos y ahorro', () => {
    const r = buildRecap(cur, prev, 31)!;
    expect(r.income).toBe(3000000);
    expect(r.expense).toBe(2050000);
    expect(r.saved).toBe(950000);
    expect(r.top[0].category).toBe('Arriendo');
  });
  test('encuentra lo que más subió y lo que más bajó', () => {
    const r = buildRecap(cur, prev, 31)!;
    expect(r.up?.category).toBe('Salidas');      // de 200 mil a 450 mil
    expect(r.down?.category).toBe('Mercado');    // de 600 mil a 500 mil
    expect(r.tip).toContain('Salidas');
  });
  test('si gastó más de lo que entró, el consejo lo dice', () => {
    const r = buildRecap([t('income', 1000000, 'Sueldo'), t('expense', 1300000, 'Mercado')], [], 30)!;
    expect(r.saved).toBeLessThan(0);
    expect(r.tip).toContain('más de lo que entró');
  });
  test('sin movimientos no hay resumen', () => {
    expect(buildRecap([], prev, 30)).toBeNull();
  });
});
