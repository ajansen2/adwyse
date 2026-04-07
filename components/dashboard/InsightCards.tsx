'use client';

import { useState } from 'react';

interface Insight {
  id: string;
  type: 'opportunity' | 'warning' | 'recommendation';
  priority: 'high' | 'medium' | 'low';
  title: string;
  description: string;
  metric?: string;
  metricValue?: string;
  action?: string;
  impact?: string;
  platform?: string;
  campaignName?: string;
}

interface InsightCardsProps {
  insights: Insight[];
  onDismiss?: (id: string) => void;
  onAction?: (id: string) => void;
}

export function InsightCards({ insights, onDismiss, onAction }: InsightCardsProps) {
  const [dismissedIds, setDismissedIds] = useState<Set<string>>(new Set());

  const handleDismiss = (id: string) => {
    setDismissedIds(prev => new Set(prev).add(id));
    onDismiss?.(id);
  };

  const getTypeStyles = (type: string) => {
    switch (type) {
      case 'opportunity':
        return {
          bg: 'bg-gradient-to-br from-green-500/10 to-emerald-500/10',
          border: 'border-green-500/30',
          icon: 'text-green-400',
          badge: 'bg-green-500/20 text-green-400',
        };
      case 'warning':
        return {
          bg: 'bg-gradient-to-br from-red-500/10 to-orange-500/10',
          border: 'border-red-500/30',
          icon: 'text-red-400',
          badge: 'bg-red-500/20 text-red-400',
        };
      default:
        return {
          bg: 'bg-gradient-to-br from-blue-500/10 to-purple-500/10',
          border: 'border-blue-500/30',
          icon: 'text-blue-400',
          badge: 'bg-blue-500/20 text-blue-400',
        };
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'opportunity':
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
          </svg>
        );
      case 'warning':
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        );
      default:
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
          </svg>
        );
    }
  };

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'high':
        return <span className="px-2 py-0.5 text-xs font-medium bg-red-500/20 text-red-400 rounded-full">High Priority</span>;
      case 'medium':
        return <span className="px-2 py-0.5 text-xs font-medium bg-yellow-500/20 text-yellow-400 rounded-full">Medium</span>;
      default:
        return <span className="px-2 py-0.5 text-xs font-medium bg-blue-500/20 text-blue-400 rounded-full">Low</span>;
    }
  };

  const getPlatformIcon = (platform?: string) => {
    if (!platform) return null;
    switch (platform.toLowerCase()) {
      case 'facebook':
        return <span className="text-blue-400">📘</span>;
      case 'google':
        return <span>🔍</span>;
      case 'tiktok':
        return <span>🎵</span>;
      default:
        return <span>📊</span>;
    }
  };

  const visibleInsights = insights.filter(i => !dismissedIds.has(i.id));

  if (visibleInsights.length === 0) {
    return null;
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {visibleInsights.map((insight) => {
        const styles = getTypeStyles(insight.type);

        return (
          <div
            key={insight.id}
            className={`${styles.bg} backdrop-blur border ${styles.border} rounded-xl p-5 relative group transition-all hover:scale-[1.02] hover:shadow-lg`}
          >
            {/* Dismiss button */}
            <button
              onClick={() => handleDismiss(insight.id)}
              className="absolute top-3 right-3 p-1 rounded-lg bg-white/5 opacity-0 group-hover:opacity-100 transition text-white/40 hover:text-white/60 hover:bg-white/10"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            {/* Header */}
            <div className="flex items-start gap-3 mb-3">
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${styles.badge}`}>
                {getTypeIcon(insight.type)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className={`px-2 py-0.5 text-xs font-medium rounded-full capitalize ${styles.badge}`}>
                    {insight.type}
                  </span>
                  {getPriorityBadge(insight.priority)}
                </div>
                <h3 className="text-white font-semibold mt-1 pr-6">{insight.title}</h3>
              </div>
            </div>

            {/* Description */}
            <p className="text-white/70 text-sm mb-4 line-clamp-2">{insight.description}</p>

            {/* Metric highlight */}
            {insight.metric && insight.metricValue && (
              <div className="bg-white/5 rounded-lg p-3 mb-4">
                <div className="text-white/50 text-xs uppercase tracking-wide">{insight.metric}</div>
                <div className="text-white text-xl font-bold">{insight.metricValue}</div>
              </div>
            )}

            {/* Campaign/Platform tag */}
            {(insight.campaignName || insight.platform) && (
              <div className="flex items-center gap-2 mb-4 text-sm">
                {getPlatformIcon(insight.platform)}
                <span className="text-white/60 truncate">
                  {insight.campaignName || insight.platform}
                </span>
              </div>
            )}

            {/* Impact */}
            {insight.impact && (
              <div className="text-green-400 text-sm font-medium mb-4">
                💰 {insight.impact}
              </div>
            )}

            {/* Action button */}
            {insight.action && (
              <button
                onClick={() => onAction?.(insight.id)}
                className="w-full py-2 px-4 bg-white/10 hover:bg-white/20 text-white text-sm font-medium rounded-lg transition flex items-center justify-center gap-2"
              >
                {insight.action}
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </button>
            )}
          </div>
        );
      })}
    </div>
  );
}

// Quick stats insight for the dashboard
interface QuickInsightProps {
  title: string;
  value: string;
  change?: number;
  changeLabel?: string;
  icon: React.ReactNode;
  color: 'green' | 'red' | 'blue' | 'orange' | 'purple';
}

export function QuickInsight({ title, value, change, changeLabel, icon, color }: QuickInsightProps) {
  const colorStyles = {
    green: 'from-green-500/10 to-emerald-500/10 border-green-500/30',
    red: 'from-red-500/10 to-orange-500/10 border-red-500/30',
    blue: 'from-blue-500/10 to-cyan-500/10 border-blue-500/30',
    orange: 'from-orange-500/10 to-amber-500/10 border-orange-500/30',
    purple: 'from-purple-500/10 to-pink-500/10 border-purple-500/30',
  };

  const iconColors = {
    green: 'bg-green-500/20 text-green-400',
    red: 'bg-red-500/20 text-red-400',
    blue: 'bg-blue-500/20 text-blue-400',
    orange: 'bg-orange-500/20 text-orange-400',
    purple: 'bg-purple-500/20 text-purple-400',
  };

  return (
    <div className={`bg-gradient-to-br ${colorStyles[color]} backdrop-blur border rounded-xl p-4`}>
      <div className="flex items-center gap-3">
        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${iconColors[color]}`}>
          {icon}
        </div>
        <div>
          <div className="text-white/60 text-sm">{title}</div>
          <div className="text-white text-xl font-bold">{value}</div>
          {change !== undefined && (
            <div className={`text-xs font-medium ${change >= 0 ? 'text-green-400' : 'text-red-400'}`}>
              {change >= 0 ? '↑' : '↓'} {Math.abs(change).toFixed(1)}% {changeLabel}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default InsightCards;
