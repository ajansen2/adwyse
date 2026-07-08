'use client';

import { useSampleData } from '@/lib/use-sample-data';

/**
 * Renders an amber "Sample Data" badge with a dismiss button when sample mode is active.
 * Drop this into any widget header — it only renders when showSampleData is true.
 */
export function SampleDataBadge() {
  const { showSampleData, disableSampleData } = useSampleData();
  if (!showSampleData) return null;

  return (
    <div className="flex items-center gap-2">
      <span className="px-2 py-1 text-xs font-medium bg-amber-500/20 text-amber-400 border border-amber-500/30 rounded-full">
        Sample Data
      </span>
      <button
        onClick={disableSampleData}
        className="text-white/40 hover:text-white/70 text-xs underline underline-offset-2 transition"
      >
        Exit preview
      </button>
    </div>
  );
}

export default SampleDataBadge;
