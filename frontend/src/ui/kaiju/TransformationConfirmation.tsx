'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { useTransformationStore } from '@/lib/stores/transformationStore';
import { useKaijuStore } from '@/lib/stores/kaijuStore';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { 
  Skull, 
  Zap, 
  Check, 
  X, 
  Loader2, 
  ChevronRight,
  AlertTriangle,
  Sparkles
} from 'lucide-react';
import { formatEther } from 'viem';
import { CHAIN_INFO, DEX_INFO, RISK_LEVEL_DESCRIPTIONS } from '@/lib/types/transformation';

type TransactionStep = 'idle' | 'confirming' | 'pending' | 'success' | 'error';

interface TransformationConfirmationProps {
  onConfirm: () => Promise<void>;
  costs: {
    entryFee: bigint;
    gasEstimate: bigint;
    totalCostWei: bigint;
    totalCostUSD: number;
  };
  isValid: boolean;
}

export function TransformationConfirmation({ onConfirm, costs, isValid }: TransformationConfirmationProps) {
  const { policy, selectedKaiju, isTransforming, transactionHash, nftTokenId } = useTransformationStore();
  const kaijus = useKaijuStore((state) => state.kaijus);
  const selectedKaijuData = kaijus.find(k => k.id === selectedKaiju);
  
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [transactionStep, setTransactionStep] = useState<TransactionStep>('idle');
  const [error, setError] = useState<string>('');

  const handleSacrifice = async () => {
    if (!isValid || !selectedKaijuData) return;
    
    setTransactionStep('confirming');
    setError('');
    
    try {
      await onConfirm();
      setTransactionStep('success');
    } catch (err: any) {
      setTransactionStep('error');
      setError(err.message || 'Transaction failed');
    }
  };

  return (
    <>
      {/* Sacrifice Button */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative"
      >
        <Button
          onClick={() => setShowConfirmDialog(true)}
          disabled={!isValid || !selectedKaijuData || isTransforming}
          className={cn(
            "w-full h-16 text-lg font-bold relative overflow-hidden group",
            "bg-gradient-to-r from-red-600 to-red-800 hover:from-red-700 hover:to-red-900",
            "border-2 border-red-500 shadow-lg shadow-red-500/20",
            "disabled:opacity-50 disabled:cursor-not-allowed",
            "transition-all duration-300"
          )}
        >
          {/* Animated Background */}
          <motion.div
            animate={{ x: ['-100%', '100%'] }}
            transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
            className="absolute inset-0 bg-gradient-to-r from-transparent via-red-400/20 to-transparent"
          />
          
          {/* Button Content */}
          <span className="relative z-10 flex items-center gap-3">
            <Skull className="w-6 h-6" />
            SACRIFICE YOURSELF
            <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </span>
        </Button>
        
        {!isValid && (
          <p className="text-red-400 text-sm mt-2 flex items-center gap-1">
            <AlertTriangle className="w-4 h-4" />
            Please fix policy validation issues
          </p>
        )}
      </motion.div>

      {/* Confirmation Dialog */}
      <AnimatePresence>
        {showConfirmDialog && (
          <Dialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
            <DialogContent className="max-w-2xl bg-gray-900 border-gray-800">
              <div className="space-y-6">
                {/* Header */}
                <div className="text-center space-y-2">
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: 'spring', bounce: 0.5 }}
                  >
                    <Skull className="w-16 h-16 mx-auto text-red-500" />
                  </motion.div>
                  <h2 className="text-3xl font-bold font-heading text-white">
                    Final Sacrifice Confirmation
                  </h2>
                  <p className="text-gray-400">
                    Transform {selectedKaijuData?.name} into its shadow form
                  </p>
                </div>

                {/* Policy Summary */}
                <div className="grid grid-cols-2 gap-4 p-4 bg-stone-800/50 rounded-lg">
                  <div className="space-y-2">
                    <h3 className="text-sm font-medium text-gray-400">Trading Configuration</h3>
                    <div className="space-y-1 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-500">Budget:</span>
                        <span className="text-white font-mono">${policy.totalBudget}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">Max Trade:</span>
                        <span className="text-white font-mono">${policy.maxTradeAmount}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">Stop Loss:</span>
                        <span className="text-white font-mono">{policy.stopLossPercentage}%</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <h3 className="text-sm font-medium text-gray-400">Execution Details</h3>
                    <div className="space-y-1 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-500">Chain:</span>
                        <span className="text-white flex items-center gap-1">
                          {policy.chain && CHAIN_INFO[policy.chain].icon}
                          {policy.chain && CHAIN_INFO[policy.chain].name}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">Duration:</span>
                        <span className="text-white">{policy.duration} days</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">Risk Level:</span>
                        <span className="text-white">{policy.riskLevel}/5</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Cost Summary */}
                <div className="p-4 bg-red-900/20 border border-red-700/50 rounded-lg">
                  <div className="flex items-center justify-between">
                    <span className="text-red-300">Total Cost:</span>
                    <div className="text-right">
                      <div className="text-white font-bold font-mono">
                        {formatEther(costs.totalCostWei)} ETH
                      </div>
                      <div className="text-sm text-gray-400">
                        ≈ ${costs.totalCostUSD.toFixed(2)} USD
                      </div>
                    </div>
                  </div>
                </div>

                {/* Transaction Status */}
                {transactionStep !== 'idle' && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="space-y-3"
                  >
                    {/* Status Steps */}
                    <div className="flex items-center justify-center gap-4">
                      <StatusStep 
                        label="Confirm" 
                        status={transactionStep === 'confirming' ? 'active' : transactionStep !== 'idle' ? 'complete' : 'pending'} 
                      />
                      <StatusStep 
                        label="Processing" 
                        status={transactionStep === 'pending' ? 'active' : transactionStep === 'success' ? 'complete' : 'pending'} 
                      />
                      <StatusStep 
                        label="Complete" 
                        status={transactionStep === 'success' ? 'complete' : 'pending'} 
                      />
                    </div>

                    {/* Success Animation */}
                    {transactionStep === 'success' && nftTokenId && (
                      <motion.div
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        className="text-center space-y-3 p-6 bg-green-900/20 border border-green-700/50 rounded-lg"
                      >
                        <Sparkles className="w-12 h-12 mx-auto text-green-400" />
                        <h3 className="text-xl font-bold text-green-400">
                          Transformation Complete!
                        </h3>
                        <p className="text-gray-300">
                          Shadow NFT #{nftTokenId} has been minted
                        </p>
                        {transactionHash && (
                          <a
                            href={`https://etherscan.io/tx/${transactionHash}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-sm text-blue-400 hover:text-blue-300 underline"
                          >
                            View Transaction
                          </a>
                        )}
                      </motion.div>
                    )}

                    {/* Error State */}
                    {transactionStep === 'error' && (
                      <div className="p-4 bg-red-900/20 border border-red-700/50 rounded-lg">
                        <p className="text-red-400 flex items-center gap-2">
                          <X className="w-5 h-5" />
                          {error || 'Transaction failed'}
                        </p>
                      </div>
                    )}
                  </motion.div>
                )}

                {/* Action Buttons */}
                <div className="flex gap-3">
                  {transactionStep === 'idle' && (
                    <>
                      <Button
                        variant="outline"
                        onClick={() => setShowConfirmDialog(false)}
                        className="flex-1 border-gray-700 hover:bg-stone-800"
                      >
                        Cancel
                      </Button>
                      <Button
                        onClick={handleSacrifice}
                        className="flex-1 bg-red-600 hover:bg-red-700 text-white"
                      >
                        <Zap className="w-4 h-4 mr-2" />
                        Confirm Sacrifice
                      </Button>
                    </>
                  )}
                  
                  {transactionStep === 'success' && (
                    <Button
                      onClick={() => {
                        setShowConfirmDialog(false);
                        setTransactionStep('idle');
                      }}
                      className="w-full bg-emerald-600 hover:bg-emerald-700"
                    >
                      View Shadow NFT
                    </Button>
                  )}
                  
                  {transactionStep === 'error' && (
                    <Button
                      onClick={() => setTransactionStep('idle')}
                      variant="outline"
                      className="w-full border-gray-700 hover:bg-stone-800"
                    >
                      Try Again
                    </Button>
                  )}
                </div>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </AnimatePresence>
    </>
  );
}

function StatusStep({ label, status }: { label: string; status: 'pending' | 'active' | 'complete' }) {
  return (
    <div className="flex flex-col items-center gap-2">
      <motion.div
        animate={status === 'active' ? { scale: [1, 1.2, 1] } : {}}
        transition={{ duration: 1, repeat: Infinity }}
        className={cn(
          "w-10 h-10 rounded-full flex items-center justify-center",
          status === 'pending' && "bg-stone-800 border-2 border-gray-700",
          status === 'active' && "bg-blue-600 border-2 border-blue-400",
          status === 'complete' && "bg-green-600 border-2 border-green-400"
        )}
      >
        {status === 'active' && <Loader2 className="w-5 h-5 text-white animate-spin" />}
        {status === 'complete' && <Check className="w-5 h-5 text-white" />}
      </motion.div>
      <span className={cn(
        "text-xs font-medium",
        status === 'pending' && "text-gray-500",
        status === 'active' && "text-blue-400",
        status === 'complete' && "text-green-400"
      )}>
        {label}
      </span>
    </div>
  );
}