'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Slider } from '@/components/ui/slider'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Brain, Zap, Shield, TrendingUp, AlertTriangle, Info } from 'lucide-react'
import { motion } from 'framer-motion'
import InfoTooltip from './InfoTooltip'

interface VincentAgentSetupProps {
  onSetupComplete: (config: VincentAgentConfig) => void
}

export interface VincentAgentConfig {
  personality: {
    aggressiveness: number
    patience: number
    adaptability: number
    confidence: number
  }
  tradingBehavior: {
    preferredTimeframe: string
    maxPositions: number
    rebalanceFrequency: string
    exitStrategy: string
    hedgingEnabled: boolean
  }
  riskProfile: {
    maxDrawdown: number
    targetReturn: number
    volatilityTolerance: string
    correlationLimit: number
    emergencyStopLoss: boolean
  }
}

const personalityTraits = [
  {
    name: 'Aggressiveness',
    description: 'How actively the agent pursues trading opportunities',
    icon: Zap,
    low: 'Conservative',
    high: 'Aggressive'
  },
  {
    name: 'Patience',
    description: 'Willingness to wait for optimal entry points',
    icon: Brain,
    low: 'Impulsive',
    high: 'Patient'
  },
  {
    name: 'Adaptability',
    description: 'How quickly the agent adjusts to market changes',
    icon: TrendingUp,
    low: 'Rigid',
    high: 'Flexible'
  },
  {
    name: 'Confidence',
    description: 'Conviction in trading decisions',
    icon: Shield,
    low: 'Cautious',
    high: 'Confident'
  }
]

