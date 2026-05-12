import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { useRentabilidad } from './hooks/useRentabilidad';
import ProjectionChart from './components/ProjectionChart';
import { formatCurrency } from './utils/format';
import { Bell, TrendingUp, ArrowRight } from 'lucide-react';
import { solicitarPermiso } from './notifications/notificationService';

// Configuración Inicial
const TASA_EA_DEMO = 9.25;
const SALDO_INICIAL_DEMO = 1000000;

// Componente para Animaciones Suaves
const FadeIn = ({ children, delay = 0 }: { children: React.ReactNode; delay?: number }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.5, delay, ease: "easeOut" }}
  >
    {children}
  </motion.div>
);

export default function ProfitabilityPage() {
  const [tasaEA] = useState(TASA_EA_DEMO);
  const [saldoInicial] = useState(SALDO_INICIAL_DEMO);
  const historial = useRentabilidad(tasaEA, saldoInicial);
  const registroHoy = historial[0];

  // ✅ FIX: Generar datos para el gráfico con 'day' como string para coincidir con ProjectionChart
  const chartData = useMemo(() => {
    if (!registroHoy) return [];
    let saldoActual = registroHoy.saldoActual;
    const datos: { day: string; value: number }[] = [];
    
    // Simulamos 15 días de proyección
    for (let i = 0; i <= 15; i++) {
      datos.push({ day: i.toString(), value: saldoActual });
      const interesDia = saldoActual * (Math.pow(1 + tasaEA / 100, 1 / 365) - 1);
      saldoActual += interesDia;
    }
    return datos;
  }, [registroHoy, tasaEA]);

  const activarNotificaciones = async () => {
    const ok = await solicitarPermiso();
    if (ok) console.log('🔔 Notificaciones activadas');
  };

  if (!registroHoy) return <div className="text-white pt-20 text-center">Calculando crecimiento...</div>;

  return (
    <div className="space-y-6 pb-24">
      {/* HEADER */}
      <FadeIn>
        <div className="flex justify-between items-center mb-2">
          <div>
            <h1 className="text-3xl font-bold text-white tracking-tight">Rentabilidad</h1>
            <p className="text-slate-400 text-sm mt-1">Crece tu dinero día a día</p>
          </div>
          <button 
            onClick={activarNotificaciones} 
            className="p-3 bg-white/5 border border-white/10 rounded-full text-white hover:bg-white/10 transition active:scale-95"
          >
            <Bell size={20} />
          </button>
        </div>
      </FadeIn>

      {/* TARJETA PRINCIPAL (VERDE CON GRÁFICO) */}
      <FadeIn delay={0.1}>
        <div className="relative overflow-hidden rounded-[2rem] bg-gradient-to-br from-emerald-600 via-green-500 to-emerald-800 p-6 shadow-[0_10px_40px_rgba(16,185,129,0.2)]">
          <div className="absolute top-0 right-0 w-40 h-40 bg-white/10 blur-3xl rounded-full -mr-10 -mt-10 pointer-events-none" />
          
          <div className="relative z-10">
            <p className="text-emerald-50 text-sm font-medium uppercase tracking-wider">Interés Generado Hoy</p>
            
            <div className="flex justify-between items-end mt-2">
              <h2 className="text-4xl sm:text-5xl font-bold text-white tracking-tight">
                ${registroHoy.interesGenerado.toLocaleString('es-CO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </h2>
            </div>

            <div className="flex items-center gap-2 mt-3 text-emerald-50">
              <span className="bg-white/20 px-2 py-1 rounded-lg text-xs font-semibold backdrop-blur-sm">
                {tasaEA}% EA
              </span>
              <span className="text-xs opacity-80">Tasa efectiva anual</span>
            </div>

            {/* GRÁFICO SVG */}
            <ProjectionChart data={chartData} />
          </div>
        </div>
      </FadeIn>

      {/* TARJETA DE DETALLE (GLASSMORPHISM) */}
      <FadeIn delay={0.2}>
        <div className="bg-[#0F172A]/60 backdrop-blur-xl border border-white/5 rounded-[2rem] p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-400">
              <TrendingUp size={20} />
            </div>
            <div>
              <h3 className="text-white font-bold text-lg">Cuenta de Ahorro</h3>
              <p className="text-slate-400 text-xs">Actualizado automáticamente</p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-slate-400 text-sm">Saldo anterior</span>
              <span className="text-white font-medium text-sm">{formatCurrency(registroHoy.saldoAnterior)}</span>
            </div>
            
            <div className="flex justify-between items-center py-3 border-y border-white/5">
              <span className="text-slate-400 text-sm">Interés generado</span>
              <span className="text-emerald-400 font-bold">+{formatCurrency(registroHoy.interesGenerado)}</span>
            </div>

            <div className="flex justify-between items-center">
              <span className="text-white font-medium">Saldo actual</span>
              <span className="text-white font-bold text-xl">{formatCurrency(registroHoy.saldoActual)}</span>
            </div>
          </div>
        </div>
      </FadeIn>

      {/* HISTORIAL TIPO TIMELINE */}
      <FadeIn delay={0.3}>
        <div className="bg-[#0F172A]/60 backdrop-blur-xl border border-white/5 rounded-[2rem] p-6">
          <h3 className="text-white font-bold text-lg mb-4">Historial de Crecimiento</h3>
          <div className="space-y-6">
            {historial.slice(0, 5).map((r, index) => (
              <div key={r.id} className="flex gap-4 items-start">
                {/* Línea de tiempo */}
                <div className="flex flex-col items-center">
                  <div className="w-8 h-8 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-400 shrink-0">
                    <ArrowRight size={14} className="rotate-[-45deg]" />
                  </div>
                  {index < Math.min(historial.length, 5) - 1 && (
                    <div className="w-[2px] h-8 bg-white/10 my-1 rounded-full" />
                  )}
                </div>
                
                {/* Contenido */}
                <div className="flex-1 pb-2">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-white font-medium text-sm">{r.fecha}</span>
                    <span className="text-emerald-400 font-bold text-sm">+${r.interesGenerado.toLocaleString('es-CO', {maximumFractionDigits: 2})}</span>
                  </div>
                  <p className="text-slate-500 text-xs">Saldo alcanzado: {formatCurrency(r.saldoActual)}</p>
                </div>
              </div>
            ))}
            {historial.length === 0 && <p className="text-slate-500 text-center text-sm py-4">Sin registros aún</p>}
          </div>
        </div>
      </FadeIn>
    </div>
  );
}