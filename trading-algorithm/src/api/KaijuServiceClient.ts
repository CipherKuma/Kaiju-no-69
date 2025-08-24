import axios, { AxiosInstance } from 'axios';
import { logger } from '../utils/logger';

export interface TradeRequest {
  kaijuId: string;
  tradeType: 'swap' | 'add_liquidity' | 'remove_liquidity' | 'perps_long' | 'perps_short';
  confidenceLevel: number;
  entryData: {
    type: 'swap' | 'liquidity' | 'perps';
    data: any;
  };
}

export interface ActiveTrade {
  id: string;
  kaijuId: string;
  tradeType: string;
  status: string;
  confidenceLevel: number;
  entryData: any;
  createdAt: string;
  positions: Array<{
    id: string;
    status: string;
    allocatedAmount: string;
    actualAmount: string;
  }>;
}

export class KaijuServiceClient {
  private client: AxiosInstance;
  private kaijuId: string;
  private algorithmKey: string;

  constructor(
    serviceUrl: string,
    kaijuId: string,
    algorithmKey: string
  ) {
    this.kaijuId = kaijuId;
    this.algorithmKey = algorithmKey;
    
    this.client = axios.create({
      baseURL: serviceUrl,
      headers: {
        'Content-Type': 'application/json',
        'X-Algorithm-Key': algorithmKey
      },
      timeout: 30000
    });

    // Add request interceptor for logging
    this.client.interceptors.request.use(
      (config) => {
        logger.info(`API Request: ${config.method?.toUpperCase()} ${config.url}`);
        return config;
      },
      (error) => {
        logger.error('API Request Error:', error);
        return Promise.reject(error);
      }
    );

    // Add response interceptor for logging
    this.client.interceptors.response.use(
      (response) => {
        logger.info(`API Response: ${response.status} ${response.config.url}`);
        return response;
      },
      (error) => {
        logger.error('API Response Error:', error.response?.data || error.message);
        return Promise.reject(error);
      }
    );
  }

  /**
   * Post a new trade to the Kaiju service
   */
  async postTrade(trade: Omit<TradeRequest, 'kaijuId'>): Promise<{ tradeId: string; shadowCount: number }> {
    try {
      const response = await this.client.post('/api/trades', {
        ...trade,
        kaijuId: this.kaijuId
      });

      return response.data.data;
    } catch (error) {
      logger.error('Failed to post trade:', error);
      throw error;
    }
  }

  /**
   * Get active trades for this Kaiju
   */
  async getActiveTrades(): Promise<ActiveTrade[]> {
    try {
      const response = await this.client.get(`/api/kaijus/${this.kaijuId}/trades/active`);
      return response.data.data;
    } catch (error) {
      logger.error('Failed to get active trades:', error);
      throw error;
    }
  }

  /**
   * Close a trade
   */
  async closeTrade(tradeId: string, exitData?: any): Promise<void> {
    try {
      await this.client.post(`/api/trades/${tradeId}/close`, {
        exitData
      });
      logger.info(`Successfully closed trade ${tradeId}`);
    } catch (error) {
      logger.error(`Failed to close trade ${tradeId}:`, error);
      throw error;
    }
  }

  /**
   * Helper method to create swap trade data
   */
  createSwapTradeData(
    tokenIn: string,
    tokenOut: string,
    amountIn: string,
    minAmountOut: string,
    confidenceLevel: number
  ): TradeRequest {
    return {
      kaijuId: this.kaijuId,
      tradeType: 'swap',
      confidenceLevel,
      entryData: {
        type: 'swap',
        data: {
          tokenIn,
          tokenOut,
          amountIn,
          minAmountOut
        }
      }
    };
  }

  /**
   * Helper method to create liquidity trade data
   */
  createLiquidityTradeData(
    tokenA: string,
    tokenB: string,
    amountA: string,
    amountB: string,
    confidenceLevel: number,
    isAdd: boolean = true
  ): TradeRequest {
    return {
      kaijuId: this.kaijuId,
      tradeType: isAdd ? 'add_liquidity' : 'remove_liquidity',
      confidenceLevel,
      entryData: {
        type: 'liquidity',
        data: {
          tokenA,
          tokenB,
          amountA,
          amountB
        }
      }
    };
  }

  /**
   * Helper method to create perpetual trade data
   */
  createPerpsTradeData(
    asset: string,
    size: string,
    leverage: number,
    isLong: boolean,
    confidenceLevel: number
  ): TradeRequest {
    return {
      kaijuId: this.kaijuId,
      tradeType: isLong ? 'perps_long' : 'perps_short',
      confidenceLevel,
      entryData: {
        type: 'perps',
        data: {
          asset,
          size,
          leverage,
          isLong
        }
      }
    };
  }
}