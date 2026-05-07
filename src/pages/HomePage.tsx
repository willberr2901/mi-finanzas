import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  ShoppingCart, 
  DollarSign, 
  CreditCard, 
  ScanLine, 
  TrendingUp, 
  Shield, 
  Smartphone, 
  Lock, 
  Info, 
  Plus,
  ChevronRight
} from 'lucide-react';
import { useFinanceStore } from '../store/financeStore';
import { notify } from '../services/notificationService';

export default function HomePage() {
  const { transactions } = useFinanceStore();
  
  const totalIncome = transactions
    .filter(t => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0);
    
  const totalExpense = transactions
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0);
    
  const balance = totalIncome - totalExpense;

  const formatCurrency = (value: number) => {
    return value.toLocaleString('es-CO', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  return (
    <div className="p-4 pb-24 space-y-6">
      {/* Header Moderno */}
      <div className="flex justify-between items-center glass-card">
        <div>
          <h1 className="text-2xl font-bold text-white">Mi Finanzas</h1>
          <p className="text-gray-400 text-sm">Tu asistente financiero personal</p>
        </div>
        <button 
          onClick={() => notify({ title: '🔒 Seguridad', message: 'Tu app está protegida con PIN.', type: 'info' })}
          className="bg-gray-700/50 p-2 rounded-full border border-gray-600 hover:bg-gray-600/50 transition-colors"
        >
          <Shield size={20} className="text-emerald-400" />
        </button>
      </div>

      {/* Tarjeta de Saldo Principal */}
      <div className="glass-card bg-gradient-to-br from-emerald-900/80 to-teal-900/80 border-emerald-700/30">
        <p className="text-emerald-300 text-sm font-medium mb-1">Saldo Total</p>
        <h2 className="text-4xl font-bold text-white mb-4">${formatCurrency(balance)}</h2>
        
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-black/20 p-3 rounded-lg">
            <div className="flex items-center gap-2 mb-1">
              <TrendingUp size={16} className="text-green-400" />
              <span className="text-xs text-gray-300">Ingresos</span>
            </div>
            <p className="text-lg font-semibold text-green-400">+${formatCurrency(totalIncome)}</p>
          </div>
          
          <div className="bg-black/20 p-3 rounded-lg">
            <div className="flex items-center gap-2 mb-1">
              <TrendingUp size={16} className="text-red-400" />
              <span className="text-xs text-gray-300">Gastos</span>
            </div>
            <p className="text-lg font-semibold text-red-400">-${formatCurrency(totalExpense)}</p>
          </div>
        </div>
      </div>

      {/* Accesos Rápidos Mejorados */}
      <div>
        <h3 className="text-white font-bold mb-4 flex items-center gap-2">
          Accesos rápidos <ChevronRight size={16} className="text-gray-400"/>
        </h3>
        <div className="grid grid-cols-2 gap-4">
          {[
            { icon: ShoppingCart, label: 'Mercado', path: '/mercado', color: 'text-green-400' },
            { icon: DollarSign, label: 'Finanzas', path: '/finanzas', color: 'text-blue-400' },
            { icon: CreditCard, label: 'Créditos', path: '/creditos', color: 'text-purple-400' },
            { icon: ScanLine, label: 'Escáner', path: '/escaner', color: 'text-orange-400' },
            { icon: TrendingUp, label: 'Rentabilidad', path: '/rentabilidad', color: 'text-yellow-400' },
            { icon: Shield, label: 'Ajustes', path: '/ajustes', color: 'text-cyan-400' },
          ].map((item, index) => (
            <Link 
              key={index}
              to={item.path} 
              className="glass-card flex flex-col items-center justify-center gap-3 hover:bg-gray-700/50 transition-all duration-300 transform hover:-translate-y-1"
            >
              <item.icon className={`${item.color}`} size={28} />
              <span className="text-sm text-gray-300">{item.label}</span>
            </Link>
          ))}
        </div>
      </div>

      {/* Características Destacadas */}
      <div className="space-y-4">
        <h3 className="text-white font-bold mb-4 flex items-center gap-2">
          Características <ChevronRight size={16} className="text-gray-400"/>
        </h3>
        
        <div className="glass-card flex items-center gap-4">
          <div className="bg-teal-500/20 p-3 rounded-lg">
            <Smartphone className="text-teal-400" size={24} />
          </div>
          <div>
            <h4 className="text-white font-medium">PWA Instalable</h4>
            <p className="text-gray-400 text-sm">Instálala como app nativa en tu dispositivo.</p>
          </div>
        </div>
        
        <div className="glass-card flex items-center gap-4">
          <div className="bg-purple-500/20 p-3 rounded-lg">
            <Lock className="text-purple-400" size={24} />
          </div>
          <div>
            <h4 className="text-white font-medium">100% Privado</h4>
            <p className="text-gray-400 text-sm">Tus datos se guardan localmente en tu dispositivo.</p>
          </div>
        </div>
      </div>

      {/* Guía Rápida Integrada */}
      <div className="glass-card mt-6">
        <h3 className="text-white font-bold mb-3 flex items-center gap-2">
          <Info size={18} className="text-blue-400"/> Guía Rápida
        </h3>
        <ul className="text-sm text-gray-300 space-y-2 list-disc pl-5">
          <li><strong>Mercado:</strong> Controla tus compras diarias</li>
          <li><strong>Rentabilidad:</strong> Calcula cuánto gana tu dinero al día</li>
          <li><strong>Seguridad:</strong> Activa el PIN en Ajustes para proteger tus datos</li>
          <li><strong>Actualizaciones:</strong> La app se actualiza sola automáticamente</li>
        </ul>
      </div>
    </div>
  );
}