'use client';

import { useState, useEffect } from 'react';

interface Alert {
  id: string;
  type: string;
  title: string;
  message: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  is_read: boolean;
  created_at: string;
  data?: any;
}

interface AlertsWidgetProps {
  storeId: string;
}

export function AlertsWidget({ storeId }: AlertsWidgetProps) {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    if (!storeId) return;

    const fetchAlerts = () => {
      const xhr = new XMLHttpRequest();
      xhr.open('GET', `/api/alerts?store_id=${storeId}`, false);
      xhr.send();

      if (xhr.status === 200) {
        const data = JSON.parse(xhr.responseText);
        setAlerts(data.alerts || []);
      }
      setLoading(false);
    };

    fetchAlerts();
    // Refresh alerts every 5 minutes
    const interval = setInterval(fetchAlerts, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [storeId]);

  const markAsRead = async (alertIds: string[]) => {
    try {
      const xhr = new XMLHttpRequest();
      xhr.open('POST', '/api/alerts', true);
      xhr.setRequestHeader('Content-Type', 'application/json');
      xhr.send(JSON.stringify({ alertIds }));

      // Update local state
      setAlerts(prev => prev.map(alert =>
        alertIds.includes(alert.id) ? { ...alert, is_read: true } : alert
      ));
    } catch (error) {
      console.error('Error marking alerts read:', error);
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'border-red-500 bg-red-500/10';
      case 'high': return 'border-orange-500 bg-orange-500/10';
      case 'medium': return 'border-yellow-500 bg-yellow-500/10';
      default: return 'border-blue-500 bg-blue-500/10';
    }
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'critical':
        return (
          <svg className="w-5 h-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        );
      case 'high':
        return (
          <svg className="w-5 h-5 text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
      case 'medium':
        return (
          <svg className="w-5 h-5 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
      default:
        return (
          <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'roas_low': return 'Low ROAS';
      case 'spend_high': return 'High Spend';
      case 'budget_pacing': return 'Budget Alert';
      case 'creative_fatigue': return 'Creative Fatigue';
      case 'conversion_drop': return 'Conversion Drop';
      default: return type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
    }
  };

  const unreadAlerts = alerts.filter(a => !a.is_read);
  const displayedAlerts = expanded ? alerts : alerts.slice(0, 3);

  if (loading) {
    return (
      <div className="bg-zinc-900/50 backdrop-blur border border-zinc-800 rounded-xl p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 bg-zinc-800 rounded-lg animate-pulse"></div>
          <div className="h-6 w-32 bg-zinc-800 rounded animate-pulse"></div>
        </div>
        <div className="space-y-3">
          {[1, 2].map(i => (
            <div key={i} className="h-20 bg-zinc-800 rounded-lg animate-pulse"></div>
          ))}
        </div>
      </div>
    );
  }

  if (alerts.length === 0) {
    return (
      <div className="bg-zinc-900/50 backdrop-blur border border-zinc-800 rounded-xl p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 bg-green-600/20 rounded-lg flex items-center justify-center">
            <svg className="w-6 h-6 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">Alerts</h2>
            <p className="text-white/60 text-sm">All systems running smoothly</p>
          </div>
        </div>
        <div className="text-center py-8 text-white/40">
          <svg className="w-12 h-12 mx-auto mb-3 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
          </svg>
          <p>No alerts at this time</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-zinc-900/50 backdrop-blur border border-zinc-800 rounded-xl p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-orange-600/20 rounded-lg flex items-center justify-center relative">
            <svg className="w-6 h-6 text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
            </svg>
            {unreadAlerts.length > 0 && (
              <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center">
                {unreadAlerts.length}
              </span>
            )}
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">Alerts</h2>
            <p className="text-white/60 text-sm">{alerts.length} alert{alerts.length !== 1 ? 's' : ''}</p>
          </div>
        </div>
        {unreadAlerts.length > 0 && (
          <button
            onClick={() => markAsRead(unreadAlerts.map(a => a.id))}
            className="text-sm text-orange-400 hover:text-orange-300 font-medium transition"
          >
            Mark all read
          </button>
        )}
      </div>

      <div className="space-y-3">
        {displayedAlerts.map((alert) => (
          <div
            key={alert.id}
            className={`p-4 rounded-lg border ${getSeverityColor(alert.severity)} ${!alert.is_read ? 'ring-1 ring-white/10' : 'opacity-75'}`}
          >
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 mt-0.5">
                {getSeverityIcon(alert.severity)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-white font-medium">{alert.title}</span>
                  <span className="px-2 py-0.5 text-xs bg-white/10 text-white/60 rounded-full">
                    {getTypeLabel(alert.type)}
                  </span>
                  {!alert.is_read && (
                    <span className="w-2 h-2 bg-orange-500 rounded-full"></span>
                  )}
                </div>
                <p className="text-white/60 text-sm">{alert.message}</p>
                <div className="flex items-center justify-between mt-2">
                  <span className="text-white/40 text-xs">
                    {new Date(alert.created_at).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      hour: 'numeric',
                      minute: '2-digit'
                    })}
                  </span>
                  {!alert.is_read && (
                    <button
                      onClick={() => markAsRead([alert.id])}
                      className="text-xs text-white/40 hover:text-white/60 transition"
                    >
                      Dismiss
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {alerts.length > 3 && (
        <button
          onClick={() => setExpanded(!expanded)}
          className="w-full mt-4 py-2 text-center text-orange-400 hover:text-orange-300 text-sm font-medium transition"
        >
          {expanded ? 'Show less' : `Show ${alerts.length - 3} more alert${alerts.length - 3 !== 1 ? 's' : ''}`}
        </button>
      )}
    </div>
  );
}

export default AlertsWidget;
