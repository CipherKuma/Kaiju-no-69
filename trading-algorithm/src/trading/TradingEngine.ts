import { EventEmitter } from 'events';
import cron from 'node-cron';
import { MarketDataCollector } from '../collectors/MarketDataCollector.js';
import { SentimentAnalyzer } from '../collectors/SentimentAnalyzer.js';
import { TechnicalAnalyzer } from '../analyzers/TechnicalAnalyzer.js';
import { AIDecisionMaker } from '../analyzers/AIDecisionMaker.js';
import { StrategyManager } from '../strategies/TradingStrategies.js';
import { TradingAbilitiesManager } from './TradingAbilities.js';
import { RiskManager } from './RiskManager.js';
import { DeFiExecutor } from '../defi/DeFiExecutor.js';
import { MarketAnalysis, TradingSignal, Position } from '../types/index.js';
import { config } from '../config/index.js';
import { logger } from '../utils/logger.js';
import { v4 as uuidv4 } from 'uuid';

export class TradingEngine extends EventEmitter {
  private marketDataCollector: MarketDataCollector;
  private sentimentAnalyzer: SentimentAnalyzer;
  private technicalAnalyzer: TechnicalAnalyzer;
  private aiDecisionMaker: AIDecisionMaker;
  private strategyManager: StrategyManager;
  private tradingAbilities: TradingAbilitiesManager;
  private riskManager: RiskManager;
  private defiExecutor?: DeFiExecutor;
  
  private isRunning: boolean = false;
  private analysisInterval?: NodeJS.Timeout;
  private positionMonitorInterval?: NodeJS.Timeout;
  private dailyResetSchedule?: cron.ScheduledTask;

  constructor() {
    super();
    
    // Initialize components
    this.marketDataCollector = new MarketDataCollector(config.trading.pairs);
    this.sentimentAnalyzer = new SentimentAnalyzer(config.trading.pairs);
    this.technicalAnalyzer = new TechnicalAnalyzer(
      this.marketDataCollector,
      config.trading.pairs
    );
    this.aiDecisionMaker = new AIDecisionMaker();
    this.strategyManager = new StrategyManager();
    this.tradingAbilities = new TradingAbilitiesManager();
    this.riskManager = new RiskManager(config.trading.initialCapital);
    
    // Initialize DeFi executor if private key is available
    const privateKey = process.env.PRIVATE_KEY;
    if (privateKey && config.trading.mode === 'live') {
      this.defiExecutor = new DeFiExecutor(privateKey);
      logger.info('DeFi executor initialized for live trading');
    }
    
    this.setupEventListeners();
  }

  private setupEventListeners(): void {
    // Market data updates
    this.marketDataCollector.on('marketData', (data) => {
      this.emit('marketUpdate', data);
    });

    // Sentiment updates
    this.sentimentAnalyzer.on('sentimentData', (data) => {
      this.emit('sentimentUpdate', data);
    });

    // Technical indicator updates
    this.technicalAnalyzer.on('technicalIndicators', (data) => {
      this.emit('technicalUpdate', data);
    });
  }

  async start(): Promise<void> {
    if (this.isRunning) {
      logger.warn('Trading engine is already running');
      return;
    }

    logger.info('Starting trading engine');
    this.isRunning = true;

    try {
      // Start data collectors
      await this.marketDataCollector.start();
      await this.sentimentAnalyzer.start();

      // Start analysis loop
      this.startAnalysisLoop();
      
      // Start position monitoring
      this.startPositionMonitoring();
      
      // Schedule daily reset
      this.scheduleDailyReset();

      logger.info('Trading engine started successfully');
      this.emit('engineStarted');
    } catch (error) {
      logger.error('Failed to start trading engine', { error });
      this.isRunning = false;
      throw error;
    }
  }

  stop(): void {
    if (!this.isRunning) {
      logger.warn('Trading engine is not running');
      return;
    }

    logger.info('Stopping trading engine');
    
    // Stop data collectors
    this.marketDataCollector.stop();
    this.sentimentAnalyzer.stop();
    
    // Clear intervals
    if (this.analysisInterval) {
      clearInterval(this.analysisInterval);
    }
    if (this.positionMonitorInterval) {
      clearInterval(this.positionMonitorInterval);
    }
    
    // Stop daily reset schedule
    if (this.dailyResetSchedule) {
      this.dailyResetSchedule.stop();
    }

    this.isRunning = false;
    logger.info('Trading engine stopped');
    this.emit('engineStopped');
  }

  private startAnalysisLoop(): void {
    // Run analysis immediately
    this.runAnalysis();
    
    // Then run every 5 minutes
    this.analysisInterval = setInterval(() => {
      this.runAnalysis();
    }, 5 * 60 * 1000);
  }

