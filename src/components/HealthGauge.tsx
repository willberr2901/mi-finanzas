import { useEffect, useState } from 'react';
import { calculateHealthScore } from '../services/financialIntelligence';
import type { Transaction, SavingsGoal } from '../utils/database';

interface HealthGaugeProps {
  transactions: Transaction[];
  goals: SavingsGoal[];
  balance: number;
}

export default function HealthGauge({ transactions, goals, balance }: HealthGaugeProps) {
  const [score, setScore] = useState<number>(0);
  const [label, setLabel] = useState('Calculando...');

  useEffect(() => {
    const result = calculateHealthScore(transactions, goals, balance);
    setScore(result.total);
    
    if (result.total >= 80) setLabel('🌟 Excelente');
    else if (result.total >= 60) setLabel('👍 Buen camino');
    else if (result.total >= 40) setLabel('⚠️ Ajustar hábitos');
    else setLabel('🔴 Requiere atención');
  }, [transactions, goals, balance]);

  const radius = 54;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;
  const color = score >= 80 ? '#10b981' : score >= 60 ? '#06b6d4' : score >= 40 ? '#f59e0b' : '#ef4444';

  return (
    <div className="bg-slate-800/50 rounded-2xl p-4 border border-white/10 flex flex-col items-center">
      <div className="relative w-32 h-32">
        <svg className="w-full h-full transform -rotate-90" viewBox="0 0 120 120">
          <circle cx="60" cy="60" r={radius} fill="none" stroke="#1e293b" strokeWidth="8" />
          <circle cx="60" cy="60" r={radius} fill="none" stroke={color} strokeWidth="8" 
                  strokeDasharray={circumference} strokeDashoffset={offset} 
                  strokeLinecap="round" className="transition-all duration-1000 ease-out" />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-2xl font-bold text-white">{score}</span>
          <span className="text-[10px] text-slate-400">/100</span>
        </div>
      </div>
      <p className="mt-2 text-sm font-medium text-emerald-400">{label}</p>
      <p className="text-xs text-slate-500 mt-1">Salud Financiera Local</p>
    </div>
  );
}