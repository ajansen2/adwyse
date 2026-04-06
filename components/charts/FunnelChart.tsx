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
}

const defaultColors = ['#6366f1', '#8b5cf6', '#a855f7', '#d946ef'];

export function FunnelChart({
  data,
  height = 300,
  showLabels = true,
  showConversionRates = true
}: FunnelChartProps) {
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
        color: stage.color || defaultColors[index % defaultColors.length]
      };
    });
  }, [data, maxValue]);

  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-500">
        No funnel data available
      </div>
    );
  }

  return (
    <div className="w-full" style={{ height }}>
      <div className="flex flex-col items-center justify-center h-full space-y-2">
        {stages.map((stage, index) => (
          <div key={stage.name} className="w-full flex items-center">
            {/* Conversion rate arrow */}
            {showConversionRates && stage.conversionRate && (
              <div className="w-16 text-right pr-2 text-sm text-gray-500">
                {stage.conversionRate}%
                <span className="ml-1">↓</span>
              </div>
            )}
            {!showConversionRates && <div className="w-16" />}

            {/* Funnel bar */}
            <div className="flex-1 flex justify-center">
              <div
                className="h-12 rounded-lg transition-all duration-300 relative flex items-center justify-center"
                style={{
                  width: `${stage.width}%`,
                  backgroundColor: stage.color,
                  minWidth: '60px'
                }}
              >
                {showLabels && (
                  <span className="text-white font-medium text-sm truncate px-2">
                    {stage.value.toLocaleString()}
                  </span>
                )}
              </div>
            </div>

            {/* Stage label */}
            <div className="w-24 pl-2 text-sm font-medium text-gray-700 truncate">
              {stage.name}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default FunnelChart;