  private async runAnalysis(): Promise<void> {
    try {
      logger.info('Running market analysis');
      
      // Gather market data for all trading pairs
      const analyses: MarketAnalysis[] = [];
      
      for (const symbol of config.trading.pairs) {
        const marketData = this.marketDataCollector.getLatestData(symbol);
        const sentimentData = this.sentimentAnalyzer.getLatestSentiment(symbol);
        
        if (!marketData || !sentimentData) {
          logger.warn('Missing data for analysis', { symbol });
          continue;
        }

        // Calculate technical indicators
        const technicalIndicators = await this.technicalAnalyzer.calculateIndicators(symbol);
        
        // Fetch news
        const newsData = await this.sentimentAnalyzer.fetchNews(symbol);
        
        analyses.push({
          marketData: [marketData],
          technicalIndicators,
          sentimentData,
          newsData,
        });
      }

      // Run strategy analysis
      const strategySignals = await this.analyzeWithStrategies(analyses);
      
      // Get AI recommendations
      const aiDecision = await this.getAIDecision(analyses[0]); // Use first symbol for now
      
      // Combine and filter signals
      const finalSignals = this.combineSignals(strategySignals, aiDecision.signals);
      
      // Execute trades based on signals
      await this.executeSignals(finalSignals);
      
      // Emit analysis complete event
      this.emit('analysisComplete', {
        timestamp: new Date(),
        signalsGenerated: finalSignals.length,
        aiDecision,
      });
      
    } catch (error) {
      logger.error('Error during market analysis', { error });
      this.emit('analysisError', error);
    }
  }

  private async analyzeWithStrategies(
    analyses: MarketAnalysis[]
  ): Promise<TradingSignal[]> {
    const allSignals: TradingSignal[] = [];
    
    for (const analysis of analyses) {
      const strategyResults = await this.strategyManager.analyzeWithAllStrategies(analysis);
      
      strategyResults.forEach((signals, strategyName) => {
        logger.info(`Strategy ${strategyName} generated ${signals.length} signals`);
        allSignals.push(...signals);
      });
    }
    
    return allSignals;
  }

  private async getAIDecision(analysis: MarketAnalysis): Promise<any> {
    const positions = this.riskManager.getPositions();
    const riskMetrics = this.riskManager.calculateRiskMetrics();
    
    return this.aiDecisionMaker.analyzeMarket(analysis, positions, riskMetrics);
  }

  private combineSignals(
    strategySignals: TradingSignal[],
    aiSignals: TradingSignal[]
  ): TradingSignal[] {
    const signalMap = new Map<string, TradingSignal[]>();
    
    // Group all signals by symbol
    [...strategySignals, ...aiSignals].forEach(signal => {
      const signals = signalMap.get(signal.symbol) || [];
      signals.push(signal);
      signalMap.set(signal.symbol, signals);
    });
    
    const combinedSignals: TradingSignal[] = [];
    
    // Process signals for each symbol
    signalMap.forEach((signals, symbol) => {
      // Filter by confidence threshold
      const highConfidenceSignals = signals.filter(s => s.confidence >= 0.6);
      
      if (highConfidenceSignals.length === 0) return;
      
      // If multiple signals agree, boost confidence
      const buySignals = highConfidenceSignals.filter(s => s.action === 'BUY');
      const sellSignals = highConfidenceSignals.filter(s => s.action === 'SELL');
      
      if (buySignals.length > sellSignals.length && buySignals.length >= 2) {
        // Consensus buy signal
        const avgConfidence = buySignals.reduce((sum, s) => sum + s.confidence, 0) / buySignals.length;
        const bestSignal = buySignals.reduce((best, current) => 
          current.confidence > best.confidence ? current : best
        );
        
        combinedSignals.push({
          ...bestSignal,
          confidence: Math.min(0.95, avgConfidence * 1.1),
          reason: `Consensus BUY: ${buySignals.length} signals agree`,
        });
      } else if (sellSignals.length > buySignals.length && sellSignals.length >= 2) {
        // Consensus sell signal
        const avgConfidence = sellSignals.reduce((sum, s) => sum + s.confidence, 0) / sellSignals.length;
        const bestSignal = sellSignals.reduce((best, current) => 
          current.confidence > best.confidence ? current : best
        );
        
        combinedSignals.push({
          ...bestSignal,
          confidence: Math.min(0.95, avgConfidence * 1.1),
          reason: `Consensus SELL: ${sellSignals.length} signals agree`,
        });
      } else if (highConfidenceSignals.length === 1) {
        // Single high confidence signal
        combinedSignals.push(highConfidenceSignals[0]);
      }
    });
    
    return combinedSignals;
  }

