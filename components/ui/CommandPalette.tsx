'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { navigateInApp } from '@/lib/shopify-app-bridge';

interface CommandItem {
  id: string;
  title: string;
  description?: string;
  icon?: React.ReactNode;
  shortcut?: string;
  action?: () => void;
  href?: string;
  group?: string;
}

interface CommandPaletteProps {
  commands?: CommandItem[];
  placeholder?: string;
  emptyMessage?: string;
  onClose?: () => void;
}

// Default navigation commands
const defaultCommands: CommandItem[] = [
  {
    id: 'dashboard',
    title: 'Go to Dashboard',
    shortcut: 'G D',
    group: 'Navigation',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
      </svg>
    ),
    href: '/dashboard',
  },
  {
    id: 'orders',
    title: 'Go to Orders',
    shortcut: 'G O',
    group: 'Navigation',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
      </svg>
    ),
    href: '/dashboard/orders',
  },
  {
    id: 'campaigns',
    title: 'Go to Campaigns',
    shortcut: 'G C',
    group: 'Navigation',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
      </svg>
    ),
    href: '/dashboard/campaigns',
  },
  {
    id: 'profit',
    title: 'Go to Profit',
    shortcut: 'G P',
    group: 'Navigation',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    href: '/dashboard/profit',
  },
  {
    id: 'attribution',
    title: 'Go to Attribution',
    shortcut: 'G A',
    group: 'Navigation',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
      </svg>
    ),
    href: '/dashboard/attribution',
  },
  {
    id: 'ltv',
    title: 'Go to Customer LTV',
    shortcut: 'G L',
    group: 'Navigation',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
      </svg>
    ),
    href: '/dashboard/ltv',
  },
  {
    id: 'creatives',
    title: 'Go to Creatives',
    group: 'Navigation',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
      </svg>
    ),
    href: '/dashboard/creatives',
  },
  {
    id: 'webhooks',
    title: 'Go to Webhooks',
    group: 'Navigation',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
      </svg>
    ),
    href: '/dashboard/webhooks',
  },
  {
    id: 'settings',
    title: 'Go to Settings',
    shortcut: 'G S',
    group: 'Navigation',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    ),
    href: '/dashboard/settings',
  },
  {
    id: 'refresh',
    title: 'Refresh Page',
    shortcut: 'R',
    group: 'Actions',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
      </svg>
    ),
    action: () => window.location.reload(),
  },
];

