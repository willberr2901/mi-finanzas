import CreditCalculator from '../components/CreditCalculator';

export default function CreditPage() {
  return (
    <div className="max-w-4xl mx-auto p-4 space-y-6">
      <header className="pt-4">
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          💳 Créditos y Préstamos
        </h1>
        <p className="text-gray-400 text-sm">Simula tus cuotas antes de firmar</p>
      </header>
      
      <CreditCalculator />
    </div>
  );
}