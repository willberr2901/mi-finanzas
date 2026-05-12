import { useState } from 'react';
import { useRentabilidad } from './hooks/useRentabilidad';
import RentabilidadCard from './components/RentabilidadCard';
import { formatCurrency } from './utils/format';
import { solicitarPermiso } from './notifications/notificationService';

// Valores por defecto (en producción vendrían de tu base de datos o settings)
const DEFAULT_TASA_EA = 9.25;
const DEFAULT_SALDO_INICIAL = 1000000;

export default function RentabilidadPage() {
  const [tasaEA] = useState(DEFAULT_TASA_EA);
  const [saldoInicial] = useState(DEFAULT_SALDO_INICIAL);
  const historial = useRentabilidad(tasaEA, saldoInicial);
  const registroHoy = historial[0];

  const handleActivarNotificaciones = async () => {
    const ok = await solicitarPermiso();
    alert(ok ? '✅ Notificaciones activadas' : '❌ Permiso denegado');
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-white">Rentabilidad</h1>
          <p className="text-slate-400 text-sm">Crece tu dinero día a día</p>
        </div>
        <button onClick={handleActivarNotificaciones} className="p-2 bg-white/5 rounded-xl hover:bg-white/10 transition">🔔</button>
      </div>

      {registroHoy ? (
        <>
          <div className="bg-gradient-to-br from-emerald-600 to-teal-500 rounded-3xl p-6 shadow-xl shadow-emerald-900/20">
            <p className="text-emerald-100 text-xs font-bold uppercase tracking-wider">INTERÉS GENERADO HOY</p>
            <h2 className="text-4xl font-bold text-white mt-3">{formatCurrency(registroHoy.interesGenerado)}</h2>
            <div className="mt-4 flex justify-between items-end">
              <div>
                <p className="text-emerald-100 text-xs">Tasa Anual</p>
                <p className="text-white font-semibold text-lg">{tasaEA}% EA</p>
              </div>
              <div className="text-right">
                <p className="text-emerald-100 text-xs">Días calculados</p>
                <p className="text-white font-semibold text-lg">{historial.length}</p>
              </div>
            </div>
          </div>

          <RentabilidadCard data={registroHoy} />

          <div className="bg-[#111827] rounded-2xl p-4 border border-white/5">
            <h3 className="text-white font-semibold mb-3">Historial Reciente</h3>
            <div className="space-y-2 max-h-48 overflow-y-auto custom-scrollbar">
              {historial.slice(1, 8).map(r => (
                <div key={r.id} className="flex justify-between items-center py-2 border-b border-white/5 last:border-0">
                  <span className="text-slate-400 text-xs">{r.fecha}</span>
                  <span className="text-emerald-400 text-sm font-medium">+{formatCurrency(r.interesGenerado)}</span>
                </div>
              ))}
              {historial.length <= 1 && <p className="text-slate-500 text-xs text-center py-2">Primer registro creado hoy</p>}
            </div>
          </div>
        </>
      ) : (
        <div className="flex flex-col items-center justify-center py-12 text-slate-500">
          <p>Calculando rentabilidad...</p>
        </div>
      )}
    </div>
  );
}