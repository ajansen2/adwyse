'use client';

import { useMemo } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceLine
} from 'recharts';

interface ROASComparisonData {
  name: string;
  current: number;
  previous: number;
}

interface ROASComparisonProps {
  data: ROASComparisonData[];
  height?: number;
  currentLabel?: string;
  previousLabel?: string;
  target?: number;
}

export function ROASComparison({
  data,
  height = 300,
  currentLabel = 'Current Period',
  previousLabel = 'Previous Period',
  target = 2.0
}: ROASComparisonProps) {
  const formattedData = useMemo(() => {
    return data.map(item => ({
      ...item,
      current: parseFloat(item.current.toFixed(2)),
      previous: parseFloat(item.previous.toFixed(2)),
      change: item.current - item.previous
    }));
  }, [data]);

  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-500">
        No comparison data available
      </div>
    );
  }

  return (
    <div className="w-full" style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={formattedData}
          margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          <XAxis
            dataKey="name"
            tick={{ fontSize: 12 }}
            tickLine={false}
          />
          <YAxis
            tick={{ fontSize: 12 }}
            tickLine={false}
            axisLine={false}
            tickFormatter={(value) => `${value}x`}
          />
          <Tooltip
            formatter={(value: number, name: string) => [
              `${value.toFixed(2)}x`,
              name === 'current' ? currentLabel : previousLabel
            ]}
            contentStyle={{
              backgroundColor: '#fff',
              border: '1px solid #e5e7eb',
              borderRadius: '8px',
              boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
            }}
          />
          <Legend
            formatter={(value) => value === 'current' ? currentLabel : previousLabel}
          />
          <ReferenceLine
            y={target}
            stroke="#10b981"
            strokeDasharray="5 5"
            label={{ value: `Target: ${target}x`, position: 'right', fill: '#10b981' }}
          />
          <Bar
            dataKey="previous"
            fill="#94a3b8"
            radius={[4, 4, 0, 0]}
            name="previous"
          />
          <Bar
            dataKey="current"
            fill="#6366f1"
            radius={[4, 4, 0, 0]}
            name="current"
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export default ROASComparison;
