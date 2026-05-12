import { useState } from 'react';
import { motion } from 'framer-motion';
import { useRentabilidad } from './hooks/useRentabilidad';
import RentabilidadCard from './components/RentabilidadCard';
import { formatCurrency } from './utils/format';
import { Bell, TrendingUp } from 'lucide-react';
import { solicitarPermiso } from './notifications/notificationService';

// Valores iniciales
const TASA_EA_DEMO = 9.25;
const SALDO_INICIAL_DEMO = 1000000;

export default function ProfitabilityPage() {
  const [tasaEA] = useState(TASA_EA_DEMO);
  const [saldoInicial] = useState(SALDO_INICIAL_DEMO);
  const historial = useRentabilidad(tasaEA, saldoInicial);
  
  // El primer elemento es el más reciente (Hoy)
  const registroHoy = historial[0];

  const activarNotificaciones = async () => {
    const ok = await solicitarPermiso();
    // Ya no usamos alert(), usamos la función nativa de notificaciones si se aprueba
    if (ok) console.log('✅ Notificaciones activadas');
  };

  // Animaciones para las tarjetas
  const cardVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5 } }
  };

  return (
    <div className="space-y-6 pb-24 pt-4 px-4">
      {/* Header con Botón de Campana */}
      <div className="flex justify-between items-center mb-2">
        <div>
          <h1 className="text-2xl font-bold text-white">Rentabilidad</h1>
          <p className="text-slate-400 text-sm">Crecimiento automático diario</p>
        </div>
        <button 
          onClick={activarNotificaciones} 
          className="p-3 bg-[#111827] border border-white/10 rounded-full text-slate-400 hover:text-white transition-colors"
        >
          <Bell size={20} />
        </button>
      </div>

      {registroHoy ? (
        <>
          {/* Tarjeta Principal (Interés del Día) - Animada */}
          <motion.div 
            variants={cardVariants} 
            initial="hidden" 
            animate="visible"
            className="bg-gradient-to-br from-emerald-600 to-teal-500 rounded-3xl p-6 shadow-xl shadow-emerald-900/20 relative overflow-hidden"
          >
             {/* Efecto de brillo */}
             <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-3xl -mr-10 -mt-10"></div>
            
            <div className="relative z-10">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp size={16} className="text-emerald-100" />
                <span className="text-emerald-100 text-xs font-bold uppercase tracking-wider">Interés Generado Hoy</span>
              </div>
              
              <h2 className="text-5xl font-bold text-white tracking-tight">
                ${registroHoy.interesGenerado.toLocaleString('es-CO', { minimumFractionDigits: 2 })}
              </h2>

              <div className="mt-6 flex justify-between items-center border-t border-white/20 pt-4">
                <div>
                  <p className="text-emerald-100/70 text-xs">Tasa Anual</p>
                  <p className="text-white font-semibold">{tasaEA}% EA</p>
                </div>
                <div className="text-right">
                  <p className="text-emerald-100/70 text-xs">Días Activos</p>
                  <p className="text-white font-semibold">{historial.length}</p>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Tarjeta de Detalle (Saldo Anterior vs Actual) */}
          <motion.div variants={cardVariants} initial="hidden" animate="visible" transition={{ delay: 0.2 }}>
            <RentabilidadCard data={registroHoy} />
          </motion.div>

          {/* Historial de Crecimiento */}
          <motion.div variants={cardVariants} initial="hidden" animate="visible" transition={{ delay: 0.3 }}>
            <div className="bg-[#111827] rounded-2xl p-5 border border-white/5">
              <h3 className="text-white font-semibold mb-4 text-sm uppercase tracking-wide">Historial de Crecimiento</h3>
              <div className="space-y-4 max-h-64 overflow-y-auto pr-1 custom-scrollbar">
                {historial.map((r) => (
                  <div key={r.id} className="flex justify-between items-center pb-3 border-b border-white/5 last:border-0 last:pb-0">
                    <div>
                      <span className="text-white text-sm font-medium block">{r.fecha}</span>
                      <span className="text-slate-500 text-xs">Saldo: ${r.saldoActual.toLocaleString('es-CO')}</span>
                    </div>
                    <div className="text-right">
                      <span className="text-emerald-400 font-bold text-sm block">+${r.interesGenerado.toLocaleString('es-CO')}</span>
                      <span className="text-emerald-400/50 text-xs">Interés</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        </>
      ) : (
        <div className="flex flex-col items-center justify-center py-20 text-slate-500 animate-pulse">
          <p>Calculando tu rentabilidad diaria...</p>
        </div>
      )}
    </div>
  );
}