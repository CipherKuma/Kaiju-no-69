import { TradeExecution } from "@/types/models";

export const mockTrades: TradeExecution[] = [
  {
    id: "trade-1",
    kaijuId: "kaiju-1",
    kaijuName: "Fire Dragon",
    kaijuAvatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=FireDragon",
    type: "buy",
    assetPair: {
      from: {
        symbol: "USDC",
        name: "USD Coin",
        logoUrl: "https://cryptologos.cc/logos/usd-coin-usdc-logo.png",
        chainId: "ethereum"
      },
      to: {
        symbol: "ETH",
        name: "Ethereum",
        logoUrl: "https://cryptologos.cc/logos/ethereum-eth-logo.png",
        chainId: "ethereum"
      }
    },
    amount: 2500,
    direction: "out",
    shadowParticipants: 42,
    pnl: 125.50,
    pnlPercentage: 5.02,
    timestamp: new Date(Date.now() - 1000 * 60 * 2), // 2 minutes ago
    txHash: "0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef",
    status: "success"
  },
  {
    id: "trade-2",
    kaijuId: "kaiju-2",
    kaijuName: "Ocean Leviathan",
    kaijuAvatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=OceanLeviathan",
    type: "sell",
    assetPair: {
      from: {
        symbol: "MATIC",
        name: "Polygon",
        logoUrl: "https://cryptologos.cc/logos/polygon-matic-logo.png",
        chainId: "polygon"
      },
      to: {
        symbol: "USDT",
        name: "Tether",
        logoUrl: "https://cryptologos.cc/logos/tether-usdt-logo.png",
        chainId: "polygon"
      }
    },
    amount: 1800,
    direction: "out",
    shadowParticipants: 28,
    pnl: -45.20,
    pnlPercentage: -2.51,
    timestamp: new Date(Date.now() - 1000 * 60 * 5), // 5 minutes ago
    txHash: "0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890",
    status: "success"
  },
  {
    id: "trade-3",
    kaijuId: "kaiju-3",
    kaijuName: "Earth Titan",
    kaijuAvatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=EarthTitan",
    type: "swap",
    assetPair: {
      from: {
        symbol: "UNI",
        name: "Uniswap",
        logoUrl: "https://cryptologos.cc/logos/uniswap-uni-logo.png",
        chainId: "ethereum"
      },
      to: {
        symbol: "SUSHI",
        name: "SushiSwap",
        logoUrl: "https://cryptologos.cc/logos/sushiswap-sushi-logo.png",
        chainId: "ethereum"
      }
    },
    amount: 3200,
    direction: "out",
    shadowParticipants: 35,
    pnl: 89.75,
    pnlPercentage: 2.80,
    timestamp: new Date(Date.now() - 1000 * 60 * 10), // 10 minutes ago
    txHash: "0x7890abcdef1234567890abcdef1234567890abcdef1234567890abcdef123456",
    status: "success"
  },
  {
    id: "trade-4",
    kaijuId: "kaiju-4",
    kaijuName: "Storm Wraith",
    kaijuAvatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=StormWraith",
    type: "arbitrage",
    assetPair: {
      from: {
        symbol: "ARB",
        name: "Arbitrum",
        logoUrl: "https://cryptologos.cc/logos/arbitrum-arb-logo.png",
        chainId: "arbitrum"
      },
      to: {
        symbol: "ARB",
        name: "Arbitrum", 
        logoUrl: "https://cryptologos.cc/logos/arbitrum-arb-logo.png",
        chainId: "arbitrum"
      }
    },
    amount: 5000,
    direction: "in",
    shadowParticipants: 67,
    pnl: 312.40,
    pnlPercentage: 6.25,
    timestamp: new Date(Date.now() - 1000 * 60 * 15), // 15 minutes ago
    txHash: "0xdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890abc",
    status: "success"
  },
  {
    id: "trade-5",
    kaijuId: "kaiju-1",
    kaijuName: "Fire Dragon",
    kaijuAvatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=FireDragon",
    type: "buy",
    assetPair: {
      from: {
        symbol: "USDC",
        name: "USD Coin",
        logoUrl: "https://cryptologos.cc/logos/usd-coin-usdc-logo.png",
        chainId: "ethereum"
      },
      to: {
        symbol: "AAVE",
        name: "Aave",
        logoUrl: "https://cryptologos.cc/logos/aave-aave-logo.png",
        chainId: "ethereum"
      }
    },
    amount: 1200,
    direction: "out",
    shadowParticipants: 42,
    pnl: 0,
    pnlPercentage: 0,
    timestamp: new Date(Date.now() - 1000 * 30), // 30 seconds ago
    txHash: "0x456789abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234",
    status: "pending"
  }
];

