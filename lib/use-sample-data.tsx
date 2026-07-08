'use client';

import React, { createContext, useContext, useState, useCallback } from 'react';
import { SAMPLE_DATA, type SampleDataset } from '@/lib/sample-data';

interface SampleDataContextValue {
  showSampleData: boolean;
  toggleSampleData: () => void;
  enableSampleData: () => void;
  disableSampleData: () => void;
  sampleData: SampleDataset;
}

const SampleDataContext = createContext<SampleDataContextValue>({
  showSampleData: false,
  toggleSampleData: () => {},
  enableSampleData: () => {},
  disableSampleData: () => {},
  sampleData: SAMPLE_DATA,
});

export function SampleDataProvider({ children }: { children: React.ReactNode }) {
  const [showSampleData, setShowSampleData] = useState(false);

  const toggleSampleData = useCallback(() => setShowSampleData(v => !v), []);
  const enableSampleData = useCallback(() => setShowSampleData(true), []);
  const disableSampleData = useCallback(() => setShowSampleData(false), []);

  return (
    <SampleDataContext.Provider
      value={{ showSampleData, toggleSampleData, enableSampleData, disableSampleData, sampleData: SAMPLE_DATA }}
    >
      {children}
    </SampleDataContext.Provider>
  );
}

export function useSampleData() {
  return useContext(SampleDataContext);
}
