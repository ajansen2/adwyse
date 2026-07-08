'use client';

import React from 'react';

interface ErrorStateProps {
  message: string;
  onRetry?: () => void;
  suggestion?: string;
  className?: string;
}

export function ErrorState({
  message,
  onRetry,
  suggestion,
  className = ''
}: ErrorStateProps) {
  return (
    <div className={`flex flex-col items-center justify-center text-center py-12 px-6 ${className}`}>
      <div className="w-12 h-12 text-red-400/60 mb-4">
        <svg className="w-full h-full" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
      </div>

      <p className="text-white/80 text-sm max-w-sm">
        {message}
        {suggestion && (
          <span className="text-white/50"> {suggestion}</span>
        )}
      </p>

      {onRetry && (
        <button
          onClick={onRetry}
          className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-sm bg-white/10 hover:bg-white/20 border border-white/10 text-white transition-colors duration-200"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          Retry
        </button>
      )}
    </div>
  );
}

export default ErrorState;
