// Core data models based on UI_DOC.md specifications

export interface User {
  address: string;
  shadows: Shadow[];
  policies: TradingPolicy[];
  vincentAgent: VincentAgent;
}

export interface Kaiju {
  id: string;
  name: string;
  imageUrl: string;
  performance: PerformanceData;
  territory: string; // territory id
  isOnline: boolean;
  shadows: Shadow[];
  // Additional fields for discovery
  traderTitle?: string;
  entryFee: number;
  profitShare: number; // percentage
  description?: string;
  tradingStyle?: 'aggressive' | 'conservative' | 'balanced' | 'arbitrage';
  popularity?: number;
  stats?: {
    winRate: number;
    totalTrades: number;
    avgProfit: number;
    riskLevel: number;
  };
}

export interface Shadow {
  kaijuId: string;
  nftId: string;
  expiresAt: Date;
  policies: TradingPolicy[];
  currentPL: number;
  // Additional fields
  userId: string;
  createdAt: Date;
  isActive: boolean;
  rarity?: 'common' | 'rare' | 'epic' | 'legendary';
  traits?: ShadowTrait[];
}

export interface Territory {
  id: string;
  biome: 'fire' | 'water' | 'earth' | 'air';
  kaijuId: string;
  activeShadows: Shadow[];
  interactiveZones: InteractiveZone[];
  // Additional fields
  name: string;
  customizations?: TerritoryCustomization;
}

export interface InteractiveZone {
  id: string;
  type: 'chat' | 'trading-post' | 'statistics-shrine';
  position: Position;
  radius: number;
  activeUsers: number;
}

export interface Position {
  x: number;
  y: number;
  z?: number;
}

export interface TradingPolicy {
  id: string;
  name: string;
  type: 'max-trade' | 'total-budget' | 'stop-loss' | 'risk-level';
  enabled: boolean;
  parameters: PolicyParameters;
}

export interface PolicyParameters {
  maxTradeAmount?: number;
  totalBudget?: number;
  chains?: Chain[];
  dexes?: string[];
  riskLevel?: 1 | 2 | 3 | 4 | 5;
  stopLossPercentage?: number;
}

export interface Chain {
  id: string;
  name: 'ethereum' | 'polygon' | 'arbitrum';
  rpcUrl?: string;
}

export interface VincentAgent {
  id: string;
  personality: 'aggressive' | 'conservative' | 'balanced';
  tradingBehavior: TradingBehavior;
  isActive: boolean;
}

export interface TradingBehavior {
  preferredDexes: string[];
  maxSlippage: number;
  gasStrategy: 'slow' | 'standard' | 'fast';
  rebalanceFrequency: 'hourly' | 'daily' | 'weekly';
}

export interface PerformanceData {
  last30Days: number; // percentage
  totalReturn: number;
  winRate: number;
  totalTrades: number;
  sharpeRatio?: number;
  maxDrawdown?: number;
  dailyReturns?: DailyReturn[];
}

export interface DailyReturn {
  date: Date;
  return: number;
  volume: number;
}

export interface ShadowTrait {
  name: string;
  value: string;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
}

export interface TerritoryCustomization {
  primaryColor: string;
  landmarks: Landmark[];
  weatherEffects: boolean;
  dayNightCycle: boolean;
}

export interface Landmark {
  id: string;
  type: string;
  position: Position;
  scale: number;
}

// Trade execution types
export interface TradeExecution {
  id: string;
  kaijuId: string;
  kaijuName: string;
  kaijuAvatar: string;
  type: 'buy' | 'sell' | 'swap' | 'arbitrage';
  assetPair: AssetPair;
  amount: number;
  direction: 'in' | 'out';
  shadowParticipants: number;
  pnl: number;
  pnlPercentage: number;
  timestamp: Date;
  txHash: string;
  status: 'pending' | 'success' | 'failed';
}

export interface AssetPair {
  from: Asset;
  to: Asset;
}

export interface Asset {
  symbol: string;
  name: string;
  logoUrl: string;
  chainId: string;
}

// Real-time subscription types
export interface RealtimeEvent {
  type: 'trade' | 'shadow-update' | 'kaiju-status' | 'performance-update' | 'chat';
  data: any;
  timestamp: Date;
}

export interface ChatMessage {
  id: string;
  userId: string;
  username: string;
  territoryId: string;
  message: string;
  timestamp: Date;
  reactions?: MessageReaction[];
}

export interface MessageReaction {
  emoji: string;
  users: string[];
}

// API response types
export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
}

export interface ApiError {
  code: string;
  message: string;
  details?: any;
}