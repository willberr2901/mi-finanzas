import { useState } from 'react';
import { useRentabilidad } from '../modules/rentabilidad/hooks/useRentabilidad';
import RentabilidadCard from '../modules/rentabilidad/components/RentabilidadCard';
import { formatCurrency } from '../modules/rentabilidad/utils/format';
import { solicitarPermiso } from '../modules/rentabilidad/notifications/notificationService';

// Configuración de ejemplo para el nuevo módulo
// En una versión futura, estos datos vendrían de los "Ajustes"
const TASA_EA_DEMO = 9.25; 
const SALDO_INICIAL_DEMO = 1000000; // 1 Millón de pesos de ejemplo

export default function ProfitabilityPage() {
  const [tasaEA] = useState(TASA_EA_DEMO);
  const [saldoInicial] = useState(SALDO_INICIAL_DEMO);
  
  // Usamos el hook que calcula el interés diario automáticamente
  const historial = useRentabilidad(tasaEA, saldoInicial);
  const registroHoy = historial[0]; // El registro más reciente es el de hoy

  const handleActivarNotificaciones = async () => {
    const ok = await solicitarPermiso();
    if (ok) alert('✅ Notificaciones activadas: Te avisaremos cuando haya ganancia.');
  };

  return (
    <div className="space-y-6 pb-24 pt-4">
      <div className="flex justify-between items-center px-2">
        <div>
          <h1 className="text-2xl font-bold text-white">Rentabilidad</h1>
          <p className="text-slate-400 text-sm">Crecimiento automático diario</p>
        </div>
        <button onClick={handleActivarNotificaciones} className="p-2 bg-white/5 rounded-xl hover:bg-white/10 transition text-xl">
          🔔
        </button>
      </div>

      {registroHoy ? (
        <>
          {/* Tarjeta Principal de Ganancia */}
          <div className="bg-gradient-to-br from-emerald-600 to-teal-500 rounded-3xl p-6 shadow-xl shadow-emerald-900/20 relative overflow-hidden mx-2">
             <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl -mr-10 -mt-10"></div>
            <p className="text-emerald-100 text-xs font-bold uppercase tracking-wider">INTERÉS GENERADO HOY</p>
            <h2 className="text-4xl font-bold text-white mt-3">{formatCurrency(registroHoy.interesGenerado)}</h2>
            <div className="mt-4 flex justify-between items-end">
              <div>
                <p className="text-emerald-100 text-xs">Tasa Anual</p>
                <p className="text-white font-semibold text-lg">{tasaEA}% EA</p>
              </div>
              <div className="text-right">
                <p className="text-emerald-100 text-xs">Días activos</p>
                <p className="text-white font-semibold text-lg">{historial.length}</p>
              </div>
            </div>
          </div>

          {/* Tarjeta de Detalle (Saldo Anterior vs Actual) */}
          <div className="px-2">
            <RentabilidadCard data={registroHoy} />
          </div>

          {/* Historial de Crecimiento */}
          <div className="bg-[#111827] rounded-2xl p-4 border border-white/5 mx-2">
            <h3 className="text-white font-semibold mb-3">Historial de Crecimiento</h3>
            <div className="space-y-2 max-h-64 overflow-y-auto custom-scrollbar">
              {historial.map(r => (
                <div key={r.id} className="flex justify-between items-center py-3 border-b border-white/5 last:border-0">
                  <div>
                    <span className="text-white text-sm block">{r.fecha}</span>
                    <span className="text-slate-500 text-xs">Saldo: {formatCurrency(r.saldoActual)}</span>
                  </div>
                  <span className="text-emerald-400 text-sm font-medium">+{formatCurrency(r.interesGenerado)}</span>
                </div>
              ))}
              {historial.length === 0 && <p className="text-slate-500 text-xs text-center py-2">Sin registros aún</p>}
            </div>
          </div>
        </>
      ) : (
        <div className="flex flex-col items-center justify-center py-20 text-slate-500">
          <p>Calculando tu rentabilidad...</p>
        </div>
      )}
    </div>
  );
}