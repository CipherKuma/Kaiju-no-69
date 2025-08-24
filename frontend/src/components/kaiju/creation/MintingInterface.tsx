'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Sparkles, 
  Check, 
  AlertCircle,
  Loader2,
  ExternalLink,
  Zap,
  Trophy,
  Brain,
  Map,
  DollarSign,
  Rocket
} from 'lucide-react'
import confetti from 'canvas-confetti'
import type { VincentAgentConfig } from './VincentAgentSetup'
import type { TerritoryConfig } from './TerritoryCustomization'
import type { FeeConfig } from './FeeConfiguration'

interface MintingInterfaceProps {
  kaijuData: {
    name: string
    imageUrl: string
    algorithm: any
    vincentAgent: VincentAgentConfig
    territory: TerritoryConfig
    fees: FeeConfig
  }
  onMintComplete: (tokenId: string, txHash: string) => void
}

interface MintingStep {
  id: string
  name: string
  status: 'pending' | 'processing' | 'completed' | 'error'
  txHash?: string
  error?: string
}

export default function MintingInterface({ kaijuData, onMintComplete }: MintingInterfaceProps) {
  const [isMinting, setIsMinting] = useState(false)
  const [mintingSteps, setMintingSteps] = useState<MintingStep[]>([
    { id: 'validate', name: 'Validating configuration', status: 'pending' },
    { id: 'ipfs', name: 'Uploading to IPFS', status: 'pending' },
    { id: 'approve', name: 'Approving transaction', status: 'pending' },
    { id: 'mint', name: 'Minting Kaiju NFT', status: 'pending' },
    { id: 'register', name: 'Registering on-chain', status: 'pending' }
  ])
  const [estimatedGas, setEstimatedGas] = useState<string>('0.025')
  const [tokenId, setTokenId] = useState<string>('')

  const updateStepStatus = (stepId: string, status: MintingStep['status'], txHash?: string, error?: string) => {
    setMintingSteps(steps => 
      steps.map(step => 
        step.id === stepId 
          ? { ...step, status, txHash, error }
          : step
      )
    )
  }

  const handleMint = async () => {
    setIsMinting(true)
    
    try {
      // Step 1: Validate
      updateStepStatus('validate', 'processing')
      await new Promise(resolve => setTimeout(resolve, 1500))
      updateStepStatus('validate', 'completed')

      // Step 2: Upload to IPFS
      updateStepStatus('ipfs', 'processing')
      await new Promise(resolve => setTimeout(resolve, 2000))
      updateStepStatus('ipfs', 'completed', '0xipfs...')

      // Step 3: Approve
      updateStepStatus('approve', 'processing')
      await new Promise(resolve => setTimeout(resolve, 1500))
      updateStepStatus('approve', 'completed', '0xapprove...')

      // Step 4: Mint
      updateStepStatus('mint', 'processing')
      await new Promise(resolve => setTimeout(resolve, 3000))
      const mockTokenId = `#${Math.floor(Math.random() * 9999) + 1000}`
      setTokenId(mockTokenId)
      updateStepStatus('mint', 'completed', '0xmint...')

      // Step 5: Register
      updateStepStatus('register', 'processing')
      await new Promise(resolve => setTimeout(resolve, 2000))
      updateStepStatus('register', 'completed', '0xregister...')

      // Celebration!
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 }
      })

      // Call completion handler
      setTimeout(() => {
        onMintComplete(mockTokenId, '0xmint...')
      }, 2000)

    } catch (error) {
      const failedStep = mintingSteps.find(step => step.status === 'processing')
      if (failedStep) {
        updateStepStatus(failedStep.id, 'error', undefined, 'Transaction failed')
      }
    }
  }

  const allStepsCompleted = mintingSteps.every(step => step.status === 'completed')

  return (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold mb-2">Ready to Mint Your Kaiju!</h1>
        <p className="text-muted-foreground">
          Review your configuration and mint your unique Kaiju NFT
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Kaiju Preview</h3>
          
          <div className="space-y-4">
            <div className="relative aspect-square rounded-lg overflow-hidden bg-gradient-to-br from-purple-900/20 to-blue-900/20">
              <img
                src={kaijuData.imageUrl}
                alt={kaijuData.name}
                className="w-full h-full object-contain"
              />
              <Badge className="absolute top-4 right-4">
                Expert Tier
              </Badge>
            </div>

            <div>
              <h4 className="text-xl font-bold">{kaijuData.territory.name}</h4>
              <p className="text-sm text-muted-foreground">{kaijuData.territory.description}</p>
            </div>

            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="flex items-center gap-2">
                <Brain className="w-4 h-4 text-muted-foreground" />
                <span>Vincent AI Active</span>
              </div>
              <div className="flex items-center gap-2">
                <Map className="w-4 h-4 text-muted-foreground" />
                <span>{kaijuData.territory.biome}</span>
              </div>
              <div className="flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-muted-foreground" />
                <span>${kaijuData.fees.entryFee} Entry</span>
              </div>
              <div className="flex items-center gap-2">
                <Trophy className="w-4 h-4 text-muted-foreground" />
                <span>{kaijuData.fees.profitShare}% Share</span>
              </div>
            </div>
          </div>
        </Card>

        <div className="space-y-6">
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Configuration Summary</h3>
            
            <div className="space-y-3">
              <div>
                <p className="text-sm font-medium mb-1">AI Personality</p>
                <div className="flex gap-2 flex-wrap">
                  <Badge variant="secondary">
                    Aggression: {kaijuData.vincentAgent.personality.aggressiveness}
                  </Badge>
                  <Badge variant="secondary">
                    Patience: {kaijuData.vincentAgent.personality.patience}
                  </Badge>
                  <Badge variant="secondary">
                    Adaptability: {kaijuData.vincentAgent.personality.adaptability}
                  </Badge>
                </div>
              </div>

              <div>
                <p className="text-sm font-medium mb-1">Trading Strategy</p>
                <div className="flex gap-2 flex-wrap">
                  <Badge variant="outline">
                    {kaijuData.vincentAgent.tradingBehavior.preferredTimeframe} timeframe
                  </Badge>
                  <Badge variant="outline">
                    Max {kaijuData.vincentAgent.tradingBehavior.maxPositions} positions
                  </Badge>
                </div>
              </div>

              <div>
                <p className="text-sm font-medium mb-1">Risk Management</p>
                <div className="flex gap-2 flex-wrap">
                  <Badge variant="outline">
                    {kaijuData.vincentAgent.riskProfile.maxDrawdown}% max drawdown
                  </Badge>
                  <Badge variant="outline">
                    {kaijuData.vincentAgent.riskProfile.targetReturn}% target return
                  </Badge>
                </div>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Gas Estimation</h3>
              <Badge variant="secondary">
                <Zap className="w-3 h-3 mr-1" />
                Ethereum
              </Badge>
            </div>
            
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Estimated Gas</span>
                <span className="font-medium">{estimatedGas} ETH</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Network Fee</span>
                <span className="text-sm">~$45.00</span>
              </div>
              <div className="flex justify-between pt-2 border-t">
                <span className="font-medium">Total Cost</span>
                <span className="font-bold text-primary">{estimatedGas} ETH</span>
              </div>
            </div>
          </Card>
        </div>
      </div>

      {!isMinting && (
        <Card className="p-8 bg-gradient-to-r from-purple-900/10 to-blue-900/10 border-primary/20">
          <div className="text-center space-y-4">
            <Sparkles className="w-12 h-12 mx-auto text-primary" />
            <h3 className="text-xl font-semibold">Everything looks great!</h3>
            <p className="text-sm text-muted-foreground max-w-md mx-auto">
              Your Kaiju is configured and ready to be minted. Once minted, it will be 
              permanently recorded on the blockchain and ready to start trading.
            </p>
            <Button 
              size="lg" 
              className="min-w-[200px]"
              onClick={handleMint}
            >
              <Rocket className="w-4 h-4 mr-2" />
              Mint Kaiju NFT
            </Button>
          </div>
        </Card>
      )}

      <AnimatePresence>
        {isMinting && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
          >
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4">Minting Progress</h3>
              
              <div className="space-y-3">
                {mintingSteps.map((step, index) => (
                  <motion.div
                    key={step.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                  >
                    <div className="flex items-center justify-between p-3 rounded-lg bg-secondary/10">
                      <div className="flex items-center gap-3">
                        {step.status === 'pending' && (
                          <div className="w-5 h-5 rounded-full border-2 border-muted" />
                        )}
                        {step.status === 'processing' && (
                          <Loader2 className="w-5 h-5 animate-spin text-primary" />
                        )}
                        {step.status === 'completed' && (
                          <div className="w-5 h-5 rounded-full bg-green-500 flex items-center justify-center">
                            <Check className="w-3 h-3 text-white" />
                          </div>
                        )}
                        {step.status === 'error' && (
                          <AlertCircle className="w-5 h-5 text-red-500" />
                        )}
                        
                        <div>
                          <p className="font-medium">{step.name}</p>
                          {step.txHash && (
                            <a
                              href={`https://etherscan.io/tx/${step.txHash}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-xs text-primary hover:underline flex items-center gap-1"
                            >
                              View transaction
                              <ExternalLink className="w-3 h-3" />
                            </a>
                          )}
                          {step.error && (
                            <p className="text-xs text-red-500">{step.error}</p>
                          )}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>

              {allStepsCompleted && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="mt-6 p-6 bg-gradient-to-r from-green-500/10 to-emerald-500/10 rounded-lg text-center"
                >
                  <Trophy className="w-12 h-12 mx-auto text-yellow-500 mb-3" />
                  <h4 className="text-xl font-bold mb-2">Congratulations!</h4>
                  <p className="text-muted-foreground mb-1">
                    Your Kaiju has been successfully minted
                  </p>
                  <p className="text-2xl font-bold text-primary">{tokenId}</p>
                </motion.div>
              )}
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}