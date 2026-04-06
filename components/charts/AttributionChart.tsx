'use client';

import { useMemo } from 'react';
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  Legend
} from 'recharts';

interface AttributionData {
  channel: string;
  revenue: number;
  percentage?: number;
  orders?: number;
}

interface AttributionChartProps {
  data: AttributionData[];
  height?: number;
  showLegend?: boolean;
  innerRadius?: number;
  outerRadius?: number;
}

const COLORS = [
  '#6366f1', // Indigo
  '#8b5cf6', // Purple
  '#ec4899', // Pink
  '#f97316', // Orange
  '#14b8a6', // Teal
  '#eab308', // Yellow
  '#22c55e', // Green
  '#ef4444', // Red
  '#64748b', // Slate
];

const CHANNEL_COLORS: Record<string, string> = {
  facebook: '#1877f2',
  instagram: '#e4405f',
  google: '#4285f4',
  tiktok: '#000000',
  direct: '#6b7280',
  organic: '#22c55e',
  email: '#f59e0b',
  referral: '#8b5cf6',
};

export function AttributionChart({
  data,
  height = 300,
  showLegend = true,
  innerRadius = 60,
  outerRadius = 100
}: AttributionChartProps) {
  const chartData = useMemo(() => {
    const total = data.reduce((sum, d) => sum + d.revenue, 0);
    return data.map(d => ({
      ...d,
      percentage: total > 0 ? (d.revenue / total) * 100 : 0,
      fill: CHANNEL_COLORS[d.channel.toLowerCase()] || COLORS[data.indexOf(d) % COLORS.length]
    }));
  }, [data]);

  const formatCurrency = (value: number) => {
    if (value >= 1000000) return `$${(value / 1000000).toFixed(1)}M`;
    if (value >= 1000) return `$${(value / 1000).toFixed(1)}K`;
    return `$${value.toFixed(0)}`;
  };

  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-500">
        No attribution data available
      </div>
    );
  }

  return (
    <div className="w-full" style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={chartData}
            cx="50%"
            cy="50%"
            innerRadius={innerRadius}
            outerRadius={outerRadius}
            paddingAngle={2}
            dataKey="revenue"
            nameKey="channel"
            label={(props: any) =>
              props.percent > 0.05 ? `${props.name} ${(props.percent * 100).toFixed(0)}%` : ''
            }
            labelLine={false}
          >
            {chartData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.fill} />
            ))}
          </Pie>
          <Tooltip
            formatter={(value: number, name: string, props: any) => [
              formatCurrency(value),
              props.payload.channel
            ]}
            contentStyle={{
              backgroundColor: '#fff',
              border: '1px solid #e5e7eb',
              borderRadius: '8px',
              boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
            }}
          />
          {showLegend && (
            <Legend
              formatter={(value, entry: any) => (
                <span className="text-sm text-gray-700">
                  {entry.payload.channel}
                </span>
              )}
              wrapperStyle={{ fontSize: '12px' }}
            />
          )}
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}

export default AttributionChart;
