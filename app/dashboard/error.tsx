'use client';

import { useEffect } from 'react';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error to console with full details
    console.error('Dashboard Error Boundary caught:', error);
    console.error('Error name:', error.name);
    console.error('Error message:', error.message);
    console.error('Error stack:', error.stack);
  }, [error]);

  return (
    <div style={{ padding: '40px', fontFamily: 'monospace', maxWidth: '800px', margin: '0 auto' }}>
      <h1 style={{ color: '#dc2626', marginBottom: '20px' }}>Dashboard Error</h1>

      <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '8px', padding: '20px', marginBottom: '20px' }}>
        <h2 style={{ color: '#991b1b', fontSize: '16px', marginBottom: '10px' }}>Error Details:</h2>
        <p style={{ color: '#7f1d1d', marginBottom: '10px' }}>
          <strong>Name:</strong> {error.name}
        </p>
        <p style={{ color: '#7f1d1d', marginBottom: '10px' }}>
          <strong>Message:</strong> {error.message}
        </p>
        {error.digest && (
          <p style={{ color: '#7f1d1d', marginBottom: '10px' }}>
            <strong>Digest:</strong> {error.digest}
          </p>
        )}
      </div>

      <div style={{ background: '#f3f4f6', border: '1px solid #d1d5db', borderRadius: '8px', padding: '20px', marginBottom: '20px' }}>
        <h2 style={{ fontSize: '14px', marginBottom: '10px', color: '#374151' }}>Stack Trace:</h2>
        <pre style={{
          whiteSpace: 'pre-wrap',
          wordBreak: 'break-word',
          fontSize: '12px',
          color: '#4b5563',
          background: '#e5e7eb',
          padding: '15px',
          borderRadius: '4px',
          overflow: 'auto',
          maxHeight: '300px'
        }}>
          {error.stack || 'No stack trace available'}
        </pre>
      </div>

      <button
        onClick={() => reset()}
        style={{
          background: '#2563eb',
          color: 'white',
          padding: '12px 24px',
          borderRadius: '6px',
          border: 'none',
          cursor: 'pointer',
          fontSize: '14px',
          fontWeight: '500'
        }}
      >
        Try Again
      </button>

      <p style={{ marginTop: '20px', color: '#6b7280', fontSize: '12px' }}>
        Check the browser console (F12 → Console) for more details.
      </p>
    </div>
  );
}
