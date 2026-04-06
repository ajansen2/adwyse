'use client';

import React from 'react';

// Platform badges
export type Platform = 'facebook' | 'google' | 'tiktok' | 'shopify' | 'organic' | 'email' | 'direct' | 'referral' | 'unknown';

// Status variants
export type Status = 'active' | 'paused' | 'ended' | 'draft' | 'pending' | 'error' | 'success' | 'warning';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'default' | 'success' | 'warning' | 'error' | 'info' | 'outline';
  size?: 'sm' | 'md' | 'lg';
  dot?: boolean;
  removable?: boolean;
  onRemove?: () => void;
  className?: string;
}

const variantClasses = {
  default: 'bg-gray-100 text-gray-700',
  success: 'bg-green-100 text-green-700',
  warning: 'bg-yellow-100 text-yellow-700',
  error: 'bg-red-100 text-red-700',
  info: 'bg-blue-100 text-blue-700',
  outline: 'bg-white border border-gray-300 text-gray-700'
};

const dotColors = {
  default: 'bg-gray-400',
  success: 'bg-green-500',
  warning: 'bg-yellow-500',
  error: 'bg-red-500',
  info: 'bg-blue-500',
  outline: 'bg-gray-400'
};

const sizeClasses = {
  sm: 'px-2 py-0.5 text-xs',
  md: 'px-2.5 py-1 text-xs',
  lg: 'px-3 py-1.5 text-sm'
};

export function Badge({
  children,
  variant = 'default',
  size = 'md',
  dot = false,
  removable = false,
  onRemove,
  className = ''
}: BadgeProps) {
  return (
    <span
      className={`
        inline-flex items-center gap-1.5 font-medium rounded-full
        ${variantClasses[variant]}
        ${sizeClasses[size]}
        ${className}
      `}
    >
      {dot && (
        <span className={`w-1.5 h-1.5 rounded-full ${dotColors[variant]}`} />
      )}
      {children}
      {removable && onRemove && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onRemove();
          }}
          className="ml-0.5 hover:bg-black/10 rounded-full p-0.5 -mr-1"
        >
          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      )}
    </span>
  );
}

// Platform-specific badge with icon
interface PlatformBadgeProps {
  platform: Platform;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
  className?: string;
}

const platformConfig: Record<Platform, { label: string; color: string; icon: React.ReactNode }> = {
  facebook: {
    label: 'Facebook',
    color: 'bg-[#1877F2]/10 text-[#1877F2]',
    icon: (
      <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor">
        <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
      </svg>
    )
  },
  google: {
    label: 'Google',
    color: 'bg-[#4285F4]/10 text-[#4285F4]',
    icon: (
      <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor">
        <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
        <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
        <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
        <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
      </svg>
    )
  },
  tiktok: {
    label: 'TikTok',
    color: 'bg-black/10 text-black',
    icon: (
      <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor">
        <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-5.2 1.74 2.89 2.89 0 012.31-4.64 2.93 2.93 0 01.88.13V9.4a6.84 6.84 0 00-1-.05A6.33 6.33 0 005 20.1a6.34 6.34 0 0010.86-4.43v-7a8.16 8.16 0 004.77 1.52v-3.4a4.85 4.85 0 01-1-.1z"/>
      </svg>
    )
  },
  shopify: {
    label: 'Shopify',
    color: 'bg-[#96BF48]/10 text-[#96BF48]',
    icon: (
      <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor">
        <path d="M15.34 4.62l-.74.23c-.08-.27-.2-.54-.34-.8-.47-.86-1.16-1.32-1.98-1.32h-.08c-.06-.08-.13-.14-.2-.2-.44-.37-.98-.53-1.58-.47-1.24.11-2.46 1.04-3.44 2.62a12.09 12.09 0 00-1.72 4.5l-1.98.62c-.59.18-.61.2-.69.76-.06.42-1.6 12.32-1.6 12.32l12.94 2.24V4.66l-.59-.04zm-3.16 1.42c-.7.22-1.46.45-2.22.69.39-1.5 1.14-2.98 2.05-3.95.34-.36.82-.76 1.4-1-.36.88-.67 2.13-.78 3.26a29.51 29.51 0 00-.45 1zm1.36-4.02c.47 0 .86.24 1.16.71.84 1.32 1.17 3.28 1.34 4.42l-2.98.92c.28-1.92.97-3.92 2.11-4.83a1.7 1.7 0 00-.63-1.22z"/>
      </svg>
    )
  },
  organic: {
    label: 'Organic',
    color: 'bg-green-100 text-green-700',
    icon: (
      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064" />
      </svg>
    )
  },
  email: {
    label: 'Email',
    color: 'bg-purple-100 text-purple-700',
    icon: (
      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
      </svg>
    )
  },
  direct: {
    label: 'Direct',
    color: 'bg-gray-100 text-gray-700',
    icon: (
      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122" />
      </svg>
    )
  },
  referral: {
    label: 'Referral',
    color: 'bg-orange-100 text-orange-700',
    icon: (
      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
      </svg>
    )
  },
  unknown: {
    label: 'Unknown',
    color: 'bg-gray-100 text-gray-500',
    icon: (
      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    )
  }
};

export function PlatformBadge({
  platform,
  size = 'md',
  showLabel = true,
  className = ''
}: PlatformBadgeProps) {
  const config = platformConfig[platform] || platformConfig.unknown;

  return (
    <span
      className={`
        inline-flex items-center gap-1.5 font-medium rounded-full
        ${config.color}
        ${sizeClasses[size]}
        ${className}
      `}
    >
      {config.icon}
      {showLabel && config.label}
    </span>
  );
}

// Status-specific badge
interface StatusBadgeProps {
  status: Status;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const statusConfig: Record<Status, { label: string; variant: BadgeProps['variant']; dot: boolean }> = {
  active: { label: 'Active', variant: 'success', dot: true },
  paused: { label: 'Paused', variant: 'warning', dot: true },
  ended: { label: 'Ended', variant: 'default', dot: true },
  draft: { label: 'Draft', variant: 'outline', dot: false },
  pending: { label: 'Pending', variant: 'warning', dot: true },
  error: { label: 'Error', variant: 'error', dot: true },
  success: { label: 'Success', variant: 'success', dot: false },
  warning: { label: 'Warning', variant: 'warning', dot: false }
};

export function StatusBadge({
  status,
  size = 'md',
  className = ''
}: StatusBadgeProps) {
  const config = statusConfig[status];

  return (
    <Badge
      variant={config.variant}
      size={size}
      dot={config.dot}
      className={className}
    >
      {config.label}
    </Badge>
  );
}

// Severity badge for alerts
export type Severity = 'low' | 'medium' | 'high' | 'critical';

interface SeverityBadgeProps {
  severity: Severity;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const severityConfig: Record<Severity, { label: string; variant: BadgeProps['variant'] }> = {
  low: { label: 'Low', variant: 'info' },
  medium: { label: 'Medium', variant: 'warning' },
  high: { label: 'High', variant: 'error' },
  critical: { label: 'Critical', variant: 'error' }
};

export function SeverityBadge({
  severity,
  size = 'md',
  className = ''
}: SeverityBadgeProps) {
  const config = severityConfig[severity];

  return (
    <Badge
      variant={config.variant}
      size={size}
      dot
      className={`${severity === 'critical' ? 'animate-pulse' : ''} ${className}`}
    >
      {config.label}
    </Badge>
  );
}

export default Badge;
