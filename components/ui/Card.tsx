'use client';

import { ReactNode } from 'react';

interface CardProps {
  children: ReactNode;
  title?: string;
  description?: string;
  actions?: ReactNode;
  footer?: ReactNode;
  padding?: 'none' | 'sm' | 'md' | 'lg';
  hoverable?: boolean;
  clickable?: boolean;
  onClick?: () => void;
  className?: string;
}

const paddingClasses = {
  none: '',
  sm: 'p-3',
  md: 'p-4',
  lg: 'p-6'
};

export function Card({
  children,
  title,
  description,
  actions,
  footer,
  padding = 'md',
  hoverable = false,
  clickable = false,
  onClick,
  className = ''
}: CardProps) {
  const hasHeader = title || description || actions;

  return (
    <div
      className={`
        bg-white rounded-xl border border-gray-200
        ${hoverable || clickable ? 'transition-all duration-200 hover:border-gray-300 hover:shadow-md' : ''}
        ${clickable ? 'cursor-pointer' : ''}
        ${className}
      `}
      onClick={clickable ? onClick : undefined}
    >
      {hasHeader && (
        <div className={`flex items-start justify-between ${padding !== 'none' ? paddingClasses[padding] : 'p-4'} border-b border-gray-200`}>
          <div>
            {title && <h3 className="font-semibold text-gray-900">{title}</h3>}
            {description && <p className="mt-1 text-sm text-gray-500">{description}</p>}
          </div>
          {actions && <div className="flex items-center gap-2 ml-4">{actions}</div>}
        </div>
      )}

      <div className={padding !== 'none' ? paddingClasses[padding] : ''}>
        {children}
      </div>

      {footer && (
        <div className={`${padding !== 'none' ? paddingClasses[padding] : 'p-4'} border-t border-gray-200 bg-gray-50 rounded-b-xl`}>
          {footer}
        </div>
      )}
    </div>
  );
}

// Stat Card - for metrics/KPIs
interface StatCardProps {
  label: string;
  value: string | number;
  change?: {
    value: number;
    type: 'increase' | 'decrease' | 'neutral';
  };
  icon?: ReactNode;
  trend?: ReactNode;
  className?: string;
}

export function StatCard({
  label,
  value,
  change,
  icon,
  trend,
  className = ''
}: StatCardProps) {
  const changeColors = {
    increase: 'text-green-600',
    decrease: 'text-red-600',
    neutral: 'text-gray-500'
  };

  return (
    <Card padding="md" className={className}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-gray-500">{label}</p>
          <p className="mt-1 text-2xl font-bold text-gray-900">{value}</p>
          {change && (
            <div className={`flex items-center gap-1 mt-1 text-sm ${changeColors[change.type]}`}>
              {change.type === 'increase' && (
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                </svg>
              )}
              {change.type === 'decrease' && (
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              )}
              <span>{Math.abs(change.value)}%</span>
            </div>
          )}
        </div>
        {icon && (
          <div className="p-2 bg-indigo-50 rounded-lg text-indigo-600">
            {icon}
          </div>
        )}
      </div>
      {trend && <div className="mt-4">{trend}</div>}
    </Card>
  );
}

// Feature Card - for feature highlights
interface FeatureCardProps {
  icon: ReactNode;
  title: string;
  description: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  className?: string;
}

export function FeatureCard({
  icon,
  title,
  description,
  action,
  className = ''
}: FeatureCardProps) {
  return (
    <Card padding="lg" className={className}>
      <div className="flex items-center justify-center w-12 h-12 bg-indigo-100 rounded-lg text-indigo-600 mb-4">
        {icon}
      </div>
      <h3 className="font-semibold text-gray-900">{title}</h3>
      <p className="mt-2 text-sm text-gray-500">{description}</p>
      {action && (
        <button
          onClick={action.onClick}
          className="mt-4 text-sm font-medium text-indigo-600 hover:text-indigo-500"
        >
          {action.label} &rarr;
        </button>
      )}
    </Card>
  );
}

// Alert Card - for important messages
type AlertVariant = 'info' | 'success' | 'warning' | 'error';

interface AlertCardProps {
  variant: AlertVariant;
  title: string;
  message?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  dismissible?: boolean;
  onDismiss?: () => void;
  className?: string;
}

const alertVariants: Record<AlertVariant, { bg: string; border: string; icon: string; iconPath: ReactNode }> = {
  info: {
    bg: 'bg-blue-50',
    border: 'border-blue-200',
    icon: 'text-blue-500',
    iconPath: (
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    )
  },
  success: {
    bg: 'bg-green-50',
    border: 'border-green-200',
    icon: 'text-green-500',
    iconPath: (
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
    )
  },
  warning: {
    bg: 'bg-yellow-50',
    border: 'border-yellow-200',
    icon: 'text-yellow-500',
    iconPath: (
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
    )
  },
  error: {
    bg: 'bg-red-50',
    border: 'border-red-200',
    icon: 'text-red-500',
    iconPath: (
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
    )
  }
};

export function AlertCard({
  variant,
  title,
  message,
  action,
  dismissible = false,
  onDismiss,
  className = ''
}: AlertCardProps) {
  const styles = alertVariants[variant];

  return (
    <div className={`rounded-lg border ${styles.bg} ${styles.border} p-4 ${className}`}>
      <div className="flex">
        <div className={`flex-shrink-0 ${styles.icon}`}>
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            {styles.iconPath}
          </svg>
        </div>
        <div className="ml-3 flex-1">
          <h3 className="text-sm font-medium text-gray-900">{title}</h3>
          {message && <p className="mt-1 text-sm text-gray-600">{message}</p>}
          {action && (
            <button
              onClick={action.onClick}
              className="mt-2 text-sm font-medium text-indigo-600 hover:text-indigo-500"
            >
              {action.label}
            </button>
          )}
        </div>
        {dismissible && onDismiss && (
          <button
            onClick={onDismiss}
            className="flex-shrink-0 ml-4 text-gray-400 hover:text-gray-500"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>
    </div>
  );
}

export default Card;
