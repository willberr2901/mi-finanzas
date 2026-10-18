/**
 * ════════════════════════════════════════════════════════════════════
 * 🛡️ PROTECCIONES AL ARRANCAR
 * ────────────────────────────────────────────────────────────────────
 * Qué hace:
 *  1) Anti-"clickjacking": si alguien mete la app dentro de otra página
 *     (un marco invisible para engañarte y que toques botones), la app se sale.
 *  2) Dirección oficial: si la app se abre desde una dirección que no es la
 *     nuestra (página clonada o "espejo" para robar), muestra una alerta roja.
 *  3) Revisa que el navegador tenga cifrado real (Web Crypto) y conexión segura.
 * Dónde se ve: solo aparece algo si detecta un peligro.
 * Si lo cambias: al usar un dominio propio (ej. mifinanzas.app), agrégalo en OFFICIAL_HOSTS.
 * Se llama desde src/main.tsx antes de dibujar la app.
 * ════════════════════════════════════════════════════════════════════
 */

/** Direcciones donde la app es oficial. */
export const OFFICIAL_HOSTS = ['mi-finanzas.onrender.com', 'localhost', '127.0.0.1'];
const isOfficial = (h: string) => OFFICIAL_HOSTS.includes(h) || /^mi-finanzas[a-z0-9-]*\.vercel\.app$/.test(h);

export const securityStatus = () => ({
  officialHost: isOfficial(location.hostname),
  https: location.protocol === 'https:' || ['localhost', '127.0.0.1'].includes(location.hostname),
  webCrypto: !!(window.crypto && crypto.subtle),
  notFramed: window.top === window.self,
});

const banner = (text: string) => {
  const d = document.createElement('div');
  d.setAttribute('role', 'alert');
  d.style.cssText = 'position:fixed;inset:0 0 auto 0;z-index:2147483647;background:#b91c1c;color:#fff;font:600 14px/1.35 system-ui;padding:14px 16px;text-align:center';
  d.textContent = text;            // texto plano: nunca HTML
  document.body.appendChild(d);
};

export const applyHardening = () => {
  // 1) Anti-clickjacking
  if (window.top !== window.self) {
    // La app no se muestra dentro de otra página (los navegadores a veces bloquean el salto, así que además se oculta).
    document.documentElement.style.display = 'none';
    try { window.top!.location.href = window.self.location.href; } catch { /* el navegador no dejó saltar: queda oculta */ }
    throw new Error('Mi Finanzas no se puede abrir dentro de otra página');
  }
  // 2) Dirección oficial
  if (!isOfficial(location.hostname)) {
    window.addEventListener('DOMContentLoaded', () => banner(`⚠️ Cuidado: esta no es la dirección oficial de Mi Finanzas (${OFFICIAL_HOSTS[0]}). No escribas datos aquí.`));
    if (document.readyState !== 'loading') banner(`⚠️ Cuidado: esta no es la dirección oficial de Mi Finanzas (${OFFICIAL_HOSTS[0]}). No escribas datos aquí.`);
  }
  // 3) Conexión segura
  if (location.protocol === 'http:' && !['localhost', '127.0.0.1'].includes(location.hostname)) {
    location.replace(location.href.replace(/^http:/, 'https:'));
  }
};
