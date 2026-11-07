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

import { shouldOfferSupport, type SupportState } from '../services/supportService';
describe('Cuándo sale Apóyanos solo', () => {
  const D = 86400000, now = Date.UTC(2026, 10, 7);
  const base: SupportState = { firstSeen: now - 30 * D, opens: 5, dismissals: 0, lastAsk: 0, supportedAt: 0 };
  it('después de apoyar no vuelve a salir en 180 días', () => {
    expect(shouldOfferSupport({ ...base, lastAsk: now - D, supportedAt: now - D }, now)).toBe(false);
  });
  it('"Recordarme en un mes" no sale antes del mes', () => {
    expect(shouldOfferSupport({ ...base, supportedAt: now - D, remindAt: now + 29 * D }, now)).toBe(false);
  });
  it('cuando se cumple el mes sale una vez y luego espera (no en cada apertura)', () => {
    expect(shouldOfferSupport({ ...base, supportedAt: now - 31 * D, remindAt: now - D }, now)).toBe(true);
    // al mostrarse se borra remindAt → vuelve la regla de 180 días desde el apoyo
    expect(shouldOfferSupport({ ...base, supportedAt: now - 31 * D, lastAsk: now }, now)).toBe(false);
  });
  it('"Ahora no" espera 14 días', () => {
    expect(shouldOfferSupport({ ...base, dismissals: 1, lastAsk: now - 3 * D }, now)).toBe(false);
  });
});
