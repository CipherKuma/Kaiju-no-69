'use client'

import { useState, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Upload, Code, FileCode, Play, Settings, AlertCircle } from 'lucide-react'
import { motion } from 'framer-motion'
import InfoTooltip from './InfoTooltip'

interface AlgorithmConfigurationProps {
  onConfigurationComplete: (config: AlgorithmConfig) => void
}

interface AlgorithmConfig {
  type: 'upload' | 'template' | 'custom'
  code: string
  template?: string
  parameters: Record<string, any>
  backtestResults?: BacktestResult
}

interface BacktestResult {
  profitLoss: number
  winRate: number
  sharpeRatio: number
  maxDrawdown: number
}

const strategyTemplates = [
  {
    id: 'momentum',
    name: 'Momentum Trading',
    description: 'Follows price trends and momentum indicators',
    code: `// Momentum Trading Strategy
function executeStrategy(marketData, position) {
  const { price, volume, sma20, sma50 } = marketData
  
  if (sma20 > sma50 && volume > averageVolume) {
    return { action: 'BUY', amount: calculatePositionSize() }
  } else if (sma20 < sma50) {
    return { action: 'SELL', amount: position.amount }
  }
  
  return { action: 'HOLD' }
}`
  },
  {
    id: 'meanReversion',
    name: 'Mean Reversion',
    description: 'Trades based on price returning to average',
    code: `// Mean Reversion Strategy
function executeStrategy(marketData, position) {
  const { price, bb_upper, bb_lower } = marketData
  
  if (price < bb_lower) {
    return { action: 'BUY', amount: calculatePositionSize() }
  } else if (price > bb_upper && position.amount > 0) {
    return { action: 'SELL', amount: position.amount }
  }
  
  return { action: 'HOLD' }
}`
  },
  {
    id: 'arbitrage',
    name: 'Arbitrage',
    description: 'Exploits price differences across markets',
    code: `// Arbitrage Strategy
function executeStrategy(marketData, position) {
  const { priceA, priceB, spread } = marketData
  const threshold = 0.002 // 0.2% spread
  
  if (spread > threshold) {
    return { 
      action: 'ARBITRAGE', 
      buy: { market: 'A', amount: calculateSize() },
      sell: { market: 'B', amount: calculateSize() }
    }
  }
  
  return { action: 'HOLD' }
}`
  }
]

