import { Link } from 'react-router-dom';
import { ShoppingCart, Wallet, CreditCard, Wind, Scan, MapPin, TrendingUp, TrendingDown } from 'lucide-react';
import { useFinanceStore } from '../store/financeStore';
import { useTheme } from '../contexts/ThemeContext';

export default function HomePage() {
  const { getBalance, getTotalIncome, getTotalExpense } = useFinanceStore();
  const { theme } = useTheme();
  
  const balance = getBalance();
  const income = getTotalIncome();
  const expense = getTotalExpense();

  const isDark = theme === 'dark';
  const bgCard = isDark ? 'bg-white/5' : 'bg-white';
  const textPrimary = isDark ? 'text-white' : 'text-gray-900';
  const textSecondary = isDark ? 'text-gray-400' : 'text-gray-600';
  const borderColor = isDark ? 'border-white/10' : 'border-gray-200';

  const formatMoney = (amount: number) =>
    amount.toLocaleString('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 });

  const modules = [
    { path: '/mercado', icon: ShoppingCart, label: 'Mercado', color: 'from-green-400 to-emerald-500', badge: null },
    { path: '/finanzas', icon: Wallet, label: 'Finanzas', color: 'from-blue-400 to-cyan-500', badge: null },
    { path: '/creditos', icon: CreditCard, label: 'Créditos', color: 'from-purple-400 to-pink-500', badge: null },
    { path: '/aire', icon: Wind, label: 'Calidad Aire', color: 'from-teal-400 to-green-500', badge: null },
    { path: '/escaner', icon: Scan, label: 'Escanear', color: 'from-orange-400 to-red-500', badge: null },
    { path: '/rutas', icon: MapPin, label: 'Rutas', color: 'from-gray-400 to-gray-600', badge: 'Próximamente' },
  ];

  return (
    <div className={`min-h-screen pb-24 ${isDark ? '' : 'bg-gray-50'}`}>
      {/* Header con Saludo */}
      <div className={`${bgCard} backdrop-blur-md border-b ${borderColor} p-5`}>
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className={`text-sm ${textSecondary}`}>¡Hola, Juan! 👋</p>
            <h1 className={`text-2xl font-bold ${textPrimary}`}>Bienvenido a Mi Finanzas</h1>
          </div>
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-green-400 to-cyan-400 flex items-center justify-center">
            <span className="text-white font-bold">JP</span>
          </div>
        </div>

        {/* Resumen Financiero Rápido */}
        <div className={`${isDark ? 'bg-black/30' : 'bg-gray-100'} rounded-xl p-4`}>
          <p className={`text-xs ${textSecondary} mb-1`}>Saldo total</p>
          <h2 className={`text-3xl font-bold ${textPrimary} mb-3`}>{formatMoney(balance)}</h2>
          <div className="grid grid-cols-2 gap-3">
            <div className={`${isDark ? 'bg-green-500/10' : 'bg-green-50'} p-2 rounded-lg`}>
              <div className="flex items-center gap-1 mb-1">
                <TrendingUp className="w-3 h-3 text-green-500" />
                <span className={`text-[10px] ${textSecondary}`}>Ingresos</span>
              </div>
              <p className="text-green-500 font-bold text-sm">{formatMoney(income)}</p>
            </div>
            <div className={`${isDark ? 'bg-red-500/10' : 'bg-red-50'} p-2 rounded-lg`}>
              <div className="flex items-center gap-1 mb-1">
                <TrendingDown className="w-3 h-3 text-red-500" />
                <span className={`text-[10px] ${textSecondary}`}>Gastos</span>
              </div>
              <p className="text-red-500 font-bold text-sm">{formatMoney(expense)}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Accesos Rápidos */}
      <div className="p-4">
        <h3 className={`text-sm font-bold ${textPrimary} mb-3`}>Accesos rápidos</h3>
        <div className="grid grid-cols-3 gap-3">
          {modules.map((mod) => {
            const Icon = mod.icon;
            return (
              <Link
                key={mod.path}
                to={mod.path}
                className={`${bgCard} backdrop-blur-md border ${borderColor} rounded-xl p-4 flex flex-col items-center gap-2 hover:scale-105 transition-transform relative`}
              >
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${mod.color} flex items-center justify-center shadow-lg`}>
                  <Icon className="w-6 h-6 text-white" />
                </div>
                <span className={`text-xs font-medium ${textPrimary} text-center`}>{mod.label}</span>
                {mod.badge && (
                  <span className="absolute -top-1 -right-1 bg-yellow-500 text-black text-[8px] font-bold px-1.5 py-0.5 rounded-full">
                    {mod.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </div>
      </div>

      {/* Características */}
      <div className="px-4 space-y-3">
        <h3 className={`text-sm font-bold ${textPrimary}`}>Características</h3>
        
        <div className={`${bgCard} backdrop-blur-md border ${borderColor} rounded-xl p-4 flex items-center gap-3`}>
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-green-400 to-cyan-400 flex items-center justify-center">
            <span className="text-white text-lg">📱</span>
          </div>
          <div className="flex-1">
            <p className={`text-sm font-semibold ${textPrimary}`}>PWA Instalable</p>
            <p className={`text-xs ${textSecondary}`}>Instálala en tu dispositivo</p>
          </div>
        </div>

        <div className={`${bgCard} backdrop-blur-md border ${borderColor} rounded-xl p-4 flex items-center gap-3`}>
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-400 to-purple-400 flex items-center justify-center">
            <span className="text-white text-lg">🔒</span>
          </div>
          <div className="flex-1">
            <p className={`text-sm font-semibold ${textPrimary}`}>100% Privado</p>
            <p className={`text-xs ${textSecondary}`}>Tus datos se guardan localmente</p>
          </div>
        </div>

        <div className={`${bgCard} backdrop-blur-md border ${borderColor} rounded-xl p-4 flex items-center gap-3`}>
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-orange-400 to-red-400 flex items-center justify-center">
            <span className="text-white text-lg">🔔</span>
          </div>
          <div className="flex-1">
            <p className={`text-sm font-semibold ${textPrimary}`}>Notificaciones</p>
            <p className={`text-xs ${textSecondary}`}>Alertas y recordatorios útiles</p>
          </div>
        </div>
      </div>
    </div>
  );
}