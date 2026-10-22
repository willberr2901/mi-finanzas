/** Pruebas del dictado por voz: lista de mercado, movimientos y palabras repetidas (Android). */
import { describe, expect, test } from 'vitest';
import { parseMarket, parseMovement } from '../services/voice/parseVoice';
import { cleanRepeats } from '../services/voice/speech';

describe('Mercado por voz', () => {
  test('entiende varias cosas con cantidad y unidad', () => {
    const items = parseMarket('dos libras de arroz, un litro de leche y tres huevos');
    expect(items.map(i => [i.name, i.qty, i.unit])).toEqual([['Arroz', 2, 'lb'], ['Leche', 1, 'l'], ['Huevos', 3, 'und']]);
  });
  test('entiende el precio dicho', () => {
    const [pan] = parseMarket('pan a cinco mil');
    expect(pan.name).toBe('Pan');
    expect(pan.price).toBe(5000);
    expect(pan.said).toBe(false); // no se dijo cantidad: se usa la de la lista
  });
});

describe('Movimientos por voz', () => {
  test('gasto con número en palabras', () => {
    expect(parseMovement('gasté veinte mil en almuerzo')).toEqual({ type: 'expense', amount: 20000, description: 'Almuerzo' });
  });
  test('ingreso con millones', () => {
    expect(parseMovement('me pagaron un millón doscientos mil de sueldo')).toEqual({ type: 'income', amount: 1200000, description: 'Sueldo' });
  });
  test('gasto con número en cifras', () => {
    expect(parseMovement('uber 15000')).toMatchObject({ type: 'expense', amount: 15000 });
  });
});

describe('Limpieza de repeticiones (Android)', () => {
  test('palabra repetida', () => expect(cleanRepeats('arroz arroz arroz leche')).toBe('arroz leche'));
  test('frase repetida', () => expect(cleanRepeats('dos libras de arroz dos libras de arroz')).toBe('dos libras de arroz'));
});
