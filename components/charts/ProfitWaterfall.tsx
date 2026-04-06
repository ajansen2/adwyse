'use client';

import { useMemo } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  ReferenceLine
} from 'recharts';

interface ProfitWaterfallProps {
  revenue: number;
  cogs: number;
  adSpend: number;
  otherCosts?: number;
  height?: number;
}

export function ProfitWaterfall({
  revenue,
  cogs,
  adSpend,
  otherCosts = 0,
  height = 300
}: ProfitWaterfallProps) {
  const data = useMemo(() => {
    const grossProfit = revenue - cogs;
    const netProfit = grossProfit - adSpend - otherCosts;

    return [
      {
        name: 'Revenue',
        value: revenue,
        total: revenue,
        type: 'positive'
      },
      {
        name: 'COGS',
        value: -cogs,
        total: revenue - cogs,
        type: 'negative'
      },
      {
        name: 'Gross Profit',
        value: grossProfit,
        total: grossProfit,
        type: 'subtotal'
      },
      {
        name: 'Ad Spend',
        value: -adSpend,
        total: grossProfit - adSpend,
        type: 'negative'
      },
      ...(otherCosts > 0 ? [{
        name: 'Other Costs',
        value: -otherCosts,
        total: grossProfit - adSpend - otherCosts,
        type: 'negative' as const
      }] : []),
      {
        name: 'Net Profit',
        value: netProfit,
        total: netProfit,
        type: netProfit >= 0 ? 'positive' : 'negative'
      }
    ];
  }, [revenue, cogs, adSpend, otherCosts]);

  const getColor = (type: string) => {
    switch (type) {
      case 'positive':
        return '#10b981';
      case 'negative':
        return '#ef4444';
      case 'subtotal':
        return '#6366f1';
      default:
        return '#6b7280';
    }
  };

  const formatCurrency = (value: number) => {
    const absValue = Math.abs(value);
    if (absValue >= 1000000) {
      return `$${(value / 1000000).toFixed(1)}M`;
    }
    if (absValue >= 1000) {
      return `$${(value / 1000).toFixed(1)}K`;
    }
    return `$${value.toFixed(0)}`;
  };

  return (
    <div className="w-full" style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={data}
          margin={{ top: 20, right: 30, left: 40, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          <XAxis
            dataKey="name"
            tick={{ fontSize: 11 }}
            tickLine={false}
            interval={0}
            angle={-20}
            textAnchor="end"
          />
          <YAxis
            tick={{ fontSize: 12 }}
            tickLine={false}
            axisLine={false}
            tickFormatter={formatCurrency}
          />
          <Tooltip
            formatter={(value: number) => [formatCurrency(value), '']}
            contentStyle={{
              backgroundColor: '#fff',
              border: '1px solid #e5e7eb',
              borderRadius: '8px',
              boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
            }}
          />
          <ReferenceLine y={0} stroke="#9ca3af" />
          <Bar
            dataKey="value"
            radius={[4, 4, 4, 4]}
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={getColor(entry.type)} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export default ProfitWaterfall;
