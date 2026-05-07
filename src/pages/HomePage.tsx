import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  ShoppingCart, 
  DollarSign, 
  CreditCard, 
  ScanLine, 
  TrendingUp, 
  TrendingDown, 
  Shield, 
  Smartphone, 
  Lock, 
  Info, 
  ChevronRight 
} from 'lucide-react';
import { useFinanceStore } from '../store/financeStore';
import { notify } from '../services/notificationService';

export default function HomePage() {
  const { transactions } = useFinanceStore();
  
  const totalIncome = transactions.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
  const totalExpense = transactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);
  const balance = totalIncome - totalExpense;

  const formatCurrency = (value: number) => value.toLocaleString('es-CO', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  return (
    <div className="p-4 space-y-6 pb-24">
      {/* Saludo */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-white">Mi Finanzas</h1>
          <p className="text-slate-400 text-sm">Bienvenido de nuevo 👋</p>
        </div>
        {/* Avatar pequeño en Home */}
        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-400 to-cyan-500 flex items-center justify-center text-black font-bold shadow-lg">
          G
        </div>
      </div>

      {/* Tarjeta Principal */}
      <div className="glass-panel bg-gradient-to-br from-slate-800 to-slate-900 border-emerald-500/20">
        <p className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-1">Saldo Total</p>
        <h2 className="text-4xl font-bold text-white mb-6 tracking-tight">${formatCurrency(balance)}</h2>
        
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-slate-900/50 p-3 rounded-xl border border-white/5">
            <div className="flex items-center gap-2 mb-1">
              <div className="p-1 bg-emerald-500/20 rounded-full">
                <TrendingUp size={12} className="text-emerald-400" />
              </div>
              <span className="text-xs text-slate-400">Ingresos</span>
            </div>
            <p className="text-lg font-bold text-emerald-400">+${formatCurrency(totalIncome)}</p>
          </div>
          
          <div className="bg-slate-900/50 p-3 rounded-xl border border-white/5">
            <div className="flex items-center gap-2 mb-1">
              <div className="p-1 bg-red-500/20 rounded-full">
                <TrendingDown size={12} className="text-red-400" />
              </div>
              <span className="text-xs text-slate-400">Gastos</span>
            </div>
            <p className="text-lg font-bold text-red-400">-${formatCurrency(totalExpense)}</p>
          </div>
        </div>
      </div>

      {/* Accesos Rápidos Grid */}
      <div>
        <h3 className="text-white font-bold mb-4 flex items-center gap-2">
          Accesos rápidos <ChevronRight size={16} className="text-slate-500"/>
        </h3>
        <div className="grid grid-cols-2 gap-4">
          {[
            { icon: ShoppingCart, label: 'Mercado', path: '/mercado', color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
            { icon: DollarSign, label: 'Finanzas', path: '/finanzas', color: 'text-blue-400', bg: 'bg-blue-500/10' },
            { icon: CreditCard, label: 'Créditos', path: '/creditos', color: 'text-purple-400', bg: 'bg-purple-500/10' },
            { icon: ScanLine, label: 'Escáner', path: '/escaner', color: 'text-orange-400', bg: 'bg-orange-500/10' },
            { icon: TrendingUp, label: 'Rentabilidad', path: '/rentabilidad', color: 'text-yellow-400', bg: 'bg-yellow-500/10' },
            { icon: Shield, label: 'Ajustes', path: '/ajustes', color: 'text-cyan-400', bg: 'bg-cyan-500/10' },
          ].map((item, index) => (
            <Link 
              key={index}
              to={item.path} 
              className={`${item.bg} p-4 rounded-2xl border border-white/5 flex flex-col items-center justify-center gap-3 hover:bg-opacity-20 transition-all duration-300`}
            >
              <item.icon className={`${item.color}`} size={28} />
              <span className="text-sm font-medium text-slate-200">{item.label}</span>
            </Link>
          ))}
        </div>
      </div>

      {/* Guía Rápida Compacta */}
      <div className="glass-panel">
        <h3 className="text-white font-bold mb-3 flex items-center gap-2">
          <Info size={18} className="text-blue-400"/> Guía Rápida
        </h3>
        <ul className="text-sm text-slate-300 space-y-2 list-disc pl-5 marker:text-emerald-400">
          <li><strong>Mercado:</strong> Controla tus compras diarias</li>
          <li><strong>Rentabilidad:</strong> Calcula cuánto gana tu dinero</li>
          <li><strong>Seguridad:</strong> Activa el PIN en Ajustes</li>
        </ul>
      </div>
    </div>
  );
}