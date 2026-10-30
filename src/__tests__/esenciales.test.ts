// @vitest-environment happy-dom
/**
 * ════════════════════════════════════════════════════════════════════
 * ✅ PRUEBAS DE LO ESENCIAL (lo que nunca puede fallar)
 * ────────────────────────────────────────────────────────────────────
 * Qué revisa, como lo haría una persona pero en segundos:
 *   1. Mercado: lo que se agrega queda guardado aunque se cierre la app.
 *   2. Gastos: un gasto registrado queda en la base de datos del celular.
 *   3. Pagos: marcar un pago guarda el pago del mes Y lo anota como gasto.
 *   4. Celulares viejos: si falta crypto.randomUUID, la app igual crea ids.
 * Cómo correrlas: npm test  (o npm run revisar para la revisión completa).
 * "fake-indexeddb" y "happy-dom" simulan el celular dentro del computador.
 * ════════════════════════════════════════════════════════════════════
 */
import 'fake-indexeddb/auto';
import { beforeEach, describe, expect, test, vi } from 'vitest';

beforeEach(() => { localStorage.clear(); vi.resetModules(); });

describe('Mercado', () => {
  test('lo agregado sigue ahí al volver a abrir la app', async () => {
    const m1 = await import('../services/market/marketStore');
    m1.addItem({ name: 'Detergente Ariel', qty: 2, unit: 'und' });
    m1.addItem({ name: 'Tomates', qty: 1, unit: 'lb' });
    expect(m1.listItems()).toHaveLength(2);

    vi.resetModules();                                   // = cerrar y abrir la app
    const m2 = await import('../services/market/marketStore');
    const names = m2.listItems().map(i => i.name);
    expect(names).toContain('Detergente Ariel');
    expect(names).toContain('Tomates');
    expect(m2.listItems().find(i => i.name === 'Tomates')?.unit).toBe('lb');
  });

  test('tachar y quitar un producto también se guarda', async () => {
    const m1 = await import('../services/market/marketStore');
    const leche = m1.addItem({ name: 'Leche' });
    const pan = m1.addItem({ name: 'Pan' });
    m1.checkItem(leche.id, 3300);
    m1.removeItem(pan.id);

    vi.resetModules();
    const m2 = await import('../services/market/marketStore');
    const items = m2.listItems();
    expect(items).toHaveLength(1);
    expect(items[0]).toMatchObject({ name: 'Leche', checked: true, paid: 3300 });
  });
});

describe('Gastos y pagos', () => {
  test('un gasto registrado queda guardado', async () => {
    const { db } = await import('../utils/database');
    await db.transactions.clear();
    await db.transactions.add({ id: 'g1', date: '2026-10-30', type: 'expense', amount: 25000, category: 'Alimentación', description: 'Almuerzo', createdAt: Date.now() });
    const saved = await db.transactions.get('g1');
    expect(saved).toMatchObject({ amount: 25000, type: 'expense', description: 'Almuerzo' });
  });

  test('marcar un pago guarda el pago del mes y lo anota como gasto', async () => {
    const { db } = await import('../utils/database');
    const { payBill, loadBillStatuses } = await import('../services/billsService');
    await Promise.all([db.bills.clear(), db.billPayments.clear(), db.transactions.clear()]);
    const ref = new Date(2026, 9, 30, 12);
    const bill = { id: 'b1', name: 'Internet', kind: 'fijo', category: 'Servicios', amount: 95000, dueDay: 5, owner: 'yo', active: true, createdAt: 1 } as const;
    await db.bills.add({ ...bill });

    await payBill({ ...bill }, 95000, ref);

    const [status] = await loadBillStatuses(ref);
    expect(status.payment?.amount).toBe(95000);                      // quedó pagado este mes
    const gastos = await db.transactions.toArray();
    expect(gastos).toHaveLength(1);                                   // y se anotó como gasto
    expect(gastos[0]).toMatchObject({ type: 'expense', amount: 95000, category: 'Servicios' });
  });

  test('pagar una cuota de deuda avanza el contador y la cierra al final', async () => {
    const { db } = await import('../utils/database');
    const { payBill } = await import('../services/billsService');
    await Promise.all([db.bills.clear(), db.billPayments.clear(), db.transactions.clear()]);
    const deuda = { id: 'd1', name: 'Celular', kind: 'deuda', category: 'Deudas', amount: 100000, dueDay: 10, owner: 'yo', active: true, createdAt: 1, totalInstallments: 2, paidInstallments: 1 } as const;
    await db.bills.add({ ...deuda });
    await payBill({ ...deuda }, 100000, new Date(2026, 9, 30, 12));
    expect(await db.bills.get('d1')).toMatchObject({ paidInstallments: 2, active: false });
  });
});

describe('Celulares viejos', () => {
  test('sin crypto.randomUUID la app igual crea identificadores', async () => {
    const original = crypto.randomUUID;
    try {
      // Simulamos un celular viejo: sin randomUUID
      Object.defineProperty(crypto, 'randomUUID', { value: undefined, configurable: true, writable: true });
      await import('../utils/polyfills');
      const id = crypto.randomUUID();
      expect(id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/);
    } finally {
      Object.defineProperty(crypto, 'randomUUID', { value: original, configurable: true, writable: true });
    }
  });
});
