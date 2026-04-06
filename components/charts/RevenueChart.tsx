'use client';

import { useMemo } from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend
} from 'recharts';

interface ChartDataPoint {
  date: string;
  revenue: number;
  orders: number;
  adRevenue: number;
}

interface RevenueChartProps {
  data: ChartDataPoint[];
  dateRangeLabel?: string;
}

export function RevenueChart({ data, dateRangeLabel }: RevenueChartProps) {
  const formattedData = useMemo(() => {
    return data.map(d => ({
      ...d,
      displayDate: new Date(d.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      directRevenue: d.revenue - d.adRevenue
    }));
  }, [data]);

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload?.length) return null;

    const data = payload[0]?.payload;
    return (
      <div className="bg-slate-800 border border-white/20 rounded-lg px-4 py-3 shadow-xl">
        <p className="text-white font-medium mb-2">{data?.displayDate}</p>
        <div className="space-y-1 text-sm">
          <p className="text-green-400">
            Total Revenue: <span className="font-bold">${data?.revenue?.toFixed(2)}</span>
          </p>
          <p className="text-orange-400">
            Ad Revenue: <span className="font-bold">${data?.adRevenue?.toFixed(2)}</span>
          </p>
          <p className="text-blue-400">
            Direct Revenue: <span className="font-bold">${data?.directRevenue?.toFixed(2)}</span>
          </p>
          <p className="text-white/60">
            Orders: <span className="font-bold">{data?.orders}</span>
          </p>
        </div>
      </div>
    );
  };

  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-white/40">
        No data available for this period
      </div>
    );
  }

  return (
    <div className="w-full">
      <ResponsiveContainer width="100%" height={300}>
        <AreaChart data={formattedData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#22c55e" stopOpacity={0.3}/>
              <stop offset="95%" stopColor="#22c55e" stopOpacity={0}/>
            </linearGradient>
            <linearGradient id="colorAdRevenue" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#f97316" stopOpacity={0.3}/>
              <stop offset="95%" stopColor="#f97316" stopOpacity={0}/>
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
          <XAxis
            dataKey="displayDate"
            stroke="rgba(255,255,255,0.4)"
            tick={{ fill: 'rgba(255,255,255,0.6)', fontSize: 12 }}
            tickLine={{ stroke: 'rgba(255,255,255,0.2)' }}
            interval="preserveStartEnd"
          />
          <YAxis
            stroke="rgba(255,255,255,0.4)"
            tick={{ fill: 'rgba(255,255,255,0.6)', fontSize: 12 }}
            tickLine={{ stroke: 'rgba(255,255,255,0.2)' }}
            tickFormatter={(value) => `$${value >= 1000 ? `${(value/1000).toFixed(0)}k` : value}`}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend
            wrapperStyle={{ paddingTop: '20px' }}
            formatter={(value) => <span className="text-white/70 text-sm">{value}</span>}
          />
          <Area
            type="monotone"
            dataKey="revenue"
            name="Total Revenue"
            stroke="#22c55e"
            strokeWidth={2}
            fillOpacity={1}
            fill="url(#colorRevenue)"
          />
          <Area
            type="monotone"
            dataKey="adRevenue"
            name="Ad Revenue"
            stroke="#f97316"
            strokeWidth={2}
            fillOpacity={1}
            fill="url(#colorAdRevenue)"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

export default RevenueChart;
