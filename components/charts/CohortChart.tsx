'use client';

import { useMemo } from 'react';

interface CohortData {
  cohort: string;  // e.g., "Jan 2024"
  totalCustomers: number;
  retention: number[];  // Percentage retained at each period (0, 1, 2, 3... months)
}

interface CohortChartProps {
  data: CohortData[];
  periods?: string[];  // e.g., ["Month 0", "Month 1", "Month 2", ...]
  variant?: 'light' | 'dark';
}

function getRetentionColor(value: number, isDark: boolean): string {
  if (value >= 80) return isDark ? 'bg-green-500' : 'bg-green-500';
  if (value >= 60) return isDark ? 'bg-green-600/80' : 'bg-green-400';
  if (value >= 40) return isDark ? 'bg-yellow-500/80' : 'bg-yellow-400';
  if (value >= 20) return isDark ? 'bg-orange-500/80' : 'bg-orange-400';
  if (value > 0) return isDark ? 'bg-red-500/60' : 'bg-red-400';
  return isDark ? 'bg-white/5' : 'bg-gray-100';
}

export function CohortChart({
  data,
  periods = ['M0', 'M1', 'M2', 'M3', 'M4', 'M5', 'M6'],
  variant = 'dark'
}: CohortChartProps) {
  const isDark = variant === 'dark';

  // Calculate average retention for each period
  const averageRetention = useMemo(() => {
    if (data.length === 0) return [];

    const maxPeriods = Math.max(...data.map(d => d.retention.length));
    const averages: number[] = [];

    for (let i = 0; i < maxPeriods; i++) {
      const values = data.filter(d => d.retention[i] !== undefined).map(d => d.retention[i]);
      if (values.length > 0) {
        averages.push(values.reduce((a, b) => a + b, 0) / values.length);
      }
    }

    return averages;
  }, [data]);

  if (data.length === 0) {
    return (
      <div className={`flex flex-col items-center justify-center py-12 ${isDark ? 'text-white/50' : 'text-gray-500'}`}>
        <svg className="w-12 h-12 mb-3 opacity-30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
        <p>No cohort data available</p>
        <p className="text-sm mt-1">Need at least 2 months of customer data</p>
      </div>
    );
  }

  return (
    <div className="w-full overflow-x-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
          Customer Retention by Cohort
        </h3>
        {averageRetention.length > 1 && (
          <div className="text-right">
            <div className={`text-xl font-bold ${isDark ? 'text-blue-400' : 'text-blue-600'}`}>
              {averageRetention[1]?.toFixed(0)}%
            </div>
            <div className={`text-xs ${isDark ? 'text-white/50' : 'text-gray-500'}`}>
              Avg Month 1 Retention
            </div>
          </div>
        )}
      </div>

      {/* Cohort Table */}
      <table className="w-full min-w-[600px]">
        <thead>
          <tr>
            <th className={`px-3 py-2 text-left text-xs font-medium uppercase tracking-wider ${isDark ? 'text-white/50' : 'text-gray-500'}`}>
              Cohort
            </th>
            <th className={`px-3 py-2 text-right text-xs font-medium uppercase tracking-wider ${isDark ? 'text-white/50' : 'text-gray-500'}`}>
              Customers
            </th>
            {periods.map((period, i) => (
              <th
                key={period}
                className={`px-2 py-2 text-center text-xs font-medium uppercase tracking-wider ${isDark ? 'text-white/50' : 'text-gray-500'}`}
              >
                {period}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className={`divide-y ${isDark ? 'divide-white/10' : 'divide-gray-200'}`}>
          {data.map((row, rowIndex) => (
            <tr key={row.cohort} className={rowIndex % 2 === 1 ? (isDark ? 'bg-white/5' : 'bg-gray-50') : ''}>
              <td className={`px-3 py-2 text-sm font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                {row.cohort}
              </td>
              <td className={`px-3 py-2 text-sm text-right ${isDark ? 'text-white/70' : 'text-gray-600'}`}>
                {row.totalCustomers.toLocaleString()}
              </td>
              {periods.map((_, periodIndex) => {
                const value = row.retention[periodIndex];
                const hasValue = value !== undefined;

                return (
                  <td key={periodIndex} className="px-1 py-2">
                    <div
                      className={`w-full h-8 rounded flex items-center justify-center text-xs font-medium transition-colors ${
                        hasValue
                          ? `${getRetentionColor(value, isDark)} text-white`
                          : isDark ? 'bg-white/5 text-white/20' : 'bg-gray-100 text-gray-400'
                      }`}
                      title={hasValue ? `${value.toFixed(1)}% retained` : 'No data'}
                    >
                      {hasValue ? `${value.toFixed(0)}%` : '-'}
                    </div>
                  </td>
                );
              })}
            </tr>
          ))}

          {/* Average row */}
          <tr className={isDark ? 'bg-white/10' : 'bg-gray-100'}>
            <td className={`px-3 py-2 text-sm font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
              Average
            </td>
            <td className={`px-3 py-2 text-sm text-right font-bold ${isDark ? 'text-white/70' : 'text-gray-600'}`}>
              {data.reduce((sum, row) => sum + row.totalCustomers, 0).toLocaleString()}
            </td>
            {periods.map((_, periodIndex) => {
              const avg = averageRetention[periodIndex];
              const hasValue = avg !== undefined;

              return (
                <td key={periodIndex} className="px-1 py-2">
                  <div
                    className={`w-full h-8 rounded flex items-center justify-center text-xs font-bold transition-colors ${
                      hasValue
                        ? `${getRetentionColor(avg, isDark)} text-white`
                        : isDark ? 'bg-white/5 text-white/20' : 'bg-gray-100 text-gray-400'
                    }`}
                  >
                    {hasValue ? `${avg.toFixed(0)}%` : '-'}
                  </div>
                </td>
              );
            })}
          </tr>
        </tbody>
      </table>

      {/* Legend */}
      <div className={`mt-4 flex items-center justify-center gap-4 text-xs ${isDark ? 'text-white/50' : 'text-gray-500'}`}>
        <div className="flex items-center gap-1">
          <div className={`w-3 h-3 rounded ${isDark ? 'bg-green-500' : 'bg-green-500'}`}></div>
          <span>80%+</span>
        </div>
        <div className="flex items-center gap-1">
          <div className={`w-3 h-3 rounded ${isDark ? 'bg-yellow-500/80' : 'bg-yellow-400'}`}></div>
          <span>40-79%</span>
        </div>
        <div className="flex items-center gap-1">
          <div className={`w-3 h-3 rounded ${isDark ? 'bg-orange-500/80' : 'bg-orange-400'}`}></div>
          <span>20-39%</span>
        </div>
        <div className="flex items-center gap-1">
          <div className={`w-3 h-3 rounded ${isDark ? 'bg-red-500/60' : 'bg-red-400'}`}></div>
          <span>&lt;20%</span>
        </div>
      </div>
    </div>
  );
}

export default CohortChart;
