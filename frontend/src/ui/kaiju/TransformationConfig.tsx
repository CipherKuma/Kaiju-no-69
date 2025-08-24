'use client';

import { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { useTransformationStore } from '@/lib/stores/transformationStore';
import { 
  DURATION_PRICING, 
  TransformationDuration, 
  TransformationCost 
} from '@/lib/types/transformation';
import { 
  Clock, 
  AlertTriangle, 
  CheckCircle, 
  Info, 
  Calculator,
  Fuel,
  CreditCard
} from 'lucide-react';
import { formatEther, parseEther } from 'viem';

const DURATION_OPTIONS: { value: TransformationDuration; label: string; description: string }[] = [
  { value: 7, label: '7 Days', description: 'Quick trial run' },
  { value: 14, label: '14 Days', description: 'Standard deployment' },
  { value: 30, label: '30 Days', description: 'Full moon cycle' }
];

const ETH_PRICE_USD = 3200; // In production, fetch from price oracle
const GAS_ESTIMATE = BigInt('200000'); // Estimated gas for contract interaction
const GAS_PRICE = BigInt('20000000000'); // 20 gwei

export function TransformationConfig() {
  const { policy, updatePolicy } = useTransformationStore();
  const [warnings, setWarnings] = useState<string[]>([]);
  const [isValid, setIsValid] = useState(false);

  const costs: TransformationCost = useMemo(() => {
    const entryFee = parseEther(DURATION_PRICING[policy.duration || 7].toString());
    const gasEstimate = GAS_ESTIMATE * GAS_PRICE;
    const totalCostWei = entryFee + gasEstimate;
    const totalCostUSD = Number(formatEther(totalCostWei)) * ETH_PRICE_USD;

    return {
      entryFee,
      gasEstimate,
      totalCostWei,
      totalCostUSD
    };
  }, [policy.duration]);

  useEffect(() => {
    const newWarnings: string[] = [];
    let valid = true;

    // Validation checks
    if (!policy.totalBudget || policy.totalBudget < 100) {
      newWarnings.push('Minimum trading budget is $100');
      valid = false;
    }

    if (!policy.maxTradeAmount || policy.maxTradeAmount < 10) {
      newWarnings.push('Minimum trade amount is $10');
      valid = false;
    }

    if (policy.maxTradeAmount && policy.totalBudget && policy.maxTradeAmount > policy.totalBudget) {
      newWarnings.push('Max trade amount exceeds total budget');
      valid = false;
    }

    if (!policy.dexes || policy.dexes.length === 0) {
      newWarnings.push('Select at least one DEX');
      valid = false;
    }

    if (policy.stopLossPercentage === undefined || policy.stopLossPercentage < 5) {
      newWarnings.push('Recommend at least 5% stop-loss for safety');
    }

    if (policy.riskLevel === 5 && policy.stopLossPercentage && policy.stopLossPercentage > 20) {
      newWarnings.push('High risk level with high stop-loss may limit gains');
    }

    setWarnings(newWarnings);
    setIsValid(valid);
  }, [policy]);

  const getRiskAssessment = () => {
    const riskLevel = policy.riskLevel || 3;
    if (riskLevel <= 2) return { text: 'Low Risk', color: 'text-green-400', bgColor: 'bg-green-400/10' };
    if (riskLevel === 3) return { text: 'Moderate Risk', color: 'text-yellow-400', bgColor: 'bg-yellow-400/10' };
    if (riskLevel === 4) return { text: 'High Risk', color: 'text-orange-400', bgColor: 'bg-orange-400/10' };
    return { text: 'Maximum Risk', color: 'text-red-400', bgColor: 'bg-red-400/10' };
  };

  const riskAssessment = getRiskAssessment();

  return (
    <div className="space-y-6 p-6 bg-gray-900/50 backdrop-blur rounded-xl border border-gray-800">
      <h2 className="text-2xl font-bold font-heading text-white flex items-center gap-2">
        <Calculator className="w-6 h-6 text-emerald-400" />
        Transformation Configuration
      </h2>

      {/* Duration Selector */}
      <div className="space-y-3">
        <label className="text-sm font-medium text-gray-300 flex items-center gap-2">
          <Clock className="w-4 h-4" />
          Select Duration
        </label>
        <div className="grid grid-cols-3 gap-3">
          {DURATION_OPTIONS.map((option) => (
            <motion.button
              key={option.value}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => updatePolicy({ duration: option.value })}
              className={cn(
                "p-4 rounded-lg border-2 transition-all duration-200",
                "flex flex-col items-center space-y-2",
                policy.duration === option.value
                  ? "border-emerald-400 bg-emerald-400/10"
                  : "border-gray-700 bg-stone-800/50 hover:border-gray-600"
              )}
            >
              <span className="text-lg font-bold text-white">{option.label}</span>
              <span className="text-xs text-gray-400">{option.description}</span>
              <span className="text-sm font-mono text-emerald-400">
                {DURATION_PRICING[option.value]} ETH
              </span>
            </motion.button>
          ))}
        </div>
      </div>

      {/* Cost Breakdown */}
      <div className="space-y-3">
        <h3 className="text-sm font-medium text-gray-300">Cost Breakdown</h3>
        <div className="space-y-2 p-4 bg-stone-800/30 rounded-lg border border-gray-700">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-400 flex items-center gap-2">
              <CreditCard className="w-4 h-4" />
              Entry Fee
            </span>
            <span className="font-mono text-white">
              {formatEther(costs.entryFee)} ETH
            </span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-400 flex items-center gap-2">
              <Fuel className="w-4 h-4" />
              Gas Estimate
            </span>
            <span className="font-mono text-white">
              {formatEther(costs.gasEstimate)} ETH
            </span>
          </div>
          <div className="border-t border-gray-700 pt-2 mt-2">
            <div className="flex items-center justify-between">
              <span className="text-gray-300 font-medium">Total Cost</span>
              <div className="text-right">
                <div className="font-mono text-white font-bold">
                  {formatEther(costs.totalCostWei)} ETH
                </div>
                <div className="text-xs text-gray-400">
                  ≈ ${costs.totalCostUSD.toFixed(2)} USD
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Policy Validation */}
      <div className="space-y-3">
        <h3 className="text-sm font-medium text-gray-300">Policy Validation</h3>
        <div className="space-y-2">
          {warnings.map((warning, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              className="flex items-start gap-2 p-3 bg-yellow-900/20 border border-yellow-700/50 rounded-lg"
            >
              <AlertTriangle className="w-4 h-4 text-yellow-400 flex-shrink-0 mt-0.5" />
              <span className="text-sm text-yellow-300">{warning}</span>
            </motion.div>
          ))}
          {isValid && warnings.length === 0 && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex items-center gap-2 p-3 bg-green-900/20 border border-green-700/50 rounded-lg"
            >
              <CheckCircle className="w-4 h-4 text-green-400" />
              <span className="text-sm text-green-300">All policy parameters valid</span>
            </motion.div>
          )}
        </div>
      </div>

      {/* Risk Assessment Summary */}
      <div className="space-y-3">
        <h3 className="text-sm font-medium text-gray-300">Risk Assessment</h3>
        <div className={cn(
          "p-4 rounded-lg border",
          riskAssessment.bgColor,
          riskAssessment.color === 'text-green-400' && 'border-green-700/50',
          riskAssessment.color === 'text-yellow-400' && 'border-yellow-700/50',
          riskAssessment.color === 'text-orange-400' && 'border-orange-700/50',
          riskAssessment.color === 'text-red-400' && 'border-red-700/50'
        )}>
          <div className="flex items-center justify-between mb-3">
            <span className={cn("font-bold text-lg", riskAssessment.color)}>
              {riskAssessment.text}
            </span>
            <Info className={cn("w-5 h-5", riskAssessment.color)} />
          </div>
          <div className="space-y-2 text-sm text-gray-300">
            <div className="flex justify-between">
              <span>Trading Budget:</span>
              <span className="font-mono">${policy.totalBudget || 0}</span>
            </div>
            <div className="flex justify-between">
              <span>Max Trade Size:</span>
              <span className="font-mono">${policy.maxTradeAmount || 0}</span>
            </div>
            <div className="flex justify-between">
              <span>Stop Loss:</span>
              <span className="font-mono">{policy.stopLossPercentage || 0}%</span>
            </div>
            <div className="flex justify-between">
              <span>Active DEXes:</span>
              <span>{policy.dexes?.length || 0}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}