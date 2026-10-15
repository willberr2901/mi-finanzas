import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ShoppingCart, Wallet, CreditCard, TrendingUp, TrendingDown, ChevronRight } from 'lucide-react';
import { db, type Transaction, type SavingsGoal } from '../utils/database';
import { calculateHealthScore } from '../services/financialIntelligence';
import { formatCOP, parseLocalDate } from '../utils/format';
import { getMarketHistory, type MarketPurchase } from '../utils/marketHistory';

const MONTHS = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];

export default function HomePage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [goals, setGoals] = useState<SavingsGoal[]>([]);
  const [lastMarket, setLastMarket] = useState<MarketPurchase | null>(null);

  useEffect(() => {
    Promise.all([db.transactions.toArray(), db.goals.toArray()])
      .then(([txs, gls]) => { setTransactions(txs); setGoals(gls); })
      .catch(() => {});
    setLastMarket(getMarketHistory()[0] ?? null);
  }, []);

  const now = new Date();
  const monthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  const monthTx = transactions.filter(t => (t.date || '').startsWith(monthKey));
  const income = monthTx.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);
  const expense = monthTx.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
  const balance = income - expense;

  const totalBalance = transactions.reduce((s, t) => s + (t.type === 'income' ? t.amount : -t.amount), 0);
  const hasRecentData = transactions.some(t => now.getTime() - parseLocalDate(t.date).getTime() < 30 * 86400000);
  const score = hasRecentData ? calculateHealthScore(transactions, goals, totalBalance).total : null;
  const health = score === null
    ? { label: 'Sin datos aún', chip: 'bg-slate-500/20 text-slate-300 border-slate-500/20', bar: 'bg-slate-500' }
    : score >= 80 ? { label: 'Excelente', chip: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/20', bar: 'bg-emerald-500' }
    : score >= 60 ? { label: 'Buen camino', chip: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/20', bar: 'bg-cyan-500' }
    : score >= 40 ? { label: 'Ajustar hábitos', chip: 'bg-amber-500/20 text-amber-400 border-amber-500/20', bar: 'bg-amber-500' }
    : { label: 'Requiere atención', chip: 'bg-red-500/20 text-red-400 border-red-500/20', bar: 'bg-red-500' };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-end">
        <div>
          <p className="text-slate-400 text-sm mb-1">Bienvenido de nuevo 👋</p>
          <h1 className="text-3xl font-bold text-white tracking-tight">Mi Finanzas</h1>
        </div>
        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-violet-500 to-cyan-400 flex items-center justify-center text-white font-bold shadow-lg shadow-violet-500/20">G</div>
      </div>

      <div className="bg-gradient-to-br from-violet-600 to-cyan-600 rounded-3xl p-6 shadow-xl shadow-violet-900/40 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl -mr-10 -mt-10"></div>
        <p className="text-white/80 text-sm font-medium">Balance de {MONTHS[now.getMonth()]}</p>
        <h2 className={`text-4xl font-bold mt-2 ${balance < 0 ? 'text-red-100' : 'text-white'}`}>{formatCOP(balance)}</h2>
        <div className="flex gap-3 mt-6">
          <Link to="/finanzas" className="flex-1 bg-white/20 hover:bg-white/30 backdrop-blur-sm py-2 px-3 rounded-xl text-white text-left">
            <span className="flex items-center gap-1 text-xs text-white/80"><TrendingUp size={12} /> Ingresos</span>
            <span className="block text-sm font-bold">{formatCOP(income)}</span>
          </Link>
          <Link to="/finanzas" className="flex-1 bg-white/20 hover:bg-white/30 backdrop-blur-sm py-2 px-3 rounded-xl text-white text-left">
            <span className="flex items-center gap-1 text-xs text-white/80"><TrendingDown size={12} /> Gastos</span>
            <span className="block text-sm font-bold">{formatCOP(expense)}</span>
          </Link>
        </div>
      </div>

      <div className="bg-[#111827] border border-white/5 rounded-2xl p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-slate-400 text-xs uppercase font-bold tracking-wider">Salud Financiera</p>
            {score === null
              ? <h3 className="text-base font-semibold text-white mt-1">Registra tus movimientos para calcularla</h3>
              : <h3 className="text-2xl font-bold text-white mt-1">{score}<span className="text-sm text-slate-500">/100</span></h3>}
          </div>
          <span className={`inline-block px-3 py-1 text-xs font-bold rounded-full border whitespace-nowrap ${health.chip}`}>{health.label}</span>
        </div>
        <div className="w-full bg-slate-700 rounded-full h-1.5 mt-4">
          <div className={`${health.bar} h-1.5 rounded-full transition-all duration-1000`} style={{ width: `${score ?? 0}%` }}></div>
        </div>
      </div>

      {lastMarket && (
        <Link to="/mercado" className="flex items-center gap-3 bg-[#111827] border border-white/5 rounded-2xl p-4 hover:border-emerald-500/40 transition-all active:scale-[0.98]">
          <div className="p-2 bg-emerald-500/15 rounded-xl"><ShoppingCart className="text-emerald-400" size={20} /></div>
          <div className="flex-1">
            <p className="text-white font-medium text-sm">Último mercado</p>
            <p className="text-slate-400 text-xs">{new Date(lastMarket.date).toLocaleDateString('es-CO', { day: 'numeric', month: 'short' })} · {lastMarket.itemsCount} productos</p>
          </div>
          <span className="text-white font-bold text-sm">{formatCOP(lastMarket.total)}</span>
          <ChevronRight className="text-slate-500" size={16} />
        </Link>
      )}

      <div>
        <h3 className="text-white font-bold mb-3">Accesos Rápidos</h3>
        <div className="grid grid-cols-2 gap-3">
          <Link to="/mercado" className="block group"><div className="bg-[#111827] border border-white/5 p-4 rounded-2xl hover:border-violet-500/50 transition-all active:scale-95"><ShoppingCart className="text-emerald-400 mb-2" size={24} /><p className="text-white font-medium text-sm">Mercado</p></div></Link>
          <Link to="/finanzas" className="block group"><div className="bg-[#111827] border border-white/5 p-4 rounded-2xl hover:border-violet-500/50 transition-all active:scale-95"><Wallet className="text-blue-400 mb-2" size={24} /><p className="text-white font-medium text-sm">Finanzas</p></div></Link>
          <Link to="/creditos" className="block group"><div className="bg-[#111827] border border-white/5 p-4 rounded-2xl hover:border-violet-500/50 transition-all active:scale-95"><CreditCard className="text-purple-400 mb-2" size={24} /><p className="text-white font-medium text-sm">Créditos</p></div></Link>
          <Link to="/rentabilidad" className="block group"><div className="bg-[#111827] border border-white/5 p-4 rounded-2xl hover:border-violet-500/50 transition-all active:scale-95"><TrendingUp className="text-orange-400 mb-2" size={24} /><p className="text-white font-medium text-sm">Rentabilidad</p></div></Link>
        </div>
      </div>
    </div>
  );
}
