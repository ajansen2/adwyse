'use client';

import { useState, useEffect } from 'react';

export default function DashboardPage() {
  const [count, setCount] = useState(0);
  const [data, setData] = useState<string | null>(null);

  useEffect(() => {
    // Simple test - just set some data
    setData('Dashboard loaded successfully!');
  }, []);

  return (
    <div style={{ padding: '40px', backgroundColor: '#1a1a1a', minHeight: '100vh', color: 'white' }}>
      <h1 style={{ fontSize: '24px', marginBottom: '20px' }}>Dashboard Test Page</h1>

      <p style={{ marginBottom: '20px' }}>
        If you can see this, React is working.
      </p>

      <p style={{ marginBottom: '20px' }}>
        Data: {data || 'Loading...'}
      </p>

      <button
        onClick={() => setCount(c => c + 1)}
        style={{
          padding: '10px 20px',
          backgroundColor: '#f97316',
          color: 'white',
          border: 'none',
          borderRadius: '8px',
          cursor: 'pointer'
        }}
      >
        Count: {count}
      </button>
    </div>
  );
}
