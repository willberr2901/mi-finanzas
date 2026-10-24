/** Pruebas del lector de facturas y de los mensajes del banco. */
import { describe, expect, test } from 'vitest';
import { parsePrice, parseReceiptText } from '../services/receipt/receiptParser';
import { parseBankText } from '../services/bankTextParser';

describe('Precios', () => {
  test('formatos colombianos', () => {
    expect(parsePrice('$12.900')).toBe(12900);
    expect(parsePrice('12,900')).toBe(12900);
    expect(parsePrice('1.234.567')).toBe(1234567);
    expect(parsePrice('abc')).toBe(0);
  });
});

describe('Factura tipo D1', () => {
  const r = parseReceiptText([
    'TIENDAS D1 S.A.S', 'NIT 900.276.962-1', 'FECHA: 15/10/2026',
    '7702001 ARROZ DIANA 500G 3.200',
    'LECHE ALQUERIA', '2 X 2.500 5.000',
    'TOTAL 8.200', 'EFECTIVO 10.000',
  ].join('\n'));
  test('tienda, fecha, pago y total', () => {
    expect(r.store).toBe('D1');
    expect(r.date).toBe('2026-10-15');
    expect(r.payment).toBe('Efectivo');
    expect(r.total).toBe(8200);
  });
  test('productos con cantidad y valor unitario', () => {
    expect(r.items).toEqual([
      expect.objectContaining({ name: 'Arroz Diana 500g', quantity: 1, price: 3200 }),
      expect.objectContaining({ name: 'Leche Alqueria', quantity: 2, unitPrice: 2500, price: 5000 }),
    ]);
    expect(r.sumMatches).toBe(true);
  });
});

describe('Mensajes del banco', () => {
  test('compra con tarjeta de crédito', () => {
    expect(parseBankText('Bancolombia: Compraste $45.000,00 en EXITO con tu T.Cred *1234, el 15/10/2026'))
      .toMatchObject({ type: 'expense', amount: 45000, merchant: 'Exito', method: 'TC', last4: '1234', date: '2026-10-15' });
  });
  test('plata recibida por Nequi', () => {
    expect(parseBankText('Recibiste $200.000 de JUAN PEREZ en tu cuenta Nequi'))
      .toMatchObject({ type: 'income', amount: 200000, method: 'Nequi' });
  });
});

describe('Categorías automáticas y cruce con la lista', async () => {
  const { guessCategory, expandReceiptName, crossReceipt } = await import('../services/market/categories');
  test('clasifica solo con el nombre', () => {
    expect(guessCategory('Arroz Diana')).toBe('despensa');
    expect(guessCategory('Huevos')).toBe('lacteos');
    expect(guessCategory('Papas fritas')).toBe('mecato');
    expect(guessCategory('Papa pastusa')).toBe('frutas');
    expect(guessCategory('Crema dental')).toBe('personal');
    expect(guessCategory('Jabón de loza')).toBe('aseo');
    expect(guessCategory('Pechuga de pollo')).toBe('carnes');
    expect(guessCategory('Cosa rara')).toBe('otros');
  });
  test('entiende abreviaturas de factura', () => {
    expect(expandReceiptName('LCHE ENT ALQ 1100')).toContain('leche');
    expect(expandReceiptName('HUEVOS AA X30')).toBe('huevo');
  });
  test('cruza la factura con la lista', () => {
    const list = [{ id: '1', name: 'Huevos' }, { id: '2', name: 'Leche' }, { id: '3', name: 'Pan tajado' }, { id: '4', name: 'Café' }];
    const r = crossReceipt([{ name: 'HUEVOS AA X30' }, { name: 'LCHE ENT ALQ' }, { name: 'TOSTADAS BIMBO' }, { name: 'CHOCOLATINA JET' }], list);
    const by = Object.fromEntries(r.pairs.map(p => [p.receipt.name, [p.item.name, p.level]]));
    expect(by['HUEVOS AA X30']).toEqual(['Huevos', 'seguro']);
    expect(by['LCHE ENT ALQ']).toEqual(['Leche', 'seguro']);
    expect(by['TOSTADAS BIMBO']).toEqual(['Pan tajado', 'confirmar']);
    expect(r.unmatched.map(u => u.name)).toEqual(['CHOCOLATINA JET']);
    expect(r.leftover.map(l => l.name)).toEqual(['Café']);
  });
});
