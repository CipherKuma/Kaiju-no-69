import dotenv from 'dotenv';

dotenv.config();

export const KAIJU_CONFIG = {
  // Kaiju Service Configuration
  SERVICE_URL: process.env.KAIJU_SERVICE_URL || 'http://localhost:3000',
  KAIJU_ID: process.env.KAIJU_ID || '',
  ALGORITHM_KEY: process.env.ALGORITHM_KEY || '',
  
  // Trading Configuration
  MIN_CONFIDENCE_THRESHOLD: Number(process.env.MIN_CONFIDENCE_THRESHOLD || '70'),
  MAX_POSITION_SIZE_USD: Number(process.env.MAX_POSITION_SIZE_USD || '10000'),
  
  // Risk Management
  MAX_OPEN_POSITIONS: Number(process.env.MAX_OPEN_POSITIONS || '5'),
  STOP_LOSS_PERCENTAGE: Number(process.env.STOP_LOSS_PERCENTAGE || '5'),
  TAKE_PROFIT_PERCENTAGE: Number(process.env.TAKE_PROFIT_PERCENTAGE || '10'),
  
  // Monitoring
  POSITION_CHECK_INTERVAL_MS: Number(process.env.POSITION_CHECK_INTERVAL_MS || '60000'), // 1 minute
  MARKET_ANALYSIS_INTERVAL_MS: Number(process.env.MARKET_ANALYSIS_INTERVAL_MS || '300000'), // 5 minutes
};

// Validate required configuration
export function validateKaijuConfig(): void {
  if (!KAIJU_CONFIG.KAIJU_ID) {
    throw new Error('KAIJU_ID is required in environment variables');
  }
  
  if (!KAIJU_CONFIG.ALGORITHM_KEY) {
    throw new Error('ALGORITHM_KEY is required in environment variables');
  }
  
  console.log('✅ Kaiju configuration validated');
}