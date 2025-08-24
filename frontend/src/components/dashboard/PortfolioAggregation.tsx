"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Shadow, Kaiju } from "@/types/models";
import { theme } from "@/lib/theme";
import {
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
} from "recharts";

interface PortfolioAggregationProps {
  shadows: Shadow[];
  kaijus: Kaiju[];
}

export function PortfolioAggregation({ shadows, kaijus }: PortfolioAggregationProps) {
  const [selectedTimeframe, setSelectedTimeframe] = useState<"1D" | "1W" | "1M" | "ALL">("1W");
  
  // Calculate total P&L
  const totalPL = shadows.reduce((acc, shadow) => acc + shadow.currentPL, 0);
  const totalPLColor = totalPL >= 0 ? theme.colors.success.DEFAULT : theme.colors.danger.DEFAULT;
  const totalPLSign = totalPL >= 0 ? "+" : "";
  
  // Find best and worst performers
  const sortedShadows = [...shadows].sort((a, b) => b.currentPL - a.currentPL);
  const bestPerformer = sortedShadows[0];
  const worstPerformer = sortedShadows[sortedShadows.length - 1];
  
  // Calculate risk exposure by chain (mock data - should come from real data)
  const riskData = [
    { name: "Ethereum", value: 45, risk: "low" },
    { name: "Polygon", value: 30, risk: "medium" },
    { name: "Arbitrum", value: 25, risk: "high" },
  ];
  
  const RISK_COLORS = {
    low: theme.colors.success.DEFAULT,
    medium: theme.colors.warning.DEFAULT,
    high: theme.colors.danger.DEFAULT,
  };
  
  // Generate daily performance data (mock - should come from real data)
  const dailyPerformanceData = Array.from({ length: 30 }, (_, i) => {
    const date = new Date();
    date.setDate(date.getDate() - (29 - i));
    return {
      date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      value: Math.random() * 200 - 100,
      volume: Math.random() * 10000,
    };
  });
  
  // Get corresponding Kaiju for a shadow
  const getKaiju = (shadow: Shadow) => {
    return kaijus.find(k => k.id === shadow.kaijuId);
  };
  
  return (
    <div className="bg-gray-900 rounded-2xl p-6 border border-gray-800">
      <div className="mb-6">
        <h2 className="text-2xl font-bold mb-2">Portfolio Overview</h2>
        <p className="text-gray-400">Track your multi-shadow performance</p>
      </div>
      
      {/* Total P&L */}
      <div className="mb-8">
        <div className="flex items-baseline gap-4">
          <div>
            <p className="text-sm text-gray-400">Total P&L</p>
            <p className="text-4xl font-bold" style={{ color: totalPLColor }}>
              {totalPLSign}${Math.abs(totalPL).toLocaleString()}
            </p>
          </div>
          <div className="flex gap-2">
            {["1D", "1W", "1M", "ALL"].map((timeframe) => (
              <button
                key={timeframe}
                onClick={() => setSelectedTimeframe(timeframe as any)}
                className={`px-3 py-1 text-sm rounded-lg transition-colors ${
                  selectedTimeframe === timeframe
                    ? "bg-primary text-white"
                    : "bg-stone-800 hover:bg-gray-700"
                }`}
              >
                {timeframe}
              </button>
            ))}
          </div>
        </div>
      </div>
      
      {/* Best/Worst Performers */}
      <div className="grid grid-cols-2 gap-4 mb-8">
        {bestPerformer && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-stone-800 rounded-lg p-4"
          >
            <p className="text-sm text-gray-400 mb-2">Best Performer</p>
            <div className="flex items-center gap-3">
              <img
                src={getKaiju(bestPerformer)?.imageUrl}
                alt={getKaiju(bestPerformer)?.name}
                className="w-10 h-10 rounded-full"
              />
              <div>
                <p className="font-medium">{getKaiju(bestPerformer)?.name}</p>
                <p className="text-green-500 font-bold">
                  +${bestPerformer.currentPL.toLocaleString()}
                </p>
              </div>
            </div>
          </motion.div>
        )}
        
        {worstPerformer && worstPerformer.currentPL < 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-stone-800 rounded-lg p-4"
          >
            <p className="text-sm text-gray-400 mb-2">Worst Performer</p>
            <div className="flex items-center gap-3">
              <img
                src={getKaiju(worstPerformer)?.imageUrl}
                alt={getKaiju(worstPerformer)?.name}
                className="w-10 h-10 rounded-full"
              />
              <div>
                <p className="font-medium">{getKaiju(worstPerformer)?.name}</p>
                <p className="text-red-500 font-bold">
                  -${Math.abs(worstPerformer.currentPL).toLocaleString()}
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </div>
      
      {/* Risk Exposure Chart */}
      <div className="mb-8">
        <h3 className="text-lg font-semibold mb-4">Risk Exposure by Chain</h3>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={riskData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {riskData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={RISK_COLORS[entry.risk as keyof typeof RISK_COLORS]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>
      
      {/* Daily Performance Graph */}
      <div>
        <h3 className="text-lg font-semibold mb-4">Daily Performance</h3>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={dailyPerformanceData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis 
                dataKey="date" 
                stroke="#9CA3AF"
                tick={{ fontSize: 12 }}
              />
              <YAxis 
                stroke="#9CA3AF"
                tick={{ fontSize: 12 }}
                tickFormatter={(value) => `$${value}`}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#1F2937",
                  border: "1px solid #374151",
                  borderRadius: "8px",
                }}
                labelStyle={{ color: "#9CA3AF" }}
              />
              <Line
                type="monotone"
                dataKey="value"
                stroke={theme.colors.primary.DEFAULT}
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 4 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}