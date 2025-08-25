"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Kaiju } from "@/types/models";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart, Bar } from "recharts";
import { Badge } from "@/components/ui/badge";
import { Users, TrendingUp, Activity, Shield, Target, Clock } from "lucide-react";

interface KaijuComparisonDialogProps {
  kaijus: Kaiju[];
  isOpen: boolean;
  onClose: () => void;
}

export function KaijuComparisonDialog({ kaijus, isOpen, onClose }: KaijuComparisonDialogProps) {
  const [activeTab, setActiveTab] = useState("overview");

  // Generate comparison chart data
  const performanceData = kaijus[0]?.performance.dailyReturns?.slice(-30).map((_, index) => {
    const dataPoint: any = { day: index + 1 };
    kaijus.forEach((kaiju, _i) => {
      dataPoint[kaiju.name] = kaiju.performance.dailyReturns?.[index]?.return || 0;
    });
    return dataPoint;
  }) || [];

  const colors = ["#ef4444", "#3b82f6", "#10b981", "#f59e0b", "#8b5cf6"];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[80vh] overflow-y-auto bg-stone-900 text-stone-200">
        <DialogHeader>
          <DialogTitle className="text-2xl font-heading">Kaiju Comparison</DialogTitle>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-4">
          <TabsList className="grid w-full grid-cols-4 bg-stone-800">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="performance">Performance</TabsTrigger>
            <TabsTrigger value="fees">Fees & Stats</TabsTrigger>
            <TabsTrigger value="trading">Trading Style</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="mt-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {kaijus.map((kaiju, _index) => (
                <div key={kaiju.id} className="bg-stone-800 rounded-lg p-6 border border-stone-700">
                  <div className="flex items-center gap-3 mb-4">
                    <img src={kaiju.imageUrl} alt={kaiju.name} className="w-16 h-16 rounded-full" />
                    <div>
                      <h3 className="font-heading text-lg font-bold">{kaiju.name}</h3>
                      <p className="text-sm text-stone-400">{kaiju.traderTitle}</p>
                    </div>
                  </div>
                  
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-stone-400 flex items-center gap-1">
                        <TrendingUp className="h-4 w-4" />
                        30D Return
                      </span>
                      <span className={`font-bold ${kaiju.performance.last30Days >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                        {kaiju.performance.last30Days.toFixed(2)}%
                      </span>
                    </div>
                    
                    <div className="flex justify-between items-center">
                      <span className="text-stone-400 flex items-center gap-1">
                        <Users className="h-4 w-4" />
                        Shadows
                      </span>
                      <span className="font-bold">{kaiju.shadows.length}</span>
                    </div>
                    
                    <div className="flex justify-between items-center">
                      <span className="text-stone-400 flex items-center gap-1">
                        <Shield className="h-4 w-4" />
                        Win Rate
                      </span>
                      <span className="font-bold">{kaiju.performance.winRate.toFixed(1)}%</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="performance" className="mt-6">
            <div className="h-[400px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={performanceData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#44403c" />
                  <XAxis dataKey="day" stroke="#a8a29e" />
                  <YAxis stroke="#a8a29e" />
                  <Tooltip 
                    contentStyle={{
                      backgroundColor: "#1c1917",
                      border: "1px solid #44403c",
                      borderRadius: "8px",
                    }}
                  />
                  <Legend />
                  {kaijus.map((kaiju, index) => (
                    <Line
                      key={kaiju.id}
                      type="monotone"
                      dataKey={kaiju.name}
                      stroke={colors[index]}
                      strokeWidth={2}
                      dot={false}
                    />
                  ))}
                </LineChart>
              </ResponsiveContainer>
            </div>
          </TabsContent>

          <TabsContent value="fees" className="mt-6">
            <div className="space-y-6">
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={kaijus.map(kaiju => ({
                      name: kaiju.name,
                      entryFee: kaiju.entryFee,
                      profitShare: kaiju.profitShare,
                    }))}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#44403c" />
                    <XAxis dataKey="name" stroke="#a8a29e" />
                    <YAxis stroke="#a8a29e" />
                    <Tooltip 
                      contentStyle={{
                        backgroundColor: "#1c1917",
                        border: "1px solid #44403c",
                        borderRadius: "8px",
                      }}
                    />
                    <Legend />
                    <Bar dataKey="entryFee" fill="#3b82f6" name="Entry Fee (ETH)" />
                    <Bar dataKey="profitShare" fill="#f59e0b" name="Profit Share (%)" />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {kaijus.map((kaiju) => (
                  <div key={kaiju.id} className="bg-stone-800 rounded-lg p-4">
                    <h4 className="font-bold mb-3">{kaiju.name}</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-stone-400">Total Value Locked</span>
                        <span>{(kaiju.performance.totalValueLocked || 0).toFixed(2)} ETH</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-stone-400">Avg Trade Size</span>
                        <span>{(kaiju.performance.avgTradeSize || 0).toFixed(2)} ETH</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-stone-400">Total Trades</span>
                        <span>{kaiju.performance.totalTrades}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="trading" className="mt-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {kaijus.map((kaiju) => (
                <div key={kaiju.id} className="bg-stone-800 rounded-lg p-6">
                  <h4 className="font-bold mb-4">{kaiju.name}</h4>
                  
                  <div className="space-y-3">
                    <Badge variant="outline" className="w-full justify-center py-2">
                      {kaiju.tradingStyle ? kaiju.tradingStyle.charAt(0).toUpperCase() + kaiju.tradingStyle.slice(1) : 'Unknown'} Trader
                    </Badge>
                    
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center gap-2">
                        <Activity className="h-4 w-4 text-stone-400" />
                        <span className="text-stone-400">Avg Daily Trades:</span>
                        <span className="font-bold">{Math.floor(kaiju.performance.totalTrades / 30)}</span>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <Target className="h-4 w-4 text-stone-400" />
                        <span className="text-stone-400">Risk Level:</span>
                        <span className="font-bold">{kaiju.riskLevel || 'Medium'}</span>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-stone-400" />
                        <span className="text-stone-400">Active Since:</span>
                        <span className="font-bold">{kaiju.createdAt ? new Date(kaiju.createdAt).toLocaleDateString() : 'Unknown'}</span>
                      </div>
                    </div>

                    {kaiju.preferredChains && kaiju.preferredChains.length > 0 && (
                      <div className="mt-3">
                        <p className="text-sm text-stone-400 mb-2">Preferred Chains:</p>
                        <div className="flex flex-wrap gap-1">
                          {kaiju.preferredChains.map(chain => (
                            <Badge key={chain} variant="secondary" className="text-xs">
                              {chain}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}