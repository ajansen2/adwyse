'use client';

import { useMemo } from 'react';

interface FunnelStage {
  name: string;
  value: number;
  color?: string;
}

interface FunnelChartProps {
  data: FunnelStage[];
  height?: number;
  showLabels?: boolean;
  showConversionRates?: boolean;
  variant?: 'light' | 'dark';
}

const darkColors = [
  'from-blue-500 to-blue-600',
  'from-purple-500 to-purple-600',
  'from-orange-500 to-orange-600',
  'from-green-500 to-green-600',
];

const lightColors = ['#6366f1', '#8b5cf6', '#f97316', '#22c55e'];

export function FunnelChart({
  data,
  height = 300,
  showLabels = true,
  showConversionRates = true,
  variant = 'dark'
}: FunnelChartProps) {
  const isDark = variant === 'dark';
  const maxValue = useMemo(() => Math.max(...data.map(d => d.value), 1), [data]);

  const stages = useMemo(() => {
    return data.map((stage, index) => {
      const width = (stage.value / maxValue) * 100;
      const previousValue = index > 0 ? data[index - 1].value : null;
      const conversionRate = previousValue ? ((stage.value / previousValue) * 100).toFixed(1) : null;

      return {
        ...stage,
        width,
        conversionRate,
        colorGradient: darkColors[index % darkColors.length],
        colorSolid: lightColors[index % lightColors.length]
      };
    });
  }, [data, maxValue]);

  // Overall conversion
  const overallConversion = data.length >= 2 && data[0].value > 0
    ? ((data[data.length - 1].value / data[0].value) * 100).toFixed(2)
    : '0.00';

  if (data.length === 0) {
    return (
      <div className={`flex flex-col items-center justify-center ${isDark ? 'text-white/50' : 'text-gray-500'}`} style={{ height }}>
        <svg className="w-12 h-12 mb-3 opacity-30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4h13M3 8h9m-9 4h6m4 0l4-4m0 0l4 4m-4-4v12" />
        </svg>
        <p>No funnel data available</p>
        <p className="text-sm mt-1">Install the tracking pixel to see conversion data</p>
      </div>
    );
  }

  return (
    <div className="w-full" style={{ minHeight: height }}>
      {/* Header with overall conversion */}
      <div className="flex items-center justify-between mb-4">
        <h3 className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
          Conversion Funnel
        </h3>
        <div className="text-right">
          <div className={`text-xl font-bold ${isDark ? 'text-green-400' : 'text-green-600'}`}>
            {overallConversion}%
          </div>
          <div className={`text-xs ${isDark ? 'text-white/50' : 'text-gray-500'}`}>
            Overall Conversion
          </div>
        </div>
      </div>

      {/* Funnel stages */}
      <div className="space-y-3">
        {stages.map((stage, index) => (
          <div key={stage.name}>
            {/* Conversion rate between stages */}
            {showConversionRates && stage.conversionRate && (
              <div className="flex items-center justify-center py-1">
                <div className={`flex items-center gap-2 text-xs ${isDark ? 'text-white/40' : 'text-gray-400'}`}>
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                  </svg>
                  <span className={
                    parseFloat(stage.conversionRate) >= 50
                      ? (isDark ? 'text-green-400' : 'text-green-600')
                      : parseFloat(stage.conversionRate) >= 20
                        ? (isDark ? 'text-yellow-400' : 'text-yellow-600')
                        : (isDark ? 'text-red-400' : 'text-red-600')
                  }>
                    {stage.conversionRate}%
                  </span>
                </div>
              </div>
            )}

            <div className="flex items-center gap-4">
              {/* Stage label */}
              <div className="w-24 flex-shrink-0">
                <div className={`text-sm font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  {stage.name}
                </div>
                <div className={`text-xs ${isDark ? 'text-white/50' : 'text-gray-500'}`}>
                  {stage.value.toLocaleString()}
                </div>
              </div>

              {/* Funnel bar */}
              <div className="flex-1 relative">
                <div className={`h-10 rounded-lg overflow-hidden ${isDark ? 'bg-white/5' : 'bg-gray-100'}`}>
                  {isDark ? (
                    <div
                      className={`h-full bg-gradient-to-r ${stage.colorGradient} rounded-lg transition-all duration-500 flex items-center justify-end pr-3`}
                      style={{ width: `${Math.max(stage.width, 8)}%` }}
                    >
                      {showLabels && stage.width > 15 && (
                        <span className="text-white text-xs font-medium">
                          {stage.value.toLocaleString()}
                        </span>
                      )}
                    </div>
                  ) : (
                    <div
                      className="h-full rounded-lg transition-all duration-500 flex items-center justify-end pr-3"
                      style={{
                        width: `${Math.max(stage.width, 8)}%`,
                        backgroundColor: stage.colorSolid
                      }}
                    >
                      {showLabels && stage.width > 15 && (
                        <span className="text-white text-xs font-medium">
                          {stage.value.toLocaleString()}
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Rate summary */}
      {data.length >= 4 && (
        <div className={`mt-6 pt-4 border-t ${isDark ? 'border-white/10' : 'border-gray-200'}`}>
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <div className={`text-lg font-bold ${isDark ? 'text-purple-400' : 'text-purple-600'}`}>
                {data[0].value > 0 ? ((data[1].value / data[0].value) * 100).toFixed(1) : 0}%
              </div>
              <div className={`text-xs ${isDark ? 'text-white/50' : 'text-gray-500'}`}>
                {data[0].name} → {data[1].name}
              </div>
            </div>
            <div>
              <div className={`text-lg font-bold ${isDark ? 'text-orange-400' : 'text-orange-600'}`}>
                {data[1].value > 0 ? ((data[2].value / data[1].value) * 100).toFixed(1) : 0}%
              </div>
              <div className={`text-xs ${isDark ? 'text-white/50' : 'text-gray-500'}`}>
                {data[1].name} → {data[2].name}
              </div>
            </div>
            <div>
              <div className={`text-lg font-bold ${isDark ? 'text-green-400' : 'text-green-600'}`}>
                {data[2].value > 0 ? ((data[3].value / data[2].value) * 100).toFixed(1) : 0}%
              </div>
              <div className={`text-xs ${isDark ? 'text-white/50' : 'text-gray-500'}`}>
                {data[2].name} → {data[3].name}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default FunnelChart;
