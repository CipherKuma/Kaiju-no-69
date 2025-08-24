import { TradingAbility, Trade, Position } from '../types/index.js';
import { logger } from '../utils/logger.js';
import { v4 as uuidv4 } from 'uuid';

// Base Trading Ability class
abstract class BaseTradingAbility implements TradingAbility {
  abstract type: 'spot' | 'perpetual' | 'lending' | 'borrowing' | 'staking';
  
  abstract execute(params: any): Promise<any>;
  
  protected generateTradeId(): string {
    return uuidv4();
  }
  
  protected simulateExecutionDelay(): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, Math.random() * 1000 + 500));
  }
}

// Spot Trading
export class SpotTrading extends BaseTradingAbility {
  type: 'spot' = 'spot';
  
  async execute(params: {
    symbol: string;
    side: 'BUY' | 'SELL';
    quantity: number;
    price?: number;
    orderType: 'MARKET' | 'LIMIT';
  }): Promise<Trade> {
    logger.info('Executing spot trade', params);
    await this.simulateExecutionDelay();
    
    const executionPrice = params.price || this.getMarketPrice(params.symbol);
    const fee = executionPrice * params.quantity * 0.001; // 0.1% fee
    
    const trade: Trade = {
      id: this.generateTradeId(),
      symbol: params.symbol,
      side: params.side,
      price: executionPrice,
      quantity: params.quantity,
      timestamp: new Date(),
      fee,
      reason: 'Spot trade execution',
    };
    
    logger.info('Spot trade executed', trade);
    return trade;
  }
  
  private getMarketPrice(symbol: string): number {
    // Mock market prices
    const prices: Record<string, number> = {
      'BTC/USDT': 45000 + Math.random() * 1000,
      'ETH/USDT': 2500 + Math.random() * 50,
      'SOL/USDT': 100 + Math.random() * 5,
    };
    return prices[symbol] || 100;
  }
}

// Perpetual Swaps Trading
export class PerpetualSwaps extends BaseTradingAbility {
  type: 'perpetual' = 'perpetual';
  
  async execute(params: {
    symbol: string;
    side: 'LONG' | 'SHORT';
    size: number; // Contract size in USD
    leverage: number;
    entryPrice?: number;
  }): Promise<{
    positionId: string;
    symbol: string;
    side: 'LONG' | 'SHORT';
    size: number;
    leverage: number;
    entryPrice: number;
    liquidationPrice: number;
    margin: number;
    fundingRate: number;
  }> {
    logger.info('Opening perpetual position', params);
    await this.simulateExecutionDelay();
    
    const entryPrice = params.entryPrice || this.getPerpPrice(params.symbol);
    const margin = params.size / params.leverage;
    const liquidationPrice = this.calculateLiquidationPrice(
      entryPrice,
      params.side,
      params.leverage
    );
    
    const position = {
      positionId: this.generateTradeId(),
      symbol: params.symbol,
      side: params.side,
      size: params.size,
      leverage: params.leverage,
      entryPrice,
      liquidationPrice,
      margin,
      fundingRate: this.getCurrentFundingRate(params.symbol),
    };
    
    logger.info('Perpetual position opened', position);
    return position;
  }
  
  async closePosition(positionId: string, exitPrice: number): Promise<{
    positionId: string;
    pnl: number;
    exitPrice: number;
    closedAt: Date;
  }> {
    logger.info('Closing perpetual position', { positionId, exitPrice });
    await this.simulateExecutionDelay();
    
    // Mock PnL calculation
    const pnl = (Math.random() - 0.5) * 1000;
    
    return {
      positionId,
      pnl,
      exitPrice,
      closedAt: new Date(),
    };
  }
  
  private getPerpPrice(symbol: string): number {
    const basePrice = {
      'BTC/USDT': 45000,
      'ETH/USDT': 2500,
      'SOL/USDT': 100,
    }[symbol] || 100;
    
    return basePrice + (Math.random() - 0.5) * basePrice * 0.01;
  }
  
  private calculateLiquidationPrice(
    entryPrice: number,
    side: 'LONG' | 'SHORT',
    leverage: number
  ): number {
    const maintenanceMargin = 0.005; // 0.5%
    const liquidationDistance = (1 - maintenanceMargin) / leverage;
    
    if (side === 'LONG') {
      return entryPrice * (1 - liquidationDistance);
    } else {
      return entryPrice * (1 + liquidationDistance);
    }
  }
  
  private getCurrentFundingRate(symbol: string): number {
    // Mock funding rate between -0.01% and 0.01%
    return (Math.random() - 0.5) * 0.0002;
  }
}

// Lending Service
export class LendingService extends BaseTradingAbility {
  type: 'lending' = 'lending';
  
  async execute(params: {
    asset: string;
    amount: number;
    duration: number; // in days
    minAPY?: number;
  }): Promise<{
    lendingId: string;
    asset: string;
    amount: number;
    apy: number;
    duration: number;
    expectedReturn: number;
    startDate: Date;
    endDate: Date;
  }> {
    logger.info('Creating lending position', params);
    await this.simulateExecutionDelay();
    
    const apy = this.getCurrentLendingRate(params.asset);
    const dailyRate = apy / 365;
    const expectedReturn = params.amount * dailyRate * params.duration;
    
    const startDate = new Date();
    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + params.duration);
    
    const lending = {
      lendingId: this.generateTradeId(),
      asset: params.asset,
      amount: params.amount,
      apy,
      duration: params.duration,
      expectedReturn,
      startDate,
      endDate,
    };
    
