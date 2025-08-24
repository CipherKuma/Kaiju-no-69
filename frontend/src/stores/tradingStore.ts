import { create } from 'zustand';
import { devtools, subscribeWithSelector } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import { logger } from './middleware';
import type { Trade, Portfolio, Policy, PerformanceMetrics, Holding } from './types';

interface TradingState {
  // Trade Feed
  trades: Trade[];
  liveTrades: Trade[];
  maxTradeHistory: number;
  isTradeStreamConnected: boolean;
  
  // Portfolio
  portfolio: Portfolio;
  historicalPortfolioValue: Array<{ timestamp: Date; value: number }>;
  
  // Policies
  policies: Map<string, Policy>;
  activePolicies: string[];
  policyExecutionHistory: Array<{
    policyId: string;
    executedAt: Date;
    action: string;
    result: 'success' | 'failed';
  }>;
  
  // Performance
  performanceMetrics: PerformanceMetrics;
  benchmarkComparison: {
    benchmark: string;
    benchmarkReturn: number;
    alpha: number;
  };
  
  // Actions - Trade Feed
  addTrade: (trade: Trade) => void;
  addLiveTrade: (trade: Trade) => void;
  updateTradeStatus: (tradeId: string, status: Trade['status']) => void;
  clearOldTrades: () => void;
  setTradeStreamConnected: (connected: boolean) => void;
  
  // Actions - Portfolio
  updatePortfolio: (portfolio: Partial<Portfolio>) => void;
  updateHolding: (asset: string, holding: Partial<Holding>) => void;
  addHolding: (holding: Holding) => void;
  removeHolding: (asset: string) => void;
  recordPortfolioSnapshot: () => void;
  
  // Actions - Policies
  createPolicy: (policy: Policy) => void;
  updatePolicy: (policyId: string, updates: Partial<Policy>) => void;
  deletePolicy: (policyId: string) => void;
  togglePolicy: (policyId: string) => void;
  executePolicy: (policyId: string) => Promise<void>;
  recordPolicyExecution: (policyId: string, action: string, result: 'success' | 'failed') => void;
  
  // Actions - Performance
  updatePerformanceMetrics: (metrics: Partial<PerformanceMetrics>) => void;
  calculateReturns: () => void;
  updateBenchmark: (benchmark: string, benchmarkReturn: number) => void;
  
  // Trade Execution
  executeBuyOrder: (asset: string, amount: number, price: number) => Promise<Trade>;
  executeSellOrder: (asset: string, amount: number, price: number) => Promise<Trade>;
  cancelOrder: (tradeId: string) => Promise<void>;
  
  // Utility
  reset: () => void;
  exportTradeHistory: () => Trade[];
  importTradeHistory: (trades: Trade[]) => void;
}

const initialPortfolio: Portfolio = {
  totalValue: 0,
  availableBalance: 0,
  holdings: [],
  performance: {
    dailyReturn: 0,
    weeklyReturn: 0,
    monthlyReturn: 0,
    totalReturn: 0,
    winRate: 0,
    totalTrades: 0,
    profitableTrades: 0
  }
};

const initialState = {
  trades: [],
  liveTrades: [],
  maxTradeHistory: 1000,
  isTradeStreamConnected: false,
  portfolio: initialPortfolio,
  historicalPortfolioValue: [],
  policies: new Map(),
  activePolicies: [],
  policyExecutionHistory: [],
  performanceMetrics: initialPortfolio.performance,
  benchmarkComparison: {
    benchmark: 'SPY',
    benchmarkReturn: 0,
    alpha: 0
  }
};

