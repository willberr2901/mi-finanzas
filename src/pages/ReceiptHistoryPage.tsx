import { useTheme } from '../contexts/ThemeContext';
import { ArrowLeft, Store, Calendar, DollarSign, FileText } from 'lucide-react';
import { Link } from 'react-router-dom';

const sampleReceipts = [
  {
    id: 1,
    store: 'Éxito',
    storeLogo: '🏪',
    date: '2026-05-02',
    total: 125000,
    items: [
      { name: 'Arroz Diana 5kg', price: 18500 },
      { name: 'Aceite Girasol 3L', price: 22000 },
      { name: 'Leche Alquería x12', price: 32000 },
      { name: 'Pollo x3 unidades', price: 32500 },
      { name: 'Jabón Bolívar x3', price: 20000 },
    ],
    comparedToMarket: [
      { item: 'Arroz', planned: 15000, actual: 18500, diff: 3500 },
      { item: 'Aceite', planned: 20000, actual: 22000, diff: 2000 },
      { item: 'Pollo', planned: 30000, actual: 32500, diff: 2500 },
    ]
  },
  {
    id: 2,
    store: 'SuperInter',
    storeLogo: '🛒',
    date: '2026-04-28',
    total: 89000,
    items: [
      { name: 'Leche x6', price: 24000 },
      { name: 'Pan x2', price: 8000 },
      { name: 'Huevos x30', price: 18000 },
      { name: 'Café Juan Valdez', price: 39000 },
    ],
    comparedToMarket: [
      { item: 'Leche', planned: 20000, actual: 24000, diff: 4000 },
      { item: 'Café', planned: 35000, actual: 39000, diff: 4000 },
    ]
  }
];

export default function ReceiptHistoryPage() {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const bgCard = isDark ? 'bg-white/5' : 'bg-white';
  const textPrimary = isDark ? 'text-white' : 'text-gray-900';
  const textSecondary = isDark ? 'text-gray-400' : 'text-gray-600';
  const borderColor = isDark ? 'border-white/10' : 'border-gray-200';

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString('es-CO', { day: 'numeric', month: 'long', year: 'numeric' });
  };

  const formatMoney = (n: number) => n.toLocaleString('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 });

  return (
    <div className={`min-h-screen pb-24 ${isDark ? '' : 'bg-gray-50'}`}>
      <div className={`${bgCard} backdrop-blur-md border-b ${borderColor} px-4 py-3 flex items-center gap-3`}>
        <Link to="/escaner" className="p-1">
          <ArrowLeft className={`w-5 h-5 ${textPrimary}`} />
        </Link>
        <h1 className={`text-lg font-bold ${textPrimary}`}>Historial de Facturas</h1>
      </div>

      <div className="p-3 space-y-4">
        {sampleReceipts.map(receipt => (
          <div key={receipt.id} className={`${bgCard} backdrop-blur-md rounded-xl border ${borderColor} overflow-hidden`}>
            <div className={`px-4 py-3 ${isDark ? 'bg-white/5' : 'bg-gray-100'} border-b ${borderColor} flex items-center justify-between`}>
              <div className="flex items-center gap-3">
                <span className="text-2xl">{receipt.storeLogo}</span>
                <div>
                  <p className={`text-sm font-bold ${textPrimary}`}>{receipt.store}</p>
                  <div className="flex items-center gap-1">
                    <Calendar className="w-3 h-3 text-gray-500" />
                    <span className={`text-[10px] ${textSecondary}`}>{formatDate(receipt.date)}</span>
                  </div>
                </div>
              </div>
              <div className="text-right">
                <p className={`text-lg font-bold ${textPrimary}`}>{formatMoney(receipt.total)}</p>
                <p className={`text-[10px] ${textSecondary}`}>{receipt.items.length} productos</p>
              </div>
            </div>

            <div className="p-3 space-y-2">
              {receipt.items.map((item, i) => (
                <div key={i} className={`flex justify-between text-sm py-1.5 border-b ${borderColor} last:border-0`}>
                  <span className={textPrimary}>{item.name}</span>
                  <span className={`font-medium ${textPrimary}`}>{formatMoney(item.price)}</span>
                </div>
              ))}
            </div>

            <div className={`px-4 py-3 ${isDark ? 'bg-yellow-500/5' : 'bg-yellow-50'} border-t ${borderColor}`}>
              <p className={`text-xs font-bold ${textSecondary} mb-2`}>📊 Comparación vs Lista de Mercado</p>
              <div className="space-y-2">
                {receipt.comparedToMarket.map((comp, i) => (
                  <div key={i} className="flex items-center justify-between text-xs">
                    <span className={textPrimary}>{comp.item}</span>
                    <div className="flex items-center gap-3">
                      <span className={textSecondary}>Plan: {formatMoney(comp.planned)}</span>
                      <span className={textPrimary}>Real: {formatMoney(comp.actual)}</span>
                      <span className={`font-bold ${comp.diff > 0 ? 'text-red-400' : 'text-green-400'}`}>
                        {comp.diff > 0 ? '↑' : '↓'} {formatMoney(Math.abs(comp.diff))}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}