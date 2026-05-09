import type { Transaction, SavingsGoal } from '../utils/database';

export interface HealthScoreResult {
  total: number;
  savingsRate: number;
  debtRatio: number;
  emergencyFund: number;
  goalConsistency: number;
}

export interface CashFlowPrediction {
  dailyBurn: number;
  daysInMonth: number;
  projectedBalance: number;
  status: 'safe' | 'warning' | 'critical';
}

export interface RuleAlert {
  message: string;
  type: 'warning' | 'success' | 'info';
}

export const calculateHealthScore = (transactions: Transaction[], goals: SavingsGoal[], currentBalance: number): HealthScoreResult => {
  const last30 = transactions.filter(t => {
    const d = new Date(t.date);
    const now = new Date();
    return (now.getTime() - d.getTime()) < 30 * 24 * 60 * 60 * 1000;
  });

  const income = last30.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);
  const expenses = last30.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
  const savingsRate = income > 0 ? Math.min(100, ((income - expenses) / income) * 100) : 0;

  const activeGoals = goals.filter(g => new Date(g.deadline) > new Date());
  const goalConsistency = activeGoals.length > 0 
    ? Math.min(100, activeGoals.reduce((s, g) => s + ((g.currentAmount / g.targetAmount) * 100), 0) / activeGoals.length)
    : 0;

  const emergencyFund = currentBalance > 0 ? Math.min(100, (currentBalance / 1000000) * 100) : 0;
  const debtRatio = Math.min(100, 100 - (expenses / Math.max(1, income)) * 100);

  const total = (savingsRate * 0.3) + (debtRatio * 0.25) + (emergencyFund * 0.25) + (goalConsistency * 0.2);
  return { total: Math.round(total), savingsRate: Math.round(savingsRate), debtRatio: Math.round(debtRatio), emergencyFund: Math.round(emergencyFund), goalConsistency: Math.round(goalConsistency) };
};

export const predictCashFlow = (transactions: Transaction[], currentBalance: number): CashFlowPrediction => {
  const last30 = transactions.filter(t => {
    const d = new Date(t.date);
    const now = new Date();
    return (now.getTime() - d.getTime()) < 30 * 24 * 60 * 60 * 1000 && t.type === 'expense';
  });
  
  const totalExpenses = last30.reduce((s, t) => s + t.amount, 0);
  const dailyBurn = last30.length > 0 ? totalExpenses / 30 : 0;
  const daysInMonth = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).getDate();
  const projectedBalance = currentBalance - (dailyBurn * daysInMonth);

  let status: CashFlowPrediction['status'] = 'safe';
  if (projectedBalance < 0) status = 'critical';
  else if (projectedBalance < dailyBurn * 15) status = 'warning';

  return { dailyBurn, daysInMonth, projectedBalance, status };
};

export const triggerLocalRules = (newTx: Transaction, transactions: Transaction[]): RuleAlert[] => {
  const alerts: RuleAlert[] = [];
  const categoryTotal = transactions.filter(t => t.category === newTx.category).reduce((s, t) => s + t.amount, 0);
  const monthTotal = transactions.reduce((s, t) => s + (t.type === 'expense' ? t.amount : 0), 0);
  
  if (newTx.category === 'Entretenimiento' && categoryTotal > monthTotal * 0.4) {
    alerts.push({ message: '🎭 Gasto en entretenimiento >40%. Considera pausar suscripciones.', type: 'warning' });
  }
  if (newTx.amount > 100000 && newTx.type === 'expense') {
    alerts.push({ message: '💸 Compra grande detectada. ¿Entra en tu presupuesto?', type: 'info' });
  }
  return alerts;
};