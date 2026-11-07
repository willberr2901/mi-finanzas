import { describe, it, expect } from 'vitest';
import { kaiSupportLine } from '../services/supportService';

describe('Apóyanos con Kai', () => {
  it('saluda antes de elegir', () => {
    expect(kaiSupportLine(2000, false).text).toMatch(/Soy Kai/);
  });
  it('reacciona según el monto', () => {
    expect(kaiSupportLine(1000, true).text).toMatch(/tintico/);
    expect(kaiSupportLine(5000, true)).toMatchObject({ mood: 'celebra' });
    expect(kaiSupportLine(5000, true).text).toMatch(/pandebono/);
    expect(kaiSupportLine(20000, true).text).toMatch(/bailar/);
  });
  it('pide un valor válido si es menor a $100', () => {
    expect(kaiSupportLine(0, true).mood).toBe('pensando');
  });
});

import { streakDays } from '../pages/HomePage';
describe('Racha de Kai', () => {
  const t = (d: string) => ({ date: d });
  it('cuenta días seguidos hasta hoy', () => {
    expect(streakDays([t('2026-11-06'), t('2026-11-05'), t('2026-11-04'), t('2026-11-01')], new Date(2026, 10, 6))).toBe(3);
  });
  it('si hoy aún no anota, cuenta desde ayer', () => {
    expect(streakDays([t('2026-11-05'), t('2026-11-04')], new Date(2026, 10, 6))).toBe(2);
  });
  it('sin movimientos recientes es 0', () => {
    expect(streakDays([t('2026-10-01')], new Date(2026, 10, 6))).toBe(0);
  });
});
