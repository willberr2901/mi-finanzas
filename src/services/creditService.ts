export interface CreditResult {
  monthlyPayment: number;
  totalPayment: number;
  totalInterest: number;
  schedule: PaymentSchedule[];
}

export interface PaymentSchedule {
  month: number;
  payment: number;
  principal: number;
  interest: number;
  balance: number;
}

/**
 * Calcula la cuota fija mensual (Sistema de Amortización Francés)
 * Fórmula: C = P * [i(1 + i)^n] / [(1 + i)^n – 1]
 */
export const calculateCredit = (
  amount: number,
  annualRate: number, // Tasa Efectiva Anual (E.A.) en porcentaje (ej: 30 para 30%)
  months: number
): CreditResult => {
  if (amount <= 0 || annualRate <= 0 || months <= 0) {
    return { monthlyPayment: 0, totalPayment: 0, totalInterest: 0, schedule: [] };
  }

  // Convertir tasa anual a mensual
  // i = (1 + EA)^(1/12) - 1
  const monthlyRate = Math.pow(1 + annualRate / 100, 1 / 12) - 1;

  // Calcular cuota mensual
  const x = Math.pow(1 + monthlyRate, months);
  const monthlyPayment = (amount * x * monthlyRate) / (x - 1);

  // Generar tabla de amortización
  const schedule: PaymentSchedule[] = [];
  let balance = amount;

  for (let i = 1; i <= months; i++) {
    const interestPayment = balance * monthlyRate;
    const principalPayment = monthlyPayment - interestPayment;
    balance -= principalPayment;

    schedule.push({
      month: i,
      payment: monthlyPayment,
      principal: principalPayment,
      interest: interestPayment,
      balance: Math.max(0, balance) // Evitar números negativos por decimales
    });
  }

  return {
    monthlyPayment,
    totalPayment: monthlyPayment * months,
    totalInterest: (monthlyPayment * months) - amount,
    schedule
  };
};