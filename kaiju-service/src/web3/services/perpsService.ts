import { ethers } from 'ethers';
import { getProvider } from '../provider';
import { CONTRACTS } from '../contracts/addresses';
import { PERPETUAL_EXCHANGE_ABI, PRICE_ORACLE_ABI } from '../contracts/abis';
import { AppError } from '../../middleware/errorHandler';

export interface OpenPositionParams {
  asset: string;
  size: string;
  isLong: boolean;
  leverage: number;
  wallet: ethers.Wallet;
}

export interface Position {
  id: string;
  trader: string;
  asset: string;
  size: string;
  isLong: boolean;
  entryPrice: string;
  leverage: number;
  margin: string;
  isOpen: boolean;
  pnl?: string;
}

export class PerpsService {
  private exchange: ethers.Contract;
  private priceOracle: ethers.Contract;

  constructor() {
    this.exchange = new ethers.Contract(
      CONTRACTS.PERPETUAL_EXCHANGE,
      PERPETUAL_EXCHANGE_ABI,
      getProvider()
    );
    
    this.priceOracle = new ethers.Contract(
      CONTRACTS.PRICE_ORACLE,
      PRICE_ORACLE_ABI,
      getProvider()
    );
  }

  async openPosition(params: OpenPositionParams): Promise<{ txHash: string; positionId: string }> {
    const { asset, size, isLong, leverage, wallet } = params;

    try {
      const exchangeWithSigner = this.exchange.connect(wallet);
      
      // Open position
      const tx = await exchangeWithSigner.openPosition(
        asset,
        size,
        isLong,
        leverage
      );

      const receipt = await tx.wait();
      
      // Extract position ID from events (assuming the contract emits it)
      // This is a simplified version - you'll need to parse the actual event
      const positionId = receipt.logs[0]?.data || '0';

      return {
        txHash: receipt.hash,
        positionId
      };
    } catch (error) {
      console.error('Open position error:', error);
      throw new AppError('Failed to open position', 500);
    }
  }

  async closePosition(positionId: string, wallet: ethers.Wallet): Promise<{ txHash: string; pnl: string }> {
    try {
      const exchangeWithSigner = this.exchange.connect(wallet);
      
      // Get current PnL before closing
      const pnl = await this.exchange.getPositionPnL(positionId);
      
      // Close position
      const tx = await exchangeWithSigner.closePosition(positionId);
      const receipt = await tx.wait();

      return {
        txHash: receipt.hash,
        pnl: pnl.toString()
      };
    } catch (error) {
      console.error('Close position error:', error);
      throw new AppError('Failed to close position', 500);
    }
  }

  async getPosition(positionId: string): Promise<Position | null> {
    try {
      const position = await this.exchange.getPosition(positionId);
      
      if (!position.isOpen) {
        return null;
      }

      const pnl = await this.exchange.getPositionPnL(positionId);

      return {
        id: positionId,
        trader: position.trader,
        asset: position.asset,
        size: position.size.toString(),
        isLong: position.isLong,
        entryPrice: position.entryPrice.toString(),
        leverage: Number(position.leverage),
        margin: position.margin.toString(),
        isOpen: position.isOpen,
        pnl: pnl.toString()
      };
    } catch (error) {
      console.error('Get position error:', error);
      throw new AppError('Failed to get position', 500);
    }
  }

  async getAssetPrice(asset: string): Promise<string> {
    try {
      const price = await this.priceOracle.getPrice(asset);
      return price.toString();
    } catch (error) {
      console.error('Get asset price error:', error);
      throw new AppError('Failed to get asset price', 500);
    }
  }

  async calculateRequiredMargin(size: string, leverage: number): Promise<string> {
    try {
      const margin = BigInt(size) / BigInt(leverage);
      return margin.toString();
    } catch (error) {
      console.error('Calculate margin error:', error);
      throw new AppError('Failed to calculate margin', 500);
    }
  }
}