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