  private async executeSignals(signals: TradingSignal[]): Promise<void> {
    for (const signal of signals) {
      try {
        // Validate with risk manager
        const validation = await this.riskManager.validateTrade(signal);
        
        if (!validation.isValid) {
          logger.warn('Signal rejected by risk manager', {
            signal,
            reason: validation.reason,
          });
          continue;
        }
        
        const validatedSignal = validation.adjustedSignal || signal;
        
        // Execute based on trading mode
        if (config.trading.mode === 'paper') {
          await this.executePaperTrade(validatedSignal);
        } else {
          await this.executeLiveTrade(validatedSignal);
        }
        
      } catch (error) {
        logger.error('Error executing signal', { signal, error });
      }
    }
  }

  private async executePaperTrade(signal: TradingSignal): Promise<void> {
    logger.info('Executing paper trade', { signal });
    
    const currentPrice = signal.entryPrice || 
      this.marketDataCollector.getLatestData(signal.symbol)?.price || 0;
    
    if (signal.action === 'BUY') {
      // Create position
      const position: Position = {
        id: uuidv4(),
        symbol: signal.symbol,
        side: 'LONG',
        entryPrice: currentPrice,
        currentPrice: currentPrice,
        quantity: (signal.positionSize || 0.1) * this.riskManager.getPortfolioValue() / currentPrice,
        pnl: 0,
        pnlPercentage: 0,
        openedAt: new Date(),
        stopLoss: signal.stopLoss,
        takeProfit: signal.targetPrice,
      };
      
      this.riskManager.addPosition(position);
      
      this.emit('tradeExecuted', {
        type: 'paper',
        action: 'BUY',
        position,
        signal,
      });
    } else if (signal.action === 'SELL') {
      // Close positions for this symbol
      const positions = this.riskManager.getPositions()
        .filter(p => p.symbol === signal.symbol);
      
      for (const position of positions) {
        const trade = this.riskManager.closePosition(
          position.id,
          currentPrice,
          signal.reason
        );
        
        this.emit('tradeExecuted', {
          type: 'paper',
          action: 'SELL',
          trade,
          signal,
        });
      }
    }
  }

  private async executeLiveTrade(signal: TradingSignal): Promise<void> {
    logger.info('Executing live trade', { signal });
    
    if (!this.defiExecutor) {
      logger.warn('DeFi executor not initialized, using mock trading');
      // Fall back to mock trading
      const trade = await this.tradingAbilities.getSpotTrading().execute({
        symbol: signal.symbol,
        side: signal.action as 'BUY' | 'SELL',
        quantity: signal.positionSize || 0.1,
        orderType: 'MARKET',
      });
      
      this.emit('tradeExecuted', {
        type: 'live',
        action: signal.action,
        trade,
        signal,
      });
      return;
    }
    
    try {
      // Execute real DeFi trade on Shape Sepolia
      const result = await this.defiExecutor.executeSpotTrade(signal);
      
      // Update risk manager with the trade
      if (result && signal.action === 'BUY') {
        const position: Position = {
          id: result.txHash,
          symbol: signal.symbol,
          side: 'LONG',
          entryPrice: signal.entryPrice || 0,
          currentPrice: signal.entryPrice || 0,
          quantity: parseFloat(result.expectedOut || '0'),
          pnl: 0,
          pnlPercentage: 0,
          openedAt: new Date(),
          stopLoss: signal.stopLoss,
          takeProfit: signal.targetPrice,
        };
        
        this.riskManager.addPosition(position);
      }
      
      this.emit('tradeExecuted', {
        type: 'live',
        action: signal.action,
        trade: result,
        signal,
      });
      
      // Log account status after trade
      const status = await this.defiExecutor.getAccountStatus();
      logger.info('Account status after trade', status);
      
    } catch (error) {
      logger.error('Failed to execute live trade', { error, signal });
      this.emit('tradeError', {
        signal,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  private startPositionMonitoring(): void {
    this.positionMonitorInterval = setInterval(() => {
      this.updatePositions();
    }, 10000); // Every 10 seconds
  }

  private updatePositions(): void {
    const positions = this.riskManager.getPositions();
    
    for (const position of positions) {
      const latestData = this.marketDataCollector.getLatestData(position.symbol);
      if (latestData) {
        this.riskManager.updatePosition(position.id, latestData.price);
      }
    }
  }

  private scheduleDailyReset(): void {
    // Reset at midnight UTC
    this.dailyResetSchedule = cron.schedule('0 0 * * *', () => {
      logger.info('Performing daily reset');
      this.riskManager.resetDaily();
      this.emit('dailyReset', {
        timestamp: new Date(),
        portfolioValue: this.riskManager.getPortfolioValue(),
      });
    });
  }

  // Public methods for external control
  async forceAnalysis(): Promise<void> {
    logger.info('Force analysis requested');
    await this.runAnalysis();
  }

  getRiskMetrics(): any {
    return this.riskManager.calculateRiskMetrics();
  }

  getPositions(): Position[] {
    return this.riskManager.getPositions();
  }

  getTrades(): any[] {
    return this.riskManager.getTrades();
  }

  getPortfolioValue(): number {
    return this.riskManager.getPortfolioValue();
  }
}