'use client';

import { useState, useEffect } from 'react';

interface Store {
  id: string;
  store_name: string;
  shopify_domain: string;
}

export default function DashboardPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [storeData, setStoreData] = useState<any>(null);
  const [debugInfo, setDebugInfo] = useState<string[]>([]);

  const addDebug = (msg: string) => {
    console.log(msg);
    setDebugInfo(prev => [...prev, msg]);
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Get shop from URL
        const urlParams = new URLSearchParams(window.location.search);
        const shop = urlParams.get('shop');

        addDebug(`Shop from URL: ${shop}`);

        if (!shop) {
          setError('No shop parameter');
          setLoading(false);
          return;
        }

        // Fetch store data
        addDebug('Fetching store data...');
        const response = await fetch(`/api/stores/lookup?shop=${encodeURIComponent(shop)}`);
        const data = await response.json();

        addDebug(`Response status: ${response.status}`);
        addDebug(`Data type: ${typeof data}`);
        addDebug(`Data keys: ${Object.keys(data).join(', ')}`);

        if (data.store) {
          addDebug(`Store type: ${typeof data.store}`);
          addDebug(`Store.store_name type: ${typeof data.store.store_name}`);
          addDebug(`Store.store_name value: ${JSON.stringify(data.store.store_name)}`);
          addDebug(`Store.shopify_domain type: ${typeof data.store.shopify_domain}`);
        }

        setStoreData(data);
        addDebug('Setting loading to false');
        setLoading(false);
      } catch (err) {
        addDebug(`Error: ${err}`);
        setError(String(err));
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) {
    return (
      <div style={{ padding: '40px', backgroundColor: '#1a1a1a', minHeight: '100vh', color: 'white' }}>
        <h1>Loading...</h1>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ padding: '40px', backgroundColor: '#1a1a1a', minHeight: '100vh', color: 'white' }}>
        <h1>Error</h1>
        <p>{error}</p>
      </div>
    );
  }

  // SAFE rendering - only render strings
  const storeName = typeof storeData?.store?.store_name === 'string'
    ? storeData.store.store_name
    : 'Unknown Store';

  const shopDomain = typeof storeData?.store?.shopify_domain === 'string'
    ? storeData.store.shopify_domain
    : 'Unknown Domain';

  return (
    <div style={{ padding: '40px', backgroundColor: '#1a1a1a', minHeight: '100vh', color: 'white' }}>
      <h1 style={{ fontSize: '24px', marginBottom: '20px' }}>Dashboard - Step 2</h1>

      <div style={{ marginBottom: '20px', padding: '20px', backgroundColor: '#2a2a2a', borderRadius: '8px' }}>
        <h2>Store Info (safely rendered)</h2>
        <p>Store Name: {storeName}</p>
        <p>Shop Domain: {shopDomain}</p>
      </div>

      <div style={{ marginBottom: '20px', padding: '20px', backgroundColor: '#333', borderRadius: '8px' }}>
        <h2>Debug Log</h2>
        <pre style={{ fontSize: '12px', whiteSpace: 'pre-wrap' }}>
          {debugInfo.join('\n')}
        </pre>
      </div>

      <div style={{ marginBottom: '20px', padding: '20px', backgroundColor: '#333', borderRadius: '8px' }}>
        <h2>Raw Data (JSON)</h2>
        <pre style={{ fontSize: '12px', whiteSpace: 'pre-wrap', maxHeight: '300px', overflow: 'auto' }}>
          {JSON.stringify(storeData, null, 2)}
        </pre>
      </div>
    </div>
  );
}
