import { AreaChart, Area, ResponsiveContainer } from 'recharts';

interface Props {
  data: { day: string; value: number }[];
}

export default function ProjectionChart({ data }: Props) {
  return (
    <div className="h-24 w-full mt-4">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data}>
          <defs>
            <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#ffffff" stopOpacity={0.3}/>
              <stop offset="95%" stopColor="#ffffff" stopOpacity={0}/>
            </linearGradient>
          </defs>
          <Area
            type="monotone"
            dataKey="value"
            stroke="#ffffff"
            strokeWidth={2}
            fill="url(#colorValue)"
            baseValue={0}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}