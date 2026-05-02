import { useState, useEffect } from 'react';
import { calculateCredit } from '../services/creditService';
import type { CreditResult } from '../services/creditService';
import { Calculator } from 'lucide-react';

export default function CreditCalculator() {
  const [amount, setAmount] = useState(1000000);
  const [annualRate, setAnnualRate] = useState(29.5); // Tasa E.A.
  const [monthlyRate, setMonthlyRate] = useState(2.18); // Tasa E.M. (calculada)
  const [rateType, setRateType] = useState<'EA' | 'EM'>('EA'); // Tipo de tasa activa
  const [months, setMonths] = useState(12);
  const [result, setResult] = useState<CreditResult | null>(null);

  // Conversión automática entre E.A. y E.M.
  useEffect(() => {
    if (rateType === 'EA') {
      // Convertir E.A. a E.M.
      // EM = (1 + EA)^(1/12) - 1
      const em = (Math.pow(1 + annualRate / 100, 1 / 12) - 1) * 100;
      setMonthlyRate(parseFloat(em.toFixed(4)));
    } else {
      // Convertir E.M. a E.A.
      // EA = (1 + EM)^12 - 1
      const ea = (Math.pow(1 + monthlyRate / 100, 12) - 1) * 100;
      setAnnualRate(parseFloat(ea.toFixed(2)));
    }
  }, [annualRate, monthlyRate, rateType]);

  const handleCalculate = () => {
    // Usar siempre la tasa E.A. para el cálculo
    const rateToUse = rateType === 'EA' ? annualRate : 
                      (Math.pow(1 + monthlyRate / 100, 12) - 1) * 100;
    
    const res = calculateCredit(amount, rateToUse, months);
    setResult(res);
  };

  // Formateador de moneda colombiana
  const formatMoney = (val: number) => 
    val.toLocaleString('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 });

  // Input formateado para monto
  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/[^0-9]/g, '');
    if (value) {
      setAmount(parseInt(value, 10));
    }
  };

  return (
    <div className="bg-gray-800 p-6 rounded-2xl border border-gray-700 space-y-6">
      <h2 className="text-xl font-bold text-white flex items-center gap-2">
        <Calculator className="w-6 h-6 text-purple-400" />
        Simulador de Crédito
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Monto */}
        <div className="space-y-2">
          <label className="text-sm text-gray-400">Monto del Préstamo</label>
          <input
            type="text"
            value={amount.toLocaleString('es-CO')}
            onChange={handleAmountChange}
            className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-purple-500 outline-none font-mono"
            placeholder="$ 0"
          />
        </div>

        {/* Tasa E.A. */}
        <div className="space-y-2">
          <label className="text-sm text-gray-400">Tasa E.A. (%)</label>
          <input
            type="number"
            step="0.01"
            value={rateType === 'EA' ? annualRate : annualRate}
            onChange={e => {
              setAnnualRate(parseFloat(e.target.value) || 0);
              setRateType('EA');
            }}
            className={`w-full p-3 bg-gray-700 border rounded-lg text-white focus:ring-2 outline-none font-mono ${
              rateType === 'EM' ? 'border-gray-600 text-gray-400' : 'border-purple-500 focus:ring-purple-500'
            }`}
            placeholder="29.5"
          />
        </div>

        {/* Tasa E.M. */}
        <div className="space-y-2">
          <label className="text-sm text-gray-400">Tasa E.M. (%)</label>
          <input
            type="number"
            step="0.0001"
            value={rateType === 'EM' ? monthlyRate : monthlyRate}
            onChange={e => {
              setMonthlyRate(parseFloat(e.target.value) || 0);
              setRateType('EM');
            }}
            className={`w-full p-3 bg-gray-700 border rounded-lg text-white focus:ring-2 outline-none font-mono ${
              rateType === 'EA' ? 'border-gray-600 text-gray-400' : 'border-purple-500 focus:ring-purple-500'
            }`}
            placeholder="2.18"
          />
        </div>
      </div>

      {/* Plazo */}
      <div className="space-y-2">
        <label className="text-sm text-gray-400">Plazo (Meses)</label>
        <input
          type="number"
          value={months}
          onChange={e => setMonths(parseInt(e.target.value) || 0)}
          className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-purple-500 outline-none font-mono"
          placeholder="12"
        />
      </div>

      <button
        onClick={handleCalculate}
        className="w-full bg-purple-600 hover:bg-purple-700 text-white font-bold py-3 rounded-xl transition-colors flex items-center justify-center gap-2"
      >
        <Calculator className="w-5 h-5" />
        Calcular Cuota
      </button>

      {/* Resultados */}
      {result && (
        <div className="mt-6 space-y-4 animate-fadeIn">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-gray-700/50 p-4 rounded-xl border-l-4 border-green-500">
              <p className="text-gray-400 text-sm">Cuota Mensual</p>
              <p className="text-2xl font-bold text-white">{formatMoney(result.monthlyPayment)}</p>
            </div>
            
            <div className="bg-gray-700/50 p-4 rounded-xl border-l-4 border-blue-500">
              <p className="text-gray-400 text-sm">Total a Pagar</p>
              <p className="text-2xl font-bold text-white">{formatMoney(result.totalPayment)}</p>
            </div>

            <div className="bg-gray-700/50 p-4 rounded-xl border-l-4 border-red-500">
              <p className="text-gray-400 text-sm">Intereses Totales</p>
              <p className="text-2xl font-bold text-red-400">{formatMoney(result.totalInterest)}</p>
            </div>
          </div>

          {/* TABLA COMPLETA DE AMORTIZACIÓN */}
          <div className="bg-gray-900 rounded-xl overflow-hidden border border-gray-700">
            <div className="px-4 py-3 bg-gray-800 border-b border-gray-700 flex justify-between items-center">
              <h4 className="text-white font-bold">Tabla de Amortización Completa</h4>
              <span className="text-xs bg-purple-600 px-2 py-1 rounded text-white">
                {months} meses
              </span>
            </div>
            <div className="overflow-x-auto max-h-96 overflow-y-auto">
              <table className="w-full text-sm text-left text-gray-400">
                <thead className="text-xs uppercase bg-gray-800 sticky top-0">
                  <tr>
                    <th className="px-4 py-3 text-center">Mes</th>
                    <th className="px-4 py-3 text-right">Cuota</th>
                    <th className="px-4 py-3 text-right text-green-400">Abono Capital</th>
                    <th className="px-4 py-3 text-right text-red-400">Interés</th>
                    <th className="px-4 py-3 text-right">Saldo</th>
                  </tr>
                </thead>
                <tbody>
                  {result.schedule.map((row, index) => (
                    <tr 
                      key={row.month} 
                      className={`border-b border-gray-700 hover:bg-gray-800/50 transition-colors ${
                        index % 2 === 0 ? 'bg-gray-900' : 'bg-gray-800/30'
                      }`}
                    >
                      <td className="px-4 py-3 text-center font-medium text-white">{row.month}</td>
                      <td className="px-4 py-3 text-right text-white font-mono">
                        {formatMoney(row.payment)}
                      </td>
                      <td className="px-4 py-3 text-right font-mono text-green-400">
                        {formatMoney(row.principal)}
                      </td>
                      <td className="px-4 py-3 text-right font-mono text-red-400">
                        {formatMoney(row.interest)}
                      </td>
                      <td className="px-4 py-3 text-right font-mono">
                        {formatMoney(row.balance)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}