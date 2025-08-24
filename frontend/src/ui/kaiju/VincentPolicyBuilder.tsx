'use client';

import { useState } from 'react';
import { Slider } from '@/components/ui/slider';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { 
  RISK_LEVEL_DESCRIPTIONS, 
  CHAIN_INFO, 
  DEX_INFO,
  SupportedChain,
  SupportedDEX,
  RiskLevel
} from '@/lib/types/transformation';
import { useTransformationStore } from '@/lib/stores/transformationStore';
import { cn } from '@/lib/utils';
import { AlertCircle, TrendingUp, Shield, DollarSign } from 'lucide-react';

export function VincentPolicyBuilder() {
  const { policy, updatePolicy } = useTransformationStore();
  const [budgetError, setBudgetError] = useState<string>('');
  const [tradeAmountError, setTradeAmountError] = useState<string>('');

  const handleMaxTradeAmountChange = (value: number[]) => {
    const amount = value[0];
    updatePolicy({ maxTradeAmount: amount });
    
    if (policy.totalBudget && amount > policy.totalBudget) {
      setTradeAmountError('Trade amount cannot exceed total budget');
    } else {
      setTradeAmountError('');
    }
  };

  const handleTotalBudgetChange = (value: string) => {
    const budget = parseFloat(value);
    if (isNaN(budget) || budget <= 0) {
      setBudgetError('Please enter a valid budget amount');
      return;
    }
    
    setBudgetError('');
    updatePolicy({ totalBudget: budget });
    
    if (policy.maxTradeAmount && policy.maxTradeAmount > budget) {
      updatePolicy({ maxTradeAmount: budget });
    }
  };

  const handleChainToggle = (chain: SupportedChain) => {
    const currentChains = policy.chains || [];
    const updatedChains = currentChains.includes(chain)
      ? currentChains.filter(c => c !== chain)
      : [...currentChains, chain];
    
    if (updatedChains.length === 0) return; // At least one chain must be selected
    updatePolicy({ chains: updatedChains });
  };

  const handleDexToggle = (dex: SupportedDEX) => {
    const currentDexes = policy.dexes || [];
    const updatedDexes = currentDexes.includes(dex)
      ? currentDexes.filter(d => d !== dex)
      : [...currentDexes, dex];
    
    if (updatedDexes.length === 0) return; // At least one DEX must be selected
    updatePolicy({ dexes: updatedDexes });
  };

  const handleRiskLevelChange = (value: number[]) => {
    updatePolicy({ riskLevel: value[0] as RiskLevel });
  };

  const handleStopLossChange = (value: string) => {
    const stopLoss = parseFloat(value);
    if (!isNaN(stopLoss) && stopLoss >= 0 && stopLoss <= 100) {
      updatePolicy({ stopLossPercentage: stopLoss });
    }
  };

  return (
    <div className="space-y-6 p-6 bg-gray-900/50 backdrop-blur rounded-xl border border-gray-800">
      <h2 className="text-2xl font-bold font-heading text-white flex items-center gap-2">
        <TrendingUp className="w-6 h-6 text-emerald-400" />
        Vincent Policy Configuration
      </h2>

      {/* Max Trade Amount */}
      <div className="space-y-3">
        <Label className="text-gray-300 flex items-center gap-2">
          <DollarSign className="w-4 h-4" />
          Max Trade Amount: ${policy.maxTradeAmount || 100}
        </Label>
        <Slider
          value={[policy.maxTradeAmount || 100]}
          onValueChange={handleMaxTradeAmountChange}
          min={10}
          max={5000}
          step={10}
          className="w-full"
        />
        {tradeAmountError && (
          <p className="text-red-400 text-sm flex items-center gap-1">
            <AlertCircle className="w-3 h-3" />
            {tradeAmountError}
          </p>
        )}
        <div className="flex justify-between text-xs text-gray-500">
          <span>$10</span>
          <span>$5,000</span>
        </div>
      </div>

      {/* Total Budget */}
      <div className="space-y-2">
        <Label htmlFor="totalBudget" className="text-gray-300">
          Total Trading Budget
        </Label>
        <Input
          id="totalBudget"
          type="number"
          value={policy.totalBudget || ''}
          onChange={(e) => handleTotalBudgetChange(e.target.value)}
          placeholder="Enter total budget in USD"
          className="bg-stone-800/50 border-gray-700 text-white placeholder:text-gray-500"
        />
        {budgetError && (
          <p className="text-red-400 text-sm flex items-center gap-1">
            <AlertCircle className="w-3 h-3" />
            {budgetError}
          </p>
        )}
      </div>

      {/* Chain Selection */}
      <div className="space-y-3">
        <Label className="text-gray-300">Select Blockchains</Label>
        <div className="space-y-3">
          {(Object.entries(CHAIN_INFO) as [SupportedChain, typeof CHAIN_INFO[SupportedChain]][]).map(([chain, info]) => (
            <div key={chain} className="flex items-center space-x-3">
              <Checkbox
                id={chain}
                checked={policy.chains?.includes(chain) || false}
                onCheckedChange={() => handleChainToggle(chain)}
                className="border-gray-600 data-[state=checked]:bg-emerald-400 data-[state=checked]:border-emerald-400"
              />
              <label
                htmlFor={chain}
                className="flex items-center gap-3 cursor-pointer text-gray-300 hover:text-white transition-colors"
              >
                <span className="text-2xl">{info.icon}</span>
                <span className="font-medium">{info.name}</span>
              </label>
            </div>
          ))}
        </div>
        {policy.chains && policy.chains.length > 0 && (
          <div className="flex flex-wrap gap-2 pt-2">
            {policy.chains.map(chain => (
              <div key={chain} className="flex items-center gap-1 px-2 py-1 bg-emerald-400/20 rounded-full border border-emerald-400/50">
                <span className="text-sm">{CHAIN_INFO[chain].icon}</span>
                <span className="text-xs text-emerald-300 font-medium">{CHAIN_INFO[chain].name}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* DEX Selection */}
      <div className="space-y-3">
        <Label className="text-gray-300">Select DEXes</Label>
        <div className="space-y-2">
          {(Object.entries(DEX_INFO) as [SupportedDEX, typeof DEX_INFO[SupportedDEX]][]).map(([dex, info]) => (
            <div key={dex} className="flex items-center space-x-3">
              <Checkbox
                id={dex}
                checked={policy.dexes?.includes(dex) || false}
                onCheckedChange={() => handleDexToggle(dex)}
                className="border-gray-600 data-[state=checked]:bg-emerald-400 data-[state=checked]:border-emerald-400"
              />
              <label
                htmlFor={dex}
                className="flex items-center gap-2 cursor-pointer text-gray-300 hover:text-white transition-colors"
              >
                <span className="text-xl">{info.logo}</span>
                <span className="font-medium">{info.name}</span>
              </label>
            </div>
          ))}
        </div>
      </div>

      {/* Risk Level */}
      <div className="space-y-3">
        <Label className="text-gray-300 flex items-center gap-2">
          <Shield className="w-4 h-4" />
          Risk Level: {policy.riskLevel || 3}
        </Label>
        <Slider
          value={[policy.riskLevel || 3]}
          onValueChange={handleRiskLevelChange}
          min={1}
          max={5}
          step={1}
          className="w-full"
        />
        <div className="p-3 rounded-lg bg-stone-800/30 border border-gray-700">
          <p className="text-sm text-gray-400">
            {RISK_LEVEL_DESCRIPTIONS[policy.riskLevel as RiskLevel || 3]}
          </p>
        </div>
        <div className="flex justify-between text-xs text-gray-500">
          <span>Conservative</span>
          <span>Degen</span>
        </div>
      </div>

      {/* Stop Loss */}
      <div className="space-y-2">
        <Label htmlFor="stopLoss" className="text-gray-300">
          Stop-Loss Percentage
        </Label>
        <div className="flex items-center gap-2">
          <Input
            id="stopLoss"
            type="number"
            value={policy.stopLossPercentage || ''}
            onChange={(e) => handleStopLossChange(e.target.value)}
            placeholder="10"
            min="0"
            max="100"
            step="1"
            className="bg-stone-800/50 border-gray-700 text-white placeholder:text-gray-500 w-24"
          />
          <span className="text-gray-400">%</span>
        </div>
        <p className="text-xs text-gray-500">
          Automatically exit positions when losses exceed this percentage
        </p>
      </div>
    </div>
  );
}