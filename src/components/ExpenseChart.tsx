import { PieChart, Pie, ResponsiveContainer, Legend, Tooltip, Cell } from 'recharts';
import { useFinanceStore } from '../store/financeStore';

const COLORS = ['#00FFA3', '#00D1FF', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899'];

export default function ExpenseChart() {
  const { transactions } = useFinanceStore();

  const data = transactions
    .filter(t => t.type === 'expense')
    .reduce((acc: any[], t) => {
      const existing = acc.find(item => item.name === t.category);
      if (existing) {
        existing.value += t.amount;
      } else {
        acc.push({ name: t.category, value: t.amount });
      }
      return acc;
    }, []);

  if (data.length === 0) {
    return (
      <div className="text-center text-gray-500 py-8">
        No hay datos suficientes para mostrar
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={250}>
      <PieChart>
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          labelLine={false}
          label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
          outerRadius={80}
          fill="#8884d8"
          dataKey="value"
        >
          {data.map((entry: any, index: number) => (
            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
          ))}
        </Pie>
        <Tooltip 
          formatter={(value: number) => `$${value.toLocaleString('es-CO')}`}
          contentStyle={{ 
            background: 'rgba(6, 26, 26, 0.95)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: '8px',
            color: '#fff'
          }}
        />
        <Legend />
      </PieChart>
    </ResponsiveContainer>
  );
}