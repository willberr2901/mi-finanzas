// @vitest-environment happy-dom
/**
 * ✅ CALIFICACIÓN: que se pida en el momento justo y sin insistir.
 */
import { beforeEach, describe, expect, test, vi } from 'vitest';

beforeEach(() => { localStorage.clear(); vi.resetModules(); vi.useRealTimers(); });
const load = () => import('../services/ratingService');

describe('Cuándo pedir estrellas', () => {
  test('el primer día de uso no se pide; desde el segundo sí', async () => {
    const r = await load();
    localStorage.setItem('mf_fb_days', '1');
    expect(r.shouldAskRating()).toBe(false);
    localStorage.setItem('mf_fb_days', '2');
    expect(r.shouldAskRating()).toBe(true);
  });
  test('nunca dos veces el mismo día', async () => {
    const r = await load();
    localStorage.setItem('mf_fb_days', '5');
    r.markRatingShown();
    expect(r.shouldAskRating()).toBe(false);
  });
  test('"Ahora no" espera 3 días y después de 4 veces no vuelve a salir sola', async () => {
    const r = await load();
    localStorage.setItem('mf_fb_days', '5');
    r.dismissRating();
    expect(r.shouldAskRating()).toBe(false);
    const s = JSON.parse(localStorage.getItem('mf_rate')!);
    expect(Math.round((s.next - Date.now()) / 86400000)).toBe(3);
    for (let i = 0; i < 3; i++) r.dismissRating();
    localStorage.setItem('mf_rate', JSON.stringify({ ...JSON.parse(localStorage.getItem('mf_rate')!), next: 0 }));
    expect(r.shouldAskRating()).toBe(false);
  });
  test('con 4–5 estrellas no se vuelve a pedir sola; con 1–3, a los 60 días', async () => {
    const r = await load();
    localStorage.setItem('mf_fb_days', '9');
    r.saveRating(5);
    localStorage.setItem('mf_rate', JSON.stringify({ ...JSON.parse(localStorage.getItem('mf_rate')!), ratedAt: Date.now() - 200 * 86400000 }));
    expect(r.shouldAskRating()).toBe(false);
    r.saveRating(2);
    expect(r.shouldAskRating()).toBe(false);
    localStorage.setItem('mf_rate', JSON.stringify({ ...JSON.parse(localStorage.getItem('mf_rate')!), ratedAt: Date.now() - 61 * 86400000 }));
    expect(r.shouldAskRating()).toBe(true);
  });
});
