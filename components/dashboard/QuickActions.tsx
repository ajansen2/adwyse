'use client';

import { useState, useEffect, useCallback } from 'react';
import { navigateInApp } from '@/lib/shopify-app-bridge';

interface QuickAction {
  id: string;
  label: string;
  description: string;
  icon: React.ReactNode;
  shortcut?: string;
  action: () => void;
  category: 'navigation' | 'action' | 'report';
}

interface QuickActionsProps {
  storeId?: string;
}

export function QuickActions({ storeId }: QuickActionsProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);

  const actions: QuickAction[] = [
    // Navigation
    {
      id: 'dashboard',
      label: 'Go to Dashboard',
      description: 'View main dashboard',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
        </svg>
      ),
      shortcut: 'D',
      action: () => navigateInApp('/dashboard'),
      category: 'navigation',
    },
    {
      id: 'orders',
      label: 'View Orders',
      description: 'See all attributed orders',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
        </svg>
      ),
      shortcut: 'O',
      action: () => navigateInApp('/dashboard/orders'),
      category: 'navigation',
    },
    {
      id: 'campaigns',
      label: 'View Campaigns',
      description: 'See campaign performance',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
      ),
      shortcut: 'C',
      action: () => navigateInApp('/dashboard/campaigns'),
      category: 'navigation',
    },
    {
      id: 'compare',
      label: 'Compare Campaigns',
      description: 'Side-by-side campaign comparison',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
        </svg>
      ),
      action: () => navigateInApp('/dashboard/campaigns/compare'),
      category: 'navigation',
    },
    {
      id: 'profit',
      label: 'Profit Tracking',
      description: 'View profit margins and COGS',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      shortcut: 'P',
      action: () => navigateInApp('/dashboard/profit'),
      category: 'navigation',
    },
    {
      id: 'ltv',
      label: 'Customer LTV',
      description: 'Customer lifetime value analysis',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
      ),
      shortcut: 'L',
      action: () => navigateInApp('/dashboard/ltv'),
      category: 'navigation',
    },
    {
      id: 'cohorts',
      label: 'Cohort Retention',
      description: 'See repurchase rates by acquisition month',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
        </svg>
      ),
      action: () => navigateInApp('/dashboard/cohorts'),
      category: 'navigation' as const,
    },
    {
      id: 'creative-score',
      label: 'Creative Score',
      description: 'AI-ranked creatives 0-100',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.539-1.118l1.519-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
        </svg>
      ),
      action: () => navigateInApp('/dashboard/creatives/score'),
      category: 'navigation' as const,
    },
    {
      id: 'competitors',
      label: 'Competitor Spy',
      description: 'Track competitor ads',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
        </svg>
      ),
      action: () => navigateInApp('/dashboard/competitor-spy'),
      category: 'navigation',
    },
    {
      id: 'settings',
      label: 'Settings',
      description: 'App settings and integrations',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      ),
      shortcut: 'S',
      action: () => navigateInApp('/dashboard/settings'),
      category: 'navigation',
    },
    // Actions
    {
      id: 'connect-facebook',
      label: 'Connect Facebook Ads',
      description: 'Link your Facebook ad account',
      icon: (
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
          <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
        </svg>
      ),
      action: () => navigateInApp('/dashboard/settings?tab=integrations'),
      category: 'action',
    },
    {
      id: 'connect-google',
      label: 'Connect Google Ads',
      description: 'Link your Google ad account',
      icon: (
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
          <path d="M12.48 10.92v3.28h7.84c-.24 1.84-.853 3.187-1.787 4.133-1.147 1.147-2.933 2.4-6.053 2.4-4.827 0-8.6-3.893-8.6-8.72s3.773-8.72 8.6-8.72c2.6 0 4.507 1.027 5.907 2.347l2.307-2.307C18.747 1.44 16.133 0 12.48 0 5.867 0 .307 5.387.307 12s5.56 12 12.173 12c3.573 0 6.267-1.173 8.373-3.36 2.16-2.16 2.84-5.213 2.84-7.667 0-.76-.053-1.467-.173-2.053H12.48z"/>
        </svg>
      ),
      action: () => navigateInApp('/dashboard/settings?tab=integrations'),
      category: 'action',
    },
    {
      id: 'search-competitors',
      label: 'Search Meta Ad Library',
      description: 'Find competitor ads on Meta',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
      ),
      action: () => {
        const query = prompt('Enter competitor name to search:');
        if (query) {
          window.open(`https://www.facebook.com/ads/library/?active_status=active&ad_type=all&country=ALL&q=${encodeURIComponent(query)}&media_type=all`, '_blank');
        }
      },
      category: 'action',
    },
    // Reports
    {
      id: 'export-orders',
      label: 'Export Orders CSV',
      description: 'Download orders as spreadsheet',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      ),
      shortcut: 'E',
      action: () => navigateInApp('/dashboard/orders?export=true'),
      category: 'report',
    },
  ];

  const filteredActions = searchQuery
    ? actions.filter(
        (action) =>
          action.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
          action.description.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : actions;

  // Group by category
  const groupedActions = {
    navigation: filteredActions.filter((a) => a.category === 'navigation'),
    action: filteredActions.filter((a) => a.category === 'action'),
    report: filteredActions.filter((a) => a.category === 'report'),
  };

  // Keyboard handling
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      // Open with Cmd/Ctrl + K
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsOpen((prev) => !prev);
        return;
      }

      if (!isOpen) return;

      if (e.key === 'Escape') {
        setIsOpen(false);
        setSearchQuery('');
        return;
      }

      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex((prev) => Math.min(prev + 1, filteredActions.length - 1));
        return;
      }

      if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex((prev) => Math.max(prev - 1, 0));
        return;
      }

      if (e.key === 'Enter') {
        e.preventDefault();
        if (filteredActions[selectedIndex]) {
          filteredActions[selectedIndex].action();
          setIsOpen(false);
          setSearchQuery('');
        }
        return;
      }
    },
    [isOpen, filteredActions, selectedIndex]
  );

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  useEffect(() => {
    setSelectedIndex(0);
  }, [searchQuery]);

  const handleActionClick = (action: QuickAction) => {
    action.action();
    setIsOpen(false);
    setSearchQuery('');
  };

  return (
    <>
      {/* Floating Action Button */}
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-20 right-6 lg:bottom-6 z-40 w-14 h-14 bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-700 hover:to-amber-700 text-white rounded-full shadow-lg shadow-orange-500/30 flex items-center justify-center transition-all hover:scale-105"
        title="Quick Actions (Cmd+K)"
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
      </button>

      {/* Command Palette Modal */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-[15vh] px-4">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => {
              setIsOpen(false);
              setSearchQuery('');
            }}
          />

          {/* Modal */}
          <div className="relative w-full max-w-xl bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl overflow-hidden">
            {/* Search Input */}
            <div className="flex items-center gap-3 px-4 py-4 border-b border-zinc-800">
              <svg className="w-5 h-5 text-zinc-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search actions..."
                className="flex-1 bg-transparent text-white text-lg placeholder-zinc-500 outline-none"
                autoFocus
              />
              <kbd className="hidden sm:inline-flex items-center gap-1 px-2 py-1 text-xs text-zinc-500 bg-zinc-800 rounded">
                ESC
              </kbd>
            </div>

            {/* Actions List */}
            <div className="max-h-[50vh] overflow-y-auto py-2">
              {filteredActions.length === 0 ? (
                <div className="px-4 py-8 text-center text-zinc-500">
                  No actions found for "{searchQuery}"
                </div>
              ) : (
                <>
                  {groupedActions.navigation.length > 0 && (
                    <div>
                      <div className="px-4 py-2 text-xs font-semibold text-zinc-500 uppercase tracking-wider">
                        Navigation
                      </div>
                      {groupedActions.navigation.map((action, index) => {
                        const globalIndex = filteredActions.indexOf(action);
                        return (
                          <button
                            key={action.id}
                            onClick={() => handleActionClick(action)}
                            className={`w-full flex items-center gap-3 px-4 py-3 text-left transition ${
                              globalIndex === selectedIndex
                                ? 'bg-orange-600/20 text-white'
                                : 'text-zinc-300 hover:bg-zinc-800'
                            }`}
                          >
                            <span className={globalIndex === selectedIndex ? 'text-orange-400' : 'text-zinc-500'}>
                              {action.icon}
                            </span>
                            <div className="flex-1 min-w-0">
                              <div className="font-medium truncate">{action.label}</div>
                              <div className="text-sm text-zinc-500 truncate">{action.description}</div>
                            </div>
                            {action.shortcut && (
                              <kbd className="hidden sm:inline-flex px-2 py-1 text-xs text-zinc-500 bg-zinc-800 rounded">
                                {action.shortcut}
                              </kbd>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  )}

                  {groupedActions.action.length > 0 && (
                    <div>
                      <div className="px-4 py-2 text-xs font-semibold text-zinc-500 uppercase tracking-wider mt-2">
                        Actions
                      </div>
                      {groupedActions.action.map((action) => {
                        const globalIndex = filteredActions.indexOf(action);
                        return (
                          <button
                            key={action.id}
                            onClick={() => handleActionClick(action)}
                            className={`w-full flex items-center gap-3 px-4 py-3 text-left transition ${
                              globalIndex === selectedIndex
                                ? 'bg-orange-600/20 text-white'
                                : 'text-zinc-300 hover:bg-zinc-800'
                            }`}
                          >
                            <span className={globalIndex === selectedIndex ? 'text-orange-400' : 'text-zinc-500'}>
                              {action.icon}
                            </span>
                            <div className="flex-1 min-w-0">
                              <div className="font-medium truncate">{action.label}</div>
                              <div className="text-sm text-zinc-500 truncate">{action.description}</div>
                            </div>
                            {action.shortcut && (
                              <kbd className="hidden sm:inline-flex px-2 py-1 text-xs text-zinc-500 bg-zinc-800 rounded">
                                {action.shortcut}
                              </kbd>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  )}

                  {groupedActions.report.length > 0 && (
                    <div>
                      <div className="px-4 py-2 text-xs font-semibold text-zinc-500 uppercase tracking-wider mt-2">
                        Reports
                      </div>
                      {groupedActions.report.map((action) => {
                        const globalIndex = filteredActions.indexOf(action);
                        return (
                          <button
                            key={action.id}
                            onClick={() => handleActionClick(action)}
                            className={`w-full flex items-center gap-3 px-4 py-3 text-left transition ${
                              globalIndex === selectedIndex
                                ? 'bg-orange-600/20 text-white'
                                : 'text-zinc-300 hover:bg-zinc-800'
                            }`}
                          >
                            <span className={globalIndex === selectedIndex ? 'text-orange-400' : 'text-zinc-500'}>
                              {action.icon}
                            </span>
                            <div className="flex-1 min-w-0">
                              <div className="font-medium truncate">{action.label}</div>
                              <div className="text-sm text-zinc-500 truncate">{action.description}</div>
                            </div>
                            {action.shortcut && (
                              <kbd className="hidden sm:inline-flex px-2 py-1 text-xs text-zinc-500 bg-zinc-800 rounded">
                                {action.shortcut}
                              </kbd>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between px-4 py-3 border-t border-zinc-800 text-xs text-zinc-500">
              <div className="flex items-center gap-4">
                <span className="flex items-center gap-1">
                  <kbd className="px-1.5 py-0.5 bg-zinc-800 rounded">↑↓</kbd>
                  navigate
                </span>
                <span className="flex items-center gap-1">
                  <kbd className="px-1.5 py-0.5 bg-zinc-800 rounded">↵</kbd>
                  select
                </span>
              </div>
              <span className="flex items-center gap-1">
                <kbd className="px-1.5 py-0.5 bg-zinc-800 rounded">⌘</kbd>
                <kbd className="px-1.5 py-0.5 bg-zinc-800 rounded">K</kbd>
                toggle
              </span>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
