'use client';

import { useState, useCallback, createContext, useContext, ReactNode } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

interface NavItem {
  label: string;
  href: string;
  icon: ReactNode;
  badge?: string | number;
  children?: NavItem[];
}

interface DashboardLayoutProps {
  children: ReactNode;
  storeName?: string;
  storeUrl?: string;
  navigation: NavItem[];
  secondaryNavigation?: NavItem[];
  actions?: ReactNode;
  header?: ReactNode;
  footer?: ReactNode;
}

// Context for sidebar state
interface SidebarContextType {
  isOpen: boolean;
  isCollapsed: boolean;
  toggle: () => void;
  setCollapsed: (collapsed: boolean) => void;
}

const SidebarContext = createContext<SidebarContextType>({
  isOpen: false,
  isCollapsed: false,
  toggle: () => {},
  setCollapsed: () => {}
});

export const useSidebar = () => useContext(SidebarContext);

function NavLink({
  item,
  collapsed,
  depth = 0
}: {
  item: NavItem;
  collapsed: boolean;
  depth?: number;
}) {
  const pathname = usePathname();
  const isActive = pathname === item.href;
  const [isExpanded, setIsExpanded] = useState(false);
  const hasChildren = item.children && item.children.length > 0;

  const baseClasses = `
    flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium
    transition-all duration-200
    ${depth > 0 ? 'ml-4' : ''}
  `;

  const activeClasses = isActive
    ? 'bg-indigo-50 text-indigo-700'
    : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900';

  if (hasChildren) {
    return (
      <div>
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className={`${baseClasses} ${activeClasses} w-full justify-between`}
        >
          <span className="flex items-center gap-3">
            <span className="flex-shrink-0 w-5 h-5">{item.icon}</span>
            {!collapsed && <span>{item.label}</span>}
          </span>
          {!collapsed && (
            <svg
              className={`w-4 h-4 transition-transform ${isExpanded ? 'rotate-90' : ''}`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          )}
        </button>
        {isExpanded && !collapsed && (
          <div className="mt-1 space-y-1">
            {item.children!.map((child) => (
              <NavLink key={child.href} item={child} collapsed={collapsed} depth={depth + 1} />
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <Link href={item.href} className={`${baseClasses} ${activeClasses}`}>
      <span className="flex-shrink-0 w-5 h-5">{item.icon}</span>
      {!collapsed && (
        <>
          <span className="flex-1">{item.label}</span>
          {item.badge && (
            <span className="px-2 py-0.5 text-xs font-medium bg-indigo-100 text-indigo-700 rounded-full">
              {item.badge}
            </span>
          )}
        </>
      )}
      {collapsed && item.badge && (
        <span className="absolute -top-1 -right-1 w-2 h-2 bg-indigo-600 rounded-full" />
      )}
    </Link>
  );
}

export function DashboardLayout({
  children,
  storeName,
  storeUrl,
  navigation,
  secondaryNavigation,
  actions,
  header,
  footer
}: DashboardLayoutProps) {
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);

  const toggle = useCallback(() => setIsMobileOpen((prev) => !prev), []);

  const sidebarWidth = isCollapsed ? 'w-16' : 'w-64';

  return (
    <SidebarContext.Provider value={{ isOpen: isMobileOpen, isCollapsed, toggle, setCollapsed: setIsCollapsed }}>
      <div className="min-h-screen bg-gray-50">
        {/* Mobile sidebar backdrop */}
        {isMobileOpen && (
          <div
            className="fixed inset-0 bg-black/50 z-40 lg:hidden"
            onClick={() => setIsMobileOpen(false)}
          />
        )}

        {/* Sidebar */}
        <aside
          className={`
            fixed top-0 left-0 z-40 h-screen ${sidebarWidth}
            bg-white border-r border-gray-200
            transition-all duration-300 ease-in-out
            ${isMobileOpen ? 'translate-x-0' : '-translate-x-full'}
            lg:translate-x-0
          `}
        >
          <div className="flex flex-col h-full">
            {/* Logo / Store info */}
            <div className="flex items-center justify-between h-16 px-4 border-b border-gray-200">
              {!isCollapsed ? (
                <Link href="/dashboard" className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center">
                    <span className="text-white font-bold text-sm">A</span>
                  </div>
                  <span className="font-semibold text-gray-900">AdWyse</span>
                </Link>
              ) : (
                <Link href="/dashboard">
                  <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center mx-auto">
                    <span className="text-white font-bold text-sm">A</span>
                  </div>
                </Link>
              )}

              {/* Collapse button - desktop only */}
              <button
                onClick={() => setIsCollapsed(!isCollapsed)}
                className="hidden lg:flex p-1 rounded hover:bg-gray-100"
              >
                <svg
                  className={`w-5 h-5 text-gray-400 transition-transform ${isCollapsed ? 'rotate-180' : ''}`}
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
                </svg>
              </button>
            </div>

            {/* Store selector */}
            {storeName && !isCollapsed && (
              <div className="px-4 py-3 border-b border-gray-200">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center">
                    <svg className="w-4 h-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                    </svg>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{storeName}</p>
                    {storeUrl && (
                      <p className="text-xs text-gray-500 truncate">{storeUrl}</p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Navigation */}
            <nav className="flex-1 overflow-y-auto p-4 space-y-1">
              {navigation.map((item) => (
                <NavLink key={item.href} item={item} collapsed={isCollapsed} />
              ))}

              {secondaryNavigation && secondaryNavigation.length > 0 && (
                <>
                  <div className={`my-4 border-t border-gray-200 ${isCollapsed ? 'mx-2' : ''}`} />
                  {secondaryNavigation.map((item) => (
                    <NavLink key={item.href} item={item} collapsed={isCollapsed} />
                  ))}
                </>
              )}
            </nav>

            {/* Footer */}
            {footer && !isCollapsed && (
              <div className="p-4 border-t border-gray-200">
                {footer}
              </div>
            )}
          </div>
        </aside>

        {/* Main content */}
        <div className={`lg:pl-${isCollapsed ? '16' : '64'} transition-all duration-300`} style={{ paddingLeft: isCollapsed ? '4rem' : '16rem' }}>
          {/* Top header */}
          <header className="sticky top-0 z-30 bg-white border-b border-gray-200">
            <div className="flex items-center justify-between h-16 px-4 sm:px-6">
              {/* Mobile menu button */}
              <button
                onClick={toggle}
                className="lg:hidden p-2 -ml-2 rounded-lg text-gray-500 hover:bg-gray-100"
              >
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>

              {/* Custom header content or default */}
              <div className="flex-1 flex items-center">
                {header}
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2">
                {actions}

                {/* Command palette trigger */}
                <button className="hidden sm:flex items-center gap-2 px-3 py-1.5 text-sm text-gray-500 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                  <span>Search</span>
                  <kbd className="px-1.5 py-0.5 text-xs bg-white border border-gray-300 rounded">⌘K</kbd>
                </button>
              </div>
            </div>
          </header>

          {/* Page content */}
          <main className="p-4 sm:p-6 lg:p-8">
            {children}
          </main>
        </div>

        {/* Mobile bottom navigation */}
        <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 lg:hidden z-30">
          <div className="flex items-center justify-around h-16">
            {navigation.slice(0, 5).map((item) => {
              const pathname = usePathname();
              const isActive = pathname === item.href;

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex flex-col items-center gap-1 px-3 py-2 ${isActive ? 'text-indigo-600' : 'text-gray-500'}`}
                >
                  <span className="w-6 h-6">{item.icon}</span>
                  <span className="text-xs font-medium">{item.label}</span>
                </Link>
              );
            })}
          </div>
        </nav>

        {/* Spacer for mobile bottom nav */}
        <div className="h-16 lg:hidden" />
      </div>
    </SidebarContext.Provider>
  );
}

export default DashboardLayout;
