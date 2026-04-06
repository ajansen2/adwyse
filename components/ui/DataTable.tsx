'use client';

import { useState, useMemo, useCallback } from 'react';

export interface Column<T> {
  key: string;
  header: string;
  accessor: (row: T) => React.ReactNode;
  sortable?: boolean;
  sortValue?: (row: T) => string | number | Date;
  exportValue?: (row: T) => string | number;  // Raw value for CSV export
  width?: string;
  align?: 'left' | 'center' | 'right';
  className?: string;
}

interface DataTableProps<T> {
  data: T[];
  columns: Column<T>[];
  keyExtractor: (row: T) => string;
  pageSize?: number;
  searchable?: boolean;
  searchPlaceholder?: string;
  searchKeys?: string[];
  searchFn?: (row: T, query: string) => boolean;
  exportable?: boolean;
  exportFilename?: string;
  emptyMessage?: string;
  loading?: boolean;
  stickyHeader?: boolean;
  striped?: boolean;
  hoverable?: boolean;
  compact?: boolean;
  className?: string;
  onRowClick?: (row: T) => void;
  variant?: 'light' | 'dark';
}

type SortDirection = 'asc' | 'desc';

export function DataTable<T>({
  data,
  columns,
  keyExtractor,
  pageSize = 20,
  searchable = true,
  searchPlaceholder = 'Search...',
  searchFn,
  exportable = true,
  exportFilename = 'export',
  emptyMessage = 'No data found',
  loading = false,
  stickyHeader = false,
  striped = true,
  hoverable = true,
  compact = false,
  className = '',
  onRowClick,
  variant = 'light'
}: DataTableProps<T>) {
  const isDark = variant === 'dark';
  const [searchQuery, setSearchQuery] = useState('');
  const [sortColumn, setSortColumn] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');
  const [currentPage, setCurrentPage] = useState(1);

  // Filter data based on search
  const filteredData = useMemo(() => {
    if (!searchQuery.trim()) return data;

    if (searchFn) {
      return data.filter(row => searchFn(row, searchQuery));
    }

    // Default search: stringify and search
    const query = searchQuery.toLowerCase();
    return data.filter(row => {
      const rowStr = JSON.stringify(row).toLowerCase();
      return rowStr.includes(query);
    });
  }, [data, searchQuery, searchFn]);

  // Sort data
  const sortedData = useMemo(() => {
    if (!sortColumn) return filteredData;

    const column = columns.find(c => c.key === sortColumn);
    if (!column || !column.sortable) return filteredData;

    const getSortValue = column.sortValue || column.accessor;

    return [...filteredData].sort((a, b) => {
      const aVal = getSortValue(a);
      const bVal = getSortValue(b);

      // Handle React nodes - convert to string, with null safety
      const aStr = aVal == null ? '' : typeof aVal === 'object' ? String(aVal) : aVal;
      const bStr = bVal == null ? '' : typeof bVal === 'object' ? String(bVal) : bVal;

      let comparison = 0;
      if (aStr < bStr) comparison = -1;
      if (aStr > bStr) comparison = 1;

      return sortDirection === 'desc' ? -comparison : comparison;
    });
  }, [filteredData, sortColumn, sortDirection, columns]);

  // Paginate data
  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return sortedData.slice(start, start + pageSize);
  }, [sortedData, currentPage, pageSize]);

  const totalPages = Math.ceil(sortedData.length / pageSize);

  // Handle sort click
  const handleSort = useCallback((columnKey: string) => {
    if (sortColumn === columnKey) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(columnKey);
      setSortDirection('asc');
    }
  }, [sortColumn]);

  // Export to CSV
  const exportCSV = useCallback(() => {
    const headers = columns.map(c => c.header);
    const rows = sortedData.map(row =>
      columns.map(col => {
        // Priority: exportValue > sortValue > accessor (stringified)
        if (col.exportValue) {
          return col.exportValue(row);
        }
        if (col.sortValue) {
          const val = col.sortValue(row);
          // Format dates nicely for export
          if (val instanceof Date) {
            return val.toISOString();
          }
          return val;
        }
        // Fallback to accessor - try to extract text content
        const val = col.accessor(row);
        if (typeof val === 'object' && val !== null) {
          // Can't reliably extract text from React nodes, return empty
          return '';
        }
        return String(val ?? '');
      })
    );

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `${exportFilename}_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  }, [columns, sortedData, exportFilename]);

  // Reset to first page when search changes
  useMemo(() => {
    setCurrentPage(1);
  }, [searchQuery]);

  const cellPadding = compact ? 'px-3 py-2' : 'px-4 py-3';

  if (loading) {
    return (
      <div className={`${isDark ? 'bg-transparent' : 'bg-white'} rounded-xl border ${isDark ? 'border-white/10' : 'border-gray-200'} overflow-hidden ${className}`}>
        <div className={`p-4 border-b ${isDark ? 'border-white/10' : 'border-gray-200'}`}>
          <div className={`animate-pulse h-10 ${isDark ? 'bg-white/10' : 'bg-gray-200'} rounded w-64`}></div>
        </div>
        <div className="p-4 space-y-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className={`animate-pulse h-12 ${isDark ? 'bg-white/5' : 'bg-gray-100'} rounded`}></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className={`${isDark ? 'bg-transparent' : 'bg-white'} rounded-xl border ${isDark ? 'border-white/10' : 'border-gray-200'} overflow-hidden ${className}`}>
      {/* Toolbar */}
      {(searchable || exportable) && (
        <div className={`p-4 border-b ${isDark ? 'border-white/10' : 'border-gray-200'} flex items-center justify-between gap-4`}>
          {searchable && (
            <div className="relative flex-1 max-w-md">
              <svg
                className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 ${isDark ? 'text-white/40' : 'text-gray-400'}`}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={searchPlaceholder}
                className={`w-full pl-10 pr-4 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent ${
                  isDark
                    ? 'bg-white/5 border-white/20 text-white placeholder-white/40'
                    : 'border-gray-200 text-gray-900 placeholder-gray-400'
                }`}
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className={`absolute right-3 top-1/2 -translate-y-1/2 ${isDark ? 'text-white/40 hover:text-white/60' : 'text-gray-400 hover:text-gray-600'}`}
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>
          )}

          <div className="flex items-center gap-2">
            <span className={`text-sm ${isDark ? 'text-white/50' : 'text-gray-500'}`}>
              {sortedData.length} {sortedData.length === 1 ? 'item' : 'items'}
            </span>
            {exportable && sortedData.length > 0 && (
              <button
                onClick={exportCSV}
                className={`flex items-center gap-1 px-3 py-1.5 text-sm border rounded-lg transition-colors ${
                  isDark
                    ? 'text-white/70 hover:text-white border-white/20 hover:bg-white/10'
                    : 'text-gray-600 hover:text-gray-900 border-gray-200 hover:bg-gray-50'
                }`}
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                Export CSV
              </button>
            )}
          </div>
        </div>
      )}

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className={`${isDark ? 'bg-white/5' : 'bg-gray-50'} ${stickyHeader ? 'sticky top-0 z-10' : ''}`}>
            <tr>
              {columns.map((column) => (
                <th
                  key={column.key}
                  className={`
                    ${cellPadding} text-left text-xs font-medium uppercase tracking-wider
                    ${isDark ? 'text-white/50' : 'text-gray-500'}
                    ${column.sortable ? `cursor-pointer select-none ${isDark ? 'hover:bg-white/10' : 'hover:bg-gray-100'}` : ''}
                    ${column.align === 'center' ? 'text-center' : column.align === 'right' ? 'text-right' : ''}
                    ${column.className || ''}
                  `}
                  style={{ width: column.width }}
                  onClick={() => column.sortable && handleSort(column.key)}
                >
                  <div className="flex items-center gap-1">
                    <span>{column.header}</span>
                    {column.sortable && (
                      <span className={isDark ? 'text-white/40' : 'text-gray-400'}>
                        {sortColumn === column.key ? (
                          sortDirection === 'asc' ? (
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                            </svg>
                          ) : (
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                            </svg>
                          )
                        ) : (
                          <svg className="w-4 h-4 opacity-0 group-hover:opacity-100" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
                          </svg>
                        )}
                      </span>
                    )}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className={`divide-y ${isDark ? 'divide-white/10' : 'divide-gray-200'}`}>
            {paginatedData.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className={`px-4 py-12 text-center ${isDark ? 'text-white/50' : 'text-gray-500'}`}>
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              paginatedData.map((row, index) => (
                <tr
                  key={keyExtractor(row)}
                  className={`
                    ${striped && index % 2 === 1 ? (isDark ? 'bg-white/5' : 'bg-gray-50') : ''}
                    ${hoverable ? (isDark ? 'hover:bg-white/10' : 'hover:bg-gray-100') : ''}
                    ${onRowClick ? 'cursor-pointer' : ''}
                    transition-colors
                  `}
                  onClick={() => onRowClick?.(row)}
                >
                  {columns.map((column) => (
                    <td
                      key={column.key}
                      className={`
                        ${cellPadding} text-sm ${isDark ? 'text-white' : 'text-gray-900'}
                        ${column.align === 'center' ? 'text-center' : column.align === 'right' ? 'text-right' : ''}
                        ${column.className || ''}
                      `}
                    >
                      {column.accessor(row)}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className={`px-4 py-3 border-t ${isDark ? 'border-white/10' : 'border-gray-200'} flex items-center justify-between`}>
          <div className={`text-sm ${isDark ? 'text-white/50' : 'text-gray-500'}`}>
            Showing {((currentPage - 1) * pageSize) + 1} to {Math.min(currentPage * pageSize, sortedData.length)} of {sortedData.length}
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setCurrentPage(1)}
              disabled={currentPage === 1}
              className={`p-1 rounded disabled:opacity-50 disabled:cursor-not-allowed ${isDark ? 'hover:bg-white/10 text-white' : 'hover:bg-gray-100'}`}
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
              </svg>
            </button>
            <button
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className={`p-1 rounded disabled:opacity-50 disabled:cursor-not-allowed ${isDark ? 'hover:bg-white/10 text-white' : 'hover:bg-gray-100'}`}
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>

            {/* Page numbers */}
            {[...Array(Math.min(5, totalPages))].map((_, i) => {
              let pageNum: number;
              if (totalPages <= 5) {
                pageNum = i + 1;
              } else if (currentPage <= 3) {
                pageNum = i + 1;
              } else if (currentPage >= totalPages - 2) {
                pageNum = totalPages - 4 + i;
              } else {
                pageNum = currentPage - 2 + i;
              }

              return (
                <button
                  key={pageNum}
                  onClick={() => setCurrentPage(pageNum)}
                  className={`
                    w-8 h-8 rounded text-sm font-medium
                    ${currentPage === pageNum
                      ? 'bg-orange-600 text-white'
                      : isDark ? 'text-white/70 hover:bg-white/10' : 'text-gray-600 hover:bg-gray-100'}
                  `}
                >
                  {pageNum}
                </button>
              );
            })}

            <button
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className={`p-1 rounded disabled:opacity-50 disabled:cursor-not-allowed ${isDark ? 'hover:bg-white/10 text-white' : 'hover:bg-gray-100'}`}
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
            <button
              onClick={() => setCurrentPage(totalPages)}
              disabled={currentPage === totalPages}
              className={`p-1 rounded disabled:opacity-50 disabled:cursor-not-allowed ${isDark ? 'hover:bg-white/10 text-white' : 'hover:bg-gray-100'}`}
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 5l7 7-7 7M5 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default DataTable;