export default function AlgorithmConfiguration({ onConfigurationComplete }: AlgorithmConfigurationProps) {
  const [activeTab, setActiveTab] = useState<'upload' | 'template' | 'custom'>('template')
  const [selectedTemplate, setSelectedTemplate] = useState<string>('')
  const [customCode, setCustomCode] = useState('')
  const [uploadedFile, setUploadedFile] = useState<File | null>(null)
  const [parameters, setParameters] = useState({
    riskLevel: 'medium',
    positionSize: 10,
    stopLoss: 5,
    takeProfit: 10,
    maxDrawdown: 15
  })
  const [isBacktesting, setIsBacktesting] = useState(false)
  const [backtestResults, setBacktestResults] = useState<BacktestResult | null>(null)

  const handleFileUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setUploadedFile(file)
      // TODO: Read file content and validate
    }
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    const file = e.dataTransfer.files[0]
    if (file && (file.name.endsWith('.js') || file.name.endsWith('.ts'))) {
      setUploadedFile(file)
    }
  }, [])

  const runBacktest = async () => {
    setIsBacktesting(true)
    try {
      // TODO: Integrate with actual backtesting API
      await new Promise(resolve => setTimeout(resolve, 3000))
      
      setBacktestResults({
        profitLoss: 23.5,
        winRate: 58.2,
        sharpeRatio: 1.85,
        maxDrawdown: 12.3
      })
    } finally {
      setIsBacktesting(false)
    }
  }

  const handleComplete = () => {
    const config: AlgorithmConfig = {
      type: activeTab,
      code: activeTab === 'template' 
        ? strategyTemplates.find(t => t.id === selectedTemplate)?.code || ''
        : activeTab === 'custom' 
        ? customCode 
        : '', // TODO: Read from uploaded file
      template: selectedTemplate,
      parameters,
      backtestResults: backtestResults || undefined
    }
    
    onConfigurationComplete(config)
  }

  return (
    <div className="space-y-6">
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="template">
            <FileCode className="w-4 h-4 mr-2" />
            Templates
          </TabsTrigger>
          <TabsTrigger value="custom">
            <Code className="w-4 h-4 mr-2" />
            Custom Code
          </TabsTrigger>
          <TabsTrigger value="upload">
            <Upload className="w-4 h-4 mr-2" />
            Upload
          </TabsTrigger>
        </TabsList>

        <TabsContent value="template" className="space-y-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Label>Select Strategy Template</Label>
              <InfoTooltip content="Choose a pre-built trading strategy template. You can customize parameters after selection." />
            </div>
            <Select value={selectedTemplate} onValueChange={setSelectedTemplate}>
              <SelectTrigger>
                <SelectValue placeholder="Choose a strategy template" />
              </SelectTrigger>
              <SelectContent>
                {strategyTemplates.map((template) => (
                  <SelectItem key={template.id} value={template.id}>
                    <div>
                      <div className="font-medium">{template.name}</div>
                      <div className="text-sm text-muted-foreground">{template.description}</div>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {selectedTemplate && (
            <Card className="p-4">
              <pre className="text-sm overflow-x-auto">
                <code>{strategyTemplates.find(t => t.id === selectedTemplate)?.code}</code>
              </pre>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="custom" className="space-y-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Label>Custom Trading Algorithm</Label>
              <InfoTooltip content="Write your own trading algorithm in JavaScript. Must export an executeStrategy function that takes marketData and position as parameters." />
            </div>
            <Card className="p-4">
              <textarea
                className="w-full h-64 font-mono text-sm bg-transparent resize-none focus:outline-none"
                placeholder="// Write your custom trading algorithm here..."
                value={customCode}
                onChange={(e) => setCustomCode(e.target.value)}
              />
            </Card>
            {customCode && customCode.length < 50 && (
              <p className="text-xs text-amber-500 mt-2">
                Algorithm seems too short. Ensure it includes proper trading logic.
              </p>
            )}
          </div>
        </TabsContent>

        <TabsContent value="upload" className="space-y-4">
          <div
            className="border-2 border-dashed rounded-lg p-8 text-center hover:border-primary transition-colors"
            onDrop={handleDrop}
            onDragOver={(e) => e.preventDefault()}
          >
            <Upload className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
            <p className="text-sm text-muted-foreground mb-2">
              Drag and drop your algorithm file here, or click to browse
            </p>
            <input
              type="file"
              accept=".js,.ts"
              onChange={handleFileUpload}
              className="hidden"
              id="file-upload"
            />
            <label htmlFor="file-upload">
              <Button variant="secondary" size="sm" asChild>
                <span>Select File</span>
              </Button>
            </label>
            {uploadedFile && (
              <p className="mt-2 text-sm font-medium">{uploadedFile.name}</p>
            )}
          </div>
        </TabsContent>
      </Tabs>

      <Card className="p-4 space-y-4">
        <h3 className="font-semibold flex items-center gap-2">
          <Settings className="w-4 h-4" />
          Strategy Parameters
        </h3>
        
        <div className="grid grid-cols-2 gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Label htmlFor="risk-level">Risk Level</Label>
              <InfoTooltip content="Determines how aggressively the algorithm will trade. Higher risk may lead to higher returns but also larger losses." />
            </div>
            <Select value={parameters.riskLevel} onValueChange={(v) => setParameters(p => ({ ...p, riskLevel: v }))}>
              <SelectTrigger id="risk-level">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="low">Low</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="high">High</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div>
            <Label htmlFor="position-size">Position Size (%)</Label>
            <Input
              id="position-size"
              type="number"
              value={parameters.positionSize}
              onChange={(e) => setParameters(p => ({ ...p, positionSize: Number(e.target.value) }))}
              min="1"
              max="100"
            />
          </div>
          
          <div>
            <Label htmlFor="stop-loss">Stop Loss (%)</Label>
            <Input
              id="stop-loss"
              type="number"
              value={parameters.stopLoss}
              onChange={(e) => setParameters(p => ({ ...p, stopLoss: Number(e.target.value) }))}
              min="1"
              max="50"
            />
          </div>
          
          <div>
            <Label htmlFor="take-profit">Take Profit (%)</Label>
            <Input
              id="take-profit"
              type="number"
              value={parameters.takeProfit}
              onChange={(e) => setParameters(p => ({ ...p, takeProfit: Number(e.target.value) }))}
              min="1"
              max="100"
            />
          </div>
        </div>
      </Card>

      <div className="space-y-4">
        <Button
          onClick={runBacktest}
          disabled={!selectedTemplate && !customCode && !uploadedFile}
          className="w-full"
          variant="secondary"
        >
          {isBacktesting ? (
            <>
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
              >
                <Play className="w-4 h-4 mr-2" />
              </motion.div>
              Running Backtest...
            </>
          ) : (
            <>
              <Play className="w-4 h-4 mr-2" />
              Run Backtest
            </>
          )}
        </Button>

        {backtestResults && (
          <Card className="p-4">
            <h4 className="font-semibold mb-3">Backtest Results</h4>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <span className="text-muted-foreground">Profit/Loss:</span>
                <span className={`ml-2 font-medium ${backtestResults.profitLoss > 0 ? 'text-green-500' : 'text-red-500'}`}>
                  {backtestResults.profitLoss > 0 ? '+' : ''}{backtestResults.profitLoss}%
                </span>
              </div>
              <div>
                <span className="text-muted-foreground">Win Rate:</span>
                <span className="ml-2 font-medium">{backtestResults.winRate}%</span>
              </div>
              <div>
                <span className="text-muted-foreground">Sharpe Ratio:</span>
                <span className="ml-2 font-medium">{backtestResults.sharpeRatio}</span>
              </div>
              <div>
                <span className="text-muted-foreground">Max Drawdown:</span>
                <span className="ml-2 font-medium text-red-500">-{backtestResults.maxDrawdown}%</span>
              </div>
            </div>
          </Card>
        )}

        <Button
          onClick={handleComplete}
          disabled={(!selectedTemplate && !customCode && !uploadedFile) || !backtestResults}
          className="w-full"
        >
          Continue to Vincent Agent Setup
        </Button>
      </div>
    </div>
  )
}