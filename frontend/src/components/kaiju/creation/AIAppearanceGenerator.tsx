'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card } from '@/components/ui/card'
import { Loader2, RefreshCw, Sparkles } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import InfoTooltip from './InfoTooltip'

interface AIAppearanceGeneratorProps {
  onGenerate: (imageUrl: string) => void
}

const stylePresets = [
  { id: 'cyberpunk', name: 'Cyberpunk', prompt: 'futuristic, neon, tech-enhanced' },
  { id: 'mythical', name: 'Mythical', prompt: 'mystical, ethereal, ancient power' },
  { id: 'mecha', name: 'Mecha', prompt: 'mechanical, robotic, armored' },
  { id: 'organic', name: 'Organic', prompt: 'natural, bio-luminescent, evolved' },
  { id: 'cosmic', name: 'Cosmic', prompt: 'celestial, space-themed, energy-based' },
  { id: 'shadow', name: 'Shadow', prompt: 'dark, mysterious, shadowy presence' }
]

export default function AIAppearanceGenerator({ onGenerate }: AIAppearanceGeneratorProps) {
  const [prompt, setPrompt] = useState('')
  const [selectedPreset, setSelectedPreset] = useState<string | null>(null)
  const [isGenerating, setIsGenerating] = useState(false)
  const [generatedImage, setGeneratedImage] = useState<string | null>(null)
  const [variations, setVariations] = useState<string[]>([])

  const handleGenerate = async () => {
    setIsGenerating(true)
    try {
      // TODO: Integrate with actual AI image generation API
      // For now, using placeholder
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      const placeholderImage = `https://api.dicebear.com/7.x/shapes/svg?seed=${Date.now()}&backgroundColor=6366f1,8b5cf6,10b981`
      setGeneratedImage(placeholderImage)
      
      // Generate variations
      const newVariations = Array.from({ length: 3 }, (_, i) => 
        `https://api.dicebear.com/7.x/shapes/svg?seed=${Date.now() + i}&backgroundColor=6366f1,8b5cf6,10b981`
      )
      setVariations(newVariations)
      
      onGenerate(placeholderImage)
    } finally {
      setIsGenerating(false)
    }
  }

  const handlePresetClick = (preset: typeof stylePresets[0]) => {
    setSelectedPreset(preset.id)
    setPrompt(prev => {
      const basePrompt = prev.replace(/,?\s*(futuristic|mystical|mechanical|natural|celestial|dark).*$/i, '')
      return basePrompt ? `${basePrompt}, ${preset.prompt}` : `Kaiju with ${preset.prompt} aesthetic`
    })
  }

  const selectVariation = (variationUrl: string) => {
    setGeneratedImage(variationUrl)
    onGenerate(variationUrl)
  }

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center gap-2 mb-2">
          <Label htmlFor="prompt" className="text-lg font-semibold">
            Describe Your Kaiju
          </Label>
          <InfoTooltip content="Provide a detailed description of your Kaiju's appearance. Be creative and specific - the AI will generate a unique visual based on your prompt." />
        </div>
        <div className="flex gap-2">
          <Input
            id="prompt"
            placeholder="A colossal dragon-like creature with glowing scales..."
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            className="flex-1"
            maxLength={500}
          />
          <Button
            onClick={handleGenerate}
            disabled={!prompt || prompt.trim().length < 10 || isGenerating}
            className="min-w-[120px]"
            title={prompt.trim().length < 10 ? "Please provide at least 10 characters" : ""}
          >
            {isGenerating ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Generating
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 mr-2" />
                Generate
              </>
            )}
          </Button>
        </div>
        <p className="text-xs text-muted-foreground mt-1">
          {prompt.length}/500 characters (minimum 10 required)
        </p>
      </div>

      <div>
        <div className="flex items-center gap-2 mb-2">
          <Label className="text-sm font-medium">Style Presets</Label>
          <InfoTooltip content="Click a preset to add style keywords to your prompt. These help guide the AI towards specific aesthetic themes." />
        </div>
        <div className="grid grid-cols-3 gap-2">
          {stylePresets.map((preset) => (
            <Button
              key={preset.id}
              variant={selectedPreset === preset.id ? 'default' : 'outline'}
              size="sm"
              onClick={() => handlePresetClick(preset)}
            >
              {preset.name}
            </Button>
          ))}
        </div>
      </div>

      <AnimatePresence mode="wait">
        {generatedImage && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-4"
          >
            <Card className="p-4">
              <div className="relative aspect-square rounded-lg overflow-hidden bg-gradient-to-br from-purple-900/20 to-blue-900/20">
                <img
                  src={generatedImage}
                  alt="Generated Kaiju"
                  className="w-full h-full object-contain"
                />
                <Button
                  size="sm"
                  variant="secondary"
                  className="absolute top-2 right-2"
                  onClick={handleGenerate}
                  disabled={isGenerating}
                >
                  <RefreshCw className="w-4 h-4" />
                </Button>
              </div>
            </Card>

            {variations.length > 0 && (
              <div>
                <Label className="text-sm font-medium mb-2 block">Variations</Label>
                <div className="grid grid-cols-3 gap-2">
                  {variations.map((variation, index) => (
                    <motion.div
                      key={variation}
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: index * 0.1 }}
                    >
                      <Card 
                        className="p-2 cursor-pointer hover:ring-2 hover:ring-primary transition-all"
                        onClick={() => selectVariation(variation)}
                      >
                        <div className="aspect-square rounded overflow-hidden bg-gradient-to-br from-purple-900/20 to-blue-900/20">
                          <img
                            src={variation}
                            alt={`Variation ${index + 1}`}
                            className="w-full h-full object-contain"
                          />
                        </div>
                      </Card>
                    </motion.div>
                  ))}
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}