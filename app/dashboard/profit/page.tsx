'use client';

import { useEffect, useState, useMemo, Suspense, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import { Sidebar, MobileNav } from '@/components/dashboard';
import { MetricCard, DashboardSkeleton } from '@/components/ui';

type DateRangeOption = '7d' | '14d' | '30d' | '90d' | 'all';

// Demo store ID for Adam
const DEMO_STORE_ID = '987c61dd-7696-47ca-bf05-37876953b0ca';

interface ProfitSummary {
  totalRevenue: number;
  totalCogs: number;
  grossProfit: number;
  totalAdSpend: number;
  netProfit: number;
  grossMarginPercent: number;
  trueRoas: number;
  orderCount: number;
}

interface ProductCost {
  id: string;
  shopify_product_id: string;
  shopify_variant_id: string | null;
  sku: string | null;
  product_title: string | null;
  variant_title: string | null;
  cost_per_unit: number;
  source: string;
  updated_at: string;
}

interface ProductProfitability {
  productId: string;
  productTitle: string;
  totalRevenue: number;
  totalCogs: number;
  grossProfit: number;
  unitsSold: number;
  avgMargin: number;
}

// Generate demo profit data
function generateDemoProfitData(dateRange: DateRangeOption): {
  summary: ProfitSummary;
  costs: ProductCost[];
  products: ProductProfitability[];
} {
  // Adjust multipliers based on date range
  const multipliers: Record<DateRangeOption, number> = {
    '7d': 0.25,
    '14d': 0.5,
    '30d': 1,
    '90d': 3,
    'all': 6
  };
  const mult = multipliers[dateRange];

  const baseRevenue = 45000 * mult;
  const baseCogs = baseRevenue * 0.35; // 35% COGS
  const baseAdSpend = 12000 * mult;
  const baseOrders = Math.round(95 * mult);

  const summary: ProfitSummary = {
    totalRevenue: baseRevenue + Math.random() * 5000 * mult,
    totalCogs: baseCogs + Math.random() * 1000 * mult,
    grossProfit: 0, // Will calculate
    totalAdSpend: baseAdSpend + Math.random() * 2000 * mult,
    netProfit: 0, // Will calculate
    grossMarginPercent: 0, // Will calculate
    trueRoas: 0, // Will calculate
    orderCount: baseOrders + Math.round(Math.random() * 10 * mult)
  };

  summary.grossProfit = summary.totalRevenue - summary.totalCogs;
  summary.netProfit = summary.grossProfit - summary.totalAdSpend;
  summary.grossMarginPercent = (summary.grossProfit / summary.totalRevenue) * 100;
  summary.trueRoas = summary.totalAdSpend > 0 ? summary.netProfit / summary.totalAdSpend : 0;

  // Demo product costs
  const demoProducts = [
    { name: 'Premium Wireless Earbuds', sku: 'PWE-001', cost: 45.00, price: 129.99 },
    { name: 'Smart Watch Pro', sku: 'SWP-002', cost: 85.00, price: 249.99 },
    { name: 'Portable Charger 20000mAh', sku: 'PC-003', cost: 18.00, price: 49.99 },
    { name: 'Bluetooth Speaker', sku: 'BS-004', cost: 25.00, price: 79.99 },
    { name: 'USB-C Hub 7-in-1', sku: 'UCH-005', cost: 22.00, price: 59.99 },
    { name: 'Noise Cancelling Headphones', sku: 'NCH-006', cost: 95.00, price: 299.99 },
    { name: 'Fitness Tracker Band', sku: 'FTB-007', cost: 15.00, price: 49.99 },
    { name: 'Wireless Mouse', sku: 'WM-008', cost: 12.00, price: 34.99 },
  ];

  const costs: ProductCost[] = demoProducts.map((p, i) => ({
    id: `demo-cost-${i}`,
    shopify_product_id: `demo-product-${i}`,
    shopify_variant_id: null,
    sku: p.sku,
    product_title: p.name,
    variant_title: null,
    cost_per_unit: p.cost,
    source: i % 3 === 0 ? 'manual' : i % 3 === 1 ? 'csv_import' : 'shopify_sync',
    updated_at: new Date().toISOString()
  }));

  const products: ProductProfitability[] = demoProducts.map((p, i) => {
    const unitsSold = Math.round((10 + Math.random() * 40) * mult);
    const totalRevenue = unitsSold * p.price;
    const totalCogs = unitsSold * p.cost;
    const grossProfit = totalRevenue - totalCogs;
    const avgMargin = (grossProfit / totalRevenue) * 100;

    return {
      productId: `demo-product-${i}`,
      productTitle: p.name,
      totalRevenue,
      totalCogs,
      grossProfit,
      unitsSold,
      avgMargin
    };
  }).sort((a, b) => b.grossProfit - a.grossProfit);

  return { summary, costs, products };
}

function ProfitContent() {
  const searchParams = useSearchParams();
  const [initialLoading, setInitialLoading] = useState(true);
  const [dataLoading, setDataLoading] = useState(false);
  const [storeId, setStoreId] = useState<string | null>(null);
  const [dateRange, setDateRange] = useState<DateRangeOption>('14d');
  const isFirstLoad = useRef(true);

  // Profit data
  const [profitSummary, setProfitSummary] = useState<ProfitSummary | null>(null);
  const [productCosts, setProductCosts] = useState<ProductCost[]>([]);
  const [productProfitability, setProductProfitability] = useState<ProductProfitability[]>([]);

  // UI state
  const [activeTab, setActiveTab] = useState<'overview' | 'products' | 'costs'>('overview');
  const [showCostModal, setShowCostModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [editingCost, setEditingCost] = useState<ProductCost | null>(null);
  const [importing, setImporting] = useState(false);
  const [syncing, setSyncing] = useState(false);

  // Form state for adding/editing costs
  const [costForm, setCostForm] = useState({
    productId: '',
    variantId: '',
    sku: '',
    productTitle: '',
    variantTitle: '',
    costPerUnit: ''
  });

  // Calculate date range for API calls
  const dateRangeParams = useMemo(() => {
    const now = new Date();
    let startDate: Date | null = null;

    switch (dateRange) {
      case '7d':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case '14d':
        startDate = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);
        break;
      case '30d':
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      case '90d':
        startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
        break;
    }

    return {
      startDate: startDate?.toISOString().split('T')[0],
      endDate: now.toISOString().split('T')[0]
    };
  }, [dateRange]);

  // Load store ID from shop parameter
  useEffect(() => {
    const loadStore = async () => {
      try {
        const shop = searchParams.get('shop');
        if (!shop) {
          setInitialLoading(false);
          return;
        }

        const xhr = new XMLHttpRequest();
        xhr.open('GET', `/api/stores/lookup?shop=${encodeURIComponent(shop)}`, false);
        xhr.send();

        if (xhr.status === 200) {
          const data = JSON.parse(xhr.responseText);
          const storeData = data.store || data.merchant;
          if (storeData) {
            setStoreId(storeData.id);
          }
        }
      } catch (error) {
        console.error('Error loading store:', error);
      } finally {
        setInitialLoading(false);
      }
    };

    loadStore();
  }, [searchParams]);

  // Load profit data
  useEffect(() => {
    if (!storeId) return;

    async function loadData() {
      // Only show full loading skeleton on first load
      if (isFirstLoad.current) {
        setInitialLoading(true);
      } else {
        setDataLoading(true);
      }

      try {
        // Check if this is the demo store
        if (storeId === DEMO_STORE_ID) {
          // Generate demo data for Adam's store
          const demoData = generateDemoProfitData(dateRange);
          setProfitSummary(demoData.summary);
          setProductCosts(demoData.costs);
          setProductProfitability(demoData.products);
        } else {
          // Load real profit summary
          const summaryRes = await fetch(
            `/api/profit/summary?storeId=${storeId}&startDate=${dateRangeParams.startDate || ''}&endDate=${dateRangeParams.endDate || ''}`
          );
          if (summaryRes.ok) {
            const data = await summaryRes.json();
            setProfitSummary(data.summary);
          }

          // Load product costs
          const costsRes = await fetch(`/api/products/costs?storeId=${storeId}&limit=100`);
          if (costsRes.ok) {
            const data = await costsRes.json();
            setProductCosts(data.costs || []);
          }

          // Load product profitability
          const profitRes = await fetch(
            `/api/profit/products?storeId=${storeId}&startDate=${dateRangeParams.startDate || ''}&endDate=${dateRangeParams.endDate || ''}`
          );
          if (profitRes.ok) {
            const data = await profitRes.json();
            setProductProfitability(data.products || []);
          }
        }
      } catch (error) {
        console.error('Error loading profit data:', error);
      } finally {
        setInitialLoading(false);
        setDataLoading(false);
        isFirstLoad.current = false;
      }
    }

    loadData();
  }, [storeId, dateRange, dateRangeParams]);

  // Save product cost
  const saveCost = async () => {
    if (!storeId || !costForm.productId || !costForm.costPerUnit) return;

    try {
      const res = await fetch('/api/products/costs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          storeId,
          productId: costForm.productId,
          variantId: costForm.variantId || null,
          sku: costForm.sku || null,
          productTitle: costForm.productTitle || null,
          variantTitle: costForm.variantTitle || null,
          costPerUnit: parseFloat(costForm.costPerUnit)
        })
      });

      if (res.ok) {
        // Refresh costs
        const costsRes = await fetch(`/api/products/costs?storeId=${storeId}&limit=100`);
        if (costsRes.ok) {
          const data = await costsRes.json();
          setProductCosts(data.costs || []);
        }
        setShowCostModal(false);
        setCostForm({ productId: '', variantId: '', sku: '', productTitle: '', variantTitle: '', costPerUnit: '' });
      }
    } catch (error) {
      console.error('Error saving cost:', error);
    }
  };

  // Delete product cost
  const deleteCost = async (costId: string) => {
    if (!storeId || !confirm('Are you sure you want to delete this cost?')) return;

    try {
      const res = await fetch(`/api/products/costs?id=${costId}&storeId=${storeId}`, {
        method: 'DELETE'
      });

      if (res.ok) {
        setProductCosts(productCosts.filter(c => c.id !== costId));
      }
    } catch (error) {
      console.error('Error deleting cost:', error);
    }
  };

  // Import from CSV
  const handleFileImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !storeId) return;

    setImporting(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('storeId', storeId);

      const res = await fetch('/api/products/costs/import', {
        method: 'POST',
        body: formData
      });

      const data = await res.json();
      if (res.ok) {
        alert(`Imported ${data.imported} product costs successfully!`);
        // Refresh costs
        const costsRes = await fetch(`/api/products/costs?storeId=${storeId}&limit=100`);
        if (costsRes.ok) {
          const costsData = await costsRes.json();
          setProductCosts(costsData.costs || []);
        }
      } else {
        alert(`Import failed: ${data.error}`);
      }
    } catch (error) {
      console.error('Import error:', error);
      alert('Import failed. Please try again.');
    } finally {
      setImporting(false);
      setShowImportModal(false);
    }
  };

  // Sync from Shopify
  const syncFromShopify = async () => {
    if (!storeId) return;

    setSyncing(true);
    try {
      const res = await fetch('/api/products/costs/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ storeId, action: 'shopify_sync' })
      });

      const data = await res.json();
      if (res.ok) {
        alert(`Synced ${data.synced} product costs from Shopify!`);
        // Refresh costs
        const costsRes = await fetch(`/api/products/costs?storeId=${storeId}&limit=100`);
        if (costsRes.ok) {
          const costsData = await costsRes.json();
          setProductCosts(costsData.costs || []);
        }
      } else {
        alert(`Sync failed: ${data.error}`);
      }
    } catch (error) {
      console.error('Sync error:', error);
      alert('Sync failed. Please try again.');
    } finally {
      setSyncing(false);
    }
  };

  // Format currency
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2
    }).format(value);
  };

  // Format percentage
  const formatPercent = (value: number) => {
    return `${value >= 0 ? '+' : ''}${value.toFixed(1)}%`;
  };

  if (initialLoading && !profitSummary) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-orange-900 to-slate-900">
        <Sidebar activePage="profit" />
        <main className="lg:ml-64 min-h-screen p-6">
          <DashboardSkeleton />
        </main>
      </div>
    );
  }

  if (!storeId) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-orange-900 to-slate-900">
        <Sidebar activePage="profit" />
        <main className="lg:ml-64 min-h-screen flex items-center justify-center">
          <div className="text-center">
            <h2 className="text-xl font-semibold text-white">No Store Connected</h2>
            <p className="mt-2 text-white/60">Please connect your Shopify store first.</p>
            <p className="mt-1 text-white/40 text-sm">Make sure the shop parameter is in the URL.</p>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-orange-900 to-slate-900">
      <Sidebar activePage="profit" />

      <main className="lg:ml-64 min-h-screen">
        {/* Header */}
        <header className="bg-slate-900/50 backdrop-blur border-b border-white/10 sticky top-0 z-30">
          <div className="px-6 py-4 flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-white">Profit Tracking</h1>
              <p className="text-white/60 text-sm">Track COGS and calculate true profitability</p>
            </div>

            {/* Date Range Selector */}
            <div className="flex items-center space-x-2">
              {(['7d', '14d', '30d', '90d', 'all'] as DateRangeOption[]).map((range) => (
                <button
                  key={range}
                  onClick={() => setDateRange(range)}
                  className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                    dateRange === range
                      ? 'bg-orange-500 text-white'
                      : 'bg-white/10 text-white/70 hover:bg-white/20 border border-white/20'
                  }`}
                >
                  {range === 'all' ? 'All Time' : range.replace('d', ' days')}
                </button>
              ))}
            </div>
          </div>
        </header>

        <div className={`p-6 transition-opacity duration-200 ${dataLoading ? 'opacity-60' : 'opacity-100'}`}>
          {/* Loading indicator */}
          {dataLoading && (
            <div className="fixed top-20 right-6 z-50 flex items-center gap-2 bg-slate-800/90 backdrop-blur px-3 py-2 rounded-lg border border-white/10 shadow-lg">
              <div className="w-4 h-4 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
              <span className="text-sm text-white/80">Updating...</span>
            </div>
          )}

          {/* Tabs */}
          <div className="border-b border-white/10 mb-6">
            <nav className="-mb-px flex space-x-8">
              {[
                { id: 'overview', label: 'Overview' },
                { id: 'products', label: 'Product Profitability' },
                { id: 'costs', label: 'Manage Costs' }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as typeof activeTab)}
                  className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                    activeTab === tab.id
                      ? 'border-orange-500 text-orange-400'
                      : 'border-transparent text-white/60 hover:text-white hover:border-white/30'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </nav>
          </div>

          {/* Overview Tab */}
          {activeTab === 'overview' && profitSummary && (
            <div className="space-y-6">
              {/* Profit Waterfall */}
              <div className="bg-white/5 backdrop-blur border border-white/10 rounded-xl p-6">
                <h2 className="text-lg font-semibold text-white mb-4">Profit Waterfall</h2>
                <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                  <div className="bg-blue-500/20 border border-blue-500/30 rounded-lg p-4 text-center">
                    <p className="text-sm text-blue-300 font-medium">Revenue</p>
                    <p className="text-2xl font-bold text-blue-400">{formatCurrency(profitSummary.totalRevenue)}</p>
                  </div>
                  <div className="flex items-center justify-center text-white/40">
                    <span className="text-2xl">−</span>
                  </div>
                  <div className="bg-red-500/20 border border-red-500/30 rounded-lg p-4 text-center">
                    <p className="text-sm text-red-300 font-medium">COGS</p>
                    <p className="text-2xl font-bold text-red-400">{formatCurrency(profitSummary.totalCogs)}</p>
                  </div>
                  <div className="flex items-center justify-center text-white/40">
                    <span className="text-2xl">=</span>
                  </div>
                  <div className="bg-green-500/20 border border-green-500/30 rounded-lg p-4 text-center">
                    <p className="text-sm text-green-300 font-medium">Gross Profit</p>
                    <p className="text-2xl font-bold text-green-400">{formatCurrency(profitSummary.grossProfit)}</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mt-4">
                  <div className="bg-green-500/20 border border-green-500/30 rounded-lg p-4 text-center">
                    <p className="text-sm text-green-300 font-medium">Gross Profit</p>
                    <p className="text-2xl font-bold text-green-400">{formatCurrency(profitSummary.grossProfit)}</p>
                  </div>
                  <div className="flex items-center justify-center text-white/40">
                    <span className="text-2xl">−</span>
                  </div>
                  <div className="bg-orange-500/20 border border-orange-500/30 rounded-lg p-4 text-center">
                    <p className="text-sm text-orange-300 font-medium">Ad Spend</p>
                    <p className="text-2xl font-bold text-orange-400">{formatCurrency(profitSummary.totalAdSpend)}</p>
                  </div>
                  <div className="flex items-center justify-center text-white/40">
                    <span className="text-2xl">=</span>
                  </div>
                  <div className={`rounded-lg p-4 text-center border ${profitSummary.netProfit >= 0 ? 'bg-emerald-500/20 border-emerald-500/30' : 'bg-red-500/20 border-red-500/30'}`}>
                    <p className={`text-sm font-medium ${profitSummary.netProfit >= 0 ? 'text-emerald-300' : 'text-red-300'}`}>Net Profit</p>
                    <p className={`text-2xl font-bold ${profitSummary.netProfit >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                      {formatCurrency(profitSummary.netProfit)}
                    </p>
                  </div>
                </div>
              </div>

              {/* Key Metrics */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-white/5 backdrop-blur border border-white/10 rounded-xl p-6">
                  <p className="text-sm text-white/60">Gross Margin</p>
                  <p className="text-3xl font-bold text-white">{profitSummary.grossMarginPercent.toFixed(1)}%</p>
                  <p className="text-sm text-white/40 mt-1">
                    {productCosts.length === 0 && <span className="text-amber-400">Add product costs for accuracy</span>}
                  </p>
                </div>

                <div className="bg-white/5 backdrop-blur border border-white/10 rounded-xl p-6">
                  <p className="text-sm text-white/60">True ROAS</p>
                  <p className={`text-3xl font-bold ${profitSummary.trueRoas >= 1 ? 'text-green-400' : 'text-red-400'}`}>
                    {profitSummary.trueRoas.toFixed(2)}x
                  </p>
                  <p className="text-sm text-white/40 mt-1">Net Profit / Ad Spend</p>
                </div>

                <div className="bg-white/5 backdrop-blur border border-white/10 rounded-xl p-6">
                  <p className="text-sm text-white/60">Total Orders</p>
                  <p className="text-3xl font-bold text-white">{profitSummary.orderCount.toLocaleString()}</p>
                  <p className="text-sm text-white/40 mt-1">
                    Avg: {formatCurrency(profitSummary.orderCount > 0 ? profitSummary.totalRevenue / profitSummary.orderCount : 0)}
                  </p>
                </div>

                <div className="bg-white/5 backdrop-blur border border-white/10 rounded-xl p-6">
                  <p className="text-sm text-white/60">Profit per Order</p>
                  <p className={`text-3xl font-bold ${profitSummary.netProfit >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                    {formatCurrency(profitSummary.orderCount > 0 ? profitSummary.netProfit / profitSummary.orderCount : 0)}
                  </p>
                  <p className="text-sm text-white/40 mt-1">After COGS & ads</p>
                </div>
              </div>

              {/* COGS Coverage Warning - hide for demo store */}
              {productCosts.length === 0 && storeId !== DEMO_STORE_ID && (
                <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-4">
                  <div className="flex items-start">
                    <span className="text-2xl mr-3">⚠️</span>
                    <div>
                      <h3 className="font-semibold text-amber-300">No Product Costs Set</h3>
                      <p className="text-amber-200/80 mt-1">
                        Add your product costs to see accurate profit calculations. You can manually enter costs,
                        import from CSV, or sync from Shopify inventory.
                      </p>
                      <button
                        onClick={() => setActiveTab('costs')}
                        className="mt-3 px-4 py-2 bg-amber-500 text-white rounded-md hover:bg-amber-600 transition-colors"
                      >
                        Add Product Costs
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Products Tab */}
          {activeTab === 'products' && (
            <div className="bg-white/5 backdrop-blur border border-white/10 rounded-xl">
              <div className="px-6 py-4 border-b border-white/10">
                <h2 className="text-lg font-semibold text-white">Product Profitability</h2>
                <p className="text-sm text-white/60">See which products are most profitable</p>
              </div>

              {productProfitability.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-white/10">
                    <thead className="bg-white/5">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-white/60 uppercase">Product</th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-white/60 uppercase">Units Sold</th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-white/60 uppercase">Revenue</th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-white/60 uppercase">COGS</th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-white/60 uppercase">Gross Profit</th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-white/60 uppercase">Margin</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/10">
                      {productProfitability.map((product) => (
                        <tr key={product.productId} className="hover:bg-white/5">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-white">{product.productTitle}</div>
                            <div className="text-xs text-white/40">ID: {product.productId}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-white">
                            {product.unitsSold.toLocaleString()}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-white">
                            {formatCurrency(product.totalRevenue)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-white/60">
                            {formatCurrency(product.totalCogs)}
                          </td>
                          <td className={`px-6 py-4 whitespace-nowrap text-right text-sm font-medium ${product.grossProfit >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                            {formatCurrency(product.grossProfit)}
                          </td>
                          <td className={`px-6 py-4 whitespace-nowrap text-right text-sm font-medium ${product.avgMargin >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                            {product.avgMargin.toFixed(1)}%
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="px-6 py-12 text-center">
                  <p className="text-white/60">No product data available for the selected period.</p>
                  <p className="text-sm text-white/40 mt-1">Make sure you have orders and product costs set up.</p>
                </div>
              )}
            </div>
          )}

          {/* Costs Tab */}
          {activeTab === 'costs' && (
            <div className="space-y-6">
              {/* Actions */}
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <button
                    onClick={() => setShowCostModal(true)}
                    className="px-4 py-2 bg-orange-500 text-white rounded-md hover:bg-orange-600 transition-colors"
                  >
                    + Add Cost
                  </button>
                  <button
                    onClick={() => setShowImportModal(true)}
                    className="px-4 py-2 bg-white/10 text-white border border-white/20 rounded-md hover:bg-white/20 transition-colors"
                  >
                    Import CSV
                  </button>
                  <button
                    onClick={syncFromShopify}
                    disabled={syncing}
                    className="px-4 py-2 bg-white/10 text-white border border-white/20 rounded-md hover:bg-white/20 disabled:opacity-50 transition-colors"
                  >
                    {syncing ? 'Syncing...' : 'Sync from Shopify'}
                  </button>
                </div>
                <a
                  href="/api/products/costs/import"
                  className="text-sm text-orange-400 hover:text-orange-300"
                >
                  Download CSV Template
                </a>
              </div>

              {/* Costs Table */}
              <div className="bg-white/5 backdrop-blur border border-white/10 rounded-xl">
                <div className="px-6 py-4 border-b border-white/10">
                  <h2 className="text-lg font-semibold text-white">Product Costs ({productCosts.length})</h2>
                </div>

                {productCosts.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-white/10">
                      <thead className="bg-white/5">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-white/60 uppercase">Product</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-white/60 uppercase">SKU</th>
                          <th className="px-6 py-3 text-right text-xs font-medium text-white/60 uppercase">Cost</th>
                          <th className="px-6 py-3 text-center text-xs font-medium text-white/60 uppercase">Source</th>
                          <th className="px-6 py-3 text-right text-xs font-medium text-white/60 uppercase">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/10">
                        {productCosts.map((cost) => (
                          <tr key={cost.id} className="hover:bg-white/5">
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm font-medium text-white">
                                {cost.product_title || `Product ${cost.shopify_product_id}`}
                              </div>
                              {cost.variant_title && (
                                <div className="text-xs text-white/40">{cost.variant_title}</div>
                              )}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-white/60">
                              {cost.sku || '-'}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium text-white">
                              {formatCurrency(cost.cost_per_unit)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-center">
                              <span className={`px-2 py-1 text-xs rounded-full ${
                                cost.source === 'manual' ? 'bg-blue-500/20 text-blue-300' :
                                cost.source === 'csv_import' ? 'bg-green-500/20 text-green-300' :
                                'bg-purple-500/20 text-purple-300'
                              }`}>
                                {cost.source}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                              <button
                                onClick={() => {
                                  setEditingCost(cost);
                                  setCostForm({
                                    productId: cost.shopify_product_id,
                                    variantId: cost.shopify_variant_id || '',
                                    sku: cost.sku || '',
                                    productTitle: cost.product_title || '',
                                    variantTitle: cost.variant_title || '',
                                    costPerUnit: cost.cost_per_unit.toString()
                                  });
                                  setShowCostModal(true);
                                }}
                                className="text-orange-400 hover:text-orange-300 mr-3"
                              >
                                Edit
                              </button>
                              <button
                                onClick={() => deleteCost(cost.id)}
                                className="text-red-400 hover:text-red-300"
                              >
                                Delete
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="px-6 py-12 text-center">
                    <p className="text-white/60">No product costs set up yet.</p>
                    <p className="text-sm text-white/40 mt-1">
                      Add costs manually, import from CSV, or sync from Shopify inventory.
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Add/Edit Cost Modal */}
          {showCostModal && (
            <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50">
              <div className="bg-slate-800 border border-white/10 rounded-xl shadow-xl max-w-md w-full mx-4 p-6">
                <h3 className="text-lg font-semibold text-white mb-4">
                  {editingCost ? 'Edit Product Cost' : 'Add Product Cost'}
                </h3>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-white/70">Product ID *</label>
                    <input
                      type="text"
                      value={costForm.productId}
                      onChange={(e) => setCostForm({ ...costForm, productId: e.target.value })}
                      className="mt-1 w-full px-3 py-2 bg-white/10 border border-white/20 rounded-md text-white placeholder-white/40 focus:ring-orange-500 focus:border-orange-500"
                      placeholder="Shopify Product ID"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-white/70">Variant ID (optional)</label>
                    <input
                      type="text"
                      value={costForm.variantId}
                      onChange={(e) => setCostForm({ ...costForm, variantId: e.target.value })}
                      className="mt-1 w-full px-3 py-2 bg-white/10 border border-white/20 rounded-md text-white placeholder-white/40 focus:ring-orange-500 focus:border-orange-500"
                      placeholder="Leave blank for all variants"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-white/70">SKU</label>
                      <input
                        type="text"
                        value={costForm.sku}
                        onChange={(e) => setCostForm({ ...costForm, sku: e.target.value })}
                        className="mt-1 w-full px-3 py-2 bg-white/10 border border-white/20 rounded-md text-white placeholder-white/40 focus:ring-orange-500 focus:border-orange-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-white/70">Cost per Unit *</label>
                      <input
                        type="number"
                        step="0.01"
                        value={costForm.costPerUnit}
                        onChange={(e) => setCostForm({ ...costForm, costPerUnit: e.target.value })}
                        className="mt-1 w-full px-3 py-2 bg-white/10 border border-white/20 rounded-md text-white placeholder-white/40 focus:ring-orange-500 focus:border-orange-500"
                        placeholder="0.00"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-white/70">Product Title</label>
                    <input
                      type="text"
                      value={costForm.productTitle}
                      onChange={(e) => setCostForm({ ...costForm, productTitle: e.target.value })}
                      className="mt-1 w-full px-3 py-2 bg-white/10 border border-white/20 rounded-md text-white placeholder-white/40 focus:ring-orange-500 focus:border-orange-500"
                    />
                  </div>
                </div>

                <div className="mt-6 flex justify-end space-x-3">
                  <button
                    onClick={() => {
                      setShowCostModal(false);
                      setEditingCost(null);
                      setCostForm({ productId: '', variantId: '', sku: '', productTitle: '', variantTitle: '', costPerUnit: '' });
                    }}
                    className="px-4 py-2 text-white/70 hover:text-white"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={saveCost}
                    className="px-4 py-2 bg-orange-500 text-white rounded-md hover:bg-orange-600 transition-colors"
                  >
                    Save
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Import Modal */}
          {showImportModal && (
            <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50">
              <div className="bg-slate-800 border border-white/10 rounded-xl shadow-xl max-w-md w-full mx-4 p-6">
                <h3 className="text-lg font-semibold text-white mb-4">Import Product Costs</h3>

                <p className="text-sm text-white/60 mb-4">
                  Upload a CSV file with columns: product_id, variant_id (optional), sku (optional),
                  product_title (optional), cost_per_unit
                </p>

                <div className="border-2 border-dashed border-white/20 rounded-lg p-6 text-center hover:border-orange-500/50 transition-colors">
                  <input
                    type="file"
                    accept=".csv"
                    onChange={handleFileImport}
                    className="hidden"
                    id="csv-upload"
                    disabled={importing}
                  />
                  <label
                    htmlFor="csv-upload"
                    className="cursor-pointer text-orange-400 hover:text-orange-300"
                  >
                    {importing ? 'Importing...' : 'Click to select CSV file'}
                  </label>
                </div>

                <div className="mt-4 text-center">
                  <a
                    href="/api/products/costs/import"
                    className="text-sm text-orange-400 hover:text-orange-300"
                  >
                    Download CSV template
                  </a>
                </div>

                <div className="mt-6 flex justify-end">
                  <button
                    onClick={() => setShowImportModal(false)}
                    className="px-4 py-2 text-white/70 hover:text-white"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
      <MobileNav activePage="profit" />
    </div>
  );
}

export default function ProfitPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-orange-900 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-16 w-16 border-4 border-solid border-orange-500 border-r-transparent mb-4"></div>
          <div className="text-white text-xl">Loading profit tracking...</div>
        </div>
      </div>
    }>
      <ProfitContent />
    </Suspense>
  );
}
