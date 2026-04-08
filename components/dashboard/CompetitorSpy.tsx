'use client';

import { useState, useEffect } from 'react';
import {
  Eye,
  Plus,
  ExternalLink,
  Search,
  Trash2,
  Globe,
  Clock,
  X,
  Loader2,
  Users,
  TrendingUp,
} from 'lucide-react';

interface Competitor {
  id: string;
  competitor_name: string;
  facebook_page_url: string | null;
  website_url: string | null;
  industry: string | null;
  notes: string | null;
  is_active: boolean;
  last_checked_at: string | null;
  created_at: string;
}

interface CompetitorSpyProps {
  storeId: string;
}

export function CompetitorSpy({ storeId }: CompetitorSpyProps) {
  const [competitors, setCompetitors] = useState<Competitor[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Form state
  const [newCompetitor, setNewCompetitor] = useState({
    name: '',
    facebookUrl: '',
    websiteUrl: '',
    industry: '',
    notes: '',
  });
  const [saving, setSaving] = useState(false);

  const fetchCompetitors = async () => {
    try {
      const response = await fetch(`/api/competitors?store_id=${storeId}`);
      if (response.ok) {
        const data = await response.json();
        setCompetitors(data.competitors || []);
      }
    } catch (error) {
      console.error('Error fetching competitors:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (storeId) {
      fetchCompetitors();
    }
  }, [storeId]);

  const handleAddCompetitor = async () => {
    if (!newCompetitor.name.trim()) return;

    setSaving(true);
    try {
      const response = await fetch('/api/competitors', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          store_id: storeId,
          competitor_name: newCompetitor.name,
          facebook_page_url: newCompetitor.facebookUrl || null,
          website_url: newCompetitor.websiteUrl || null,
          industry: newCompetitor.industry || null,
          notes: newCompetitor.notes || null,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setCompetitors([data, ...competitors]);
        setShowAddModal(false);
        setNewCompetitor({ name: '', facebookUrl: '', websiteUrl: '', industry: '', notes: '' });
      }
    } catch (error) {
      console.error('Error adding competitor:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteCompetitor = async (id: string) => {
    try {
      const response = await fetch(`/api/competitors?id=${id}&store_id=${storeId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setCompetitors(competitors.filter((c) => c.id !== id));
      }
    } catch (error) {
      console.error('Error deleting competitor:', error);
    }
  };

  const openAdLibrary = (competitorName: string) => {
    const url = `https://www.facebook.com/ads/library/?active_status=active&ad_type=all&country=US&media_type=all&q=${encodeURIComponent(competitorName)}`;
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const formatTimeAgo = (dateStr: string | null) => {
    if (!dateStr) return 'Never checked';
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));

    if (diffDays > 0) return `${diffDays}d ago`;
    if (diffHours > 0) return `${diffHours}h ago`;
    return 'Just now';
  };

  if (loading) {
    return (
      <div className="bg-white/5 backdrop-blur border border-white/10 rounded-xl p-6">
        <div className="flex items-center gap-2 mb-4">
          <Eye className="w-5 h-5 text-orange-400" />
          <h3 className="font-semibold text-white">Competitor Spy</h3>
        </div>
        <div className="animate-pulse space-y-3">
          <div className="h-10 bg-white/10 rounded" />
          <div className="h-16 bg-white/10 rounded" />
          <div className="h-16 bg-white/10 rounded" />
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="bg-white/5 backdrop-blur border border-white/10 rounded-xl overflow-hidden">
        {/* Header */}
        <div className="p-4 border-b border-white/10">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Eye className="w-5 h-5 text-orange-400" />
              <h3 className="font-semibold text-white">Competitor Spy</h3>
              <span className="text-xs text-white/40 bg-white/10 px-2 py-0.5 rounded-full">
                {competitors.length} tracking
              </span>
            </div>
            <button
              onClick={() => setShowAddModal(true)}
              className="flex items-center gap-1 text-xs font-medium text-orange-400 hover:text-orange-300 transition"
            >
              <Plus className="w-4 h-4" />
              Add
            </button>
          </div>
        </div>

        {/* Quick Search */}
        <div className="p-3 border-b border-white/5">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
            <input
              type="text"
              placeholder="Search Meta Ad Library..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && searchQuery.trim()) {
                  openAdLibrary(searchQuery);
                }
              }}
              className="w-full bg-white/5 border border-white/10 rounded-lg pl-9 pr-3 py-2 text-sm text-white placeholder:text-white/40 focus:outline-none focus:border-orange-500/50"
            />
            {searchQuery && (
              <button
                onClick={() => openAdLibrary(searchQuery)}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-xs bg-orange-500/20 text-orange-400 px-2 py-1 rounded hover:bg-orange-500/30 transition"
              >
                Search
              </button>
            )}
          </div>
        </div>

        {/* Competitors List */}
        {competitors.length === 0 ? (
          <div className="p-6 text-center">
            <Users className="w-10 h-10 text-white/20 mx-auto mb-2" />
            <p className="text-sm text-white/60 mb-1">No competitors tracked yet</p>
            <p className="text-xs text-white/40 mb-3">
              Add competitors to spy on their Facebook & Instagram ads
            </p>
            <button
              onClick={() => setShowAddModal(true)}
              className="text-sm text-orange-400 hover:text-orange-300 transition"
            >
              + Add your first competitor
            </button>
          </div>
        ) : (
          <div className="divide-y divide-white/5 max-h-[320px] overflow-y-auto">
            {competitors.map((competitor) => (
              <div
                key={competitor.id}
                className="p-3 hover:bg-white/[0.02] transition-colors group"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-white text-sm truncate">
                        {competitor.competitor_name}
                      </span>
                      {competitor.industry && (
                        <span className="text-[10px] text-white/40 bg-white/10 px-1.5 py-0.5 rounded">
                          {competitor.industry}
                        </span>
                      )}
                    </div>
                    {competitor.notes && (
                      <p className="text-xs text-white/50 mt-0.5 line-clamp-1">
                        {competitor.notes}
                      </p>
                    )}
                    <div className="flex items-center gap-3 mt-1.5">
                      <button
                        onClick={() => openAdLibrary(competitor.competitor_name)}
                        className="flex items-center gap-1 text-[10px] text-orange-400 hover:text-orange-300 transition"
                      >
                        <Eye className="w-3 h-3" />
                        View Ads
                      </button>
                      {competitor.website_url && (
                        <a
                          href={competitor.website_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1 text-[10px] text-white/40 hover:text-white/60 transition"
                        >
                          <Globe className="w-3 h-3" />
                          Website
                        </a>
                      )}
                      {competitor.facebook_page_url && (
                        <a
                          href={competitor.facebook_page_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1 text-[10px] text-blue-400 hover:text-blue-300 transition"
                        >
                          <ExternalLink className="w-3 h-3" />
                          Facebook
                        </a>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-white/30 flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {formatTimeAgo(competitor.last_checked_at)}
                    </span>
                    <button
                      onClick={() => handleDeleteCompetitor(competitor.id)}
                      className="p-1 text-white/20 hover:text-red-400 opacity-0 group-hover:opacity-100 transition"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Footer */}
        <div className="p-3 bg-gradient-to-r from-orange-500/10 to-red-500/10 border-t border-white/5">
          <div className="flex items-center gap-2 text-xs text-white/60">
            <TrendingUp className="w-3.5 h-3.5 text-orange-400" />
            <span>Spy on competitor ads to get creative inspiration</span>
          </div>
        </div>
      </div>

      {/* Add Competitor Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-slate-900 border border-white/10 rounded-xl w-full max-w-md overflow-hidden">
            <div className="p-4 border-b border-white/10 flex items-center justify-between">
              <h3 className="font-semibold text-white">Add Competitor</h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="p-1 text-white/40 hover:text-white/60 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 space-y-4">
              <div>
                <label className="block text-xs font-medium text-white/60 mb-1">
                  Competitor Name *
                </label>
                <input
                  type="text"
                  placeholder="e.g., Nike, Adidas, Gymshark"
                  value={newCompetitor.name}
                  onChange={(e) => setNewCompetitor({ ...newCompetitor, name: e.target.value })}
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-orange-500/50"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-white/60 mb-1">
                  Facebook Page URL
                </label>
                <input
                  type="url"
                  placeholder="https://facebook.com/brandname"
                  value={newCompetitor.facebookUrl}
                  onChange={(e) => setNewCompetitor({ ...newCompetitor, facebookUrl: e.target.value })}
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-orange-500/50"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-white/60 mb-1">
                  Website URL
                </label>
                <input
                  type="url"
                  placeholder="https://competitor.com"
                  value={newCompetitor.websiteUrl}
                  onChange={(e) => setNewCompetitor({ ...newCompetitor, websiteUrl: e.target.value })}
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-orange-500/50"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-white/60 mb-1">
                  Industry
                </label>
                <input
                  type="text"
                  placeholder="e.g., Fitness Apparel, Skincare"
                  value={newCompetitor.industry}
                  onChange={(e) => setNewCompetitor({ ...newCompetitor, industry: e.target.value })}
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-orange-500/50"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-white/60 mb-1">
                  Notes
                </label>
                <textarea
                  placeholder="What to watch for, their strategy, etc."
                  value={newCompetitor.notes}
                  onChange={(e) => setNewCompetitor({ ...newCompetitor, notes: e.target.value })}
                  rows={2}
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-orange-500/50 resize-none"
                />
              </div>
            </div>

            <div className="p-4 border-t border-white/10 flex justify-end gap-2">
              <button
                onClick={() => setShowAddModal(false)}
                className="px-4 py-2 text-sm text-white/60 hover:text-white/80 transition"
              >
                Cancel
              </button>
              <button
                onClick={handleAddCompetitor}
                disabled={!newCompetitor.name.trim() || saving}
                className="px-4 py-2 text-sm font-medium bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {saving && <Loader2 className="w-4 h-4 animate-spin" />}
                Add Competitor
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default CompetitorSpy;
