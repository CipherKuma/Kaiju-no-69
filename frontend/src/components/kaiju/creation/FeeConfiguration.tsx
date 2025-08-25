'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Slider } from '@/components/ui/slider'
import { Badge } from '@/components/ui/badge'
import { motion } from 'framer-motion'
import { 
  TrendingUp, 
  Zap, 
  Trophy,
  Info,
  Calculator,
  DollarSign,
  BarChart3
} from 'lucide-react'

interface FeeConfigurationProps {
  onConfigurationComplete: (config: FeeConfig) => void
}

export interface FeeConfig {
  entryFee: number
  profitShare: number
  tierSystem: {
    enabled: boolean
    tiers: TierLevel[]
  }
}

interface TierLevel {
  name: string
  threshold: number
  discount: number
  benefits: string[]
}

const defaultTiers: TierLevel[] = [
  {
    name: 'Bronze',
    threshold: 0,
    discount: 0,
    benefits: ['Basic trading access', 'Standard support']
  },
  {
    name: 'Silver',
    threshold: 100,
    discount: 10,
    benefits: ['Priority execution', 'Weekly reports', 'Silver badge']
  },
  {
    name: 'Gold',
    threshold: 500,
    discount: 20,
    benefits: ['VIP execution', 'Daily reports', 'Custom alerts', 'Gold badge']
  },
  {
    name: 'Platinum',
    threshold: 1000,
    discount: 30,
    benefits: ['Ultra-fast execution', 'Real-time analytics', 'Direct support', 'Platinum badge']
  }
]

