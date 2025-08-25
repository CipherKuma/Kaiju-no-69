export type RiskLevel = 1 | 2 | 3 | 4 | 5;
export type TransformationDuration = 7 | 14 | 30;
export type SupportedChain = 'ethereum' | 'polygon' | 'arbitrum';
export type SupportedDEX = 'uniswap' | '1inch' | 'sushiswap';
export type ShadowRarity = 'common' | 'rare' | 'epic' | 'legendary';

export interface VincentPolicy {
  maxTradeAmount: number;
  totalBudget: number;
  chains: SupportedChain[];
  dexes: SupportedDEX[];
  riskLevel: RiskLevel;
  stopLossPercentage: number;
  duration: TransformationDuration;
}

export interface ShadowTrait {
  name: string;
  value: string;
  rarity: ShadowRarity;
}

export interface ShadowNFTMetadata {
  kaijuId: string;
  name: string;
  rarity: ShadowRarity;
  traits: ShadowTrait[];
  powerLevel: number;
  transformedAt: number;
  policy: VincentPolicy;
}

export interface TransformationCost {
  entryFee: bigint;
  gasEstimate: bigint;
  totalCostWei: bigint;
  totalCostUSD: number;
}

export interface TransformationState {
  selectedKaiju?: string;
  policy: Partial<VincentPolicy>;
  isTransforming: boolean;
  transactionHash?: string;
  nftTokenId?: string;
  error?: string;
}

export const RISK_LEVEL_DESCRIPTIONS: Record<RiskLevel, string> = {
  1: "Conservative - Low risk, steady returns",
  2: "Cautious - Moderate risk, balanced approach",
  3: "Balanced - Standard risk, optimal returns",
  4: "Aggressive - High risk, high potential",
  5: "Degen - Maximum risk, maximum gains"
};

export const DURATION_PRICING: Record<TransformationDuration, number> = {
  7: 0.01,  // 0.01 ETH
  14: 0.018, // 0.018 ETH
  30: 0.035  // 0.035 ETH
};

export const CHAIN_INFO: Record<SupportedChain, { name: string; icon: string; color: string }> = {
  ethereum: { name: 'Ethereum', icon: '⟠', color: '#627EEA' },
  polygon: { name: 'Polygon', icon: '🟣', color: '#8247E5' },
  arbitrum: { name: 'Arbitrum', icon: '🔵', color: '#28A0F0' }
};

export const DEX_INFO: Record<SupportedDEX, { name: string; logo: string }> = {
  uniswap: { name: 'Uniswap', logo: '🦄' },
  '1inch': { name: '1inch', logo: '🐴' },
  sushiswap: { name: 'SushiSwap', logo: '🍣' }
};