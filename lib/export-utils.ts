/**
 * Export utilities for CSV and PDF generation
 */

export interface ExportColumn {
  key: string;
  header: string;
  formatter?: (value: any) => string;
}

/**
 * Convert data to CSV string
 */
export function toCSV(data: any[], columns: ExportColumn[]): string {
  // Header row
  const headers = columns.map(col => `"${col.header}"`).join(',');

  // Data rows
  const rows = data.map(item => {
    return columns.map(col => {
      let value = item[col.key];

      // Apply formatter if provided
      if (col.formatter) {
        value = col.formatter(value);
      }

      // Handle null/undefined
      if (value === null || value === undefined) {
        value = '';
      }

      // Escape quotes and wrap in quotes
      const stringValue = String(value).replace(/"/g, '""');
      return `"${stringValue}"`;
    }).join(',');
  });

  return [headers, ...rows].join('\n');
}

/**
 * Download CSV file
 */
export function downloadCSV(data: any[], columns: ExportColumn[], filename: string) {
  const csv = toCSV(data, columns);
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);

  const link = document.createElement('a');
  link.href = url;
  link.download = `${filename}_${new Date().toISOString().split('T')[0]}.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Order export columns
 */
export const orderExportColumns: ExportColumn[] = [
  { key: 'order_number', header: 'Order Number' },
  { key: 'order_created_at', header: 'Date', formatter: (v) => v ? new Date(v).toLocaleDateString() : '' },
  { key: 'customer_email', header: 'Customer Email' },
  { key: 'total_price', header: 'Total', formatter: (v) => `$${Number(v || 0).toFixed(2)}` },
  { key: 'currency', header: 'Currency' },
  { key: 'attributed_platform', header: 'Attribution Source' },
  { key: 'utm_source', header: 'UTM Source' },
  { key: 'utm_medium', header: 'UTM Medium' },
  { key: 'utm_campaign', header: 'UTM Campaign' },
  { key: 'cogs', header: 'COGS', formatter: (v) => v ? `$${Number(v).toFixed(2)}` : '' },
  { key: 'gross_profit', header: 'Gross Profit', formatter: (v) => v ? `$${Number(v).toFixed(2)}` : '' },
];

/**
 * Campaign export columns
 */
export const campaignExportColumns: ExportColumn[] = [
  { key: 'name', header: 'Campaign Name' },
  { key: 'platform', header: 'Platform' },
  { key: 'status', header: 'Status' },
  { key: 'total_spend', header: 'Total Spend', formatter: (v) => `$${Number(v || 0).toFixed(2)}` },
  { key: 'total_revenue', header: 'Revenue', formatter: (v) => `$${Number(v || 0).toFixed(2)}` },
  { key: 'total_orders', header: 'Orders' },
  { key: 'impressions', header: 'Impressions' },
  { key: 'clicks', header: 'Clicks' },
  { key: 'conversions', header: 'Conversions' },
  { key: 'roas', header: 'ROAS', formatter: (v) => `${Number(v || 0).toFixed(2)}x` },
  { key: 'ctr', header: 'CTR', formatter: (v) => v ? `${(Number(v) * 100).toFixed(2)}%` : '' },
  { key: 'cpc', header: 'CPC', formatter: (v) => v ? `$${Number(v).toFixed(2)}` : '' },
];

/**
 * Creative export columns
 */
export const creativeExportColumns: ExportColumn[] = [
  { key: 'ad_name', header: 'Creative Name' },
  { key: 'campaign_name', header: 'Campaign' },
  { key: 'platform', header: 'Platform' },
  { key: 'creative_type', header: 'Type' },
  { key: 'status', header: 'Status' },
  { key: 'spend', header: 'Spend', formatter: (v) => `$${Number(v || 0).toFixed(2)}` },
  { key: 'impressions', header: 'Impressions' },
  { key: 'clicks', header: 'Clicks' },
  { key: 'conversions', header: 'Conversions' },
  { key: 'attributed_revenue', header: 'Revenue', formatter: (v) => `$${Number(v || 0).toFixed(2)}` },
  { key: 'roas', header: 'ROAS', formatter: (v) => `${Number(v || 0).toFixed(2)}x` },
];

/**
 * LTV export columns
 */
export const ltvExportColumns: ExportColumn[] = [
  { key: 'customer_email', header: 'Customer Email' },
  { key: 'first_order_date', header: 'First Order', formatter: (v) => v ? new Date(v).toLocaleDateString() : '' },
  { key: 'last_order_date', header: 'Last Order', formatter: (v) => v ? new Date(v).toLocaleDateString() : '' },
  { key: 'total_orders', header: 'Total Orders' },
  { key: 'total_revenue', header: 'Total LTV', formatter: (v) => `$${Number(v || 0).toFixed(2)}` },
  { key: 'avg_order_value', header: 'Avg Order Value', formatter: (v) => `$${Number(v || 0).toFixed(2)}` },
  { key: 'acquisition_source', header: 'Acquisition Source' },
];

/**
 * Attribution export columns
 */
export const attributionExportColumns: ExportColumn[] = [
  { key: 'platform', header: 'Platform' },
  { key: 'orders', header: 'Orders' },
  { key: 'revenue', header: 'Revenue', formatter: (v) => `$${Number(v || 0).toFixed(2)}` },
  { key: 'spend', header: 'Spend', formatter: (v) => `$${Number(v || 0).toFixed(2)}` },
  { key: 'roas', header: 'ROAS', formatter: (v) => `${Number(v || 0).toFixed(2)}x` },
  { key: 'percentage', header: '% of Revenue', formatter: (v) => `${Number(v || 0).toFixed(1)}%` },
];
