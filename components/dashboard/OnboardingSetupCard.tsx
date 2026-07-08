'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { authenticatedFetch } from '@/lib/shopify-app-bridge';

interface OnboardingStatus {
  hasConnectedAccounts: boolean;
  pixelActive: boolean;
  firstSyncComplete: boolean;
  syncInProgress: boolean;
  onboardingCompleted: boolean;
}

interface OnboardingSetupCardProps {
  storeId: string;
  onComplete: () => void;
  onConnectGoogle: () => void;
  onConnectMeta: () => void;
  onConnectTikTok: () => void;
}

export function OnboardingSetupCard({
  storeId,
  onComplete,
  onConnectGoogle,
  onConnectMeta,
  onConnectTikTok,
}: OnboardingSetupCardProps) {
  const [status, setStatus] = useState<OnboardingStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [completing, setCompleting] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchStatus = useCallback(async () => {
    try {
      const res = await authenticatedFetch(`/api/onboarding/status?store_id=${storeId}`);
      if (res.ok) {
        const data: OnboardingStatus = await res.json();
        setStatus(data);
        if (data.onboardingCompleted) {
          // All steps done — show success briefly then collapse
          setCompleting(true);
          if (intervalRef.current) {
            clearInterval(intervalRef.current);
            intervalRef.current = null;
          }
          setTimeout(() => onComplete(), 2500);
        }
      }
    } catch (e) {
      console.error('Failed to fetch onboarding status:', e);
    } finally {
      setLoading(false);
    }
  }, [storeId, onComplete]);

  useEffect(() => {
    fetchStatus();
    // Poll every 7 seconds while card is visible
    intervalRef.current = setInterval(fetchStatus, 7000);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [fetchStatus]);

  if (loading || !status) {
    return (
      <div className="bg-white/5 backdrop-blur border border-white/10 rounded-xl p-8 mb-6">
        <div className="flex items-center gap-3">
          <div className="w-5 h-5 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
          <span className="text-white/60">Checking setup status...</span>
        </div>
      </div>
    );
  }

  if (completing) {
    return (
      <div className="bg-gradient-to-r from-green-500/15 to-emerald-500/15 border-2 border-green-500/40 rounded-xl p-8 mb-6">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-green-500/20 rounded-full flex items-center justify-center flex-shrink-0">
            <svg className="w-7 h-7 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">Setup complete!</h2>
            <p className="text-green-300/80 text-sm mt-1">Your dashboard is ready. Data will start appearing shortly.</p>
          </div>
        </div>
      </div>
    );
  }

  const steps = [
    {
      key: 'connect',
      title: 'Connect an ad platform',
      done: status.hasConnectedAccounts,
      description: status.hasConnectedAccounts
        ? 'Ad platform connected'
        : 'Connect Google, Meta, or TikTok Ads to start tracking',
    },
    {
      key: 'pixel',
      title: 'Tracking active',
      done: status.pixelActive,
      description: status.pixelActive
        ? 'Tracking active — installed automatically'
        : 'Web Pixel activates automatically on install',
    },
    {
      key: 'sync',
      title: 'First sync complete',
      done: status.firstSyncComplete,
      description: status.firstSyncComplete
        ? 'Historical data synced'
        : status.syncInProgress
        ? 'Syncing your last 30 days — usually takes a few minutes'
        : status.hasConnectedAccounts
        ? 'Sync will start once your account connects'
        : 'Connect an ad platform to begin syncing',
    },
  ];

  const completedCount = steps.filter((s) => s.done).length;

  return (
    <div className="bg-white/5 backdrop-blur border border-white/10 rounded-xl p-6 mb-6">
      {/* Header */}
      <div className="mb-6">
        <h2 className="text-xl font-bold text-white">Set up AdWyse</h2>
        <p className="text-white/50 text-sm mt-1">
          Complete these steps to start seeing your ad performance data
        </p>
        {/* Progress */}
        <div className="mt-4">
          <div className="flex items-center justify-between text-sm mb-2">
            <span className="text-white/60">{completedCount} of {steps.length} completed</span>
          </div>
          <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
            <div
              className="h-full bg-orange-500 rounded-full transition-all duration-700"
              style={{ width: `${(completedCount / steps.length) * 100}%` }}
            />
          </div>
        </div>
      </div>

      {/* Steps */}
      <div className="space-y-4">
        {steps.map((step, idx) => (
          <div key={step.key}>
            <div className="flex items-start gap-4">
              {/* Step indicator */}
              <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center mt-0.5 ${
                step.done
                  ? 'bg-green-500 text-white'
                  : 'bg-white/10 text-white/40'
              }`}>
                {step.done ? (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                ) : (
                  <span className="text-sm font-semibold">{idx + 1}</span>
                )}
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <h3 className={`font-medium ${step.done ? 'text-green-400' : 'text-white'}`}>
                  {step.title}
                </h3>
                <p className="text-white/50 text-sm mt-0.5">
                  {step.description}
                  {step.key === 'sync' && status.syncInProgress && !step.done && (
                    <span className="inline-flex items-center gap-1.5 ml-2">
                      <span className="w-2 h-2 bg-orange-400 rounded-full animate-pulse" />
                    </span>
                  )}
                </p>

                {/* Connect buttons for step 1 */}
                {step.key === 'connect' && !step.done && (
                  <div className="flex flex-wrap gap-3 mt-3">
                    <button
                      onClick={onConnectGoogle}
                      className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 border border-white/15 rounded-lg text-white text-sm font-medium transition"
                    >
                      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
                        <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                        <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                        <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                      </svg>
                      Google Ads
                    </button>
                    <button
                      onClick={onConnectMeta}
                      className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 border border-white/15 rounded-lg text-white text-sm font-medium transition"
                    >
                      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="#1877F2">
                        <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                      </svg>
                      Meta Ads
                    </button>
                    <button
                      onClick={onConnectTikTok}
                      className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 border border-white/15 rounded-lg text-white text-sm font-medium transition"
                    >
                      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.88-2.88 2.89 2.89 0 012.88-2.88c.28 0 .55.04.81.11V9.03a6.37 6.37 0 00-.81-.05 6.3 6.3 0 00-6.3 6.3A6.3 6.3 0 009.49 21.6a6.3 6.3 0 006.3-6.3V9.41a8.16 8.16 0 004.78 1.53V7.51a4.82 4.82 0 01-.98-.82z"/>
                      </svg>
                      TikTok Ads
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default OnboardingSetupCard;
