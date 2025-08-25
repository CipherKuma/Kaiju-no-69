"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Shadow, Kaiju, TradingPolicy } from "@/types/models";
import { 
  Settings, 
  TrendingUp, 
  Download,
  Upload,
  CheckSquare,
  Square
} from "lucide-react";
import { theme } from "@/lib/theme";

interface ManagementPanelProps {
  shadows: Shadow[];
  kaijus: Kaiju[];
  onUpdatePolicy: (shadowId: string, policy: TradingPolicy) => void;
  onBatchOperation: (operation: string, shadowIds: string[]) => void;
  onExportData: () => void;
}

export function ManagementPanel({ 
  shadows, 
  kaijus, 
  onUpdatePolicy, 
  onBatchOperation,
  onExportData 
}: ManagementPanelProps) {
  const [selectedShadows, setSelectedShadows] = useState<Set<string>>(new Set());
  const [activeTab, setActiveTab] = useState<"policies" | "comparison" | "export">("policies");
  const [editingPolicy, setEditingPolicy] = useState<string | null>(null);
  
  const toggleShadowSelection = (shadowId: string) => {
    const newSelection = new Set(selectedShadows);
    if (newSelection.has(shadowId)) {
      newSelection.delete(shadowId);
    } else {
      newSelection.add(shadowId);
    }
    setSelectedShadows(newSelection);
  };
  
  const selectAll = () => {
    setSelectedShadows(new Set(shadows.map(s => s.nftId)));
  };
  
  const deselectAll = () => {
    setSelectedShadows(new Set());
  };
  
  const getKaiju = (shadow: Shadow) => {
    return kaijus.find(k => k.id === shadow.kaijuId);
  };
  
  return (
    <div className="space-y-6">
      {/* Header with Batch Operations */}
      <div className="bg-gray-900 rounded-xl p-6 border border-gray-800">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold">Shadow Management</h2>
          <div className="flex gap-2">
            <button
              onClick={selectAll}
              className="px-4 py-2 text-sm bg-stone-800 hover:bg-gray-700 rounded-lg transition-colors"
            >
              Select All
            </button>
            <button
              onClick={deselectAll}
              className="px-4 py-2 text-sm bg-stone-800 hover:bg-gray-700 rounded-lg transition-colors"
            >
              Clear Selection
            </button>
          </div>
        </div>
        
        {/* Batch Operations */}
        {selectedShadows.size > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-stone-800 rounded-lg p-4 mb-4"
          >
            <p className="text-sm text-gray-400 mb-2">
              {selectedShadows.size} shadow{selectedShadows.size > 1 ? "s" : ""} selected
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => onBatchOperation("pause", Array.from(selectedShadows))}
                className="px-3 py-1 text-sm bg-yellow-600 hover:bg-yellow-700 rounded transition-colors"
              >
                Pause Selected
              </button>
              <button
                onClick={() => onBatchOperation("resume", Array.from(selectedShadows))}
                className="px-3 py-1 text-sm bg-green-600 hover:bg-green-700 rounded transition-colors"
              >
                Resume Selected
              </button>
              <button
                onClick={() => onBatchOperation("update-policy", Array.from(selectedShadows))}
                className="px-3 py-1 text-sm bg-blue-600 hover:bg-blue-700 rounded transition-colors"
              >
                Update Policies
              </button>
            </div>
          </motion.div>
        )}
      </div>
      
      {/* Tab Navigation */}
      <div className="flex gap-2">
        <button
          onClick={() => setActiveTab("policies")}
          className={`px-4 py-2 rounded-lg transition-colors flex items-center gap-2 ${
            activeTab === "policies"
              ? "bg-primary text-white"
              : "bg-stone-800 hover:bg-gray-700 text-gray-300"
          }`}
        >
          <Settings size={16} />
          Policy Adjustment
        </button>
        <button
          onClick={() => setActiveTab("comparison")}
          className={`px-4 py-2 rounded-lg transition-colors flex items-center gap-2 ${
            activeTab === "comparison"
              ? "bg-primary text-white"
              : "bg-stone-800 hover:bg-gray-700 text-gray-300"
          }`}
        >
          <TrendingUp size={16} />
          Performance Comparison
        </button>
        <button
          onClick={() => setActiveTab("export")}
          className={`px-4 py-2 rounded-lg transition-colors flex items-center gap-2 ${
            activeTab === "export"
              ? "bg-primary text-white"
              : "bg-stone-800 hover:bg-gray-700 text-gray-300"
          }`}
        >
          <Download size={16} />
          Export Data
        </button>
      </div>
      
      {/* Content */}
      {activeTab === "policies" && (
        <div className="space-y-4">
          {shadows.map((shadow) => {
            const kaiju = getKaiju(shadow);
            if (!kaiju) return null;
            
            return (
              <motion.div
                key={shadow.nftId}
                whileHover={{ scale: 1.01 }}
                className="bg-gray-900 rounded-xl p-6 border border-gray-800"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => toggleShadowSelection(shadow.nftId)}
                      className="text-gray-400 hover:text-white transition-colors"
                    >
                      {selectedShadows.has(shadow.nftId) ? (
                        <CheckSquare size={20} />
                      ) : (
                        <Square size={20} />
                      )}
                    </button>
                    <img
                      src={kaiju.imageUrl}
                      alt={kaiju.name}
                      className="w-12 h-12 rounded-full"
                    />
                    <div>
                      <h3 className="font-semibold">{kaiju.name}</h3>
                      <p className="text-sm text-gray-400">Shadow #{shadow.nftId}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setEditingPolicy(shadow.nftId === editingPolicy ? null : shadow.nftId)}
                    className="text-primary hover:text-primary/80 transition-colors"
                  >
                    <Settings size={20} />
                  </button>
                </div>
                
                {editingPolicy === shadow.nftId && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="space-y-4"
                  >
                    {shadow.policies.map((policy) => (
                      <div key={policy.id} className="bg-stone-800 rounded-lg p-4">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-medium">{policy.name}</h4>
                          <label className="flex items-center gap-2">
                            <input
                              type="checkbox"
                              checked={policy.enabled}
                              onChange={(e) => {
                                onUpdatePolicy(shadow.nftId, {
                                  ...policy,
                                  enabled: e.target.checked,
                                });
                              }}
                              className="rounded border-gray-600"
                            />
                            <span className="text-sm">Enabled</span>
                          </label>
                        </div>
                        
                        {/* Policy-specific controls */}
                        {policy.type === "max-trade" && (
                          <div>
                            <label className="text-sm text-gray-400">Max Trade Amount</label>
                            <input
                              type="number"
                              value={policy.parameters.maxTradeAmount || 0}
                              onChange={(e) => {
                                onUpdatePolicy(shadow.nftId, {
                                  ...policy,
                                  parameters: {
                                    ...policy.parameters,
                                    maxTradeAmount: Number(e.target.value),
                                  },
                                });
                              }}
                              className="w-full mt-1 px-3 py-2 bg-gray-700 rounded border border-gray-600 focus:border-primary focus:outline-none"
                            />
                          </div>
                        )}
                        
                        {policy.type === "stop-loss" && (
                          <div>
                            <label className="text-sm text-gray-400">Stop Loss %</label>
                            <input
                              type="number"
                              value={policy.parameters.stopLossPercentage || 0}
                              onChange={(e) => {
                                onUpdatePolicy(shadow.nftId, {
                                  ...policy,
                                  parameters: {
                                    ...policy.parameters,
                                    stopLossPercentage: Number(e.target.value),
                                  },
                                });
                              }}
                              className="w-full mt-1 px-3 py-2 bg-gray-700 rounded border border-gray-600 focus:border-primary focus:outline-none"
                            />
                          </div>
                        )}
                      </div>
                    ))}
                  </motion.div>
                )}
              </motion.div>
            );
          })}
        </div>
      )}
      
      {activeTab === "comparison" && (
        <div className="bg-gray-900 rounded-xl p-6 border border-gray-800">
          <h3 className="text-lg font-semibold mb-4">Performance Comparison</h3>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-800">
                  <th className="text-left py-3 px-4">Shadow</th>
                  <th className="text-right py-3 px-4">P&L</th>
                  <th className="text-right py-3 px-4">Win Rate</th>
                  <th className="text-right py-3 px-4">Total Trades</th>
                  <th className="text-right py-3 px-4">Risk Level</th>
                </tr>
              </thead>
              <tbody>
                {shadows.map((shadow) => {
                  const kaiju = getKaiju(shadow);
                  if (!kaiju) return null;
                  
                  return (
                    <tr key={shadow.nftId} className="border-b border-gray-800">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <img
                            src={kaiju.imageUrl}
                            alt={kaiju.name}
                            className="w-8 h-8 rounded-full"
                          />
                          <span>{kaiju.name}</span>
                        </div>
                      </td>
                      <td className="text-right py-3 px-4">
                        <span
                          style={{
                            color: shadow.currentPL >= 0
                              ? theme.colors.success.DEFAULT
                              : theme.colors.danger.DEFAULT,
                          }}
                        >
                          {shadow.currentPL >= 0 ? "+" : ""}${shadow.currentPL.toLocaleString()}
                        </span>
                      </td>
                      <td className="text-right py-3 px-4">{kaiju.performance.winRate}%</td>
                      <td className="text-right py-3 px-4">{kaiju.performance.totalTrades}</td>
                      <td className="text-right py-3 px-4">
                        <span className="px-2 py-1 text-xs rounded-full bg-yellow-600">
                          Medium
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
      
      {activeTab === "export" && (
        <div className="bg-gray-900 rounded-xl p-6 border border-gray-800">
          <h3 className="text-lg font-semibold mb-4">Export Data</h3>
          <div className="space-y-4">
            <button
              onClick={onExportData}
              className="w-full flex items-center justify-center gap-2 py-3 bg-primary hover:bg-primary/80 rounded-lg transition-colors"
            >
              <Download size={20} />
              Export All Shadow Data (CSV)
            </button>
            <button
              className="w-full flex items-center justify-center gap-2 py-3 bg-stone-800 hover:bg-gray-700 rounded-lg transition-colors"
            >
              <Download size={20} />
              Export Performance Report (PDF)
            </button>
            <button
              className="w-full flex items-center justify-center gap-2 py-3 bg-stone-800 hover:bg-gray-700 rounded-lg transition-colors"
            >
              <Upload size={20} />
              Import Policy Configuration
            </button>
          </div>
        </div>
      )}
    </div>
  );
}