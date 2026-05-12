import { useState } from 'react';
import { AreaChart, Area, ResponsiveContainer } from 'recharts';
import { Plus, ArrowUpRight, Pencil, Clock } from 'lucide-react';
import { motion } from 'framer-motion';

// Datos estáticos para replicar el diseño exacto de la referencia
const chartData = [
  { day: 1, value: 101234 },
  { day: 5, value: 101320 },
  { day: 10, value: 101420 },
  { day: 15, value: 101500 },
  { day: 20, value: 101580 },
  { day: 25, value: 101630 },
  { day: 30, value: 101682 },
];

export default function RentabilidadPremium() {
  return (
    <div className="min-h-screen bg-[#020617] text-white relative overflow-hidden pb-40 font-sans">
      
      {/* ✨ GLOW EFFECTS (Luz de fondo) */}
      <div className="absolute top-[-150px] left-[-150px] w-[350px] h-[350px] bg-emerald-500/10 blur-[140px] rounded-full" />
      <div className="absolute bottom-[-150px] right-[-150px] w-[350px] h-[350px] bg-cyan-500/10 blur-[140px] rounded-full" />

      <div className="relative z-10 p-5 space-y-6">

        {/* 🔝 HEADER */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Rentabilidad</h1>
              <p className="text-slate-400 mt-1 text-sm">Crece tu dinero día a día</p>
            </div>
            <button className="w-12 h-12 rounded-full bg-emerald-500 flex items-center justify-center shadow-[0_0_20px_rgba(16,185,129,0.4)]">
              <Plus size={24} color="black" strokeWidth={3} />
            </button>
          </div>
        </motion.div>

        {/* 💰 CARD PRINCIPAL (Interés del Día) */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
          className="rounded-[32px] p-6 bg-gradient-to-br from-emerald-600 via-green-600 to-emerald-800 shadow-[0_10px_40px_rgba(16,185,129,0.25)] overflow-hidden relative"
        >
          <div className="relative z-10">
            <p className="text-emerald-100 uppercase text-xs tracking-widest font-semibold">Interés generado hoy</p>
            <h2 className="text-5xl font-bold mt-2 tracking-tight">$13,50</h2>
            
            <div className="flex items-center gap-4 mt-6">
               <div>
                  <p className="text-emerald-100 text-xs opacity-80">Tasa diaria (EA)</p>
                  <p className="text-2xl font-bold mt-1">9,25%</p>
               </div>
               <div className="bg-white/10 px-3 py-1 rounded-lg text-xs font-medium backdrop-blur-sm">
                  +0,013% hoy ↑
               </div>
            </div>
          </div>

          {/* Gráfico de fondo en la tarjeta */}
          <div className="absolute right-0 bottom-0 w-[60%] h-[60%] opacity-60">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <Area type="monotone" dataKey="value" stroke="#ffffff" fill="rgba(255,255,255,0.1)" strokeWidth={3} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* 🏦 CUENTA DE AHORRO (Glassmorphism) */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
          className="rounded-[32px] p-6 backdrop-blur-xl bg-white/[0.03] border border-white/5 shadow-[0_10px_40px_rgba(0,0,0,0.4)]"
        >
          <div className="flex justify-between items-start">
            <div>
              <h2 className="text-xl font-semibold text-white">Cuenta de Ahorro</h2>
              <p className="text-emerald-400 mt-1 text-sm">Cuenta Nu Bank • 9,25% EA</p>
            </div>
            <Pencil className="text-slate-400" size={18} />
          </div>

          <div className="mt-8 space-y-5">
            <div className="flex justify-between items-center">
              <span className="text-slate-400 text-sm">Saldo anterior</span>
              <span className="text-white font-medium">$101.234,00</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-400 text-sm">Interés generado hoy</span>
              <span className="text-emerald-400 font-bold">+$13,50</span>
            </div>
            <div className="border-t border-white/10 pt-5 flex justify-between items-center">
              <span className="text-white font-medium">Saldo actual</span>
              <span className="text-white font-bold text-xl">$101.247,50</span>
            </div>
          </div>
        </motion.div>

        {/* 📈 PROYECCIÓN 30 DÍAS */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
          className="rounded-[32px] p-6 backdrop-blur-xl bg-white/[0.03] border border-white/5"
        >
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-lg font-semibold text-white">Proyección 30 días</h2>
            <span className="text-emerald-400 font-bold">$101.682,35</span>
          </div>
          
          <div className="h-40">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10B981" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#10B981" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <Area type="monotone" dataKey="value" stroke="#10B981" fill="url(#colorValue)" strokeWidth={3} dot={false} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          <div className="flex justify-between text-xs text-slate-500 mt-2 px-2">
             <span>Hoy</span>
             <span>Día 10</span>
             <span>Día 20</span>
             <span>Día 30</span>
          </div>
        </motion.div>

        {/* 📜 HISTORIAL */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
          className="rounded-[32px] p-6 backdrop-blur-xl bg-white/[0.03] border border-white/5"
        >
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-lg font-semibold text-white">Historial</h2>
            <span className="text-slate-400 text-sm">Hoy</span>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-400">
                <ArrowUpRight size={24} />
              </div>
              <div>
                <h3 className="text-base font-semibold text-white">Interés diario generado</h3>
                <p className="text-slate-400 text-xs mt-0.5">9,25% EA • 07:00 AM</p>
              </div>
            </div>
            <span className="text-emerald-400 font-bold text-lg">+$13,50</span>
          </div>
        </motion.div>

      </div>
    </div>
  );
}