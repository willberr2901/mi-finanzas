// @vitest-environment happy-dom
/**
 * ✅ DEUDAS DEL HOGAR: dos celulares (A y B) simulados.
 * A ofrece sus deudas → B aprueba y aparecen en su Pagos → A paga → B lo ve pagado.
 * Si B dice "no por ahora", nada se crea en su Pagos.
 */
import 'fake-indexeddb/auto';
import { beforeEach, describe, expect, test, vi } from 'vitest';

const deviceA = async () => {
  localStorage.clear(); localStorage.setItem('mf_device', 'A'); localStorage.setItem('miFinanzasUserName', 'Gato');
  vi.resetModules();
  const { db } = await import('../utils/database');
  await Promise.all([db.bills.clear(), db.billPayments.clear(), db.transactions.clear()]);
  return { db, sync: await import('../services/household/debtSync'), bills: await import('../services/billsService') };
};
const deviceB = async () => {
  localStorage.clear(); localStorage.setItem('mf_device', 'B'); localStorage.setItem('miFinanzasUserName', 'Chumpalumpa');
  vi.resetModules();
  const { db } = await import('../utils/database');
  await Promise.all([db.bills.clear(), db.billPayments.clear(), db.transactions.clear()]);
  return { db, sync: await import('../services/household/debtSync') };
};
const docsOf = (sync: any) => sync.allDebtKeys().map((k: string) => ({ key: k, value: JSON.parse(JSON.stringify(sync.getDebtDoc(k))) }));

const credito = { id: 'c1', name: 'Crédito libre inversión', kind: 'deuda' as const, category: 'Deudas', amount: 420000, dueDay: 15, owner: 'yo' as const, totalInstallments: 15, paidInstallments: 2, active: true, createdAt: 1 };

beforeEach(() => { localStorage.clear(); });

describe('Deudas sincronizadas con el hogar', () => {
  test('A ofrece, B aprueba y la deuda aparece en el Pagos de B', async () => {
    const A = await deviceA();
    await A.db.bills.add({ ...credito });
    await A.sync.offerDebts([{ ...credito }]);
    expect((await A.db.bills.get('c1'))?.shared).toBe(true);
    const sent = docsOf(A.sync);

    const B = await deviceB();
    const fresh = await B.sync.applyDebtRemote(sent);
    expect(fresh).toHaveLength(1);
    expect(fresh[0].from).toBe('Gato');
    expect(await B.db.bills.count()).toBe(0);           // nada se crea sin aprobar
    await B.sync.answerOffer(fresh[0], true);
    const got = await B.db.bills.get('c1');
    expect(got).toMatchObject({ name: 'Crédito libre inversión', amount: 420000, shared: true, sharedBy: 'Gato' });
  });

  test('"No por ahora" no crea nada, pero se puede aprobar después desde Pagos', async () => {
    const A = await deviceA();
    await A.db.bills.add({ ...credito });
    await A.sync.offerDebts([{ ...credito }]);
    const sent = docsOf(A.sync);
    const B = await deviceB();
    const [offer] = await B.sync.applyDebtRemote(sent);
    await B.sync.answerOffer(offer, false);
    expect(await B.db.bills.count()).toBe(0);
    expect(B.sync.incomingOffers()).toHaveLength(0);       // no vuelve a salir sola
    expect(B.sync.incomingOffers(true)).toHaveLength(1);   // pero el botón "Sincronizar" la recupera
  });

  test('cuando A paga, B la ve pagada con el nombre de quien pagó', async () => {
    const A = await deviceA();
    await A.db.bills.add({ ...credito });
    await A.sync.offerDebts([{ ...credito }]);
    const offerDocs = docsOf(A.sync);
    // B aprueba
    const B1 = await deviceB();
    const [offer] = await B1.sync.applyDebtRemote(offerDocs);
    await B1.sync.answerOffer(offer, true);
    const bState = localStorage.getItem('mf_debt_sync');
    const bBills = await B1.db.bills.toArray();
    // A paga la cuota
    const A2 = await deviceA();
    await A2.db.bills.add({ ...credito, shared: true });
    await A2.bills.payBill({ ...credito, shared: true }, 420000, new Date(2026, 10, 15, 12));
    const payDocs = docsOf(A2.sync).filter((d: any) => d.key.startsWith('p:'));
    expect(payDocs).toHaveLength(1);
    // B recibe el pago
    const B2 = await deviceB();
    localStorage.setItem('mf_debt_sync', bState!);
    await B2.db.bills.bulkAdd(bBills);
    await B2.sync.applyDebtRemote(payDocs);
    const pays = await B2.db.billPayments.toArray();
    expect(pays).toHaveLength(1);
    expect(pays[0]).toMatchObject({ billId: 'c1', amount: 420000, paidByName: 'Gato' });
    expect((await B2.db.bills.get('c1'))?.paidInstallments).toBe(3);
    expect(await B2.db.transactions.count()).toBe(0);      // el gasto es de quien pagó, no se duplica
  });
});
