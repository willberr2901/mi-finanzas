/** Pruebas de cuándo se ofrece "Apóyanos" (sin ser intensos). */
import { describe, expect, test } from 'vitest';
import { shouldOfferSupport, SUPPORT_QR } from '../services/supportService';

const D = 86400000, T0 = Date.UTC(2026, 10, 1);
const base = { firstSeen: T0, opens: 0, dismissals: 0, lastAsk: 0, supportedAt: 0 };

describe('Apóyanos', () => {
  test('no sale los primeros días ni con pocas aperturas', () => {
    expect(shouldOfferSupport({ ...base, opens: 10 }, T0 + 2 * D)).toBe(false);
    expect(shouldOfferSupport({ ...base, opens: 3 }, T0 + 9 * D)).toBe(false);
    expect(shouldOfferSupport({ ...base, opens: 5 }, T0 + 5 * D)).toBe(true);
  });
  test('si dice "Ahora no", espera cada vez más (14, 30, 60, 120 días)', () => {
    const s1 = { ...base, opens: 9, dismissals: 1, lastAsk: T0 };
    expect(shouldOfferSupport(s1, T0 + 13 * D)).toBe(false);
    expect(shouldOfferSupport(s1, T0 + 14 * D)).toBe(true);
    expect(shouldOfferSupport({ ...s1, dismissals: 2 }, T0 + 29 * D)).toBe(false);
    expect(shouldOfferSupport({ ...s1, dismissals: 3 }, T0 + 60 * D)).toBe(true);
    expect(shouldOfferSupport({ ...s1, dismissals: 7 }, T0 + 100 * D)).toBe(false);
  });
  test('si ya apoyó, no se ofrece en 180 días', () => {
    const s = { ...base, opens: 30, supportedAt: T0 };
    expect(shouldOfferSupport(s, T0 + 90 * D)).toBe(false);
    expect(shouldOfferSupport(s, T0 + 181 * D)).toBe(true);
  });
  test('el QR Bre-B es válido (código de control CRC correcto)', () => {
    const body = SUPPORT_QR.slice(0, -4);
    let crc = 0xffff;
    for (const ch of new TextEncoder().encode(body)) { crc ^= ch << 8; for (let i = 0; i < 8; i++) crc = (crc & 0x8000 ? (crc << 1) ^ 0x1021 : crc << 1) & 0xffff; }
    expect(crc.toString(16).toUpperCase().padStart(4, '0')).toBe(SUPPORT_QR.slice(-4));
    expect(SUPPORT_QR.toLowerCase()).toContain('@wbr617');
  });
});
