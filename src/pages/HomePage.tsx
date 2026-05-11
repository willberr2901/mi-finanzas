import { Link } from 'react-router-dom';
import { ShoppingCart, Wallet, CreditCard, TrendingUp, ShieldCheck, BrainCircuit } from 'lucide-react';

export default function HomePage() {
  return (
    <div className="space-y-6">
      {/* Saludo Premium */}
      <div className="flex justify-between items-end">
        <div>
          <p className="text-slate-400 text-sm mb-1">Bienvenido de nuevo 👋</p>
          <h1 className="text-3xl font-bold text-white tracking-tight">Mi Finanzas</h1>
        </div>
        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-violet-500 to-cyan-400 flex items-center justify-center text-white font-bold shadow-lg shadow-violet-500/20">
          G
        </div>
      </div>

      {/* Tarjeta de Balance (Visualmente impactante) */}
      <div className="bg-gradient-to-br from-violet-600 to-cyan-600 rounded-3xl p-6 shadow-xl shadow-violet-900/40 relative overflow-hidden group">
        <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl -mr-10 -mt-10"></div>
        <p className="text-white/80 text-sm font-medium">Balance Total</p>
        <h2 className="text-4xl font-bold text-white mt-2">$0,00</h2>
        <div className="flex gap-3 mt-6">
          <button className="flex-1 bg-white/20 hover:bg-white/30 backdrop-blur-sm py-2 rounded-xl text-white text-sm font-medium transition-all">Ingresos</button>
          <button className="flex-1 bg-white/20 hover:bg-white/30 backdrop-blur-sm py-2 rounded-xl text-white text-sm font-medium transition-all">Gastos</button>
        </div>
      </div>

      {/* Score Financiero */}
      <div className="bg-[#111827] border border-white/5 rounded-2xl p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-slate-400 text-xs uppercase font-bold tracking-wider">Salud Financiera</p>
            <h3 className="text-2xl font-bold text-white mt-1">8<span className="text-sm text-slate-500">/100</span></h3>
          </div>
          <div className="text-right">
            <span className="inline-block px-3 py-1 bg-red-500/20 text-red-400 text-xs font-bold rounded-full border border-red-500/20">Requiere atención</span>
          </div>
        </div>
        <div className="w-full bg-slate-700 rounded-full h-1.5 mt-4">
          <div className="bg-red-500 h-1.5 rounded-full w-[8%]"></div>
        </div>
      </div>

      {/* Accesos Rápidos */}
      <div>
        <h3 className="text-white font-bold mb-3">Accesos Rápidos</h3>
        <div className="grid grid-cols-2 gap-3">
          <Link to="/mercado" className="block group">
            <div className="bg-[#111827] border border-white/5 p-4 rounded-2xl hover:border-violet-500/50 transition-all group-active:scale-95">
              <ShoppingCart className="text-emerald-400 mb-2 group-hover:scale-110 transition-transform" size={24} />
              <p className="text-white font-medium text-sm">Mercado</p>
            </div>
          </Link>
          
          <Link to="/finanzas" className="block group">
            <div className="bg-[#111827] border border-white/5 p-4 rounded-2xl hover:border-violet-500/50 transition-all group-active:scale-95">
              <Wallet className="text-blue-400 mb-2 group-hover:scale-110 transition-transform" size={24} />
              <p className="text-white font-medium text-sm">Finanzas</p>
            </div>
          </Link>
          
          <Link to="/creditos" className="block group">
            <div className="bg-[#111827] border border-white/5 p-4 rounded-2xl hover:border-violet-500/50 transition-all group-active:scale-95">
              <CreditCard className="text-purple-400 mb-2 group-hover:scale-110 transition-transform" size={24} />
              <p className="text-white font-medium text-sm">Créditos</p>
            </div>
          </Link>
          
          <Link to="/rentabilidad" className="block group">
            <div className="bg-[#111827] border border-white/5 p-4 rounded-2xl hover:border-violet-500/50 transition-all group-active:scale-95">
              <TrendingUp className="text-orange-400 mb-2 group-hover:scale-110 transition-transform" size={24} />
              <p className="text-white font-medium text-sm">Rentabilidad</p>
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
}