import { Kaiju } from '@/lib/types';

export const mockKaijus: Kaiju[] = [
  {
    id: '1',
    name: 'Drakonix',
    imageUrl: 'https://images.unsplash.com/photo-1599481238505-b8b0537a3f77?w=400&h=400&fit=crop',
    territory: 'fire',
    tradingStyle: 'aggressive',
    description: 'A fearless fire dragon that dominates volatile markets with aggressive trades.',
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