export default function FeeConfiguration({ onConfigurationComplete }: FeeConfigurationProps) {
  const [entryFee, setEntryFee] = useState(50) // In USD
  const [profitShare, setProfitShare] = useState(20) // Percentage
  const [tiersEnabled, setTiersEnabled] = useState(true)
  const [customTiers] = useState(defaultTiers)

  // Calculate projections
  const calculateProjections = () => {
    const avgShadowValue = 1000 // Average shadow value in USD
    const avgMonthlyProfit = 15 // Average monthly profit percentage
    const estimatedShadows = [10, 50, 100, 500] // Different user counts
    
    return estimatedShadows.map(count => {
      const entryRevenue = entryFee * count
      const monthlyTradingProfit = avgShadowValue * count * (avgMonthlyProfit / 100)
      const profitShareRevenue = monthlyTradingProfit * (profitShare / 100)
      const totalMonthlyRevenue = entryRevenue + profitShareRevenue
      
      return {
        shadows: count,
        entryRevenue,
        profitShareRevenue,
        totalMonthlyRevenue,
        yearlyProjection: totalMonthlyRevenue * 12
      }
    })
  }

  const projections = calculateProjections()

  const handleComplete = () => {
    onConfigurationComplete({
      entryFee,
      profitShare,
      tierSystem: {
        enabled: tiersEnabled,
        tiers: tiersEnabled ? customTiers : []
      }
    })
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="p-6 space-y-6">
          <div>
            <h3 className="text-lg font-semibold mb-2 flex items-center gap-2">
              <DollarSign className="w-5 h-5" />
              Entry Fee
            </h3>
            <p className="text-sm text-muted-foreground mb-4">
              One-time fee for shadows to enter your territory
            </p>
          </div>

          <div className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-2">
                <Label>Entry Fee Amount</Label>
                <div className="flex items-center gap-2">
                  <span className="text-2xl font-bold">${entryFee}</span>
                  <Badge variant="secondary">USD</Badge>
                </div>
              </div>
              <Slider
                value={[entryFee]}
                onValueChange={([v]) => setEntryFee(v)}
                max={500}
                min={10}
                step={10}
                className="mb-2"
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>$10</span>
                <span>$500</span>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setEntryFee(25)}
                className={entryFee === 25 ? 'border-primary' : ''}
              >
                Low ($25)
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setEntryFee(50)}
                className={entryFee === 50 ? 'border-primary' : ''}
              >
                Medium ($50)
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setEntryFee(100)}
                className={entryFee === 100 ? 'border-primary' : ''}
              >
                High ($100)
              </Button>
            </div>

            <Card className="p-4 bg-primary/5">
              <div className="flex items-start gap-2">
                <Info className="w-4 h-4 text-primary mt-0.5" />
                <div className="text-sm">
                  <p className="font-medium">Entry Fee Guidelines</p>
                  <ul className="mt-1 space-y-1 text-muted-foreground">
                    <li>• Lower fees attract more shadows</li>
                    <li>• Higher fees filter for serious traders</li>
                    <li>• Consider your Kaiju&apos;s performance history</li>
                  </ul>
                </div>
              </div>
            </Card>
          </div>
        </Card>

        <Card className="p-6 space-y-6">
          <div>
            <h3 className="text-lg font-semibold mb-2 flex items-center gap-2">
              <TrendingUp className="w-5 h-5" />
              Profit Share
            </h3>
            <p className="text-sm text-muted-foreground mb-4">
              Your percentage of profits generated by shadows
            </p>
          </div>

          <div className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-2">
                <Label>Profit Share Percentage</Label>
                <div className="flex items-center gap-2">
                  <span className="text-2xl font-bold">{profitShare}%</span>
                </div>
              </div>
              <Slider
                value={[profitShare]}
                onValueChange={([v]) => setProfitShare(v)}
                max={50}
                min={5}
                step={5}
                className="mb-2"
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>5%</span>
                <span>50%</span>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setProfitShare(10)}
                className={profitShare === 10 ? 'border-primary' : ''}
              >
                Low (10%)
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setProfitShare(20)}
                className={profitShare === 20 ? 'border-primary' : ''}
              >
                Standard (20%)
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setProfitShare(30)}
                className={profitShare === 30 ? 'border-primary' : ''}
              >
                Premium (30%)
              </Button>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Shadow keeps:</span>
                <span className="font-medium">{100 - profitShare}%</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">You receive:</span>
                <span className="font-medium text-primary">{profitShare}%</span>
              </div>
            </div>
          </div>
        </Card>
      </div>

      <Card className="p-6 space-y-6">
        <div>
          <h3 className="text-lg font-semibold mb-2 flex items-center gap-2">
            <Trophy className="w-5 h-5" />
            Loyalty Tier System
          </h3>
          <p className="text-sm text-muted-foreground">
            Reward loyal shadows with fee discounts and perks
          </p>
        </div>

        <div className="flex items-center justify-between p-4 bg-secondary/10 rounded-lg">
          <div className="flex items-center gap-3">
            <Zap className="w-5 h-5 text-secondary" />
            <div>
              <p className="font-medium">Enable Tier System</p>
              <p className="text-sm text-muted-foreground">
                Automatically apply discounts based on trading volume
              </p>
            </div>
          </div>
          <Button
            variant={tiersEnabled ? 'default' : 'outline'}
            size="sm"
            onClick={() => setTiersEnabled(!tiersEnabled)}
          >
            {tiersEnabled ? 'Enabled' : 'Disabled'}
          </Button>
        </div>

        {tiersEnabled && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {customTiers.map((tier, index) => (
              <motion.div
                key={tier.name}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Card className="p-4 hover:shadow-lg transition-shadow">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h4 className="font-semibold">{tier.name}</h4>
                      <p className="text-sm text-muted-foreground">
                        ${tier.threshold}+ volume
                      </p>
                    </div>
                    <Badge variant="secondary">{tier.discount}% off</Badge>
                  </div>
                  <div className="space-y-1">
                    {tier.benefits.map((benefit, i) => (
                      <p key={i} className="text-xs text-muted-foreground flex items-center gap-1">
                        <span className="w-1 h-1 bg-primary rounded-full" />
                        {benefit}
                      </p>
                    ))}
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>
        )}
      </Card>

      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <BarChart3 className="w-5 h-5" />
          Revenue Projections
        </h3>
        
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b">
                <th className="text-left py-2">Shadows</th>
                <th className="text-right py-2">Entry Revenue</th>
                <th className="text-right py-2">Profit Share/mo</th>
                <th className="text-right py-2">Total/mo</th>
                <th className="text-right py-2">Yearly</th>
              </tr>
            </thead>
            <tbody>
              {projections.map((proj, index) => (
                <tr key={index} className="border-b">
                  <td className="py-2">{proj.shadows}</td>
                  <td className="text-right py-2">${proj.entryRevenue}</td>
                  <td className="text-right py-2">${proj.profitShareRevenue.toFixed(0)}</td>
                  <td className="text-right py-2 font-medium">
                    ${proj.totalMonthlyRevenue.toFixed(0)}
                  </td>
                  <td className="text-right py-2 font-bold text-primary">
                    ${(proj.yearlyProjection / 1000).toFixed(1)}k
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        <p className="text-xs text-muted-foreground mt-4">
          * Projections based on average trading performance. Actual results may vary.
        </p>
      </Card>

      <Button onClick={handleComplete} className="w-full" size="lg">
        <Calculator className="w-4 h-4 mr-2" />
        Finalize Fee Structure
      </Button>
    </div>
  )
}