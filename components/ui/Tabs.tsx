'use client';

import { useState, createContext, useContext, ReactNode } from 'react';

interface Tab {
  id: string;
  label: string;
  icon?: ReactNode;
  badge?: string | number;
  disabled?: boolean;
}

interface TabsContextType {
  activeTab: string;
  setActiveTab: (id: string) => void;
}

const TabsContext = createContext<TabsContextType>({
  activeTab: '',
  setActiveTab: () => {}
});

interface TabsProps {
  tabs: Tab[];
  defaultTab?: string;
  onChange?: (tabId: string) => void;
  variant?: 'underline' | 'pills' | 'boxed';
  size?: 'sm' | 'md' | 'lg';
  fullWidth?: boolean;
  className?: string;
  children: ReactNode;
}

export function Tabs({
  tabs,
  defaultTab,
  onChange,
  variant = 'underline',
  size = 'md',
  fullWidth = false,
  className = '',
  children
}: TabsProps) {
  const [activeTab, setActiveTab] = useState(defaultTab || tabs[0]?.id || '');

  const handleTabChange = (tabId: string) => {
    setActiveTab(tabId);
    onChange?.(tabId);
  };

  const sizeClasses = {
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-base'
  };

  const variantClasses = {
    underline: {
      container: 'border-b border-gray-200',
      tab: (isActive: boolean) =>
        `px-4 py-2 font-medium border-b-2 -mb-px transition-colors ${
          isActive
            ? 'border-indigo-600 text-indigo-600'
            : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
        }`,
      disabled: 'text-gray-300 cursor-not-allowed'
    },
    pills: {
      container: 'bg-gray-100 rounded-lg p-1',
      tab: (isActive: boolean) =>
        `px-4 py-2 font-medium rounded-md transition-colors ${
          isActive
            ? 'bg-white text-gray-900 shadow-sm'
            : 'text-gray-500 hover:text-gray-700'
        }`,
      disabled: 'text-gray-300 cursor-not-allowed'
    },
    boxed: {
      container: 'border border-gray-200 rounded-lg p-1',
      tab: (isActive: boolean) =>
        `px-4 py-2 font-medium rounded-md transition-colors ${
          isActive
            ? 'bg-indigo-600 text-white'
            : 'text-gray-600 hover:bg-gray-100'
        }`,
      disabled: 'text-gray-300 cursor-not-allowed'
    }
  };

  const styles = variantClasses[variant];

  return (
    <TabsContext.Provider value={{ activeTab, setActiveTab: handleTabChange }}>
      <div className={className}>
        {/* Tab list */}
        <div className={`flex ${fullWidth ? '' : 'inline-flex'} ${styles.container}`}>
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => !tab.disabled && handleTabChange(tab.id)}
              disabled={tab.disabled}
              className={`
                ${fullWidth ? 'flex-1' : ''}
                ${sizeClasses[size]}
                ${tab.disabled ? styles.disabled : styles.tab(activeTab === tab.id)}
                flex items-center justify-center gap-2
              `}
            >
              {tab.icon && <span className="w-4 h-4">{tab.icon}</span>}
              {tab.label}
              {tab.badge && (
                <span className={`
                  px-1.5 py-0.5 text-xs font-medium rounded-full
                  ${activeTab === tab.id ? 'bg-indigo-100 text-indigo-600' : 'bg-gray-200 text-gray-600'}
                `}>
                  {tab.badge}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Tab panels */}
        <div className="mt-4">
          {children}
        </div>
      </div>
    </TabsContext.Provider>
  );
}

interface TabPanelProps {
  id: string;
  children: ReactNode;
  className?: string;
}

export function TabPanel({ id, children, className = '' }: TabPanelProps) {
  const { activeTab } = useContext(TabsContext);

  if (activeTab !== id) return null;

  return <div className={className}>{children}</div>;
}

export default Tabs;
