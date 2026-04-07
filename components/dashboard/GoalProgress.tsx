'use client';

import { useState, useEffect } from 'react';

interface GoalProgressData {
  goal_type: string;
  target_value: number;
  current_value: number;
  progress_percent: number;
  period: string;
  period_start: string;
  period_end: string;
  on_track: boolean;
  projected_value: number;
}

interface GoalProgressProps {
  storeId: string;
  className?: string;
}

const goalConfig: Record<string, { label: string; icon: string; format: (v: number) => string; color: string }> = {
  revenue: {
    label: 'Revenue',
    icon: '💰',
    format: (v) => `$${v.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`,
    color: 'from-green-500 to-emerald-500',
  },
  orders: {
    label: 'Orders',
    icon: '📦',
    format: (v) => v.toLocaleString(),
    color: 'from-blue-500 to-cyan-500',
  },
  roas: {
    label: 'ROAS',
    icon: '📈',
    format: (v) => `${v.toFixed(2)}x`,
    color: 'from-purple-500 to-violet-500',
  },
  spend_limit: {
    label: 'Spend Limit',
    icon: '💸',
    format: (v) => `$${v.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`,
    color: 'from-orange-500 to-red-500',
  },
  aov: {
    label: 'Avg Order Value',
    icon: '🛒',
    format: (v) => `$${v.toFixed(2)}`,
    color: 'from-pink-500 to-rose-500',
  },
};

export function GoalProgress({ storeId, className = '' }: GoalProgressProps) {
  const [goals, setGoals] = useState<GoalProgressData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchGoals = async () => {
      try {
        const response = await fetch(`/api/goals/progress?store_id=${storeId}`);
        const data = await response.json();
        setGoals(data.progress || []);
      } catch (error) {
        console.error('Failed to fetch goal progress:', error);
      } finally {
        setLoading(false);
      }
    };

    if (storeId) {
      fetchGoals();
    }
  }, [storeId]);

  if (loading) {
    return (
      <div className={`bg-white/5 backdrop-blur border border-white/10 rounded-xl p-6 ${className}`}>
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-white/10 rounded w-32"></div>
          <div className="h-20 bg-white/10 rounded"></div>
        </div>
      </div>
    );
  }

  if (goals.length === 0) {
    return null; // Don't show if no goals set
  }

  return (
    <div className={`bg-white/5 backdrop-blur border border-white/10 rounded-xl p-6 ${className}`}>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-white">Goal Progress</h2>
        <span className="text-xs text-white/40">
          {goals[0]?.period === 'monthly' ? 'This Month' :
           goals[0]?.period === 'weekly' ? 'This Week' :
           goals[0]?.period === 'daily' ? 'Today' : 'This Quarter'}
        </span>
      </div>

      <div className="space-y-4">
        {goals.map((goal) => {
          const config = goalConfig[goal.goal_type] || goalConfig.revenue;
          const isSpendGoal = goal.goal_type === 'spend_limit';
          const progressClamped = Math.min(goal.progress_percent, 100);

          return (
            <div key={goal.goal_type} className="relative">
              {/* Header */}
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-lg">{config.icon}</span>
                  <span className="text-sm font-medium text-white">{config.label}</span>
                </div>
                <div className="text-right">
                  <span className="text-sm font-bold text-white">
                    {config.format(goal.current_value)}
                  </span>
                  <span className="text-white/40 text-sm"> / {config.format(goal.target_value)}</span>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="relative h-3 bg-white/10 rounded-full overflow-hidden">
                <div
                  className={`absolute inset-y-0 left-0 bg-gradient-to-r ${config.color} rounded-full transition-all duration-500`}
                  style={{ width: `${progressClamped}%` }}
                />
                {/* Projected marker (if different from current) */}
                {goal.projected_value !== goal.current_value && !isSpendGoal && (
                  <div
                    className="absolute top-0 w-0.5 h-full bg-white/50"
                    style={{
                      left: `${Math.min((goal.projected_value / goal.target_value) * 100, 100)}%`
                    }}
                  />
                )}
              </div>

              {/* Footer */}
              <div className="flex items-center justify-between mt-1">
                <span className={`text-xs font-medium ${
                  goal.on_track
                    ? 'text-green-400'
                    : isSpendGoal
                      ? goal.progress_percent > 80 ? 'text-yellow-400' : 'text-green-400'
                      : 'text-yellow-400'
                }`}>
                  {isSpendGoal
                    ? goal.on_track
                      ? `${(100 - goal.progress_percent).toFixed(0)}% budget remaining`
                      : 'Over budget!'
                    : goal.on_track
                      ? 'On track'
                      : `Projected: ${config.format(goal.projected_value)}`
                  }
                </span>
                <span className="text-xs text-white/40">
                  {goal.progress_percent.toFixed(0)}% complete
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default GoalProgress;
