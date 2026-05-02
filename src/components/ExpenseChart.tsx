import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import { useFinanceStore } from '../store/financeStore';

// Colores vibrantes estilo siglo 21
const COLORS = ['#00C49F', '#FF8042', '#0088FE', '#FFBB28', '#8884D8', '#E91E63'];

export default function ExpenseChart() {
  const { transactions } = useFinanceStore();

  // Procesar datos para el gráfico
  const data = Object.entries(
    transactions
      .filter(t => t.type === 'expense')
      .reduce((acc, t) => {
        acc[t.category] = (acc[t.category] || 0) + t.amount;
        return acc;
      }, {} as Record<string, number>)
  ).map(([name, value]) => ({ name, value }));

  if (data.length === 0) return null;

  return (
    <div className="bg-gray-800 p-6 rounded-xl shadow-lg">
      <h3 className="text-xl font-bold text-white mb-4">Distribución de Gastos</h3>
      <div className="h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              labelLine={false}
              outerRadius={80}
              fill="#8884d8"
              dataKey="value"
            >
              // Busca y elimina la variable 'entry' si existe
// O agrégale un guión bajo: _entry
            </Pie>
            <Tooltip 
              formatter={(value: number) => `$${value.toLocaleString('es-CO')}`}
              contentStyle={{ backgroundColor: '#1f2937', border: 'none', borderRadius: '8px', color: '#fff' }}
            />
            <Legend wrapperStyle={{ color: '#9ca3af' }} />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}