// Function to generate random trades for testing
export function generateRandomTrade(): TradeExecution {
  const kaijus = [
    { id: "kaiju-1", name: "Fire Dragon", avatar: "FireDragon" },
    { id: "kaiju-2", name: "Ocean Leviathan", avatar: "OceanLeviathan" },
    { id: "kaiju-3", name: "Earth Titan", avatar: "EarthTitan" },
    { id: "kaiju-4", name: "Storm Wraith", avatar: "StormWraith" },
    { id: "kaiju-5", name: "Shadow Phoenix", avatar: "ShadowPhoenix" },
  ];
  
  const assets = [
    { symbol: "ETH", name: "Ethereum", logo: "ethereum-eth-logo.png" },
    { symbol: "BTC", name: "Bitcoin", logo: "bitcoin-btc-logo.png" },
    { symbol: "USDC", name: "USD Coin", logo: "usd-coin-usdc-logo.png" },
    { symbol: "MATIC", name: "Polygon", logo: "polygon-matic-logo.png" },
    { symbol: "ARB", name: "Arbitrum", logo: "arbitrum-arb-logo.png" },
    { symbol: "AAVE", name: "Aave", logo: "aave-aave-logo.png" },
    { symbol: "UNI", name: "Uniswap", logo: "uniswap-uni-logo.png" },
  ];
  
  const types: TradeExecution["type"][] = ["buy", "sell", "swap", "arbitrage"];
  const chains = ["ethereum", "polygon", "arbitrum"];
  
  const kaiju = kaijus[Math.floor(Math.random() * kaijus.length)];
  const fromAsset = assets[Math.floor(Math.random() * assets.length)];
  const toAsset = assets[Math.floor(Math.random() * assets.length)];
  const type = types[Math.floor(Math.random() * types.length)];
  const chain = chains[Math.floor(Math.random() * chains.length)];
  
  const amount = Math.floor(Math.random() * 10000) + 500;
  const pnlPercentage = (Math.random() - 0.5) * 20; // -10% to +10%
  const pnl = amount * (pnlPercentage / 100);
  
  return {
    id: `trade-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    kaijuId: kaiju.id,
    kaijuName: kaiju.name,
    kaijuAvatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${kaiju.avatar}`,
    type,
    assetPair: {
      from: {
        symbol: fromAsset.symbol,
        name: fromAsset.name,
        logoUrl: `https://cryptologos.cc/logos/${fromAsset.logo}`,
        chainId: chain
      },
      to: {
        symbol: toAsset.symbol,
        name: toAsset.name,
        logoUrl: `https://cryptologos.cc/logos/${toAsset.logo}`,
        chainId: chain
      }
    },
    amount,
    direction: Math.random() > 0.5 ? "out" : "in",
    shadowParticipants: Math.floor(Math.random() * 100) + 10,
    pnl,
    pnlPercentage,
    timestamp: new Date(),
    txHash: `0x${Array(64).fill(0).map(() => Math.floor(Math.random() * 16).toString(16)).join('')}`,
    status: Math.random() > 0.1 ? "success" : "pending"
  };
}