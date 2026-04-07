'use client';

import { useState, useEffect } from 'react';

export default function DashboardPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [storeData, setStoreData] = useState<any>(null);
  const [ordersData, setOrdersData] = useState<any>(null);
  const [campaignsData, setCampaignsData] = useState<any>(null);
  const [debugInfo, setDebugInfo] = useState<string[]>([]);

  const addDebug = (msg: string) => {
    console.log(msg);
    setDebugInfo(prev => [...prev, msg]);
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const urlParams = new URLSearchParams(window.location.search);
        const shop = urlParams.get('shop');
        addDebug(`Shop: ${shop}`);

        if (!shop) {
          setError('No shop parameter');
          setLoading(false);
          return;
        }

        // 1. Fetch store data
        addDebug('Fetching store...');
        const storeRes = await fetch(`/api/stores/lookup?shop=${encodeURIComponent(shop)}`);
        const storeJson = await storeRes.json();
        setStoreData(storeJson);
        addDebug(`Store OK: ${storeJson.store?.store_name}`);

        const merchantId = storeJson.store?.id;
        if (!merchantId) {
          setError('No merchant ID');
          setLoading(false);
          return;
        }

        // 2. Fetch orders
        addDebug('Fetching orders...');
        const ordersRes = await fetch(`/api/orders/list?merchant_id=${merchantId}`);
        const ordersJson = await ordersRes.json();
        setOrdersData(ordersJson);
        addDebug(`Orders OK: ${ordersJson.orders?.length || 0} orders`);

        // Check orders data types
        if (ordersJson.orders && ordersJson.orders.length > 0) {
          const firstOrder = ordersJson.orders[0];
          addDebug(`First order keys: ${Object.keys(firstOrder).join(', ')}`);
          addDebug(`order_number type: ${typeof firstOrder.order_number}`);
          addDebug(`customer_email type: ${typeof firstOrder.customer_email}`);
          addDebug(`total_price type: ${typeof firstOrder.total_price}`);
        }

        // 3. Fetch campaigns
        addDebug('Fetching campaigns...');
        const campaignsRes = await fetch(`/api/campaigns/list?merchant_id=${merchantId}`);
        const campaignsJson = await campaignsRes.json();
        setCampaignsData(campaignsJson);
        addDebug(`Campaigns OK: ${campaignsJson.campaigns?.length || 0} campaigns`);

        addDebug('All data fetched, setting loading false');
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
        <pre>{debugInfo.join('\n')}</pre>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ padding: '40px', backgroundColor: '#1a1a1a', minHeight: '100vh', color: 'white' }}>
        <h1>Error: {error}</h1>
        <pre>{debugInfo.join('\n')}</pre>
      </div>
    );
  }

  // Calculate some basic metrics safely
  const orders = ordersData?.orders || [];
  const campaigns = campaignsData?.campaigns || [];

  const totalOrders = orders.length;
  const totalRevenue = orders.reduce((sum: number, o: any) => sum + (Number(o.total_price) || 0), 0);
  const totalSpend = campaigns.reduce((sum: number, c: any) => sum + (Number(c.total_spend) || 0), 0);

  return (
    <div style={{ padding: '40px', backgroundColor: '#1a1a1a', minHeight: '100vh', color: 'white' }}>
      <h1 style={{ fontSize: '24px', marginBottom: '20px' }}>Dashboard - Step 3 (with data)</h1>

      {/* Basic Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '20px' }}>
        <div style={{ padding: '20px', backgroundColor: '#2a2a2a', borderRadius: '8px' }}>
          <div style={{ color: '#888', fontSize: '14px' }}>Total Orders</div>
          <div style={{ fontSize: '24px', fontWeight: 'bold' }}>{totalOrders}</div>
        </div>
        <div style={{ padding: '20px', backgroundColor: '#2a2a2a', borderRadius: '8px' }}>
          <div style={{ color: '#888', fontSize: '14px' }}>Total Revenue</div>
          <div style={{ fontSize: '24px', fontWeight: 'bold' }}>${totalRevenue.toFixed(2)}</div>
        </div>
        <div style={{ padding: '20px', backgroundColor: '#2a2a2a', borderRadius: '8px' }}>
          <div style={{ color: '#888', fontSize: '14px' }}>Ad Spend</div>
          <div style={{ fontSize: '24px', fontWeight: 'bold' }}>${totalSpend.toFixed(2)}</div>
        </div>
        <div style={{ padding: '20px', backgroundColor: '#2a2a2a', borderRadius: '8px' }}>
          <div style={{ color: '#888', fontSize: '14px' }}>Campaigns</div>
          <div style={{ fontSize: '24px', fontWeight: 'bold' }}>{campaigns.length}</div>
        </div>
      </div>

      {/* Store Info */}
      <div style={{ marginBottom: '20px', padding: '20px', backgroundColor: '#2a2a2a', borderRadius: '8px' }}>
        <h2>Store: {String(storeData?.store?.store_name || 'Unknown')}</h2>
        <p>Domain: {String(storeData?.store?.shopify_domain || 'Unknown')}</p>
        <p>Subscription: {String(storeData?.merchant?.subscription_tier || 'Unknown')}</p>
      </div>

      {/* Orders List */}
      <div style={{ marginBottom: '20px', padding: '20px', backgroundColor: '#2a2a2a', borderRadius: '8px' }}>
        <h2>Recent Orders ({orders.length})</h2>
        {orders.slice(0, 5).map((order: any, i: number) => (
          <div key={i} style={{ padding: '10px', borderBottom: '1px solid #444' }}>
            Order #{String(order.order_number || 'N/A')} - ${Number(order.total_price || 0).toFixed(2)} - {String(order.customer_email || 'No email')}
          </div>
        ))}
        {orders.length === 0 && <p>No orders yet</p>}
      </div>

      {/* Debug Log */}
      <div style={{ padding: '20px', backgroundColor: '#333', borderRadius: '8px' }}>
        <h2>Debug Log</h2>
        <pre style={{ fontSize: '12px', whiteSpace: 'pre-wrap' }}>{debugInfo.join('\n')}</pre>
      </div>
    </div>
  );
}
