'use client';

import { useState, useEffect } from 'react';
import { navigateInApp } from '@/lib/shopify-app-bridge';

interface GettingStartedProps {
  storeId: string;
  hasAdAccounts: boolean;
  hasPixelEvents: boolean;
  hasAttributedOrders: boolean;
  hasAlerts: boolean;
  onDismiss?: () => void;
}

interface ChecklistItem {
  id: string;
  title: string;
  description: string;
  completed: boolean;
  action: () => void;
  actionLabel: string;
  icon: React.ReactNode;
}

export function GettingStarted({
  storeId,
  hasAdAccounts,
  hasPixelEvents,
  hasAttributedOrders,
  hasAlerts,
  onDismiss
}: GettingStartedProps) {
  const [dismissed, setDismissed] = useState(false);

  // Check localStorage for dismissal
  useEffect(() => {
    const isDismissed = localStorage.getItem(`adwyse_checklist_dismissed_${storeId}`);
    if (isDismissed === 'true') {
      setDismissed(true);
    }
  }, [storeId]);

  const handleDismiss = () => {
    localStorage.setItem(`adwyse_checklist_dismissed_${storeId}`, 'true');
    setDismissed(true);
    onDismiss?.();
  };

  const checklist: ChecklistItem[] = [
    {
      id: 'ad_accounts',
      title: 'Connect Ad Accounts',
      description: 'Link Facebook, Google, or TikTok Ads to track spend and ROAS',
      completed: hasAdAccounts,
      action: () => navigateInApp('/dashboard/settings'),
      actionLabel: 'Connect',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
        </svg>
      )
    },
    {
      id: 'pixel',
      title: 'Install Tracking Pixel',
      description: 'Add the first-party pixel to track page views and attribution',
      completed: hasPixelEvents,
      action: () => navigateInApp('/dashboard/settings'),
      actionLabel: 'Install',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
        </svg>
      )
    },
    {
      id: 'attribution',
      title: 'Get Your First Attribution',
      description: 'Receive an order with UTM params or ad click IDs',
      completed: hasAttributedOrders,
      action: () => {},
      actionLabel: 'Waiting...',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
        </svg>
      )
    },
    {
      id: 'alerts',
      title: 'Set Up Alerts',
      description: 'Get notified when ROAS drops or spend exceeds budget',
      completed: hasAlerts,
      action: () => navigateInApp('/dashboard/settings'),
      actionLabel: 'Configure',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
        </svg>
      )
    }
  ];

  const completedCount = checklist.filter(item => item.completed).length;
  const totalCount = checklist.length;
  const progressPercent = (completedCount / totalCount) * 100;

  // Don't show if all items are complete or dismissed
  if (dismissed || completedCount === totalCount) {
    return null;
  }

  return (
    <div className="bg-gradient-to-r from-orange-500/10 to-red-500/10 border border-orange-500/20 rounded-xl p-6 mb-6">
      <div className="flex items-start justify-between mb-4">
        <div>
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <span className="text-2xl">🚀</span>
            Getting Started
          </h2>
          <p className="text-white/60 text-sm mt-1">
            Complete these steps to get the most out of AdWyse
          </p>
        </div>
        <button
          onClick={handleDismiss}
          className="text-white/40 hover:text-white/60 transition"
          title="Dismiss"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Progress Bar */}
      <div className="mb-6">
        <div className="flex items-center justify-between text-sm mb-2">
          <span className="text-white/60">{completedCount} of {totalCount} completed</span>
          <span className="text-orange-400 font-medium">{Math.round(progressPercent)}%</span>
        </div>
        <div className="h-2 bg-white/10 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-orange-500 to-red-500 rounded-full transition-all duration-500"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      {/* Checklist Items */}
      <div className="space-y-3">
        {checklist.map((item) => (
          <div
            key={item.id}
            className={`flex items-center gap-4 p-3 rounded-lg transition ${
              item.completed
                ? 'bg-green-500/10 border border-green-500/20'
                : 'bg-white/5 border border-white/10 hover:bg-white/10'
            }`}
          >
            {/* Checkbox */}
            <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
              item.completed
                ? 'bg-green-500 text-white'
                : 'bg-white/10 text-white/40'
            }`}>
              {item.completed ? (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              ) : (
                item.icon
              )}
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <h3 className={`font-medium ${item.completed ? 'text-green-400' : 'text-white'}`}>
                {item.title}
              </h3>
              <p className="text-white/50 text-sm truncate">{item.description}</p>
            </div>

            {/* Action Button */}
            {!item.completed && item.id !== 'attribution' && (
              <button
                onClick={item.action}
                className="flex-shrink-0 px-4 py-1.5 bg-orange-600 hover:bg-orange-700 text-white text-sm font-medium rounded-lg transition"
              >
                {item.actionLabel}
              </button>
            )}
            {!item.completed && item.id === 'attribution' && (
              <span className="flex-shrink-0 px-4 py-1.5 bg-white/10 text-white/50 text-sm font-medium rounded-lg">
                {item.actionLabel}
              </span>
            )}
            {item.completed && (
              <span className="flex-shrink-0 text-green-400 text-sm font-medium">
                Done!
              </span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

export default GettingStarted;
