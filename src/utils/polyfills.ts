/**
 * Arreglos para celulares viejos. Se carga antes que todo en main.tsx.
 * crypto.randomUUID no existe en Android/iPhone antiguos (Chrome < 92, Safari < 15.4):
 * sin esto, agregar al mercado, préstamos o pagos fallaba en silencio y no se guardaba nada.
 */
if (typeof crypto !== 'undefined' && typeof crypto.randomUUID !== 'function') {
  (crypto as any).randomUUID = () => {
    const b = crypto.getRandomValues(new Uint8Array(16));
    b[6] = (b[6] & 0x0f) | 0x40; b[8] = (b[8] & 0x3f) | 0x80;
    const h = Array.from(b, x => x.toString(16).padStart(2, '0')).join('');
    return `${h.slice(0, 8)}-${h.slice(8, 12)}-${h.slice(12, 16)}-${h.slice(16, 20)}-${h.slice(20)}`;
  };
}
export {};