export function CommandPalette({
  commands = defaultCommands,
  placeholder = 'Search commands...',
  emptyMessage = 'No results found',
  onClose
}: CommandPaletteProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  // Filter commands based on query
  const filteredCommands = query === ''
    ? commands
    : commands.filter((command) =>
        command.title.toLowerCase().includes(query.toLowerCase()) ||
        command.description?.toLowerCase().includes(query.toLowerCase()) ||
        command.group?.toLowerCase().includes(query.toLowerCase())
      );

  // Group commands
  const groupedCommands = filteredCommands.reduce((groups, command) => {
    const group = command.group || 'Commands';
    if (!groups[group]) groups[group] = [];
    groups[group].push(command);
    return groups;
  }, {} as Record<string, CommandItem[]>);

  const flatFilteredCommands = filteredCommands;

  // Handle keyboard shortcuts to open/close
  // Use Cmd+/ (or Ctrl+/) to avoid conflict with Shopify's Cmd+K search
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === '/') {
        e.preventDefault();
        setIsOpen((prev) => !prev);
      }
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  // Focus input when opened
  useEffect(() => {
    if (isOpen) {
      inputRef.current?.focus();
      setQuery('');
      setSelectedIndex(0);
    } else {
      onClose?.();
    }
  }, [isOpen, onClose]);

  // Handle keyboard navigation
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex((prev) => (prev + 1) % flatFilteredCommands.length);
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex((prev) => (prev - 1 + flatFilteredCommands.length) % flatFilteredCommands.length);
        break;
      case 'Enter':
        e.preventDefault();
        const selectedCommand = flatFilteredCommands[selectedIndex];
        if (selectedCommand) {
          executeCommand(selectedCommand);
        }
        break;
    }
  }, [flatFilteredCommands, selectedIndex]);

  const executeCommand = (command: CommandItem) => {
    if (command.action) {
      command.action();
    } else if (command.href) {
      navigateInApp(command.href);
    }
    setIsOpen(false);
  };

  // Reset selected index when query changes
  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  // Scroll selected item into view
  useEffect(() => {
    if (listRef.current) {
      const selectedEl = listRef.current.querySelector(`[data-index="${selectedIndex}"]`);
      selectedEl?.scrollIntoView({ block: 'nearest' });
    }
  }, [selectedIndex]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto" role="dialog" aria-modal="true">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
        onClick={() => setIsOpen(false)}
      />

      {/* Dialog */}
      <div className="fixed inset-x-0 top-[15%] mx-auto max-w-xl px-4">
        <div className="bg-slate-900 rounded-xl shadow-2xl overflow-hidden border border-white/20">
          {/* Search input */}
          <div className="flex items-center gap-3 px-4 border-b border-white/10">
            <svg className="w-5 h-5 text-white/40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={placeholder}
              className="flex-1 py-4 text-white placeholder-white/40 bg-transparent focus:outline-none"
            />
            <kbd className="px-2 py-1 text-xs font-medium text-white/40 bg-white/10 rounded">ESC</kbd>
          </div>

          {/* Results */}
          <div ref={listRef} className="max-h-80 overflow-y-auto">
            {flatFilteredCommands.length === 0 ? (
              <div className="px-4 py-8 text-center text-sm text-white/40">
                {emptyMessage}
              </div>
            ) : (
              Object.entries(groupedCommands).map(([group, items]) => (
                <div key={group}>
                  <div className="px-4 py-2 text-xs font-medium text-white/40 uppercase tracking-wider bg-white/5">
                    {group}
                  </div>
                  <ul>
                    {items.map((command) => {
                      const globalIndex = flatFilteredCommands.findIndex((c) => c.id === command.id);
                      const isSelected = globalIndex === selectedIndex;

                      return (
                        <li key={command.id}>
                          <button
                            data-index={globalIndex}
                            className={`w-full flex items-center gap-3 px-4 py-3 text-left transition ${
                              isSelected
                                ? 'bg-orange-600/20 text-orange-300'
                                : 'text-white hover:bg-white/5'
                            }`}
                            onClick={() => executeCommand(command)}
                            onMouseEnter={() => setSelectedIndex(globalIndex)}
                          >
                            {command.icon && (
                              <span className={isSelected ? 'text-orange-400' : 'text-white/60'}>
                                {command.icon}
                              </span>
                            )}
                            <div className="flex-1 min-w-0">
                              <p className="font-medium">{command.title}</p>
                              {command.description && (
                                <p className="text-xs text-white/40 truncate">{command.description}</p>
                              )}
                            </div>
                            {command.shortcut && (
                              <kbd className="px-2 py-1 text-xs font-medium text-white/40 bg-white/10 rounded font-mono">
                                {command.shortcut}
                              </kbd>
                            )}
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              ))
            )}
          </div>

          {/* Footer */}
          <div className="px-4 py-3 bg-white/5 border-t border-white/10 flex items-center justify-between text-xs text-white/40">
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1">
                <kbd className="px-1.5 py-0.5 bg-white/10 rounded">
                  <svg className="w-3 h-3 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
                  </svg>
                </kbd>
                <kbd className="px-1.5 py-0.5 bg-white/10 rounded">
                  <svg className="w-3 h-3 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                  </svg>
                </kbd>
                navigate
              </span>
              <span className="flex items-center gap-1">
                <kbd className="px-1.5 py-0.5 bg-white/10 rounded text-[10px]">ENTER</kbd>
                select
              </span>
            </div>
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 bg-white/10 rounded text-[10px]">CMD</kbd>
              +
              <kbd className="px-1.5 py-0.5 bg-white/10 rounded text-[10px]">/</kbd>
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

// Hook for using the command palette
export function useCommandPalette() {
  const [isOpen, setIsOpen] = useState(false);

  const open = useCallback(() => setIsOpen(true), []);
  const close = useCallback(() => setIsOpen(false), []);
  const toggle = useCallback(() => setIsOpen((prev) => !prev), []);

  return { isOpen, open, close, toggle };
}

export default CommandPalette;