export default function VincentAgentSetup({ onSetupComplete }: VincentAgentSetupProps) {
  const [currentStep, setCurrentStep] = useState(0)
  const [config, setConfig] = useState<VincentAgentConfig>({
    personality: {
      aggressiveness: 50,
      patience: 50,
      adaptability: 50,
      confidence: 50
    },
    tradingBehavior: {
      preferredTimeframe: '1h',
      maxPositions: 5,
      rebalanceFrequency: 'daily',
      exitStrategy: 'trailing',
      hedgingEnabled: false
    },
    riskProfile: {
      maxDrawdown: 20,
      targetReturn: 30,
      volatilityTolerance: 'medium',
      correlationLimit: 0.7,
      emergencyStopLoss: true
    }
  })

  const steps = ['Personality', 'Trading Behavior', 'Risk Profile']

  const updatePersonality = (trait: string, value: number) => {
    setConfig(prev => ({
      ...prev,
      personality: {
        ...prev.personality,
        [trait]: value
      }
    }))
  }

  const updateTradingBehavior = (key: string, value: any) => {
    setConfig(prev => ({
      ...prev,
      tradingBehavior: {
        ...prev.tradingBehavior,
        [key]: value
      }
    }))
  }

  const updateRiskProfile = (key: string, value: any) => {
    setConfig(prev => ({
      ...prev,
      riskProfile: {
        ...prev.riskProfile,
        [key]: value
      }
    }))
  }

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1)
    } else {
      onSetupComplete(config)
    }
  }

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold">Vincent Agent Setup</h2>
        <div className="flex items-center gap-2">
          {steps.map((step, index) => (
            <div
              key={step}
              className={`flex items-center ${index < steps.length - 1 ? 'mr-2' : ''}`}
            >
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors ${
                  index <= currentStep
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted text-muted-foreground'
                }`}
              >
                {index + 1}
              </div>
              {index < steps.length - 1 && (
                <div
                  className={`w-12 h-0.5 transition-colors ${
                    index < currentStep ? 'bg-primary' : 'bg-muted'
                  }`}
                />
              )}
            </div>
          ))}
        </div>
      </div>

      <motion.div
        key={currentStep}
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: -20 }}
        transition={{ duration: 0.3 }}
      >
        {currentStep === 0 && (
          <Card className="p-6 space-y-6">
            <div>
              <h3 className="text-lg font-semibold mb-2">Agent Personality</h3>
              <p className="text-sm text-muted-foreground">
                Define how your Vincent agent will approach trading decisions
              </p>
            </div>

            <div className="space-y-6">
              {personalityTraits.map((trait) => {
                const Icon = trait.icon
                const value = config.personality[trait.name.toLowerCase() as keyof typeof config.personality]
                
                return (
                  <div key={trait.name} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Icon className="w-4 h-4 text-muted-foreground" />
                        <Label>{trait.name}</Label>
                      </div>
                      <span className="text-sm font-medium">{value}</span>
                    </div>
                    <p className="text-xs text-muted-foreground">{trait.description}</p>
                    <div className="flex items-center gap-4">
                      <span className="text-xs w-20">{trait.low}</span>
                      <Slider
                        value={[value]}
                        onValueChange={([v]) => updatePersonality(trait.name.toLowerCase(), v)}
                        max={100}
                        step={1}
                        className="flex-1"
                      />
                      <span className="text-xs w-20 text-right">{trait.high}</span>
                    </div>
                  </div>
                )
              })}
            </div>
          </Card>
        )}

        {currentStep === 1 && (
          <Card className="p-6 space-y-6">
            <div>
              <h3 className="text-lg font-semibold mb-2">Trading Behavior</h3>
              <p className="text-sm text-muted-foreground">
                Configure how your agent executes trades
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <Label htmlFor="timeframe">Preferred Timeframe</Label>
                <Select
                  value={config.tradingBehavior.preferredTimeframe}
                  onValueChange={(v) => updateTradingBehavior('preferredTimeframe', v)}
                >
                  <SelectTrigger id="timeframe">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1m">1 Minute</SelectItem>
                    <SelectItem value="5m">5 Minutes</SelectItem>
                    <SelectItem value="15m">15 Minutes</SelectItem>
                    <SelectItem value="1h">1 Hour</SelectItem>
                    <SelectItem value="4h">4 Hours</SelectItem>
                    <SelectItem value="1d">1 Day</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="max-positions">Maximum Concurrent Positions</Label>
                <Input
                  id="max-positions"
                  type="number"
                  value={config.tradingBehavior.maxPositions}
                  onChange={(e) => updateTradingBehavior('maxPositions', Number(e.target.value))}
                  min="1"
                  max="20"
                />
              </div>

              <div>
                <Label htmlFor="rebalance">Rebalance Frequency</Label>
                <Select
                  value={config.tradingBehavior.rebalanceFrequency}
                  onValueChange={(v) => updateTradingBehavior('rebalanceFrequency', v)}
                >
                  <SelectTrigger id="rebalance">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="hourly">Hourly</SelectItem>
                    <SelectItem value="daily">Daily</SelectItem>
                    <SelectItem value="weekly">Weekly</SelectItem>
                    <SelectItem value="monthly">Monthly</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="exit-strategy">Exit Strategy</Label>
                <Select
                  value={config.tradingBehavior.exitStrategy}
                  onValueChange={(v) => updateTradingBehavior('exitStrategy', v)}
                >
                  <SelectTrigger id="exit-strategy">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="fixed">Fixed Target</SelectItem>
                    <SelectItem value="trailing">Trailing Stop</SelectItem>
                    <SelectItem value="dynamic">Dynamic Exit</SelectItem>
                    <SelectItem value="timebound">Time-Based</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="hedging">Enable Hedging</Label>
                  <p className="text-xs text-muted-foreground">Allow opposite positions for risk management</p>
                </div>
                <Switch
                  id="hedging"
                  checked={config.tradingBehavior.hedgingEnabled}
                  onCheckedChange={(v) => updateTradingBehavior('hedgingEnabled', v)}
                />
              </div>
            </div>
          </Card>
        )}

        {currentStep === 2 && (
          <Card className="p-6 space-y-6">
            <div>
              <h3 className="text-lg font-semibold mb-2">Risk Profile</h3>
              <p className="text-sm text-muted-foreground">
                Set risk parameters to protect your capital
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <Label>Maximum Drawdown</Label>
                  <span className="text-sm font-medium">{config.riskProfile.maxDrawdown}%</span>
                </div>
                <Slider
                  value={[config.riskProfile.maxDrawdown]}
                  onValueChange={([v]) => updateRiskProfile('maxDrawdown', v)}
                  max={50}
                  min={5}
                  step={5}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Agent will stop trading if drawdown exceeds this limit
                </p>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <Label>Target Annual Return</Label>
                  <span className="text-sm font-medium">{config.riskProfile.targetReturn}%</span>
                </div>
                <Slider
                  value={[config.riskProfile.targetReturn]}
                  onValueChange={([v]) => updateRiskProfile('targetReturn', v)}
                  max={100}
                  min={10}
                  step={5}
                />
              </div>

              <div>
                <Label htmlFor="volatility">Volatility Tolerance</Label>
                <Select
                  value={config.riskProfile.volatilityTolerance}
                  onValueChange={(v) => updateRiskProfile('volatilityTolerance', v)}
                >
                  <SelectTrigger id="volatility">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low (Stable assets)</SelectItem>
                    <SelectItem value="medium">Medium (Balanced)</SelectItem>
                    <SelectItem value="high">High (Volatile assets)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <Label>Position Correlation Limit</Label>
                  <span className="text-sm font-medium">{config.riskProfile.correlationLimit}</span>
                </div>
                <Slider
                  value={[config.riskProfile.correlationLimit]}
                  onValueChange={([v]) => updateRiskProfile('correlationLimit', v / 100)}
                  max={100}
                  min={0}
                  step={10}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Maximum allowed correlation between positions
                </p>
              </div>

              <div className="flex items-center justify-between p-4 bg-red-50 dark:bg-red-950/20 rounded-lg">
                <div className="flex items-center gap-3">
                  <AlertTriangle className="w-5 h-5 text-red-500" />
                  <div>
                    <Label htmlFor="emergency-stop">Emergency Stop Loss</Label>
                    <p className="text-xs text-muted-foreground">
                      Immediately close all positions on critical loss
                    </p>
                  </div>
                </div>
                <Switch
                  id="emergency-stop"
                  checked={config.riskProfile.emergencyStopLoss}
                  onCheckedChange={(v) => updateRiskProfile('emergencyStopLoss', v)}
                />
              </div>
            </div>
          </Card>
        )}
      </motion.div>

      <div className="flex justify-between">
        <Button
          variant="outline"
          onClick={handlePrevious}
          disabled={currentStep === 0}
        >
          Previous
        </Button>
        <Button onClick={handleNext}>
          {currentStep === steps.length - 1 ? 'Complete Setup' : 'Next'}
        </Button>
      </div>
    </div>
  )
}