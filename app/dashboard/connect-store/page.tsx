'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getSupabaseClient } from '@/lib/supabase-client';
import { isEmbeddedInShopify } from '@/lib/shopify-app-bridge';
import Link from 'next/link';
import Image from 'next/image';

export default function ConnectStorePage() {
  // This page is disabled to comply with Shopify App Store requirements
  // Apps must be installed only through the Shopify App Store, not via manual shop URL entry

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center p-6">
      <div className="max-w-lg w-full bg-blue-500/10 border-2 border-blue-500/50 rounded-xl p-8 text-center">
        <div className="w-16 h-16 bg-blue-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <h2 className="text-2xl font-bold text-white mb-3">Install from Shopify App Store</h2>
        <p className="text-white/80 mb-6">
          To use Argora Cart Recovery, please install the app from the Shopify App Store.
        </p>
        <a
          href="https://apps.shopify.com"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-block bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-semibold py-3 px-8 rounded-lg shadow-lg transition-all transform hover:scale-105"
        >
          Go to Shopify App Store
        </a>
        <p className="text-white/60 text-sm mt-6">
          Search for "Argora Cart Recovery" or contact support at support@argora.ai
        </p>
      </div>
    </div>
  );
}
