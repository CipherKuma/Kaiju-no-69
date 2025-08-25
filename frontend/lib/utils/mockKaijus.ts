import { Kaiju } from '@/types/models';

export const mockKaijus: Kaiju[] = [
  {
    id: '1',
    name: 'Drakonix',
    imageUrl: 'https://images.unsplash.com/photo-1599481238505-b8b0537a3f77?w=400&h=400&fit=crop',
    territory: 'fire',
    tradingStyle: 'aggressive',
    description: 'A fearless fire dragon that dominates volatile markets with aggressive trades.',
    isOnline: true,
    shadows: [],
    entryFee: 0.05,
    profitShare: 20,
    performance: {
      last30Days: 18.5,
      totalReturn: 245.3,
      winRate: 72,
      totalTrades: 1543,
      sharpeRatio: 2.1,
      maxDrawdown: -12.8
    },
    stats: {
      winRate: 72,
      totalTrades: 1543,
      avgProfit: 18.5,
      riskLevel: 5
    }
  },
  {
    id: '2',
    name: 'Aqua Leviathan',
    imageUrl: 'https://images.unsplash.com/photo-1614732414444-096e5f1122d5?w=400&h=400&fit=crop',
    territory: 'water',
    tradingStyle: 'balanced',
    description: 'Master of the seas, flowing with market currents for balanced gains.',
    isOnline: true,
    shadows: [],
    entryFee: 0.03,
    profitShare: 15,
    performance: {
      last30Days: 12.3,
      totalReturn: 187.6,
      winRate: 68,
      totalTrades: 892,
      sharpeRatio: 1.8,
      maxDrawdown: -8.4
    },
    stats: {
      winRate: 68,
      totalTrades: 892,
      avgProfit: 12.3,
      riskLevel: 3
    }
  },
  {
    id: '3',
    name: 'Terra Titan',
    imageUrl: 'https://images.unsplash.com/photo-1605092676920-8ac5ae40c7c8?w=400&h=400&fit=crop',
    territory: 'earth',
    tradingStyle: 'conservative',
    description: 'Solid as bedrock, this earth giant favors steady, conservative strategies.',
    isOnline: false,
    shadows: [],
    entryFee: 0.02,
    profitShare: 12,
    performance: {
      last30Days: 8.2,
      totalReturn: 134.7,
      winRate: 81,
      totalTrades: 567,
      sharpeRatio: 1.5,
      maxDrawdown: -5.2
    },
    stats: {
      winRate: 81,
      totalTrades: 567,
      avgProfit: 8.2,
      riskLevel: 2
    }
  },
  {
    id: '4',
    name: 'Zephyr Phoenix',
    imageUrl: 'https://images.unsplash.com/photo-1574482620811-1aa16ffe3c82?w=400&h=400&fit=crop',
    territory: 'air',
    tradingStyle: 'arbitrage',
    description: 'Swift as wind, catching price differences across multiple exchanges.',
    isOnline: true,
    shadows: [],
    entryFee: 0.01,
    profitShare: 10,
    performance: {
      last30Days: 4.7,
      totalReturn: 198.3,
      winRate: 89,
      totalTrades: 2341,
      sharpeRatio: 2.4,
      maxDrawdown: -3.1
    },
    stats: {
      winRate: 89,
      totalTrades: 2341,
      avgProfit: 4.7,
      riskLevel: 2
    }
  },
  {
    id: '5',
    name: 'Inferno Rex',
    imageUrl: 'https://images.unsplash.com/photo-1611604548018-d56bbd85d681?w=400&h=400&fit=crop',
    territory: 'fire',
    tradingStyle: 'aggressive',
    description: 'The king of high-risk trades, turning market heat into massive gains.',
    isOnline: true,
    shadows: [],
    entryFee: 0.08,
    profitShare: 25,
    performance: {
      last30Days: 25.8,
      totalReturn: 312.4,
      winRate: 65,
      totalTrades: 987,
      sharpeRatio: 1.9,
      maxDrawdown: -18.6
    },
    stats: {
      winRate: 65,
      totalTrades: 987,
      avgProfit: 25.8,
      riskLevel: 5
    }
  },
  {
    id: '6',
    name: 'Frost Wyrm',
    imageUrl: 'https://images.unsplash.com/photo-1578321272176-b7bbc0679853?w=400&h=400&fit=crop',
    territory: 'water',
    tradingStyle: 'conservative',
    description: 'Cool and calculated, freezing assets at optimal moments.',
    isOnline: false,
    shadows: [],
    entryFee: 0.025,
    profitShare: 13,
    performance: {
      last30Days: 9.1,
      totalReturn: 156.8,
      winRate: 78,
      totalTrades: 432,
      sharpeRatio: 1.6,
      maxDrawdown: -6.3
    },
    stats: {
      winRate: 78,
      totalTrades: 432,
      avgProfit: 9.1,
      riskLevel: 2
    }
  },
  {
    id: '7',
    name: 'Storm Elemental',
    imageUrl: 'https://images.unsplash.com/photo-1620336655052-b57986f5a26a?w=400&h=400&fit=crop',
    territory: 'air',
    tradingStyle: 'balanced',
    description: 'Harnesses market volatility like lightning in a storm.',
    isOnline: true,
    shadows: [],
    entryFee: 0.04,
    profitShare: 18,
    performance: {
      last30Days: 15.2,
      totalReturn: 203.7,
      winRate: 70,
      totalTrades: 1123,
      sharpeRatio: 1.7,
      maxDrawdown: -10.9
    },
    stats: {
      winRate: 70,
      totalTrades: 1123,
      avgProfit: 15.2,
      riskLevel: 4
    }
  },
  {
    id: '8',
    name: 'Crystal Guardian',
    imageUrl: 'https://images.unsplash.com/photo-1618005198919-d3d4b5a92ead?w=400&h=400&fit=crop',
    territory: 'earth',
    tradingStyle: 'arbitrage',
    description: 'Sees through market opacity with crystalline clarity.',
    isOnline: true,
    shadows: [],
    entryFee: 0.015,
    profitShare: 11,
    performance: {
      last30Days: 6.3,
      totalReturn: 178.9,
      winRate: 85,
      totalTrades: 1876,
      sharpeRatio: 2.2,
      maxDrawdown: -4.1
    },
    stats: {
      winRate: 85,
      totalTrades: 1876,
      avgProfit: 6.3,
      riskLevel: 2
    }
  }
];

// Initialize the Kaiju store with mock data if empty
export function initializeMockKaijus() {
  if (typeof window !== 'undefined') {
    const kaijuStore = window.localStorage.getItem('kaiju-store');
    if (!kaijuStore || JSON.parse(kaijuStore).state.kaijus.length === 0) {
      window.localStorage.setItem('kaiju-store', JSON.stringify({
        state: { kaijus: mockKaijus },
        version: 0
      }));
    }
  }
}