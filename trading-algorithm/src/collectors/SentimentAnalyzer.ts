import axios from 'axios';
import Sentiment from 'sentiment';
import { EventEmitter } from 'events';
import { SentimentData, NewsItem } from '../types/index.js';
import { config } from '../config/index.js';
import { logger } from '../utils/logger.js';

export class SentimentAnalyzer extends EventEmitter {
  private sentiment: Sentiment;
  private symbols: string[];
  private intervalId?: NodeJS.Timeout;
  private sentimentCache: Map<string, SentimentData> = new Map();

  constructor(symbols: string[]) {
    super();
    this.symbols = symbols;
    this.sentiment = new Sentiment();
  }

  async start(): Promise<void> {
    logger.info('Starting sentiment analyzer', { symbols: this.symbols });
    
    // Initial analysis
    await this.analyzeSentiment();
    
    // Set up interval
    this.intervalId = setInterval(
      () => this.analyzeSentiment(),
      config.dataCollection.sentimentUpdateInterval
    );
  }

  stop(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = undefined;
    }
    logger.info('Stopped sentiment analyzer');
  }

  private async analyzeSentiment(): Promise<void> {
    for (const symbol of this.symbols) {
      try {
        const sentimentData = await this.analyzeSymbolSentiment(symbol);
        this.sentimentCache.set(symbol, sentimentData);
        this.emit('sentimentData', sentimentData);
      } catch (error) {
        logger.error('Error analyzing sentiment', { symbol, error: error instanceof Error ? error.message : error });
      }
    }
  }

  private async analyzeSymbolSentiment(symbol: string): Promise<SentimentData> {
    // Mock implementation for now - in production, you would fetch from real APIs
    const mockTexts = [
      `${symbol} is showing strong bullish momentum`,
      `Investors are optimistic about ${symbol}`,
      `Technical analysis suggests ${symbol} might correct`,
      `${symbol} breaking resistance levels`,
      `Market sentiment turning bearish on ${symbol}`,
    ];

    // Analyze sentiment
    const scores = mockTexts.map(text => {
      const result = this.sentiment.analyze(text);
      return result.score;
    });

    const averageScore = scores.reduce((a, b) => a + b, 0) / scores.length;
    const normalizedScore = Math.tanh(averageScore / 5); // Normalize to -1 to 1

    return {
      symbol,
      score: normalizedScore,
      sources: {
        twitter: normalizedScore + (Math.random() * 0.2 - 0.1),
        reddit: normalizedScore + (Math.random() * 0.2 - 0.1),
        news: normalizedScore + (Math.random() * 0.2 - 0.1),
      },
      volume: Math.floor(Math.random() * 10000) + 1000, // Mock mention volume
      timestamp: new Date(),
    };
  }

  async fetchNews(symbol: string): Promise<NewsItem[]> {
    // Mock news implementation
    const mockNews: NewsItem[] = [
      {
        title: `${symbol} Reaches New All-Time High`,
        content: `The cryptocurrency ${symbol} has reached a new all-time high...`,
        url: 'https://example.com/news1',
        publishedAt: new Date(),
        source: 'CryptoNews',
        sentiment: 0.8,
        relevantSymbols: [symbol],
      },
      {
        title: `Technical Analysis: ${symbol} Shows Bullish Pattern`,
        content: `Technical indicators suggest ${symbol} is forming a bullish pattern...`,
        url: 'https://example.com/news2',
        publishedAt: new Date(Date.now() - 3600000),
        source: 'TradingView',
        sentiment: 0.6,
        relevantSymbols: [symbol],
      },
    ];

    return mockNews;
  }

  getLatestSentiment(symbol: string): SentimentData | undefined {
    return this.sentimentCache.get(symbol);
  }

  getAllLatestSentiment(): Map<string, SentimentData> {
    return new Map(this.sentimentCache);
  }

  // Advanced sentiment analysis using multiple sources
  async performDeepSentimentAnalysis(texts: string[]): Promise<{
    overallSentiment: number;
    positiveCount: number;
    negativeCount: number;
    neutralCount: number;
    keywords: string[];
  }> {
    const results = texts.map(text => this.sentiment.analyze(text));
    
    const overallScore = results.reduce((sum, r) => sum + r.score, 0) / results.length;
    const positiveCount = results.filter(r => r.score > 0).length;
    const negativeCount = results.filter(r => r.score < 0).length;
    const neutralCount = results.filter(r => r.score === 0).length;

    // Extract keywords (simplified version)
    const allWords = texts.join(' ').toLowerCase().split(/\\s+/);
    const wordFreq = new Map<string, number>();
    
    allWords.forEach(word => {
      if (word.length > 4) { // Only consider words with more than 4 characters
        wordFreq.set(word, (wordFreq.get(word) || 0) + 1);
      }
    });

    const keywords = Array.from(wordFreq.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([word]) => word);

    return {
      overallSentiment: Math.tanh(overallScore / 5),
      positiveCount,
      negativeCount,
      neutralCount,
      keywords,
    };
  }
}