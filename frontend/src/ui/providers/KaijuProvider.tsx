'use client';

import { useEffect } from 'react';
import { useKaijuStore } from '@/lib/stores/kaijuStore';
import { mockKaijus } from '@/lib/utils/mockKaijus';

export function KaijuProvider({ children }: { children: React.ReactNode }) {
  const { kaijus, setKaijus } = useKaijuStore();

  useEffect(() => {
    // Initialize with mock data if store is empty
    if (kaijus.length === 0) {
      setKaijus(mockKaijus);
    }
  }, [kaijus.length, setKaijus]);

  return <>{children}</>;
}