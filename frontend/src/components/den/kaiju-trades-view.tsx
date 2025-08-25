"use client";

import { useState, useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from "recharts";
import { ArrowUpRight, ArrowDownRight, Clock, DollarSign, TrendingUp, Activity } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface Trade {
  id: string;
  timestamp: Date;
  type: 'buy' | 'sell';
  token: string;
  amount: number;
  price: number;
  value: number;
  pnl: number;
  pnlPercentage: number;
  chain: string;
  dex: string;
  txHash: string;
}

interface KaijuTradesViewProps {
  kaijuId: string;
}

// Mock trades data
const generateMockTrades = (): Trade[] => {
  const tokens = ['PEPE', 'SHIB', 'DOGE', 'FLOKI', 'WOJAK', 'MEME'];
  const chains = ['Shape', 'Ethereum', 'Arbitrum'];
  const dexes = ['Uniswap', 'Sushiswap', 'Pancakeswap'];
  
  return Array.from({ length: 20 }, (_, i) => ({
    id: `trade-${i}`,
    timestamp: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000),
    type: Math.random() > 0.5 ? 'buy' : 'sell' as 'buy' | 'sell',
    token: tokens[Math.floor(Math.random() * tokens.length)],
    amount: Math.floor(Math.random() * 10000) + 1000,
    price: Math.random() * 0.001,
    value: Math.random() * 10 + 0.5,
    pnl: (Math.random() - 0.3) * 5,
    pnlPercentage: (Math.random() - 0.3) * 100,
    chain: chains[Math.floor(Math.random() * chains.length)],
    dex: dexes[Math.floor(Math.random() * dexes.length)],
    txHash: `0x${Math.random().toString(16).substr(2, 64)}`,
  })).sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
};

