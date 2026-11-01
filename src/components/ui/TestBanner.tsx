/** 🧪 Franja que solo aparece en la app de pruebas (ver utils/env.ts). */
import { useEffect } from 'react';
import { IS_TEST } from '../../utils/env';
import { APP_VERSION } from '../../version';

export default function TestBanner() {
  // Deja espacio arriba para que la franja no tape el encabezado
  useEffect(() => { if (IS_TEST) document.body.style.paddingTop = '26px'; }, []);
  if (!IS_TEST) return null;
  return (
    <div className="fixed left-1/2 -translate-x-1/2 z-[300] pointer-events-none" style={{ top: 'max(4px, env(safe-area-inset-top))' }} role="status">
      <span className="block px-3 py-1 rounded-full bg-orange-500 text-[#1A0A00] text-[10px] font-extrabold tracking-widest shadow-lg shadow-black/40 whitespace-nowrap">
        🧪 AMBIENTE DE PRUEBAS · v{APP_VERSION}
      </span>
    </div>
  );
}
