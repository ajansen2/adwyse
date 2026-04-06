'use client';

import { useMemo } from 'react';
import NumberFlow from '@number-flow/react';

interface SparklineProps {
  data: number[];
  color?: string;
  height?: number;
  width?: number;
}

function Sparkline({ data, color = '#6366f1', height = 24, width = 80 }: SparklineProps) {
  if (data.length < 2) return null;

  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;

  const points = data.map((value, i) => {
    const x = (i / (data.length - 1)) * width;
    const y = height - ((value - min) / range) * height;
    return `${x},${y}`;
  }).join(' ');

  return (
    <svg width={width} height={height} className="overflow-visible">
      <polyline
        points={points}
        fill="none"
        stroke={color}
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export type TrendDirection = 'up' | 'down' | 'neutral';

interface MetricCardProps {
  title: string;
  value: number;
  previousValue?: number;
  format?: 'number' | 'currency' | 'percent' | 'multiplier';
  prefix?: string;
  suffix?: string;
  decimals?: number;
  trend?: {
    value: number;
    direction: TrendDirection;
    label?: string;
  };
  sparklineData?: number[];
  sparklineColor?: string;
  icon?: React.ReactNode;
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  className?: string;
  onClick?: () => void;
}

export function MetricCard({
  title,
  value,
  previousValue,
  format = 'number',
  prefix,
  suffix,
  decimals,
  trend,
  sparklineData,
  sparklineColor,
  icon,
  size = 'md',
  loading = false,
  className = '',
  onClick
}: MetricCardProps) {
  // Calculate trend from previous value if not provided
  const calculatedTrend = useMemo(() => {
    if (trend) return trend;
    if (previousValue === undefined || previousValue === 0) return null;

    const changePercent = ((value - previousValue) / previousValue) * 100;
    const direction: TrendDirection = changePercent > 0 ? 'up' : changePercent < 0 ? 'down' : 'neutral';

    return {
      value: Math.abs(changePercent),
      direction,
      label: 'vs previous period'
    };
  }, [trend, value, previousValue]);

  // Format value based on type
  const formatValue = (val: number): string => {
    const dec = decimals ?? (format === 'currency' ? 2 : format === 'percent' ? 1 : 0);

    switch (format) {
      case 'currency':
        if (val >= 1000000) return `$${(val / 1000000).toFixed(1)}M`;
        if (val >= 1000) return `$${(val / 1000).toFixed(1)}K`;
        return `$${val.toFixed(dec)}`;
      case 'percent':
        return `${val.toFixed(dec)}%`;
      case 'multiplier':
        return `${val.toFixed(dec)}x`;
      default:
        if (val >= 1000000) return `${(val / 1000000).toFixed(1)}M`;
        if (val >= 1000) return `${(val / 1000).toFixed(1)}K`;
        return val.toFixed(dec);
    }
  };

  // Determine colors based on trend direction and metric type
  const getTrendColor = (direction: TrendDirection): string => {
    // For some metrics like spend, "up" might be bad
    switch (direction) {
      case 'up':
        return 'text-green-600';
      case 'down':
        return 'text-red-600';
      default:
        return 'text-gray-500';
    }
  };

  const getTrendIcon = (direction: TrendDirection) => {
    switch (direction) {
      case 'up':
        return (
          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
          </svg>
        );
      case 'down':
        return (
          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        );
      default:
        return (
          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h14" />
          </svg>
        );
    }
  };

  const sizeClasses = {
    sm: 'p-3',
    md: 'p-4',
    lg: 'p-6'
  };

  const valueSizeClasses = {
    sm: 'text-xl',
    md: 'text-2xl',
    lg: 'text-3xl'
  };

  if (loading) {
    return (
      <div className={`bg-white rounded-xl border border-gray-200 ${sizeClasses[size]} ${className}`}>
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-24 mb-3"></div>
          <div className="h-8 bg-gray-200 rounded w-32 mb-2"></div>
          <div className="h-3 bg-gray-200 rounded w-20"></div>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`
        bg-white rounded-xl border border-gray-200 ${sizeClasses[size]}
        transition-all duration-200 hover:border-gray-300 hover:shadow-sm
        ${onClick ? 'cursor-pointer' : ''}
        ${className}
      `}
      onClick={onClick}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            {icon && <span className="text-gray-400">{icon}</span>}
            <h3 className="text-sm font-medium text-gray-500 truncate">{title}</h3>
          </div>

          <div className={`${valueSizeClasses[size]} font-bold text-gray-900 tabular-nums`}>
            {prefix}
            <NumberFlow
              value={value}
              format={{
                notation: value >= 1000000 ? 'compact' : 'standard',
                maximumFractionDigits: decimals ?? (format === 'currency' ? 2 : 0),
                style: format === 'currency' ? 'currency' : format === 'percent' ? 'percent' : 'decimal',
                currency: format === 'currency' ? 'USD' : undefined
              }}
              transformTiming={{ duration: 500, easing: 'ease-out' }}
            />
            {suffix}
            {format === 'multiplier' && 'x'}
          </div>

          {calculatedTrend && (
            <div className={`flex items-center gap-1 mt-1 text-xs ${getTrendColor(calculatedTrend.direction)}`}>
              {getTrendIcon(calculatedTrend.direction)}
              <span className="font-medium">{calculatedTrend.value.toFixed(1)}%</span>
              {calculatedTrend.label && (
                <span className="text-gray-400 ml-1">{calculatedTrend.label}</span>
              )}
            </div>
          )}
        </div>

        {sparklineData && sparklineData.length > 1 && (
          <div className="ml-4 flex-shrink-0">
            <Sparkline
              data={sparklineData}
              color={sparklineColor || (calculatedTrend?.direction === 'up' ? '#22c55e' : calculatedTrend?.direction === 'down' ? '#ef4444' : '#6366f1')}
            />
          </div>
        )}
      </div>
    </div>
  );
}

export default MetricCard;
