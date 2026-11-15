import { describe, it, expect } from 'vitest';
import { leftOf, paidOf, extraOf, totalOf, pctPaid, loanHistory, statementText, type Loan } from '../services/loansService';

const base: Loan = { id: 'x', dir: 'meDeben', person: 'Juan', amount: 250000, reason: 'Préstamo', date: '2026-11-01', payments: [], createdAt: 0 };
const loan: Loan = { ...base, payments: [
  { id: 'a', kind: 'abono', amount: 70000, date: '2026-11-14', at: new Date('2026-11-14T21:40').getTime(), note: 'Nequi' },
  { id: 'b', amount: 130000, date: '2026-11-05' },                     // abono viejo (sin kind ni hora)
  { id: 'c', kind: 'mas', amount: 50000, date: '2026-11-08', at: new Date('2026-11-08T19:15').getTime() },
] };

describe('Préstamos: abonos (verde) y más prestado (rojo)', () => {
  it('calcula solo: prestado + más − abonos', () => {
    expect(paidOf(loan)).toBe(200000);
    expect(extraOf(loan)).toBe(50000);
    expect(totalOf(loan)).toBe(300000);
    expect(leftOf(loan)).toBe(100000);
    expect(pctPaid(loan)).toBe(67);
  });
  it('los préstamos viejos sin movimientos nuevos siguen igual', () => {
    expect(leftOf({ ...base, payments: [{ id: 'z', amount: 50000, date: '2026-11-02' }] })).toBe(200000);
  });
  it('historial en orden con el saldo que quedó', () => {
    const h = loanHistory(loan);
    expect(h.map(e => e.kind)).toEqual(['inicio', 'abono', 'mas', 'abono']);
    expect(h.map(e => e.after)).toEqual([250000, 120000, 170000, 100000]);
  });
  it('el estado de cuenta trae colores, notas y saldo', () => {
    const t = statementText(loan, n => `$${n}`);
    expect(t).toMatch(/Debe: \$100000/);
    expect(t).toMatch(/🔴 Préstamo adicional \+\$50000/);
    expect(t).toMatch(/Nequi/);
  });
});
