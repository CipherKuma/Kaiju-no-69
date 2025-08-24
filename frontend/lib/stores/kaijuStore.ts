import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Kaiju } from '@/types/models';

interface KaijuStore {
  kaijus: Kaiju[];
  selectedKaiju: Kaiju | null;
  setKaijus: (kaijus: Kaiju[]) => void;
  addKaiju: (kaiju: Kaiju) => void;
  updateKaiju: (id: string, updates: Partial<Kaiju>) => void;
  removeKaiju: (id: string) => void;
  selectKaiju: (kaiju: Kaiju | null) => void;
}

export const useKaijuStore = create<KaijuStore>()(
  persist(
    (set) => ({
      kaijus: [],
      selectedKaiju: null,
      
      setKaijus: (kaijus) => set({ kaijus }),
      
      addKaiju: (kaiju) => set((state) => ({
        kaijus: [...state.kaijus, kaiju]
      })),
      
      updateKaiju: (id, updates) => set((state) => ({
        kaijus: state.kaijus.map(k => k.id === id ? { ...k, ...updates } : k)
      })),
      
      removeKaiju: (id) => set((state) => ({
        kaijus: state.kaijus.filter(k => k.id !== id),
        selectedKaiju: state.selectedKaiju?.id === id ? null : state.selectedKaiju
      })),
      
      selectKaiju: (kaiju) => set({ selectedKaiju: kaiju })
    }),
    {
      name: 'kaiju-store'
    }
  )
);