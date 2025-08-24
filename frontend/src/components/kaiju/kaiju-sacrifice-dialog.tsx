"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Kaiju } from "@/types/models";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { AlertCircle, Clock, DollarSign, Shield, Zap } from "lucide-react";
import { useAccount, useBalance } from "wagmi";
import { useNotifications } from "@/components/ui/notification";

interface KaijuSacrificeDialogProps {
  kaiju: Kaiju;
  isOpen: boolean;
  onClose: () => void;
}

const SUBSCRIPTION_OPTIONS = [
  { days: 2, price: 0.01, label: "2 Days Trial", description: "Test the waters" },
  { days: 7, price: 0.03, label: "1 Week", description: "Short term commitment" },
  { days: 14, price: 0.05, label: "2 Weeks", description: "Half month access" },
  { days: 30, price: 0.1, label: "30 Days", description: "Full month subscription (NFT included)" },
];

export function KaijuSacrificeDialog({ kaiju, isOpen, onClose }: KaijuSacrificeDialogProps) {
  const { address, isConnected } = useAccount();
  const { data: balance } = useBalance({ address, chainId: 360 });
  const { showNotification } = useNotifications();
  
  const [selectedDuration, setSelectedDuration] = useState("30");
  const [slippage, setSlippage] = useState([2.5]);
  const [isProcessing, setIsProcessing] = useState(false);

  const selectedOption = SUBSCRIPTION_OPTIONS.find(opt => opt.days.toString() === selectedDuration);
  const totalCost = selectedOption ? selectedOption.price + kaiju.entryFee : kaiju.entryFee;

  const handleSacrifice = async () => {
    if (!isConnected) {
      showNotification({
        type: "error",
        title: "Wallet not connected",
        message: "Please connect your wallet to proceed",
      });
      return;
    }

    if (balance && parseFloat(balance.formatted) < totalCost) {
      showNotification({
        type: "error",
        title: "Insufficient funds",
        message: `You need at least ${totalCost} ETH to sacrifice yourself`,
      });
      return;
    }

    setIsProcessing(true);
    
    // TODO: Implement actual sacrifice logic
    setTimeout(() => {
      showNotification({
        type: "info",
        title: "Sacrifice initiated",
        message: "Your shadow NFT is being minted...",
      });
      setIsProcessing(false);
      onClose();
    }, 2000);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl bg-stone-900 text-stone-200">
        <DialogHeader>
          <DialogTitle className="text-2xl font-heading">Sacrifice Yourself to {kaiju.name}</DialogTitle>
          <DialogDescription className="text-stone-400">
            By sacrificing yourself, you'll mint a Shadow NFT that automatically copies {kaiju.name}'s trades
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 mt-6">
          {/* Kaiju Info */}
          <div className="bg-stone-800 rounded-lg p-4 flex items-center gap-4">
            <img src={kaiju.imageUrl} alt={kaiju.name} className="w-16 h-16 rounded-full" />
            <div className="flex-1">
              <h3 className="font-bold">{kaiju.name}</h3>
              <p className="text-sm text-stone-400">{kaiju.traderTitle}</p>
            </div>
            <div className="text-right">
              <p className="text-sm text-stone-400">30D Performance</p>
              <p className={`font-bold ${kaiju.performance.last30Days >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                {kaiju.performance.last30Days.toFixed(2)}%
              </p>
            </div>
          </div>

          {/* Duration Selection */}
          <div className="space-y-3">
            <Label className="text-lg font-semibold">Select Subscription Duration</Label>
            <RadioGroup value={selectedDuration} onValueChange={setSelectedDuration}>
              {SUBSCRIPTION_OPTIONS.map((option) => (
                <div key={option.days} className="mb-3">
                  <label 
                    htmlFor={`duration-${option.days}`}
                    className="flex items-center space-x-3 cursor-pointer bg-stone-800 p-4 rounded-lg hover:bg-stone-700 transition-colors"
                  >
                    <RadioGroupItem value={option.days.toString()} id={`duration-${option.days}`} />
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">{option.label}</p>
                          <p className="text-sm text-stone-400">{option.description}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-bold">{option.price} ETH</p>
                          {option.days === 30 && (
                            <Badge variant="secondary" className="text-xs">
                              <Shield className="h-3 w-3 mr-1" />
                              NFT Included
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  </label>
                </div>
              ))}
            </RadioGroup>
          </div>

          {/* Slippage Tolerance */}
          <div className="space-y-3">
            <Label className="text-lg font-semibold">Slippage Tolerance</Label>
            <div className="bg-stone-800 p-4 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-stone-400">Max slippage for copy trades</span>
                <span className="font-mono font-bold">{slippage[0]}%</span>
              </div>
              <Slider
                value={slippage}
                onValueChange={setSlippage}
                min={0.5}
                max={5}
                step={0.5}
                className="mt-2"
              />
              <div className="flex justify-between text-xs text-stone-500 mt-1">
                <span>0.5%</span>
                <span>5%</span>
              </div>
            </div>
          </div>

          {/* Cost Summary */}
          <div className="bg-stone-800 rounded-lg p-4 space-y-2">
            <h4 className="font-semibold mb-3">Cost Summary</h4>
            <div className="flex justify-between text-sm">
              <span className="text-stone-400">Entry Fee</span>
              <span>{kaiju.entryFee} ETH</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-stone-400">Subscription ({selectedOption?.days} days)</span>
              <span>{selectedOption?.price} ETH</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-stone-400">Profit Share</span>
              <span>{kaiju.profitShare}%</span>
            </div>
            <div className="border-t border-stone-700 pt-2 mt-2">
              <div className="flex justify-between font-bold">
                <span>Total Cost</span>
                <span>{totalCost} ETH</span>
              </div>
            </div>
          </div>

          {/* Warning */}
          <div className="bg-yellow-900/20 border border-yellow-700/50 rounded-lg p-4 flex gap-3">
            <AlertCircle className="h-5 w-5 text-yellow-600 flex-shrink-0 mt-0.5" />
            <div className="text-sm">
              <p className="font-semibold text-yellow-600 mb-1">Important Information</p>
              <ul className="text-stone-400 space-y-1">
                <li>• Your Shadow NFT will automatically copy all of {kaiju.name}'s trades</li>
                <li>• You'll pay {kaiju.profitShare}% of profits as performance fee</li>
                <li>• Subscription expires after {selectedOption?.days} days</li>
                {selectedOption?.days === 30 && (
                  <li>• 30-day subscription includes a tradeable Shadow NFT</li>
                )}
              </ul>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={onClose}
              className="flex-1"
              disabled={isProcessing}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSacrifice}
              className="flex-1 bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-500 hover:to-purple-600"
              disabled={isProcessing || !isConnected}
            >
              {isProcessing ? (
                <>
                  <Zap className="h-4 w-4 mr-2 animate-pulse" />
                  Processing...
                </>
              ) : (
                <>
                  <Shield className="h-4 w-4 mr-2" />
                  Sacrifice for {totalCost} ETH
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}