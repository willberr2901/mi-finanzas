import { useState } from 'react';
import { AreaChart, Area, ResponsiveContainer, XAxis, YAxis, Tooltip } from 'recharts';
import { Plus, Pencil, ArrowUpRight, Clock, TrendingUp } from 'lucide-react';
import { motion } from 'framer-motion';

// Datos exactos para replicar el diseño de referencia
const projectionData = [
  { day: 'Hoy', value: 101234 },
  { day: '5', value: 101320 },
  { day: '10', value: 101420 },
  { day: '15', value: 101500 },
  { day: '20', value: 101580 },
  { day: '25', value: 101630 },
  { day: '30', value: 101682 },
];

export default function ProfitabilityPage() {
  return (
    <div className="min-h-screen bg-[#0A0F1C] text-white pb-24 font-sans selection:bg-emerald-500/30">
      <div className="px-5 pt-6 space-y-5">
        
        {/* 🔝 HEADER */}
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Rentabilidad</h1>
            <p className="text-slate-400 text-sm mt-1">Crece tu dinero día a día</p>
          </div>
          <button className="w-12 h-12 rounded-full bg-emerald-500 flex items-center justify-center text-black shadow-[0_0_20px_rgba(16,185,129,0.4)] active:scale-95 transition-transform">
            <Plus size={24} strokeWidth={3} />
          </button>
        </motion.div>

        {/* 💰 TARJETA PRINCIPAL (Interés del Día) */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.1 }}
          className="rounded-[28px] p-5 bg-gradient-to-br from-emerald-800 via-emerald-700 to-emerald-900 border border-emerald-500/20 relative overflow-hidden"
        >
          <div className="absolute top-0 right-0 w-40 h-40 bg-white/5 blur-3xl rounded-full -mr-10 -mt-10" />
          
          <div className="relative z-10 flex justify-between items-start">
            <div>
              <p className="text-emerald-200 text-xs font-semibold uppercase tracking-wider">Interés generado hoy</p>
              <h2 className="text-4xl font-bold text-white mt-2 tracking-tight">$13,50</h2>
              <div className="mt-4">
                <p className="text-emerald-200/70 text-xs">Tasa diaria (EA)</p>
                <p className="text-2xl font-bold text-emerald-300 mt-1">9,25%</p>
              </div>
            </div>
            
            {/* Mini Gráfico SVG */}
            <div className="w-32 h-20">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={projectionData.slice(0, 6)}>
                  <defs>
                    <linearGradient id="miniGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#34D399" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#34D399" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <Area type="monotone" dataKey="value" stroke="#34D399" fill="url(#miniGrad)" strokeWidth={2} dot={false} />
                </AreaChart>
              </ResponsiveContainer>
              <div className="absolute bottom-0 right-0 bg-emerald-500/20 backdrop-blur-md px-2 py-1 rounded-lg border border-emerald-500/30">
                <span className="text-xs font-bold text-emerald-300">+0,013% hoy ↑</span>
              </div>
            </div>
          </div>
        </motion.div>

        {/* 🏦 CUENTA DE AHORRO */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
          className="rounded-[28px] p-5 bg-[#111827] border border-white/5"
        >
          <div className="flex justify-between items-start mb-6">
            <div>
              <h2 className="text-xl font-semibold text-white">Cuenta de Ahorro</h2>
              <p className="text-emerald-400 text-sm mt-1">Cuenta Nu Bank • 9,25% EA</p>
            </div>
            <Pencil className="text-blue-400 cursor-pointer" size={20} />
          </div>

          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-slate-400 text-sm">Saldo anterior</span>
              <span className="text-white font-medium">$101.234,00</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-400 text-sm">Interés generado hoy</span>
              <span className="text-emerald-400 font-semibold">+$13,50</span>
            </div>
            <div className="border-t border-white/10 pt-4 flex justify-between items-center">
              <span className="text-white font-medium">Saldo actual</span>
              <span className="text-white font-bold text-xl">$101.247,50</span>
            </div>
          </div>
        </motion.div>

        {/* 📊 RESUMEN DEL DÍA */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
          className="rounded-[28px] p-5 bg-[#111827] border border-white/5"
        >
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold text-white">Resumen del día</h3>
            <div className="text-right">
              <p className="text-slate-400 text-xs">Hoy</p>
              <p className="text-white text-sm">08 Mayo 2026</p>
            </div>
          </div>
          <div className="space-y-3">
            {[
              { label: 'Tasa diaria (EA)', value: '9,25%' },
              { label: 'Interés generado', value: '$13,50', color: 'text-emerald-400' },
              { label: 'Saldo anterior', value: '$101.234,00' },
              { label: 'Saldo actual', value: '$101.247,50' },
            ].map((item, i) => (
              <div key={i} className="flex justify-between items-center">
                <span className="text-slate-400 text-sm">{item.label}</span>
                <span className={`font-medium ${item.color || 'text-white'}`}>{item.value}</span>
              </div>
            ))}
          </div>
        </motion.div>

        {/* 📈 PROYECCIÓN 30 DÍAS */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
          className="rounded-[28px] p-5 bg-[#111827] border border-white/5"
        >
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold text-white">Proyección 30 días</h3>
            <span className="text-emerald-400 font-bold">$101.682,35</span>
          </div>
          
          <div className="h-40 -ml-4">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={projectionData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="projGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10B981" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#10B981" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fill: '#64748B', fontSize: 10 }} />
                <Area type="monotone" dataKey="value" stroke="#10B981" fill="url(#projGrad)" strokeWidth={2} dot={{ fill: '#10B981', r: 3 }} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          <div className="flex justify-between text-xs text-slate-500 mt-1 px-1">
             <span>Hoy</span>
             <span>Día 10</span>
             <span>Día 20</span>
             <span>Día 30</span>
          </div>
        </motion.div>

        {/* 📜 HISTORIAL / ESTADÍSTICAS */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}
          className="rounded-[28px] p-5 bg-[#111827] border border-white/5"
        >
          <div className="flex border-b border-white/10 mb-4">
            <button className="flex-1 pb-3 text-emerald-400 font-semibold border-b-2 border-emerald-400">Historial</button>
            <button className="flex-1 pb-3 text-slate-500 font-medium">Estadísticas</button>
          </div>

          <div className="space-y-1">
            <p className="text-slate-400 text-xs mb-3">Viernes 08 de mayo</p>
            <div className="flex items-center justify-between p-3 hover:bg-white/5 rounded-xl transition-colors cursor-pointer">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-400">
                  <TrendingUp size={20} />
                </div>
                <div>
                  <h4 className="text-white font-medium text-sm">Interés diario generado</h4>
                  <p className="text-slate-500 text-xs mt-0.5">9,25% EA • 07:00 AM</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-emerald-400 font-bold text-sm">+$13,50</p>
              </div>
            </div>
          </div>
        </motion.div>

      </div>
    </div>
  );
}