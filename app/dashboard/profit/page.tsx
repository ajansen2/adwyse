'use client';

import { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

type DateRangeOption = '7d' | '14d' | '30d' | '90d' | 'all';

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

export default function ProfitDashboard() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [storeId, setStoreId] = useState<string | null>(null);
  const [dateRange, setDateRange] = useState<DateRangeOption>('30d');

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

  // Load store ID from localStorage
  useEffect(() => {
    const savedStoreId = localStorage.getItem('adwyse_store_id');
    if (savedStoreId) {
      setStoreId(savedStoreId);
    } else {
      setLoading(false);
    }
  }, []);

  // Load profit data
  useEffect(() => {
    if (!storeId) return;

    async function loadData() {
      setLoading(true);
      try {
        // Load profit summary
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
      } catch (error) {
        console.error('Error loading profit data:', error);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [storeId, dateRangeParams]);

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

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading profit data...</p>
        </div>
      </div>
    );
  }

  if (!storeId) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-900">No Store Connected</h2>
          <p className="mt-2 text-gray-600">Please connect your Shopify store first.</p>
          <Link href="/dashboard" className="mt-4 inline-block text-indigo-600 hover:text-indigo-500">
            Go to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Profit Tracking</h1>
              <p className="text-gray-500">Track COGS and calculate true profitability</p>
            </div>

            {/* Date Range Selector */}
            <div className="flex items-center space-x-2">
              {(['7d', '14d', '30d', '90d', 'all'] as DateRangeOption[]).map((range) => (
                <button
                  key={range}
                  onClick={() => setDateRange(range)}
                  className={`px-3 py-1.5 text-sm font-medium rounded-md ${
                    dateRange === range
                      ? 'bg-indigo-600 text-white'
                      : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-300'
                  }`}
                >
                  {range === 'all' ? 'All Time' : range.replace('d', ' days')}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Tabs */}
        <div className="border-b border-gray-200 mb-6">
          <nav className="-mb-px flex space-x-8">
            {[
              { id: 'overview', label: 'Overview' },
              { id: 'products', label: 'Product Profitability' },
              { id: 'costs', label: 'Manage Costs' }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as typeof activeTab)}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === tab.id
                    ? 'border-indigo-500 text-indigo-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
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
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Profit Waterfall</h2>
              <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                <div className="bg-blue-50 rounded-lg p-4 text-center">
                  <p className="text-sm text-blue-600 font-medium">Revenue</p>
                  <p className="text-2xl font-bold text-blue-700">{formatCurrency(profitSummary.totalRevenue)}</p>
                </div>
                <div className="flex items-center justify-center text-gray-400">
                  <span className="text-2xl">−</span>
                </div>
                <div className="bg-red-50 rounded-lg p-4 text-center">
                  <p className="text-sm text-red-600 font-medium">COGS</p>
                  <p className="text-2xl font-bold text-red-700">{formatCurrency(profitSummary.totalCogs)}</p>
                </div>
                <div className="flex items-center justify-center text-gray-400">
                  <span className="text-2xl">=</span>
                </div>
                <div className="bg-green-50 rounded-lg p-4 text-center">
                  <p className="text-sm text-green-600 font-medium">Gross Profit</p>
                  <p className="text-2xl font-bold text-green-700">{formatCurrency(profitSummary.grossProfit)}</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mt-4">
                <div className="bg-green-50 rounded-lg p-4 text-center">
                  <p className="text-sm text-green-600 font-medium">Gross Profit</p>
                  <p className="text-2xl font-bold text-green-700">{formatCurrency(profitSummary.grossProfit)}</p>
                </div>
                <div className="flex items-center justify-center text-gray-400">
                  <span className="text-2xl">−</span>
                </div>
                <div className="bg-orange-50 rounded-lg p-4 text-center">
                  <p className="text-sm text-orange-600 font-medium">Ad Spend</p>
                  <p className="text-2xl font-bold text-orange-700">{formatCurrency(profitSummary.totalAdSpend)}</p>
                </div>
                <div className="flex items-center justify-center text-gray-400">
                  <span className="text-2xl">=</span>
                </div>
                <div className={`rounded-lg p-4 text-center ${profitSummary.netProfit >= 0 ? 'bg-emerald-50' : 'bg-red-50'}`}>
                  <p className={`text-sm font-medium ${profitSummary.netProfit >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>Net Profit</p>
                  <p className={`text-2xl font-bold ${profitSummary.netProfit >= 0 ? 'text-emerald-700' : 'text-red-700'}`}>
                    {formatCurrency(profitSummary.netProfit)}
                  </p>
                </div>
              </div>
            </div>

            {/* Key Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="bg-white rounded-lg shadow p-6">
                <p className="text-sm text-gray-500">Gross Margin</p>
                <p className="text-3xl font-bold text-gray-900">{profitSummary.grossMarginPercent.toFixed(1)}%</p>
                <p className="text-sm text-gray-500 mt-1">
                  {productCosts.length === 0 && <span className="text-amber-600">⚠ Add product costs for accuracy</span>}
                </p>
              </div>

              <div className="bg-white rounded-lg shadow p-6">
                <p className="text-sm text-gray-500">True ROAS</p>
                <p className={`text-3xl font-bold ${profitSummary.trueRoas >= 1 ? 'text-green-600' : 'text-red-600'}`}>
                  {profitSummary.trueRoas.toFixed(2)}x
                </p>
                <p className="text-sm text-gray-500 mt-1">Net Profit / Ad Spend</p>
              </div>

              <div className="bg-white rounded-lg shadow p-6">
                <p className="text-sm text-gray-500">Total Orders</p>
                <p className="text-3xl font-bold text-gray-900">{profitSummary.orderCount.toLocaleString()}</p>
                <p className="text-sm text-gray-500 mt-1">
                  Avg: {formatCurrency(profitSummary.orderCount > 0 ? profitSummary.totalRevenue / profitSummary.orderCount : 0)}
                </p>
              </div>

              <div className="bg-white rounded-lg shadow p-6">
                <p className="text-sm text-gray-500">Profit per Order</p>
                <p className={`text-3xl font-bold ${profitSummary.netProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {formatCurrency(profitSummary.orderCount > 0 ? profitSummary.netProfit / profitSummary.orderCount : 0)}
                </p>
                <p className="text-sm text-gray-500 mt-1">After COGS & ads</p>
              </div>
            </div>

            {/* COGS Coverage Warning */}
            {productCosts.length === 0 && (
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                <div className="flex items-start">
                  <span className="text-2xl mr-3">⚠️</span>
                  <div>
                    <h3 className="font-semibold text-amber-800">No Product Costs Set</h3>
                    <p className="text-amber-700 mt-1">
                      Add your product costs to see accurate profit calculations. You can manually enter costs,
                      import from CSV, or sync from Shopify inventory.
                    </p>
                    <button
                      onClick={() => setActiveTab('costs')}
                      className="mt-3 px-4 py-2 bg-amber-600 text-white rounded-md hover:bg-amber-700"
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
          <div className="bg-white rounded-lg shadow">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">Product Profitability</h2>
              <p className="text-sm text-gray-500">See which products are most profitable</p>
            </div>

            {productProfitability.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Product</th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Units Sold</th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Revenue</th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">COGS</th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Gross Profit</th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Margin</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {productProfitability.map((product) => (
                      <tr key={product.productId} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">{product.productTitle}</div>
                          <div className="text-xs text-gray-500">ID: {product.productId}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-gray-900">
                          {product.unitsSold.toLocaleString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-gray-900">
                          {formatCurrency(product.totalRevenue)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-gray-500">
                          {formatCurrency(product.totalCogs)}
                        </td>
                        <td className={`px-6 py-4 whitespace-nowrap text-right text-sm font-medium ${product.grossProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {formatCurrency(product.grossProfit)}
                        </td>
                        <td className={`px-6 py-4 whitespace-nowrap text-right text-sm font-medium ${product.avgMargin >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {product.avgMargin.toFixed(1)}%
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="px-6 py-12 text-center">
                <p className="text-gray-500">No product data available for the selected period.</p>
                <p className="text-sm text-gray-400 mt-1">Make sure you have orders and product costs set up.</p>
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
                  className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
                >
                  + Add Cost
                </button>
                <button
                  onClick={() => setShowImportModal(true)}
                  className="px-4 py-2 bg-white text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50"
                >
                  Import CSV
                </button>
                <button
                  onClick={syncFromShopify}
                  disabled={syncing}
                  className="px-4 py-2 bg-white text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50"
                >
                  {syncing ? 'Syncing...' : 'Sync from Shopify'}
                </button>
              </div>
              <a
                href="/api/products/costs/import"
                className="text-sm text-indigo-600 hover:text-indigo-500"
              >
                Download CSV Template
              </a>
            </div>

            {/* Costs Table */}
            <div className="bg-white rounded-lg shadow">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900">Product Costs ({productCosts.length})</h2>
              </div>

              {productCosts.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Product</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">SKU</th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Cost</th>
                        <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Source</th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {productCosts.map((cost) => (
                        <tr key={cost.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900">
                              {cost.product_title || `Product ${cost.shopify_product_id}`}
                            </div>
                            {cost.variant_title && (
                              <div className="text-xs text-gray-500">{cost.variant_title}</div>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {cost.sku || '-'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium text-gray-900">
                            {formatCurrency(cost.cost_per_unit)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-center">
                            <span className={`px-2 py-1 text-xs rounded-full ${
                              cost.source === 'manual' ? 'bg-blue-100 text-blue-800' :
                              cost.source === 'csv_import' ? 'bg-green-100 text-green-800' :
                              'bg-purple-100 text-purple-800'
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
                              className="text-indigo-600 hover:text-indigo-900 mr-3"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => deleteCost(cost.id)}
                              className="text-red-600 hover:text-red-900"
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
                  <p className="text-gray-500">No product costs set up yet.</p>
                  <p className="text-sm text-gray-400 mt-1">
                    Add costs manually, import from CSV, or sync from Shopify inventory.
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Add/Edit Cost Modal */}
        {showCostModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                {editingCost ? 'Edit Product Cost' : 'Add Product Cost'}
              </h3>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Product ID *</label>
                  <input
                    type="text"
                    value={costForm.productId}
                    onChange={(e) => setCostForm({ ...costForm, productId: e.target.value })}
                    className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                    placeholder="Shopify Product ID"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Variant ID (optional)</label>
                  <input
                    type="text"
                    value={costForm.variantId}
                    onChange={(e) => setCostForm({ ...costForm, variantId: e.target.value })}
                    className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                    placeholder="Leave blank for all variants"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">SKU</label>
                    <input
                      type="text"
                      value={costForm.sku}
                      onChange={(e) => setCostForm({ ...costForm, sku: e.target.value })}
                      className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Cost per Unit *</label>
                    <input
                      type="number"
                      step="0.01"
                      value={costForm.costPerUnit}
                      onChange={(e) => setCostForm({ ...costForm, costPerUnit: e.target.value })}
                      className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                      placeholder="0.00"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Product Title</label>
                  <input
                    type="text"
                    value={costForm.productTitle}
                    onChange={(e) => setCostForm({ ...costForm, productTitle: e.target.value })}
                    className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
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
                  className="px-4 py-2 text-gray-700 hover:text-gray-900"
                >
                  Cancel
                </button>
                <button
                  onClick={saveCost}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
                >
                  Save
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Import Modal */}
        {showImportModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Import Product Costs</h3>

              <p className="text-sm text-gray-600 mb-4">
                Upload a CSV file with columns: product_id, variant_id (optional), sku (optional),
                product_title (optional), cost_per_unit
              </p>

              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
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
                  className="cursor-pointer text-indigo-600 hover:text-indigo-500"
                >
                  {importing ? 'Importing...' : 'Click to select CSV file'}
                </label>
              </div>

              <div className="mt-4 text-center">
                <a
                  href="/api/products/costs/import"
                  className="text-sm text-indigo-600 hover:text-indigo-500"
                >
                  Download CSV template
                </a>
              </div>

              <div className="mt-6 flex justify-end">
                <button
                  onClick={() => setShowImportModal(false)}
                  className="px-4 py-2 text-gray-700 hover:text-gray-900"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
