'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { getSupabaseClient } from '@/lib/supabase-client';
import Link from 'next/link';
import Image from 'next/image';
import { logActivity } from '../../../../lib/activities';

export default function EditPropertyPage() {
  const router = useRouter();
  const params = useParams();
  const propertyId = params.id as string;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState('');

  const [formData, setFormData] = useState({
    address: '',
    city: '',
    state: '',
    zip: '',
    property_type: 'single_family',
    purchase_price: '',
    current_value: '',
    down_payment: '',
    loan_amount: '',
    interest_rate: '',
    monthly_rent: '',
    monthly_expenses: '',
    notes: '',
    status: 'acquired',
  });

  const supabase = getSupabaseClient();

  // Fetch property data
  useEffect(() => {
    const fetchProperty = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();

        if (!session) {
          router.push('/login');
          return;
        }

        const { data, error: fetchError } = await supabase
          .from('properties')
          .select('*')
          .eq('id', propertyId)
          .eq('user_id', session.user.id)
          .single();

        if (fetchError) throw fetchError;

        // Type cast to work around singleton pattern type inference
        const property = data as any; // eslint-disable-line @typescript-eslint/no-explicit-any

        if (property) {
          setFormData({
            address: property.address || '',
            city: property.city || '',
            state: property.state || '',
            zip: property.zip || '',
            property_type: property.property_type || 'single_family',
            purchase_price: property.purchase_price?.toString() || '',
            current_value: property.current_value?.toString() || '',
            down_payment: property.down_payment?.toString() || '',
            loan_amount: property.loan_amount?.toString() || '',
            interest_rate: property.interest_rate?.toString() || '',
            monthly_rent: property.monthly_rent?.toString() || '',
            monthly_expenses: property.monthly_expenses?.toString() || '',
            notes: property.notes || '',
            status: property.status || 'acquired',
          });
        }

        setLoading(false);
      } catch (err) {
        console.error('Error fetching property:', err);
        setError('Failed to load property');
        setLoading(false);
      }
    };

    fetchProperty();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [propertyId]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');

    try {
      const { data: { session } } = await supabase.auth.getSession();

      if (!session) {
        router.push('/login');
        return;
      }

      const propertyData = {
        address: formData.address,
        city: formData.city,
        state: formData.state,
        zip: formData.zip || null,
        property_type: formData.property_type,
        purchase_price: parseFloat(formData.purchase_price),
        current_value: parseFloat(formData.current_value),
        down_payment: formData.down_payment ? parseFloat(formData.down_payment) : null,
        loan_amount: formData.loan_amount ? parseFloat(formData.loan_amount) : null,
        interest_rate: formData.interest_rate ? parseFloat(formData.interest_rate) : null,
        monthly_rent: parseFloat(formData.monthly_rent),
        monthly_expenses: parseFloat(formData.monthly_expenses),
        notes: formData.notes || null,
        status: formData.status,
        updated_at: new Date().toISOString(),
      };

      const { error: updateError } = await supabase
        .from('properties')
        // @ts-expect-error - Singleton pattern causes type inference issues
        .update(propertyData)
        .eq('id', propertyId)
        .eq('user_id', session.user.id);

      if (updateError) throw updateError;

      // Log activity (non-blocking - don't fail if activity logging fails)
      logActivity(
        `Updated property: ${formData.address}, ${formData.city}`,
        'property',
        propertyId,
        {
          address: formData.address,
          city: formData.city,
          monthly_rent: formData.monthly_rent,
          monthly_expenses: formData.monthly_expenses
        }
      ).catch(err => console.error('Failed to log activity:', err));

      router.push('/dashboard');
      router.refresh();

    } catch (err) {
      console.error('Error updating property:', err);
      // Show detailed error message
      let errorMessage = 'Failed to update property';
      if (err instanceof Error) {
        errorMessage = err.message;
      } else if (typeof err === 'object' && err !== null) {
        errorMessage = JSON.stringify(err);
      }
      setError(errorMessage);
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    const confirmed = window.confirm(
      `Are you sure you want to delete "${formData.address}"?\n\nThis action cannot be undone.`
    );

    if (!confirmed) return;

    setDeleting(true);
    setError('');

    try {
      const { data: { session } } = await supabase.auth.getSession();

      if (!session) {
        router.push('/login');
        return;
      }

      const { error: deleteError } = await supabase
        .from('properties')
        .delete()
        .eq('id', propertyId)
        .eq('user_id', session.user.id);

      if (deleteError) throw deleteError;

      // Log activity (non-blocking)
      logActivity(
        `Deleted property: ${formData.address}, ${formData.city}`,
        'property',
        propertyId,
        { address: formData.address }
      ).catch(err => console.error('Failed to log activity:', err));

      router.push('/dashboard');
      router.refresh();

    } catch (err) {
      console.error('Error deleting property:', err);
      let errorMessage = 'Failed to delete property';
      if (err instanceof Error) {
        errorMessage = err.message;
      } else if (typeof err === 'object' && err !== null) {
        errorMessage = JSON.stringify(err);
      }
      setError(errorMessage);
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-16 w-16 border-4 border-solid border-purple-600 border-r-transparent mb-4"></div>
          <div className="text-white text-xl">Loading property...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Header */}
      <header className="border-b border-white/10 backdrop-blur-md bg-slate-900/50 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
          <Link href="/" style={{ cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
            <Image src="/logo 3.png" alt="ARGORA DEALS" width={140} height={47} style={{ objectFit: 'contain' }} />
          </Link>
          <Link href="/dashboard" className="text-white/80 hover:text-white transition-colors">
            ← Back to Dashboard
          </Link>
        </div>
      </header>

      {/* Form */}
      <div className="max-w-4xl mx-auto px-6 py-12">
        <div className="bg-white/5 backdrop-blur border border-white/10 rounded-2xl p-8">
          <h1 className="text-4xl font-bold text-white mb-2">Edit Property</h1>
          <p className="text-white/60 mb-8">
            Update property details - metrics will auto-recalculate
          </p>

          {error && (
            <div className="bg-red-500/20 border border-red-500/50 rounded-lg p-4 mb-6">
              <p className="text-red-300 text-sm">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Property Location */}
            <div>
              <h2 className="text-2xl font-bold text-white mb-4">Property Location</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="md:col-span-2">
                  <label className="block text-white/80 text-sm font-semibold mb-2">
                    Street Address *
                  </label>
                  <input
                    type="text"
                    name="address"
                    placeholder="123 Main Street"
                    value={formData.address}
                    onChange={handleChange}
                    className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/40 focus:outline-none focus:border-purple-500 transition"
                    required
                  />
                </div>

                <div>
                  <label className="block text-white/80 text-sm font-semibold mb-2">
                    City *
                  </label>
                  <input
                    type="text"
                    name="city"
                    placeholder="Edmonton, Austin, Toronto, etc."
                    value={formData.city}
                    onChange={handleChange}
                    className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/40 focus:outline-none focus:border-purple-500 transition"
                    required
                  />
                </div>

                <div>
                  <label className="block text-white/80 text-sm font-semibold mb-2">
                    State/Province/Region *
                  </label>
                  <input
                    type="text"
                    name="state"
                    placeholder="TX, AB, Ontario, etc."
                    value={formData.state}
                    onChange={handleChange}
                    className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/40 focus:outline-none focus:border-purple-500 transition"
                    required
                  />
                </div>

                <div>
                  <label className="block text-white/80 text-sm font-semibold mb-2">
                    Postal/ZIP Code
                  </label>
                  <input
                    type="text"
                    name="zip"
                    placeholder="78701, T6W 2T8, etc."
                    value={formData.zip}
                    onChange={handleChange}
                    className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/40 focus:outline-none focus:border-purple-500 transition"
                  />
                </div>

                <div>
                  <label className="block text-white/80 text-sm font-semibold mb-2">
                    Property Type *
                  </label>
                  <select
                    name="property_type"
                    value={formData.property_type}
                    onChange={handleChange}
                    className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:border-purple-500 transition"
                    required
                  >
                    <option value="single_family">Single Family</option>
                    <option value="multi_family">Multi Family</option>
                    <option value="condo">Condo</option>
                    <option value="townhouse">Townhouse</option>
                    <option value="commercial">Commercial</option>
                  </select>
                </div>

                <div>
                  <label className="block text-white/80 text-sm font-semibold mb-2">
                    Status *
                  </label>
                  <select
                    name="status"
                    value={formData.status}
                    onChange={handleChange}
                    className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:border-purple-500 transition"
                    required
                  >
                    <option value="analyzing">Analyzing</option>
                    <option value="acquired">Acquired</option>
                    <option value="passed">Passed</option>
                    <option value="sold">Sold</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Financial Details */}
            <div>
              <h2 className="text-2xl font-bold text-white mb-4">Financial Details</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-white/80 text-sm font-semibold mb-2">
                    Purchase Price *
                  </label>
                  <input
                    type="number"
                    name="purchase_price"
                    placeholder="350000"
                    value={formData.purchase_price}
                    onChange={handleChange}
                    className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/40 focus:outline-none focus:border-purple-500 transition"
                    required
                    min="0"
                    step="0.01"
                  />
                </div>

                <div>
                  <label className="block text-white/80 text-sm font-semibold mb-2">
                    Current Value *
                  </label>
                  <input
                    type="number"
                    name="current_value"
                    placeholder="375000"
                    value={formData.current_value}
                    onChange={handleChange}
                    className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/40 focus:outline-none focus:border-purple-500 transition"
                    required
                    min="0"
                    step="0.01"
                  />
                </div>

                <div>
                  <label className="block text-white/80 text-sm font-semibold mb-2">
                    Down Payment
                  </label>
                  <input
                    type="number"
                    name="down_payment"
                    placeholder="70000"
                    value={formData.down_payment}
                    onChange={handleChange}
                    className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/40 focus:outline-none focus:border-purple-500 transition"
                    min="0"
                    step="0.01"
                  />
                </div>

                <div>
                  <label className="block text-white/80 text-sm font-semibold mb-2">
                    Loan Amount
                  </label>
                  <input
                    type="number"
                    name="loan_amount"
                    placeholder="280000"
                    value={formData.loan_amount}
                    onChange={handleChange}
                    className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/40 focus:outline-none focus:border-purple-500 transition"
                    min="0"
                    step="0.01"
                  />
                </div>

                <div>
                  <label className="block text-white/80 text-sm font-semibold mb-2">
                    Interest Rate (%)
                  </label>
                  <input
                    type="number"
                    name="interest_rate"
                    placeholder="6.5"
                    value={formData.interest_rate}
                    onChange={handleChange}
                    className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/40 focus:outline-none focus:border-purple-500 transition"
                    min="0"
                    max="100"
                    step="0.01"
                  />
                </div>
              </div>
            </div>

            {/* Income & Expenses - QUICK EDIT SECTION */}
            <div className="bg-gradient-to-r from-green-500/10 to-emerald-500/10 border border-green-500/30 rounded-xl p-6">
              <h2 className="text-2xl font-bold text-white mb-2 flex items-center gap-2">
                ⚡ Income & Expenses
                <span className="text-xs bg-green-500/20 text-green-400 px-2 py-1 rounded-full">Quick Edit</span>
              </h2>
              <p className="text-white/60 text-sm mb-4">
                Update these to recalculate cash flow instantly
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-white/80 text-sm font-semibold mb-2">
                    Monthly Rent *
                  </label>
                  <input
                    type="number"
                    name="monthly_rent"
                    placeholder="2500"
                    value={formData.monthly_rent}
                    onChange={handleChange}
                    className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/40 focus:outline-none focus:border-purple-500 transition"
                    required
                    min="0"
                    step="0.01"
                  />
                </div>

                <div>
                  <label className="block text-white/80 text-sm font-semibold mb-2">
                    Monthly Expenses *
                  </label>
                  <input
                    type="number"
                    name="monthly_expenses"
                    placeholder="800"
                    value={formData.monthly_expenses}
                    onChange={handleChange}
                    className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/40 focus:outline-none focus:border-purple-500 transition"
                    required
                    min="0"
                    step="0.01"
                  />
                  <p className="text-white/40 text-xs mt-2">
                    Include: taxes, insurance, maintenance, HOA, property management
                  </p>
                </div>
              </div>
            </div>

            {/* Notes */}
            <div>
              <label className="block text-white/80 text-sm font-semibold mb-2">
                Notes (Optional)
              </label>
              <textarea
                name="notes"
                placeholder="Additional details about this property..."
                value={formData.notes}
                onChange={handleChange}
                rows={4}
                className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/40 focus:outline-none focus:border-purple-500 transition resize-none"
              />
            </div>

            {/* Submit Button */}
            <div className="flex gap-4">
              <button
                type="submit"
                disabled={saving || deleting}
                className="flex-1 px-8 py-4 bg-gradient-to-r from-purple-600 to-blue-600 rounded-lg text-white font-semibold text-lg hover:opacity-90 transition disabled:opacity-50"
              >
                {saving ? 'Saving Changes...' : 'Save Changes'}
              </button>

              <Link
                href="/dashboard"
                className="px-8 py-4 bg-white/10 border border-white/20 rounded-lg text-white font-semibold text-lg hover:bg-white/20 transition text-center"
              >
                Cancel
              </Link>
            </div>

            {/* Delete Property Section */}
            <div className="border-t border-white/10 pt-8">
              <h3 className="text-xl font-bold text-white mb-2">Danger Zone</h3>
              <p className="text-white/60 text-sm mb-4">
                Once you delete a property, there is no going back. Please be certain.
              </p>
              <button
                type="button"
                onClick={handleDelete}
                disabled={saving || deleting}
                className="px-6 py-3 bg-red-600/20 border border-red-500/50 rounded-lg text-red-400 font-semibold hover:bg-red-600/30 transition disabled:opacity-50"
              >
                {deleting ? 'Deleting Property...' : '🗑️ Delete Property'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
