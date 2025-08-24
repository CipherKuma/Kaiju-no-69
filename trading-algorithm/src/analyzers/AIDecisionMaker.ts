import { GoogleGenerativeAI } from '@google/generative-ai';
import { MarketAnalysis, TradingSignal, AIDecision, Position, RiskMetrics } from '../types/index.js';
import { config } from '../config/index.js';
import { logger } from '../utils/logger.js';

export class AIDecisionMaker {
  private genAI: GoogleGenerativeAI;
  private model: any;

  constructor() {
    this.genAI = new GoogleGenerativeAI(config.gemini.apiKey);
    this.model = this.genAI.getGenerativeModel({ 
      model: config.gemini.model,
      generationConfig: {
        temperature: 0.3,
        topK: 1,
        topP: 0.95,
        maxOutputTokens: 1000,
      },
    });
  }

  async analyzeMarket(
    marketAnalysis: MarketAnalysis,
    currentPositions: Position[],
    riskMetrics: RiskMetrics
  ): Promise<AIDecision> {
    try {
      const prompt = this.buildAnalysisPrompt(marketAnalysis, currentPositions, riskMetrics);
      
      const result = await this.model.generateContent([
        this.getSystemPrompt(),
        prompt
      ]);

      const response = await result.response;
      const text = response.text();

      return this.parseAIResponse(text);
    } catch (error) {
      logger.error('Error in AI decision making', { error: error instanceof Error ? error.message : error });
      
      // Return a conservative decision on error
      return {
        signals: [],
        reasoning: 'Error occurred during analysis, recommending no action',
        marketCondition: 'neutral',
        confidence: 0,
        suggestedActions: [],
        riskAssessment: {
          level: 'high',
          factors: ['AI analysis failed'],
        },
      };
    }
  }

  private getSystemPrompt(): string {
    return `You are an expert cryptocurrency trading AI assistant. Your role is to analyze market data, technical indicators, and sentiment to make informed trading decisions.

Key responsibilities:
1. Analyze market conditions comprehensively
2. Generate trading signals with appropriate risk management
3. Consider current positions and portfolio risk
4. Provide clear reasoning for all recommendations
5. Prioritize capital preservation over aggressive gains

Trading rules:
- Maximum position size: ${config.trading.maxPositionSize * 100}% of capital per trade
- Stop loss: ${config.trading.stopLossPercentage * 100}% maximum loss per position
- Take profit: Target ${config.trading.takeProfitPercentage * 100}% gain per position
- Maximum open positions: ${config.riskManagement.maxOpenPositions}
- Daily loss limit: ${config.riskManagement.maxDailyLoss * 100}%

Always provide your analysis in the following JSON format:
{
  "signals": [
    {
      "symbol": "BTC/USDT",
      "action": "BUY|SELL|HOLD",
      "confidence": 0.0-1.0,
      "reason": "Brief explanation",
      "entryPrice": 50000,
      "targetPrice": 52500,
      "stopLoss": 49000,
      "positionSize": 0.1
    }
  ],
  "reasoning": "Detailed market analysis",
  "marketCondition": "bullish|bearish|neutral|volatile",
  "confidence": 0.0-1.0,
  "suggestedActions": [
    {
      "symbol": "BTC/USDT",
      "action": "Monitor for breakout above 51000",
      "rationale": "Explanation"
    }
  ],
  "riskAssessment": {
    "level": "low|medium|high",
    "factors": ["List of risk factors"]
  }
}`;
  }

