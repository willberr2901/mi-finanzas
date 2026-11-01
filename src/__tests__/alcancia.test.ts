/** Pruebas del contador de alcancía (sumas y cómo se reconoce cada moneda por su color). */
import { describe, expect, test } from 'vitest';
import { totals, emptyCounts, splitTen, classify, coinsOf } from '../services/coinCounter';

describe('Contador de alcancía', () => {
  test('montoncitos de 10 + sueltas suman bien', () => {
    const c = emptyCounts();
    c[1000] = { stacks: 3, loose: 4 };   // 34 monedas
    c[500] = { stacks: 5, loose: 7 };    // 57 monedas
    const t = totals(c, 20000);
    expect(t.coins).toBe(91);
    expect(t.amount).toBe(34000 + 28500 + 20000);
  });
  test('pasa monedas a montoncitos', () => {
    expect(splitTen(37)).toEqual({ stacks: 3, loose: 7 });
    expect(coinsOf({ stacks: 3, loose: 7 })).toBe(37);
  });
  test('reconoce cada moneda por el color del borde y del centro', () => {
    expect(classify(0.35, 0.05, 30, 30)).toBe(1000); // borde amarillo, centro plateado
    expect(classify(0.05, 0.35, 27, 30)).toBe(500);  // borde plateado, centro amarillo
    expect(classify(0.3, 0.32, 23, 30)).toBe(100);   // toda amarilla
    expect(classify(0.05, 0.06, 25, 30)).toBe(200);  // toda plateada y grande
    expect(classify(0.05, 0.06, 19, 30)).toBe(50);   // toda plateada y pequeña
  });
});