export function KaijuTradesView({ kaijuId }: KaijuTradesViewProps) {
  const [trades, setTrades] = useState<Trade[]>([]);
  const [filter, setFilter] = useState<'all' | 'profitable' | 'loss'>('all');

  useEffect(() => {
    // In production, fetch trades from API
    setTrades(generateMockTrades());
  }, [kaijuId]);

  const filteredTrades = trades.filter(trade => {
    if (filter === 'profitable') return trade.pnl > 0;
    if (filter === 'loss') return trade.pnl < 0;
    return true;
  });

  // Calculate stats
  const totalTrades = filteredTrades.length;
  const profitableTrades = filteredTrades.filter(t => t.pnl > 0).length;
  const winRate = totalTrades > 0 ? (profitableTrades / totalTrades * 100) : 0;
  const totalPnL = filteredTrades.reduce((sum, t) => sum + t.pnl, 0);
  const avgTradeSize = filteredTrades.reduce((sum, t) => sum + t.value, 0) / totalTrades || 0;

  // Generate chart data
  const chartData = Array.from({ length: 30 }, (_, i) => {
    const date = new Date();
    date.setDate(date.getDate() - (29 - i));
    const dayTrades = trades.filter(t => 
      t.timestamp.toDateString() === date.toDateString()
    );
    const dayPnL = dayTrades.reduce((sum, t) => sum + t.pnl, 0);
    const volume = dayTrades.reduce((sum, t) => sum + t.value, 0);
    
    return {
      day: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      pnl: dayPnL,
      volume: volume,
      trades: dayTrades.length,
    };
  });

  return (
    <div className="space-y-6">
      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-stone-800/50 p-4">
          <div className="flex items-center gap-2 text-stone-400 mb-1">
            <Activity className="h-4 w-4" />
            <span className="text-sm">Total Trades</span>
          </div>
          <p className="text-2xl font-bold">{totalTrades}</p>
        </Card>
        
        <Card className="bg-stone-800/50 p-4">
          <div className="flex items-center gap-2 text-stone-400 mb-1">
            <TrendingUp className="h-4 w-4" />
            <span className="text-sm">Win Rate</span>
          </div>
          <p className="text-2xl font-bold">{winRate.toFixed(1)}%</p>
        </Card>
        
        <Card className="bg-stone-800/50 p-4">
          <div className="flex items-center gap-2 text-stone-400 mb-1">
            <DollarSign className="h-4 w-4" />
            <span className="text-sm">Total P&L</span>
          </div>
          <p className={`text-2xl font-bold ${totalPnL >= 0 ? 'text-green-500' : 'text-red-500'}`}>
            {totalPnL >= 0 ? '+' : ''}{totalPnL.toFixed(2)} ETH
          </p>
        </Card>
        
        <Card className="bg-stone-800/50 p-4">
          <div className="flex items-center gap-2 text-stone-400 mb-1">
            <DollarSign className="h-4 w-4" />
            <span className="text-sm">Avg Trade Size</span>
          </div>
          <p className="text-2xl font-bold">{avgTradeSize.toFixed(2)} ETH</p>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="bg-stone-800/50 p-6">
          <h3 className="text-lg font-semibold mb-4">Daily P&L</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#44403c" />
                <XAxis dataKey="day" stroke="#a8a29e" fontSize={12} />
                <YAxis stroke="#a8a29e" fontSize={12} />
                <Tooltip 
                  contentStyle={{
                    backgroundColor: "#1c1917",
                    border: "1px solid #44403c",
                    borderRadius: "8px",
                  }}
                />
                <Line 
                  type="monotone" 
                  dataKey="pnl" 
                  stroke="#10b981" 
                  strokeWidth={2}
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card className="bg-stone-800/50 p-6">
          <h3 className="text-lg font-semibold mb-4">Trading Volume</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#44403c" />
                <XAxis dataKey="day" stroke="#a8a29e" fontSize={12} />
                <YAxis stroke="#a8a29e" fontSize={12} />
                <Tooltip 
                  contentStyle={{
                    backgroundColor: "#1c1917",
                    border: "1px solid #44403c",
                    borderRadius: "8px",
                  }}
                />
                <Bar dataKey="volume" fill="#3b82f6" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex gap-2">
        <button
          onClick={() => setFilter('all')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            filter === 'all' 
              ? 'bg-stone-700 text-white' 
              : 'bg-stone-800/50 text-stone-400 hover:bg-stone-700/50'
          }`}
        >
          All Trades
        </button>
        <button
          onClick={() => setFilter('profitable')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            filter === 'profitable' 
              ? 'bg-green-900/50 text-green-400' 
              : 'bg-stone-800/50 text-stone-400 hover:bg-stone-700/50'
          }`}
        >
          Profitable
        </button>
        <button
          onClick={() => setFilter('loss')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            filter === 'loss' 
              ? 'bg-red-900/50 text-red-400' 
              : 'bg-stone-800/50 text-stone-400 hover:bg-stone-700/50'
          }`}
        >
          Losses
        </button>
      </div>

      {/* Trades List */}
      <div className="space-y-3">
        <h3 className="text-lg font-semibold">Recent Trades</h3>
        <div className="space-y-2">
          {filteredTrades.map((trade) => (
            <Card key={trade.id} className="bg-stone-800/50 p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className={`p-2 rounded-lg ${
                    trade.type === 'buy' ? 'bg-green-900/50' : 'bg-red-900/50'
                  }`}>
                    {trade.type === 'buy' ? (
                      <ArrowDownRight className="h-5 w-5 text-green-500" />
                    ) : (
                      <ArrowUpRight className="h-5 w-5 text-red-500" />
                    )}
                  </div>
                  
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold">{trade.type.toUpperCase()}</span>
                      <span className="text-stone-400">{trade.amount.toLocaleString()} {trade.token}</span>
                      <Badge variant="outline" className="text-xs">
                        {trade.chain}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-stone-400 mt-1">
                      <Clock className="h-3 w-3" />
                      <span>{formatDistanceToNow(trade.timestamp, { addSuffix: true })}</span>
                      <span>•</span>
                      <span>{trade.dex}</span>
                    </div>
                  </div>
                </div>
                
                <div className="text-right">
                  <p className="font-semibold">{trade.value.toFixed(3)} ETH</p>
                  <p className={`text-sm ${trade.pnl >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                    {trade.pnl >= 0 ? '+' : ''}{trade.pnl.toFixed(3)} ETH ({trade.pnlPercentage.toFixed(1)}%)
                  </p>
                </div>
              </div>
              
              <a
                href={`https://etherscan.io/tx/${trade.txHash}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-stone-500 hover:text-stone-400 mt-2 inline-block"
              >
                {trade.txHash.slice(0, 10)}...{trade.txHash.slice(-8)}
              </a>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}