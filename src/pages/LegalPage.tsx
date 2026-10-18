/**
 * ════════════════════════════════════════════════════════════════════
 * ⚖️ PANTALLA PRIVACIDAD
 * ────────────────────────────────────────────────────────────────────
 * Qué hace: Muestra la política y los términos.
 * Dónde se ve: Menú → Privacidad.
 * Si lo cambias: El texto está en components/legal/LegalContent.tsx.
 * ════════════════════════════════════════════════════════════════════
 */
import ModuleHeader from '../components/ui/ModuleHeader';
import LegalContent from '../components/legal/LegalContent';

export default function LegalPage() {
  return (
    <div className="pb-28">
      <ModuleHeader module="legal" />
      <div className="bg-surface border border-white/5 rounded-3xl p-5">
        <LegalContent />
      </div>
    </div>
  );
}
