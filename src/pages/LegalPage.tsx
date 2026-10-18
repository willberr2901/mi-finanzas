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
