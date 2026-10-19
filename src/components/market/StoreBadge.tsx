/**
 * ════════════════════════════════════════════════════════════════════
 * 🏪 IMAGEN DE LA TIENDA (la misma para todas)
 * ────────────────────────────────────────────────────────────────────
 * Qué hace: dibuja una tiendita con toldo a rayas (dibujo propio de la app).
 *           Es igual para todas las tiendas: el nombre se muestra al lado o debajo.
 * Por qué no los logos reales: son marcas registradas de cada empresa.
 * Dónde se ve: Mercado → "¿Dónde estás comprando?", Terminar mercado,
 *              Historial y Precios por tienda.
 * ════════════════════════════════════════════════════════════════════
 */

export default function StoreBadge({ size = 36, className = '' }: { name?: string; size?: number; className?: string }) {
  return (
    <span aria-hidden="true" style={{ width: size, height: size, borderRadius: size * 0.3 }}
      className={`relative inline-flex items-center justify-center shrink-0 overflow-hidden bg-gradient-to-b from-[#2A3570] to-[#151D45] ring-1 ring-white/10 shadow-md shadow-black/30 ${className}`}>
      <svg viewBox="0 0 48 48" width={size * 0.8} height={size * 0.8}>
        {/* Fachada */}
        <rect x="8" y="19" width="32" height="22" rx="2.5" fill="#F4F6FF" />
        {/* Toldo a rayas */}
        <path d="M6 12.5 9 7h30l3 5.5z" fill="#C6F432" />
        <g>
          {[0, 1, 2, 3, 4, 5].map(i => (
            <path key={i} d={`M${6 + i * 6} 12.5h6v3.2a3 3 0 0 1-6 0z`} fill={i % 2 ? '#F4F6FF' : '#C6F432'} />
          ))}
        </g>
        {/* Puerta */}
        <rect x="27" y="26" width="8.5" height="15" rx="1.5" fill="#1B2350" />
        <circle cx="33.6" cy="34" r="0.9" fill="#C6F432" />
        {/* Vitrina */}
        <rect x="12" y="26" width="11.5" height="8.5" rx="1.5" fill="#7DD3FC" />
        <path d="M13.5 33l3-3.5 2.5 2.5 2-1.5 1.5 2.5z" fill="#F4F6FF" opacity=".75" />
        {/* Andén */}
        <rect x="5" y="40.5" width="38" height="2.5" rx="1.25" fill="#C6F432" opacity=".55" />
      </svg>
    </span>
  );
}