  private buildAnalysisPrompt(
    marketAnalysis: MarketAnalysis,
    currentPositions: Position[],
    riskMetrics: RiskMetrics
  ): string {
    const { marketData, technicalIndicators, sentimentData } = marketAnalysis;

    return `Please analyze the following market data and provide trading recommendations:

MARKET DATA:
${marketData.map(md => 
  `${md.symbol}: Price: $${md.price}, Volume: ${md.volume}, 24h Change: ${md.change24h}%`
).join('\n')}

TECHNICAL INDICATORS:
- RSI: ${technicalIndicators.rsi}
- MACD: Value: ${technicalIndicators.macd.value}, Signal: ${technicalIndicators.macd.signal}
- SMA20: ${technicalIndicators.sma20}, SMA50: ${technicalIndicators.sma50}
- Bollinger Bands: Upper: ${technicalIndicators.bbands.upper}, Lower: ${technicalIndicators.bbands.lower}
- ATR: ${technicalIndicators.atr}

SENTIMENT ANALYSIS:
- Overall Score: ${sentimentData.score} (-1 to 1)
- Twitter: ${sentimentData.sources.twitter}
- Reddit: ${sentimentData.sources.reddit}
- News: ${sentimentData.sources.news}
- Mention Volume: ${sentimentData.volume}

CURRENT POSITIONS:
${currentPositions.length === 0 ? 'No open positions' : 
  currentPositions.map(p => 
    `${p.symbol}: ${p.side} ${p.quantity} @ $${p.entryPrice}, PnL: ${p.pnlPercentage}%`
  ).join('\n')}

RISK METRICS:
- Portfolio Value: $${riskMetrics.portfolioValue}
- Daily PnL: ${riskMetrics.dailyPnLPercentage}%
- Open Positions: ${riskMetrics.openPositions}/${config.riskManagement.maxOpenPositions}
- Win Rate: ${riskMetrics.winRate}%
- Risk/Reward Ratio: ${riskMetrics.riskRewardRatio}

Please provide your analysis and trading recommendations in the specified JSON format.`;
  }

  private parseAIResponse(response: string): AIDecision {
    try {
      // Extract JSON from the response by finding matching braces
      const firstBraceIndex = response.indexOf('{');
      if (firstBraceIndex === -1) {
        throw new Error('No JSON found in response');
      }
      
      // Find the matching closing brace
      let braceCount = 0;
      let jsonEndIndex = -1;
      
      for (let i = firstBraceIndex; i < response.length; i++) {
        if (response[i] === '{') {
          braceCount++;
        } else if (response[i] === '}') {
          braceCount--;
          if (braceCount === 0) {
            jsonEndIndex = i;
            break;
          }
        }
      }
      
      if (jsonEndIndex === -1) {
        throw new Error('No matching closing brace found');
      }
      
      const jsonString = response.substring(firstBraceIndex, jsonEndIndex + 1);
      const parsed = JSON.parse(jsonString);
      
      // Validate and transform the response
      const signals: TradingSignal[] = (parsed.signals || []).map((signal: any) => ({
        symbol: signal.symbol,
        action: signal.action,
        confidence: Math.max(0, Math.min(1, signal.confidence || 0)),
        reason: signal.reason || '',
        timestamp: new Date(),
        entryPrice: signal.entryPrice,
        targetPrice: signal.targetPrice,
        stopLoss: signal.stopLoss,
        positionSize: signal.positionSize,
      }));

      return {
        signals,
        reasoning: parsed.reasoning || '',
        marketCondition: parsed.marketCondition || 'neutral',
        confidence: Math.max(0, Math.min(1, parsed.confidence || 0)),
        suggestedActions: parsed.suggestedActions || [],
        riskAssessment: parsed.riskAssessment || {
          level: 'medium',
          factors: [],
        },
      };
    } catch (error) {
      logger.error('Error parsing AI response', { 
        error: error instanceof Error ? error.message : error,
        responseLength: response.length,
        responsePreview: response.substring(0, 200) + '...'
      });
      
      return {
        signals: [],
        reasoning: 'Failed to parse AI response',
        marketCondition: 'neutral',
        confidence: 0,
        suggestedActions: [],
        riskAssessment: {
          level: 'high',
          factors: ['Response parsing failed'],
        },
      };
    }
  }

  async evaluateSignal(signal: TradingSignal, marketData: any): Promise<{
    isValid: boolean;
    adjustedSignal?: TradingSignal;
    reason?: string;
  }> {
    // Validate and potentially adjust the signal based on current market conditions
    
    // Check if the entry price is reasonable
    const currentPrice = marketData.price;
    const priceDifference = Math.abs(currentPrice - (signal.entryPrice || currentPrice)) / currentPrice;
    
    if (priceDifference > 0.02) { // More than 2% difference
      return {
        isValid: false,
        reason: `Entry price too far from current market price (${priceDifference * 100}% difference)`,
      };
    }

    // Validate stop loss
    if (signal.stopLoss) {
      const stopLossDistance = Math.abs(signal.stopLoss - currentPrice) / currentPrice;
      if (stopLossDistance > config.trading.stopLossPercentage * 2) {
        return {
          isValid: false,
          reason: 'Stop loss is too far from entry price',
        };
      }
    }

    // Validate position size
    if (signal.positionSize && signal.positionSize > config.trading.maxPositionSize) {
      signal.positionSize = config.trading.maxPositionSize;
    }

    return {
      isValid: true,
      adjustedSignal: signal,
    };
  }
}