'use client';

import { useState } from 'react';
import { downloadCSV, ExportColumn } from '@/lib/export-utils';

interface ExportButtonProps {
  data: any[];
  columns: ExportColumn[];
  filename: string;
  label?: string;
  className?: string;
}

export function ExportButton({ data, columns, filename, label = 'Export CSV', className = '' }: ExportButtonProps) {
  const [exporting, setExporting] = useState(false);

  const handleExport = async () => {
    if (data.length === 0) return;

    setExporting(true);

    // Small delay for UX
    await new Promise(resolve => setTimeout(resolve, 300));

    try {
      downloadCSV(data, columns, filename);
    } catch (error) {
      console.error('Export failed:', error);
    } finally {
      setExporting(false);
    }
  };

  return (
    <button
      onClick={handleExport}
      disabled={exporting || data.length === 0}
      className={`inline-flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 disabled:bg-white/5 disabled:cursor-not-allowed text-white text-sm font-medium rounded-lg transition ${className}`}
    >
      {exporting ? (
        <>
          <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
          Exporting...
        </>
      ) : (
        <>
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
          </svg>
          {label}
        </>
      )}
    </button>
  );
}

export default ExportButton;
