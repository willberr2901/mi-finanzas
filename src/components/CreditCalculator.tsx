import { useState, useEffect } from 'react';
import { Calculator, DollarSign, Percent, Calendar } from 'lucide-react';

const GLASS_CARD = {
  background: 'rgba(255, 255, 255, 0.05)',
  backdropFilter: 'blur(10px)',
  border: '1px solid rgba(255, 255, 255, 0.1)',
};

export default function CreditCalculator() {
  const [amount, setAmount] = useState(5000000);
  const [rateEA, setRateEA] = useState(29.5);
  const [months, setMonths] = useState(24);
  const [rateEM, setRateEM] = useState(0);
  const [cuota, setCuota] = useState(0);
  const [totalPagar, setTotalPagar] = useState(0);

  useEffect(() => {
    const rm = Math.pow(1 + rateEA / 100, 1 / 12) - 1;
    const rateEMPercent = rm * 100;
    setRateEM(rateEMPercent);

    if (amount > 0 && rateEMPercent > 0 && months > 0) {
      const i = rateEMPercent / 100;
      const numerator = i * Math.pow(1 + i, months);
      const denominator = Math.pow(1 + i, months) - 1;
      const monthlyPayment = amount * (numerator / denominator);
      
      setCuota(monthlyPayment);
      setTotalPagar(monthlyPayment * months);
    } else {
      setCuota(0);
      setTotalPagar(0);
    }
  }, [amount, rateEA, months]);

  const formatMoney = (num: number) =>
    num.toLocaleString('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 });

  return (
    <div className="max-w-4xl mx-auto p-4 space-y-6 pb-24">
      <div className="flex items-center gap-3 mb-2">
        <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center">
          <DollarSign className="w-5 h-5 text-white" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-white">Simulador de Crédito</h1>
          <p className="text-[10px] text-gray-400 uppercase tracking-wider">Calcula tus cuotas</p>
        </div>
      </div>

      <div className="rounded-2xl p-5 border border-white/10 bg-white/5 backdrop-blur-md">
        <h3 className="text-sm font-bold text-gray-300 mb-5 flex items-center gap-2">
          <Calculator className="w-4 h-4 text-purple-400" />
          Configuración del Préstamo
        </h3>

        <div className="grid grid-cols-2 gap-x-4 gap-y-5">
          {/* Monto */}
          <div className="space-y-2">
            <label className="text-[10px] font-bold text-gray-500 uppercase">Monto ($)</label>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(Number(e.target.value))}
              className="w-full px-3 py-2 bg-black/20 border border-white/10 rounded-lg text-white text-sm focus:outline-none focus:border-purple-500/50 transition-all"
            />
          </div>

          {/* Tasa EA */}
          <div className="space-y-2">
            <label className="text-[10px] font-bold text-gray-500 uppercase">Tasa EA (%)</label>
            <div className="relative">
              <input
                type="number"
                step="0.1"
                value={rateEA}
                onChange={(e) => setRateEA(Number(e.target.value))}
                className="w-full px-3 py-2 bg-black/20 border border-white/10 rounded-lg text-white text-sm focus:outline-none focus:border-purple-500/50 transition-all pr-8"
              />
              <span className="absolute right-3 top-2 text-purple-400 text-xs font-bold">%</span>
            </div>
          </div>

          {/* Tasa EM (Auto) */}
          <div className="space-y-2">
            <label className="text-[10px] font-bold text-gray-500 uppercase">Tasa EM (Auto)</label>
            <div className="px-3 py-2 bg-purple-500/10 border border-purple-500/20 rounded-lg text-purple-300 font-mono text-sm flex justify-between items-center">
              <span>{rateEM.toFixed(2)}%</span>
              <Percent className="w-3 h-3 opacity-50" />
            </div>
          </div>

          {/* Plazo */}
          <div className="space-y-2">
            <label className="text-[10px] font-bold text-gray-500 uppercase">Plazo ({months} meses)</label>
            <input
              type="range"
              min="1"
              max="84"
              value={months}
              onChange={(e) => setMonths(Number(e.target.value))}
              className="w-full h-1.5 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-purple-500"
            />
            <div className="flex justify-between text-[9px] text-gray-600 px-1">
              <span>1</span>
              <span>84</span>
            </div>
          </div>
        </div>

        {/* Resultados Glass */}
        <div className="mt-6 grid grid-cols-2 gap-3">
          <div style={GLASS_CARD} className="p-3 rounded-xl text-center">
            <p className="text-[10px] text-gray-400 mb-1">Cuota Mensual</p>
            <p className="text-lg font-bold text-purple-300">{formatMoney(cuota)}</p>
          </div>
          
          <div style={GLASS_CARD} className="p-3 rounded-xl text-center">
            <p className="text-[10px] text-gray-400 mb-1">Total a Pagar</p>
            <p className="text-lg font-bold text-white">{formatMoney(totalPagar)}</p>
          </div>
        </div>

        <div className="mt-3 p-2 px-3 bg-black/30 rounded-lg border border-white/5 flex justify-between items-center">
          <span className="text-xs text-gray-500">Intereses Totales:</span>
          <span className="text-sm font-bold text-red-400">{formatMoney(totalPagar - amount)}</span>
        </div>
      </div>
    </div>
  );
}