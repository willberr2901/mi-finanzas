import { useState } from 'react';
import { Calculator, DollarSign, Percent, ChevronDown, ChevronUp } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';

export default function CreditPage() {
  const { theme } = useTheme();
  const [amount, setAmount] = useState(5000000);
  const [rateEA, setRateEA] = useState(29.5);
  const [months, setMonths] = useState(24);
  const [showTable, setShowTable] = useState(false);

  const rm = Math.pow(1 + rateEA / 100, 1 / 12) - 1;
  const rateEM = rm * 100;
  const cuota = amount > 0 && rateEM > 0 && months > 0
    ? amount * ((rateEM / 100) * Math.pow(1 + rateEM / 100, months)) / (Math.pow(1 + rateEM / 100, months) - 1)
    : 0;
  const totalPagar = cuota * months;
  const interesesTotales = totalPagar - amount;

  // Generar tabla de amortización
  const amortTable = [];
  let saldo = amount;
  for (let i = 1; i <= months; i++) {
    const interesMes = saldo * (rateEM / 100);
    const capitalMes = cuota - interesMes;
    saldo -= capitalMes;
    amortTable.push({
      mes: i,
      cuota,
      interes: interesMes,
      capital: capitalMes,
      saldo: Math.max(saldo, 0)
    });
  }

  const isDark = theme === 'dark';
  const bgCard = isDark ? 'bg-white/5' : 'bg-white';
  const textPrimary = isDark ? 'text-white' : 'text-gray-900';
  const textSecondary = isDark ? 'text-gray-400' : 'text-gray-600';
  const borderColor = isDark ? 'border-white/10' : 'border-gray-200';

  const formatMoney = (n: number) => n.toLocaleString('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 });

  return (
    <div className={`min-h-screen pb-24 ${isDark ? '' : 'bg-gray-50'}`}>
      <div className={`${bgCard} backdrop-blur-md border-b ${borderColor} px-4 py-3`}>
        <div className="flex items-center gap-2">
          <span className="text-lg">💳</span>
          <div>
            <h1 className={`text-base font-bold ${textPrimary}`}>Créditos y Préstamos</h1>
            <p className={`text-[10px] ${textSecondary}`}>Simula tus cuotas</p>
          </div>
        </div>
      </div>

      <div className="p-3 space-y-3">
        {/* Configuración */}
        <div className={`${bgCard} backdrop-blur-md rounded-xl border ${borderColor} p-4`}>
          <h3 className={`text-sm font-bold ${textPrimary} mb-4`}>Configuración del Préstamo</h3>
          
          <div className="grid grid-cols-2 gap-3 mb-4">
            <div>
              <label className={`text-[10px] font-bold ${textSecondary} uppercase`}>Monto ($)</label>
              <input type="number" value={amount} onChange={e => setAmount(Number(e.target.value))}
                className={`w-full px-3 py-2 mt-1 rounded-lg ${bgCard} border ${borderColor} ${textPrimary} text-sm focus:outline-none focus:ring-2 focus:ring-purple-400/50`} />
            </div>
            <div>
              <label className={`text-[10px] font-bold ${textSecondary} uppercase`}>Tasa EA (%)</label>
              <input type="number" step="0.1" value={rateEA} onChange={e => setRateEA(Number(e.target.value))}
                className={`w-full px-3 py-2 mt-1 rounded-lg ${bgCard} border ${borderColor} ${textPrimary} text-sm focus:outline-none focus:ring-2 focus:ring-purple-400/50`} />
            </div>
          </div>

          <div className="space-y-2 mb-4">
            <div className="flex justify-between">
              <label className={`text-[10px] font-bold ${textSecondary} uppercase`}>Tasa EM (auto)</label>
              <span className="text-xs text-purple-400">{rateEM.toFixed(2)}%</span>
            </div>
            <div className={`px-3 py-2 rounded-lg ${isDark ? 'bg-purple-500/10 border border-purple-500/20' : 'bg-purple-50 border border-purple-200'}`}>
              <span className={`text-sm font-mono ${isDark ? 'text-purple-300' : 'text-purple-700'}`}>{rateEM.toFixed(2)}%</span>
            </div>
          </div>

          <div className="space-y-1">
            <div className="flex justify-between">
              <label className={`text-[10px] font-bold ${textSecondary} uppercase`}>Plazo</label>
              <span className="text-xs text-purple-400">{months} meses</span>
            </div>
            <input type="range" min="1" max="84" value={months} onChange={e => setMonths(Number(e.target.value))}
              className="w-full h-1.5 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-purple-500" />
            <div className="flex justify-between text-[9px] text-gray-600"><span>1</span><span>84</span></div>
          </div>
        </div>

        {/* Resultados */}
        <div className="grid grid-cols-2 gap-3">
          <div className={`${bgCard} backdrop-blur-md rounded-xl border ${borderColor} p-3 text-center`}>
            <p className={`text-[10px] ${textSecondary} mb-1`}>Cuota Mensual</p>
            <p className={`text-lg font-bold ${isDark ? 'text-purple-300' : 'text-purple-700'}`}>{formatMoney(cuota)}</p>
          </div>
          <div className={`${bgCard} backdrop-blur-md rounded-xl border ${borderColor} p-3 text-center`}>
            <p className={`text-[10px] ${textSecondary} mb-1`}>Total a Pagar</p>
            <p className={`text-lg font-bold ${textPrimary}`}>{formatMoney(totalPagar)}</p>
          </div>
        </div>

        <div className={`${bgCard} backdrop-blur-md rounded-xl border ${borderColor} p-3 flex justify-between items-center`}>
          <span className={`text-xs ${textSecondary}`}>Intereses Totales:</span>
          <span className="text-sm font-bold text-red-400">{formatMoney(interesesTotales)}</span>
        </div>

        {/* Tabla de Amortización */}
        <div className={`${bgCard} backdrop-blur-md rounded-xl border ${borderColor} overflow-hidden`}>
          <button onClick={() => setShowTable(!showTable)}
            className={`w-full px-4 py-3 flex items-center justify-between ${isDark ? 'hover:bg-white/5' : 'hover:bg-gray-50'}`}>
            <span className={`text-sm font-bold ${textPrimary}`}>📊 Tabla de Amortización</span>
            {showTable ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
          </button>
          
          {showTable && (
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className={`${isDark ? 'bg-white/5' : 'bg-gray-100'} border-b ${borderColor}`}>
                    <th className={`px-3 py-2 text-left ${textSecondary}`}>Mes</th>
                    <th className={`px-3 py-2 text-right ${textSecondary}`}>Cuota</th>
                    <th className={`px-3 py-2 text-right ${textSecondary}`}>Interés</th>
                    <th className={`px-3 py-2 text-right ${textSecondary}`}>Capital</th>
                    <th className={`px-3 py-2 text-right ${textSecondary}`}>Saldo</th>
                  </tr>
                </thead>
                <tbody>
                  {amortTable.map(row => (
                    <tr key={row.mes} className={`border-b ${borderColor} ${isDark ? 'hover:bg-white/5' : 'hover:bg-gray-50'}`}>
                      <td className={`px-3 py-2 ${textPrimary}`}>{row.mes}</td>
                      <td className={`px-3 py-2 text-right ${textPrimary}`}>{formatMoney(row.cuota)}</td>
                      <td className="px-3 py-2 text-right text-red-400">{formatMoney(row.interes)}</td>
                      <td className="px-3 py-2 text-right text-green-400">{formatMoney(row.capital)}</td>
                      <td className={`px-3 py-2 text-right ${textSecondary}`}>{formatMoney(row.saldo)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}