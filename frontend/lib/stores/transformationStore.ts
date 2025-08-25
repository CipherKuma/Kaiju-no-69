import { create } from 'zustand';
import { TransformationState, VincentPolicy } from '@/types/transformation';

interface TransformationStore extends TransformationState {
  setSelectedKaiju: (kaijuId: string) => void;
  updatePolicy: (policy: Partial<VincentPolicy>) => void;
  setTransforming: (isTransforming: boolean) => void;
  setTransactionHash: (hash: string) => void;
  setNftTokenId: (tokenId: string) => void;
  setError: (error: string) => void;
  reset: () => void;
}

const initialState: TransformationState = {
  policy: {
    maxTradeAmount: 100,
    totalBudget: 1000,
    chain: 'ethereum',
    dexes: ['uniswap'],
    riskLevel: 3,
    stopLossPercentage: 10,
    duration: 7
  },
  isTransforming: false
};

export const useTransformationStore = create<TransformationStore>((set) => ({
  ...initialState,
  
  setSelectedKaiju: (kaijuId) => set({ selectedKaiju: kaijuId }),
  
  updatePolicy: (policy) => set((state) => ({
    policy: { ...state.policy, ...policy }
  })),
  
  setTransforming: (isTransforming) => set({ isTransforming }),
  
  setTransactionHash: (transactionHash) => set({ transactionHash }),
  
  setNftTokenId: (nftTokenId) => set({ nftTokenId }),
  
  setError: (error) => set({ error }),
  
  reset: () => set(initialState)
}));