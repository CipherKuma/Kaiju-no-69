import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../../.env') });

export const config = {
  // Gemini AI Configuration
  gemini: {
    apiKey: process.env.GEMINI_API_KEY || 'AIzaSyCk1Ii4OZE8fYZfHtEm_W8Jd9Gp9YtU5hU',
    model: process.env.GEMINI_MODEL || 'gemini-2.0-flash-exp',
  },

  // Trading Configuration
  trading: {
    mode: process.env.TRADING_MODE || 'paper',
    initialCapital: parseFloat(process.env.INITIAL_CAPITAL || '10000'),
    maxPositionSize: parseFloat(process.env.MAX_POSITION_SIZE || '0.1'),
    stopLossPercentage: parseFloat(process.env.STOP_LOSS_PERCENTAGE || '0.02'),
    takeProfitPercentage: parseFloat(process.env.TAKE_PROFIT_PERCENTAGE || '0.05'),
    pairs: (process.env.TRADING_PAIRS || 'BTC/USDT,ETH/USDT,SOL/USDT').split(','),
    network: process.env.TRADING_NETWORK || 'shapeSepolia',
  },
  
  // Blockchain Configuration
  blockchain: {
    privateKey: process.env.PRIVATE_KEY || '',
    rpcUrl: process.env.RPC_URL || 'https://rpc-shape-sepolia-vg7moj8ogd.t.conduit.xyz',
  },

  // Exchange Configuration
  exchange: {
    name: process.env.EXCHANGE_NAME || 'binance',
    apiKey: process.env.EXCHANGE_API_KEY || '',
    apiSecret: process.env.EXCHANGE_API_SECRET || '',
  },

  // Data Collection
  dataCollection: {
    priceUpdateInterval: parseInt(process.env.PRICE_UPDATE_INTERVAL || '5000'),
    sentimentUpdateInterval: parseInt(process.env.SENTIMENT_UPDATE_INTERVAL || '60000'),
    newsUpdateInterval: parseInt(process.env.NEWS_UPDATE_INTERVAL || '300000'),
  },

  // Risk Management
  riskManagement: {
    maxDailyLoss: parseFloat(process.env.MAX_DAILY_LOSS || '0.05'),
    maxOpenPositions: parseInt(process.env.MAX_OPEN_POSITIONS || '3'),
    positionSizingMethod: process.env.POSITION_SIZING_METHOD || 'fixed',
  },

  // Server Configuration
  server: {
    port: parseInt(process.env.PORT || '3000'),
    logLevel: process.env.LOG_LEVEL || 'info',
  },
};

// Validate configuration
export function validateConfig(): void {
  const errors: string[] = [];

  if (!config.gemini.apiKey) {
    errors.push('GEMINI_API_KEY is required');
  }

  if (config.trading.mode === 'live') {
    if (!config.exchange.apiKey || !config.exchange.apiSecret) {
      errors.push('Exchange API credentials are required for live trading');
    }
  }

  if (config.trading.maxPositionSize > 1 || config.trading.maxPositionSize <= 0) {
    errors.push('MAX_POSITION_SIZE must be between 0 and 1');
  }

  if (errors.length > 0) {
    throw new Error(`Configuration errors:\\n${errors.join('\\n')}`);
  }
}