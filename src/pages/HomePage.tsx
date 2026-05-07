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
  Plus 
} from 'lucide-react';
import { useFinanceStore } from '../store/financeStore';
import { notify } from '../services/notificationService';

export default function HomePage() {
  const { transactions } = useFinanceStore();
  
  // Calcular totales
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
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-white">Mi Finanzas</h1>
          <p className="text-gray-400 text-sm">Bienvenido de nuevo 👋</p>
        </div>
        <button 
          onClick={() => notify({ title: '🔒 Seguridad', message: 'Tu app está protegida con PIN.', type: 'info' })}
          className="bg-gray-800 p-2 rounded-full border border-gray-700"
        >
          <Shield size={20} className="text-green-400" />
        </button>
      </div>

      {/* Tarjeta de Saldo */}
      <div className="bg-gradient-to-br from-emerald-900 to-teal-900 p-6 rounded-2xl border border-emerald-700/30 shadow-lg">
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
              <TrendingDown size={16} className="text-red-400" />
              <span className="text-xs text-gray-300">Gastos</span>
            </div>
            <p className="text-lg font-semibold text-red-400">-${formatCurrency(totalExpense)}</p>
          </div>
        </div>
      </div>

      {/* Accesos Rápidos */}
      <div>
        <h3 className="text-white font-bold mb-4">Accesos rápidos</h3>
        <div className="grid grid-cols-3 gap-3">
          <Link to="/mercado" className="bg-gray-800/50 backdrop-blur-md p-4 rounded-xl border border-gray-700 flex flex-col items-center justify-center gap-2 hover:bg-gray-700/50 transition-colors">
            <ShoppingCart className="text-green-400" size={24} />
            <span className="text-xs text-gray-300">Mercado</span>
          </Link>
          
          <Link to="/finanzas" className="bg-gray-800/50 backdrop-blur-md p-4 rounded-xl border border-gray-700 flex flex-col items-center justify-center gap-2 hover:bg-gray-700/50 transition-colors">
            <DollarSign className="text-blue-400" size={24} />
            <span className="text-xs text-gray-300">Finanzas</span>
          </Link>
          
          <Link to="/creditos" className="bg-gray-800/50 backdrop-blur-md p-4 rounded-xl border border-gray-700 flex flex-col items-center justify-center gap-2 hover:bg-gray-700/50 transition-colors">
            <CreditCard className="text-purple-400" size={24} />
            <span className="text-xs text-gray-300">Créditos</span>
          </Link>
          
          <Link to="/escaner" className="bg-gray-800/50 backdrop-blur-md p-4 rounded-xl border border-gray-700 flex flex-col items-center justify-center gap-2 hover:bg-gray-700/50 transition-colors">
            <ScanLine className="text-orange-400" size={24} />
            <span className="text-xs text-gray-300">Escáner</span>
          </Link>
          
          <Link to="/rentabilidad" className="bg-gray-800/50 backdrop-blur-md p-4 rounded-xl border border-gray-700 flex flex-col items-center justify-center gap-2 hover:bg-gray-700/50 transition-colors">
            <TrendingUp className="text-yellow-400" size={24} />
            <span className="text-xs text-gray-300">Rentabilidad</span>
          </Link>
          
          <Link to="/ajustes" className="bg-gray-800/50 backdrop-blur-md p-4 rounded-xl border border-gray-700 flex flex-col items-center justify-center gap-2 hover:bg-gray-700/50 transition-colors">
            <Shield className="text-cyan-400" size={24} />
            <span className="text-xs text-gray-300">Ajustes</span>
          </Link>
        </div>
      </div>

      {/* Características Destacadas */}
      <div>
        <h3 className="text-white font-bold mb-4">Características</h3>
        <div className="space-y-3">
          <div className="bg-gray-800/50 backdrop-blur-md p-4 rounded-xl border border-gray-700 flex items-center gap-4">
            <div className="bg-teal-500/20 p-2 rounded-lg">
              <Smartphone className="text-teal-400" size={20} />
            </div>
            <div>
              <h4 className="text-white font-medium text-sm">PWA Instalable</h4>
              <p className="text-gray-400 text-xs">Instálala en tu dispositivo como una app nativa.</p>
            </div>
          </div>
          
          <div className="bg-gray-800/50 backdrop-blur-md p-4 rounded-xl border border-gray-700 flex items-center gap-4">
            <div className="bg-purple-500/20 p-2 rounded-lg">
              <Lock className="text-purple-400" size={20} />
            </div>
            <div>
              <h4 className="text-white font-medium text-sm">100% Privado</h4>
              <p className="text-gray-400 text-xs">Tus datos se guardan localmente en tu dispositivo.</p>
            </div>
          </div>
        </div>
      </div>

      {/* ✅ NUEVA SECCIÓN: GUÍA RÁPIDA */}
      <div className="bg-gray-800/50 p-4 rounded-xl border border-gray-700 mt-6">
        <h3 className="text-white font-bold mb-2 flex items-center gap-2">
          <Info size={18} className="text-blue-400"/> Guía Rápida
        </h3>
        <ul className="text-sm text-gray-300 space-y-2 list-disc pl-5">
          <li><strong>Mercado:</strong> Controla tus compras diarias.</li>
          <li><strong>Rentabilidad:</strong> Calcula cuánto gana tu dinero al día.</li>
          <li><strong>Seguridad:</strong> Activa el PIN en Ajustes para proteger tus datos.</li>
          <li><strong>Actualizaciones:</strong> La app se actualiza sola. ¡Siempre tendrás la última versión!</li>
        </ul>
      </div>

    </div>
  );
}