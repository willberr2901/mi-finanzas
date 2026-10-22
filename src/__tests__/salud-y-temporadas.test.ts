/** Pruebas del puntaje de salud financiera y de las fechas de cada temporada. */
import { describe, expect, test } from 'vitest';
import { computeHealth } from '../services/healthScore';
import { seasonFor } from '../services/season';

describe('Salud financiera', () => {
  test('sin ingresos no se calcula', () => {
    expect(computeHealth({ income: 0, expense: 50000, gustos: 0, bills: [] }).total).toBeNull();
  });
  test('ahorro alto, pocos gustos y sin deudas = excelente', () => {
    const h = computeHealth({ income: 2000000, expense: 1200000, gustos: 200000, bills: [] });
    expect(h.total).toBe(100);
    expect(h.label).toBe('Excelente');
    expect(h.focus).toBeNull();
  });
  test('gastar más de lo que entra baja el puntaje y señala el ahorro', () => {
    const h = computeHealth({ income: 1000000, expense: 1300000, gustos: 500000, bills: [] });
    expect(h.total!).toBeLessThan(60);
    expect(h.focus?.id).toBe('ahorro');
  });
});

describe('Temporadas', () => {
  const d = (m: number, day: number) => new Date(2026, m - 1, day, 12);
  test('Halloween todo octubre y se quita el 1 de noviembre', () => {
    expect(seasonFor(d(10, 1))).toBe('halloween');
    expect(seasonFor(d(10, 31))).toBe('halloween');
    expect(seasonFor(d(11, 1))).toBeNull();
  });
  test('Navidad del 1 de diciembre al 1 de enero', () => {
    expect(seasonFor(d(11, 30))).toBeNull();
    expect(seasonFor(d(12, 1))).toBe('navidad');
    expect(seasonFor(new Date(2027, 0, 1, 12))).toBe('navidad');
    expect(seasonFor(new Date(2027, 0, 2, 12))).toBeNull();
  });
});