    logger.info('Lending position created', lending);
    return lending;
  }
  
  async withdrawLending(lendingId: string): Promise<{
    lendingId: string;
    withdrawnAmount: number;
    interest: number;
    withdrawnAt: Date;
  }> {
    logger.info('Withdrawing lending position', { lendingId });
    await this.simulateExecutionDelay();
    
    // Mock withdrawal
    const principal = 1000; // Mock principal
    const interest = principal * 0.05; // Mock 5% interest
    
    return {
      lendingId,
      withdrawnAmount: principal + interest,
      interest,
      withdrawnAt: new Date(),
    };
  }
  
  private getCurrentLendingRate(asset: string): number {
    // Mock APY rates
    const rates: Record<string, number> = {
      'USDT': 0.08 + Math.random() * 0.04, // 8-12%
      'USDC': 0.07 + Math.random() * 0.03, // 7-10%
      'BTC': 0.03 + Math.random() * 0.02,  // 3-5%
      'ETH': 0.04 + Math.random() * 0.02,  // 4-6%
    };
    return rates[asset] || 0.05;
  }
}

// Borrowing Service
export class BorrowingService extends BaseTradingAbility {
  type: 'borrowing' = 'borrowing';
  
  async execute(params: {
    asset: string;
    amount: number;
    collateralAsset: string;
    collateralAmount: number;
    duration?: number; // in days, optional for open-ended loans
  }): Promise<{
    loanId: string;
    asset: string;
    amount: number;
    collateralAsset: string;
    collateralAmount: number;
    apr: number;
    ltv: number; // Loan-to-Value ratio
    liquidationLTV: number;
    startDate: Date;
  }> {
    logger.info('Creating borrowing position', params);
    await this.simulateExecutionDelay();
    
    const apr = this.getCurrentBorrowingRate(params.asset);
    const ltv = this.calculateLTV(
      params.amount,
      params.asset,
      params.collateralAmount,
      params.collateralAsset
    );
    
    const loan = {
      loanId: this.generateTradeId(),
      asset: params.asset,
      amount: params.amount,
      collateralAsset: params.collateralAsset,
      collateralAmount: params.collateralAmount,
      apr,
      ltv,
      liquidationLTV: 0.85, // 85% LTV triggers liquidation
      startDate: new Date(),
    };
    
    logger.info('Loan created', loan);
    return loan;
  }
  
  async repayLoan(loanId: string, amount: number): Promise<{
    loanId: string;
    repaidAmount: number;
    remainingDebt: number;
    interestPaid: number;
    repaidAt: Date;
  }> {
    logger.info('Repaying loan', { loanId, amount });
    await this.simulateExecutionDelay();
    
    // Mock repayment
    const interestPaid = amount * 0.1; // Mock 10% of repayment as interest
    const principalPaid = amount - interestPaid;
    
    return {
      loanId,
      repaidAmount: amount,
      remainingDebt: Math.max(0, 1000 - principalPaid), // Mock remaining debt
      interestPaid,
      repaidAt: new Date(),
    };
  }
  
  private getCurrentBorrowingRate(asset: string): number {
    // Mock APR rates
    const rates: Record<string, number> = {
      'USDT': 0.10 + Math.random() * 0.05, // 10-15%
      'USDC': 0.09 + Math.random() * 0.04, // 9-13%
      'BTC': 0.05 + Math.random() * 0.03,  // 5-8%
      'ETH': 0.06 + Math.random() * 0.03,  // 6-9%
    };
    return rates[asset] || 0.12;
  }
  
  private calculateLTV(
    loanAmount: number,
    loanAsset: string,
    collateralAmount: number,
    collateralAsset: string
  ): number {
    // Mock asset prices for LTV calculation
    const prices: Record<string, number> = {
      'BTC': 45000,
      'ETH': 2500,
      'USDT': 1,
      'USDC': 1,
    };
    
    const loanValue = loanAmount * (prices[loanAsset] || 1);
    const collateralValue = collateralAmount * (prices[collateralAsset] || 1);
    
    return loanValue / collateralValue;
  }
}

// Trading Abilities Manager
export class TradingAbilitiesManager {
  private spot: SpotTrading;
  private perpetual: PerpetualSwaps;
  private lending: LendingService;
  private borrowing: BorrowingService;
  
  constructor() {
    this.spot = new SpotTrading();
    this.perpetual = new PerpetualSwaps();
    this.lending = new LendingService();
    this.borrowing = new BorrowingService();
  }
  
  getSpotTrading(): SpotTrading {
    return this.spot;
  }
  
  getPerpetualSwaps(): PerpetualSwaps {
    return this.perpetual;
  }
  
  getLendingService(): LendingService {
    return this.lending;
  }
  
  getBorrowingService(): BorrowingService {
    return this.borrowing;
  }
  
  // Composite strategies
  async executeLeveragedSpotTrade(params: {
    symbol: string;
    side: 'BUY' | 'SELL';
    baseAmount: number;
    leverage: number;
    collateralAsset: string;
  }): Promise<{
    spotTrade: Trade;
    loan?: any;
  }> {
    logger.info('Executing leveraged spot trade', params);
    
    let loan;
    const totalAmount = params.baseAmount * params.leverage;
    const borrowAmount = totalAmount - params.baseAmount;
    
    if (borrowAmount > 0) {
      // Borrow additional funds
      loan = await this.borrowing.execute({
        asset: 'USDT',
        amount: borrowAmount,
        collateralAsset: params.collateralAsset,
        collateralAmount: params.baseAmount * 1.5, // 150% collateral
      });
    }
    
    // Execute spot trade
    const spotTrade = await this.spot.execute({
      symbol: params.symbol,
      side: params.side,
      quantity: totalAmount,
      orderType: 'MARKET',
    });
    
    return { spotTrade, loan };
  }
}