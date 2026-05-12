import { formatCurrency } from '../utils/format';
import { RentabilidadDia } from '../types';

interface Props {
  data: RentabilidadDia;
}

export default function RentabilidadCard({ data }: Props) {
  return (
    <div className="bg-[#111827] rounded-3xl p-5 border border-white/5 shadow-lg">
      <div className="mb-5">
        <h3 className="text-lg font-semibold text-white">Cuenta de Ahorro</h3>
        <p className="text-xs text-slate-400">{data.tasaEA}% EA • Actualizado hoy</p>
      </div>
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <span className="text-slate-400 text-sm">Saldo anterior</span>
          <span className="text-white font-medium">{formatCurrency(data.saldoAnterior)}</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-slate-400 text-sm">Interés generado</span>
          <span className="text-emerald-400 font-bold">+{formatCurrency(data.interesGenerado)}</span>
        </div>
        <div className="pt-3 border-t border-white/10 flex justify-between items-center">
          <span className="text-slate-400 text-sm font-medium">Saldo actual</span>
          <span className="text-white font-bold text-xl">{formatCurrency(data.saldoActual)}</span>
        </div>
      </div>
    </div>
  );
}