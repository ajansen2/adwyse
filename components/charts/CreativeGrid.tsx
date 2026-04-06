'use client';

interface Creative {
  id: string;
  name: string;
  thumbnailUrl?: string;
  spend: number;
  revenue: number;
  roas: number;
  clicks: number;
  impressions: number;
  status?: 'active' | 'paused' | 'fatigued';
}

interface CreativeGridProps {
  creatives: Creative[];
  onCreativeClick?: (creative: Creative) => void;
  columns?: 2 | 3 | 4;
}

export function CreativeGrid({
  creatives,
  onCreativeClick,
  columns = 3
}: CreativeGridProps) {
  const formatCurrency = (value: number) => {
    if (value >= 1000000) return `$${(value / 1000000).toFixed(1)}M`;
    if (value >= 1000) return `$${(value / 1000).toFixed(1)}K`;
    return `$${value.toFixed(0)}`;
  };

  const formatNumber = (value: number) => {
    if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`;
    if (value >= 1000) return `${(value / 1000).toFixed(1)}K`;
    return value.toFixed(0);
  };

  const getStatusColor = (status?: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'paused':
        return 'bg-yellow-100 text-yellow-800';
      case 'fatigued':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getRoasColor = (roas: number) => {
    if (roas >= 3) return 'text-green-600';
    if (roas >= 2) return 'text-emerald-600';
    if (roas >= 1) return 'text-yellow-600';
    return 'text-red-600';
  };

  const gridCols = {
    2: 'grid-cols-1 sm:grid-cols-2',
    3: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3',
    4: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'
  };

  if (creatives.length === 0) {
    return (
      <div className="flex items-center justify-center h-48 text-gray-500">
        No creative data available
      </div>
    );
  }

  return (
    <div className={`grid ${gridCols[columns]} gap-4`}>
      {creatives.map((creative) => (
        <div
          key={creative.id}
          className={`bg-white rounded-lg border border-gray-200 overflow-hidden hover:shadow-md transition-shadow ${
            onCreativeClick ? 'cursor-pointer' : ''
          }`}
          onClick={() => onCreativeClick?.(creative)}
        >
          {/* Thumbnail */}
          <div className="relative aspect-video bg-gray-100">
            {creative.thumbnailUrl ? (
              <img
                src={creative.thumbnailUrl}
                alt={creative.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <svg
                  className="w-12 h-12 text-gray-300"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                  />
                </svg>
              </div>
            )}

            {/* Status badge */}
            {creative.status && (
              <span
                className={`absolute top-2 right-2 px-2 py-0.5 text-xs font-medium rounded-full ${getStatusColor(
                  creative.status
                )}`}
              >
                {creative.status}
              </span>
            )}
          </div>

          {/* Info */}
          <div className="p-3">
            <h4 className="text-sm font-medium text-gray-900 truncate mb-2">
              {creative.name}
            </h4>

            {/* Metrics */}
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div>
                <span className="text-gray-500">Spend</span>
                <p className="font-medium text-gray-900">
                  {formatCurrency(creative.spend)}
                </p>
              </div>
              <div>
                <span className="text-gray-500">Revenue</span>
                <p className="font-medium text-gray-900">
                  {formatCurrency(creative.revenue)}
                </p>
              </div>
              <div>
                <span className="text-gray-500">ROAS</span>
                <p className={`font-semibold ${getRoasColor(creative.roas)}`}>
                  {creative.roas.toFixed(2)}x
                </p>
              </div>
              <div>
                <span className="text-gray-500">Clicks</span>
                <p className="font-medium text-gray-900">
                  {formatNumber(creative.clicks)}
                </p>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

export default CreativeGrid;