export const useTradingStore = create<TradingState>()(
  logger(
    devtools(
      subscribeWithSelector(
        immer((set, get) => ({
          ...initialState,

          addTrade: (trade) => {
            set((state) => {
              state.trades.unshift(trade);
              if (state.trades.length > state.maxTradeHistory) {
                state.trades.pop();
              }
              
              // Update performance metrics
              if (trade.status === 'completed') {
                state.performanceMetrics.totalTrades += 1;
                if (trade.type === 'sell') {
                  const holding = state.portfolio.holdings.find(h => h.asset === trade.asset);
                  if (holding && trade.price > holding.averagePrice) {
                    state.performanceMetrics.profitableTrades += 1;
                  }
                }
                state.performanceMetrics.winRate = 
                  state.performanceMetrics.profitableTrades / state.performanceMetrics.totalTrades;
              }
            });
          },

          addLiveTrade: (trade) => {
            set((state) => {
              state.liveTrades.unshift(trade);
              if (state.liveTrades.length > 100) {
                state.liveTrades = state.liveTrades.slice(0, 100);
              }
            });
          },

          updateTradeStatus: (tradeId, status) => {
            set((state) => {
              const trade = state.trades.find(t => t.id === tradeId);
              if (trade) {
                trade.status = status;
              }
            });
          },

          clearOldTrades: () => {
            set((state) => {
              const cutoffDate = new Date();
              cutoffDate.setDate(cutoffDate.getDate() - 30);
              state.trades = state.trades.filter(t => t.timestamp > cutoffDate);
            });
          },

          setTradeStreamConnected: (connected) => {
            set((state) => {
              state.isTradeStreamConnected = connected;
            });
          },

          updatePortfolio: (portfolio) => {
            set((state) => {
              Object.assign(state.portfolio, portfolio);
            });
          },

          updateHolding: (asset, holding) => {
            set((state) => {
              const existingHolding = state.portfolio.holdings.find(h => h.asset === asset);
              if (existingHolding) {
                Object.assign(existingHolding, holding);
              }
            });
          },

          addHolding: (holding) => {
            set((state) => {
              state.portfolio.holdings.push(holding);
            });
          },

          removeHolding: (asset) => {
            set((state) => {
              state.portfolio.holdings = state.portfolio.holdings.filter(h => h.asset !== asset);
            });
          },

          recordPortfolioSnapshot: () => {
            set((state) => {
              state.historicalPortfolioValue.push({
                timestamp: new Date(),
                value: state.portfolio.totalValue
              });
              
              // Keep only last 30 days of data
              const cutoffDate = new Date();
              cutoffDate.setDate(cutoffDate.getDate() - 30);
              state.historicalPortfolioValue = state.historicalPortfolioValue.filter(
                snapshot => snapshot.timestamp > cutoffDate
              );
            });
          },

          createPolicy: (policy) => {
            set((state) => {
              state.policies.set(policy.id, policy);
              if (policy.enabled) {
                state.activePolicies.push(policy.id);
              }
            });
          },

          updatePolicy: (policyId, updates) => {
            set((state) => {
              const policy = state.policies.get(policyId);
              if (policy) {
                Object.assign(policy, updates);
              }
            });
          },

          deletePolicy: (policyId) => {
            set((state) => {
              state.policies.delete(policyId);
              state.activePolicies = state.activePolicies.filter(id => id !== policyId);
            });
          },

          togglePolicy: (policyId) => {
            set((state) => {
              const policy = state.policies.get(policyId);
              if (policy) {
                policy.enabled = !policy.enabled;
                if (policy.enabled) {
                  state.activePolicies.push(policyId);
                } else {
                  state.activePolicies = state.activePolicies.filter(id => id !== policyId);
                }
              }
            });
          },

          executePolicy: async (policyId) => {
            const policy = get().policies.get(policyId);
            if (!policy || !policy.enabled) return;

            try {
              // TODO: Implement actual policy execution logic
              console.log(`Executing policy: ${policy.name}`);
              
              get().recordPolicyExecution(policyId, 'execute', 'success');
            } catch (error) {
              get().recordPolicyExecution(policyId, 'execute', 'failed');
              throw error;
            }
          },

          recordPolicyExecution: (policyId, action, result) => {
            set((state) => {
              state.policyExecutionHistory.unshift({
                policyId,
                executedAt: new Date(),
                action,
                result
              });
              
              // Keep only last 100 executions
              if (state.policyExecutionHistory.length > 100) {
                state.policyExecutionHistory = state.policyExecutionHistory.slice(0, 100);
              }
            });
          },

          updatePerformanceMetrics: (metrics) => {
            set((state) => {
              Object.assign(state.performanceMetrics, metrics);
            });
          },

          calculateReturns: () => {
            const { historicalPortfolioValue } = get();
            if (historicalPortfolioValue.length < 2) return;

            set((state) => {
              const now = new Date();
              const dayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
              const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
              const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

              const currentValue = state.portfolio.totalValue;
              const dayAgoValue = historicalPortfolioValue.find(s => s.timestamp >= dayAgo)?.value || currentValue;
              const weekAgoValue = historicalPortfolioValue.find(s => s.timestamp >= weekAgo)?.value || currentValue;
              const monthAgoValue = historicalPortfolioValue.find(s => s.timestamp >= monthAgo)?.value || currentValue;
              const initialValue = historicalPortfolioValue[0].value;

              state.performanceMetrics.dailyReturn = ((currentValue - dayAgoValue) / dayAgoValue) * 100;
              state.performanceMetrics.weeklyReturn = ((currentValue - weekAgoValue) / weekAgoValue) * 100;
              state.performanceMetrics.monthlyReturn = ((currentValue - monthAgoValue) / monthAgoValue) * 100;
              state.performanceMetrics.totalReturn = ((currentValue - initialValue) / initialValue) * 100;
            });
          },

          updateBenchmark: (benchmark, benchmarkReturn) => {
            set((state) => {
              state.benchmarkComparison.benchmark = benchmark;
              state.benchmarkComparison.benchmarkReturn = benchmarkReturn;
              state.benchmarkComparison.alpha = state.performanceMetrics.totalReturn - benchmarkReturn;
            });
          },

          executeBuyOrder: async (asset, amount, price) => {
            const trade: Trade = {
              id: Date.now().toString(),
              timestamp: new Date(),
              type: 'buy',
              asset,
              amount,
              price,
              total: amount * price,
              status: 'pending',
              userId: 'current-user' // TODO: Get from user store
            };

            get().addTrade(trade);

            try {
              // TODO: Implement actual buy order execution
              await new Promise(resolve => setTimeout(resolve, 1000));
              
              get().updateTradeStatus(trade.id, 'completed');
              
              // Update portfolio
              const holding = get().portfolio.holdings.find(h => h.asset === asset);
              if (holding) {
                const newAmount = holding.amount + amount;
                const newAveragePrice = ((holding.amount * holding.averagePrice) + (amount * price)) / newAmount;
                get().updateHolding(asset, {
                  amount: newAmount,
                  averagePrice: newAveragePrice,
                  value: newAmount * price
                });
              } else {
                get().addHolding({
                  asset,
                  amount,
                  averagePrice: price,
                  currentPrice: price,
                  value: amount * price,
                  profitLoss: 0,
                  profitLossPercentage: 0
                });
              }
              
              return trade;
            } catch (error) {
              get().updateTradeStatus(trade.id, 'failed');
              throw error;
            }
          },

          executeSellOrder: async (asset, amount, price) => {
            const holding = get().portfolio.holdings.find(h => h.asset === asset);
            if (!holding || holding.amount < amount) {
              throw new Error('Insufficient holdings');
            }

            const trade: Trade = {
              id: Date.now().toString(),
              timestamp: new Date(),
              type: 'sell',
              asset,
              amount,
              price,
              total: amount * price,
              status: 'pending',
              userId: 'current-user' // TODO: Get from user store
            };

            get().addTrade(trade);

            try {
              // TODO: Implement actual sell order execution
              await new Promise(resolve => setTimeout(resolve, 1000));
              
              get().updateTradeStatus(trade.id, 'completed');
              
              // Update portfolio
              const newAmount = holding.amount - amount;
              if (newAmount === 0) {
                get().removeHolding(asset);
              } else {
                get().updateHolding(asset, {
                  amount: newAmount,
                  value: newAmount * price
                });
              }
              
              return trade;
            } catch (error) {
              get().updateTradeStatus(trade.id, 'failed');
              throw error;
            }
          },

          cancelOrder: async (tradeId) => {
            const trade = get().trades.find(t => t.id === tradeId);
            if (!trade || trade.status !== 'pending') {
              throw new Error('Trade cannot be cancelled');
            }

            // TODO: Implement actual order cancellation
            await new Promise(resolve => setTimeout(resolve, 500));
            
            get().updateTradeStatus(tradeId, 'cancelled');
          },

          reset: () => {
            set(() => ({
              ...initialState,
              policies: new Map()
            }));
          },

          exportTradeHistory: () => {
            return get().trades;
          },

          importTradeHistory: (trades) => {
            set((state) => {
              state.trades = trades;
            });
          }
        }))
      ),
      { name: 'trading-store' }
    ),
    'TradingStore'
  )
);

// Selectors for optimized re-renders
export const selectTrades = (state: TradingState) => state.trades;
export const selectLiveTrades = (state: TradingState) => state.liveTrades;
export const selectPortfolio = (state: TradingState) => state.portfolio;
export const selectHoldings = (state: TradingState) => state.portfolio.holdings;
export const selectPolicies = (state: TradingState) => Array.from(state.policies.values());
export const selectActivePolicies = (state: TradingState) => 
  state.activePolicies.map(id => state.policies.get(id)).filter(Boolean);
export const selectPerformanceMetrics = (state: TradingState) => state.performanceMetrics;
export const selectTotalPortfolioValue = (state: TradingState) => state.portfolio.totalValue;