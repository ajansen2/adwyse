'use client';

import { useMemo } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Area,
  ComposedChart
} from 'recharts';

interface TrendDataPoint {
  date: string;
  [key: string]: string | number;
}

interface TrendLine {
  key: string;
  name: string;
  color: string;
  type?: 'line' | 'area';
  yAxisId?: 'left' | 'right';
}

interface TrendChartProps {
  data: TrendDataPoint[];
  lines: TrendLine[];
  height?: number;
  showGrid?: boolean;
  showLegend?: boolean;
  dateFormat?: 'short' | 'medium' | 'long';
  valueFormat?: 'number' | 'currency' | 'percent';
  dualAxis?: boolean;
}

export function TrendChart({
  data,
  lines,
  height = 300,
  showGrid = true,
  showLegend = true,
  dateFormat = 'short',
  valueFormat = 'number',
  dualAxis = false
}: TrendChartProps) {
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    switch (dateFormat) {
      case 'short':
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      case 'medium':
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: '2-digit' });
      case 'long':
        return date.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
      default:
        return dateStr;
    }
  };

  const formatValue = (value: number, format: string = valueFormat) => {
    switch (format) {
      case 'currency':
        if (value >= 1000000) return `$${(value / 1000000).toFixed(1)}M`;
        if (value >= 1000) return `$${(value / 1000).toFixed(1)}K`;
        return `$${value.toFixed(0)}`;
      case 'percent':
        return `${value.toFixed(1)}%`;
      default:
        if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`;
        if (value >= 1000) return `${(value / 1000).toFixed(1)}K`;
        return value.toFixed(0);
    }
  };

  const hasArea = lines.some(l => l.type === 'area');

  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-500">
        No trend data available
      </div>
    );
  }

  const Chart = hasArea ? ComposedChart : LineChart;

  return (
    <div className="w-full" style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <Chart data={data} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
          {showGrid && <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />}
          <XAxis
            dataKey="date"
            tick={{ fontSize: 11 }}
            tickLine={false}
            tickFormatter={formatDate}
          />
          <YAxis
            yAxisId="left"
            tick={{ fontSize: 11 }}
            tickLine={false}
            axisLine={false}
            tickFormatter={(v) => formatValue(v)}
          />
          {dualAxis && (
            <YAxis
              yAxisId="right"
              orientation="right"
              tick={{ fontSize: 11 }}
              tickLine={false}
              axisLine={false}
              tickFormatter={(v) => formatValue(v)}
            />
          )}
          <Tooltip
            formatter={(value: number, name: string) => [formatValue(value), name]}
            labelFormatter={formatDate}
            contentStyle={{
              backgroundColor: '#fff',
              border: '1px solid #e5e7eb',
              borderRadius: '8px',
              boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
            }}
          />
          {showLegend && <Legend wrapperStyle={{ fontSize: '12px' }} />}
          {lines.map((line) =>
            line.type === 'area' ? (
              <Area
                key={line.key}
                type="monotone"
                dataKey={line.key}
                name={line.name}
                stroke={line.color}
                fill={line.color}
                fillOpacity={0.1}
                strokeWidth={2}
                yAxisId={line.yAxisId || 'left'}
              />
            ) : (
              <Line
                key={line.key}
                type="monotone"
                dataKey={line.key}
                name={line.name}
                stroke={line.color}
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 4 }}
                yAxisId={line.yAxisId || 'left'}
              />
            )
          )}
        </Chart>
      </ResponsiveContainer>
    </div>
  );
}

export default TrendChart;
