'use client';

import React from 'react';

interface SkeletonProps {
  className?: string;
  animate?: boolean;
  style?: React.CSSProperties;
}

export function Skeleton({ className = '', animate = true, style }: SkeletonProps) {
  return (
    <div
      className={`bg-gray-200 rounded ${animate ? 'animate-pulse' : ''} ${className}`}
      style={style}
    />
  );
}

// Pre-built skeleton layouts
export function MetricCardSkeleton() {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4">
      <div className="animate-pulse">
        <Skeleton className="h-4 w-24 mb-3" animate={false} />
        <Skeleton className="h-8 w-32 mb-2" animate={false} />
        <Skeleton className="h-3 w-20" animate={false} />
      </div>
    </div>
  );
}

export function TableRowSkeleton({ columns = 5 }: { columns?: number }) {
  return (
    <tr className="animate-pulse">
      {[...Array(columns)].map((_, i) => (
        <td key={i} className="px-4 py-3">
          <Skeleton className="h-4 w-full" animate={false} />
        </td>
      ))}
    </tr>
  );
}

export function TableSkeleton({ rows = 5, columns = 5 }: { rows?: number; columns?: number }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      <div className="p-4 border-b border-gray-200">
        <Skeleton className="h-10 w-64" />
      </div>
      <table className="w-full">
        <thead className="bg-gray-50">
          <tr>
            {[...Array(columns)].map((_, i) => (
              <th key={i} className="px-4 py-3">
                <Skeleton className="h-4 w-20" />
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200">
          {[...Array(rows)].map((_, i) => (
            <TableRowSkeleton key={i} columns={columns} />
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function ChartSkeleton({ height = 300 }: { height?: number }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4">
      <div className="animate-pulse">
        <div className="flex justify-between mb-4">
          <Skeleton className="h-5 w-32" animate={false} />
          <Skeleton className="h-5 w-24" animate={false} />
        </div>
        <Skeleton className="w-full rounded-lg" style={{ height }} animate={false} />
      </div>
    </div>
  );
}

export function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-10 w-32" />
      </div>

      {/* Metric cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <MetricCardSkeleton key={i} />
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ChartSkeleton />
        <ChartSkeleton />
      </div>

      {/* Table */}
      <TableSkeleton rows={5} columns={6} />
    </div>
  );
}

export function CardSkeleton() {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6 animate-pulse">
      <Skeleton className="h-6 w-1/3 mb-4" animate={false} />
      <Skeleton className="h-4 w-full mb-2" animate={false} />
      <Skeleton className="h-4 w-2/3 mb-4" animate={false} />
      <Skeleton className="h-10 w-24" animate={false} />
    </div>
  );
}

export function ListSkeleton({ items = 5 }: { items?: number }) {
  return (
    <div className="space-y-3 animate-pulse">
      {[...Array(items)].map((_, i) => (
        <div key={i} className="flex items-center gap-3">
          <Skeleton className="h-10 w-10 rounded-full" animate={false} />
          <div className="flex-1">
            <Skeleton className="h-4 w-3/4 mb-1" animate={false} />
            <Skeleton className="h-3 w-1/2" animate={false} />
          </div>
        </div>
      ))}
    </div>
  );
}

export default Skeleton;
