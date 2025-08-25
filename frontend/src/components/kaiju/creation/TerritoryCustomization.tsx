'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { motion } from 'framer-motion'
import { 
  Mountain, 
  Waves, 
  Trees, 
  Cloud, 
  Flame,
  Snowflake,
  Palette,
  MapPin,
  Edit3,
  Sparkles
} from 'lucide-react'

interface TerritoryCustomizationProps {
  onCustomizationComplete: (config: TerritoryConfig) => void
}

export interface TerritoryConfig {
  biome: string
  name: string
  description: string
  colorScheme: {
    primary: string
    secondary: string
    accent: string
  }
  landmarks: Landmark[]
}

interface Landmark {
  id: string
  type: string
  position: { x: number; y: number }
  size: 'small' | 'medium' | 'large'
}

const biomes = [
  {
    id: 'volcanic',
    name: 'Volcanic Peaks',
    icon: Flame,
    description: 'Fiery mountains with lava flows',
    colors: { primary: '#ef4444', secondary: '#f97316', accent: '#fbbf24' }
  },
  {
    id: 'aquatic',
    name: 'Deep Ocean',
    icon: Waves,
    description: 'Underwater realm with coral reefs',
    colors: { primary: '#3b82f6', secondary: '#06b6d4', accent: '#6366f1' }
  },
  {
    id: 'forest',
    name: 'Ancient Forest',
    icon: Trees,
    description: 'Dense woods with mystical energy',
    colors: { primary: '#10b981', secondary: '#22c55e', accent: '#84cc16' }
  },
  {
    id: 'sky',
    name: 'Floating Islands',
    icon: Cloud,
    description: 'Aerial territory among the clouds',
    colors: { primary: '#8b5cf6', secondary: '#a78bfa', accent: '#c084fc' }
  },
  {
    id: 'mountain',
    name: 'Crystal Mountains',
    icon: Mountain,
    description: 'Towering peaks with crystal formations',
    colors: { primary: '#6b7280', secondary: '#9ca3af', accent: '#e5e7eb' }
  },
  {
    id: 'tundra',
    name: 'Frozen Wasteland',
    icon: Snowflake,
    description: 'Icy plains with aurora displays',
    colors: { primary: '#06b6d4', secondary: '#0ea5e9', accent: '#38bdf8' }
  }
]

const landmarkTypes = [
  { id: 'monument', name: 'Monument', icon: '🗿' },
  { id: 'crystal', name: 'Crystal Formation', icon: '💎' },
  { id: 'portal', name: 'Energy Portal', icon: '🌀' },
  { id: 'shrine', name: 'Ancient Shrine', icon: '⛩️' },
  { id: 'tree', name: 'Sacred Tree', icon: '🌳' },
  { id: 'fountain', name: 'Mystic Fountain', icon: '⛲' }
]

export default function TerritoryCustomization({ onCustomizationComplete }: TerritoryCustomizationProps) {
  const [selectedBiome, setSelectedBiome] = useState<string>('')
  const [territoryName, setTerritoryName] = useState('')
  const [territoryDescription, setTerritoryDescription] = useState('')
  const [colorScheme, setColorScheme] = useState({
    primary: '#6366f1',
    secondary: '#8b5cf6',
    accent: '#10b981'
  })
  const [landmarks, setLandmarks] = useState<Landmark[]>([])
  const [_selectedLandmarkType] = useState('')

  const handleBiomeSelect = (biomeId: string) => {
    setSelectedBiome(biomeId)
    const biome = biomes.find(b => b.id === biomeId)
    if (biome) {
      setColorScheme(biome.colors)
    }
  }

  const addLandmark = (type: string) => {
    const newLandmark: Landmark = {
      id: `landmark-${Date.now()}`,
      type,
      position: { 
        x: Math.random() * 80 + 10, // 10-90% range
        y: Math.random() * 80 + 10 
      },
      size: 'medium'
    }
    setLandmarks([...landmarks, newLandmark])
  }


  const removeLandmark = (id: string) => {
    setLandmarks(landmarks.filter(l => l.id !== id))
  }

  const handleComplete = () => {
    if (!selectedBiome || !territoryName) return
    
    onCustomizationComplete({
      biome: selectedBiome,
      name: territoryName,
      description: territoryDescription,
      colorScheme,
      landmarks
    })
  }

  return (
    <div className="space-y-6">
      <Tabs defaultValue="biome" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="biome">
            <Mountain className="w-4 h-4 mr-2" />
            Biome
          </TabsTrigger>
          <TabsTrigger value="details">
            <Edit3 className="w-4 h-4 mr-2" />
            Details
          </TabsTrigger>
          <TabsTrigger value="colors">
            <Palette className="w-4 h-4 mr-2" />
            Colors
          </TabsTrigger>
          <TabsTrigger value="landmarks">
            <MapPin className="w-4 h-4 mr-2" />
            Landmarks
          </TabsTrigger>
        </TabsList>

        <TabsContent value="biome" className="space-y-4">
          <div>
            <Label>Select Territory Biome</Label>
            <p className="text-sm text-muted-foreground mb-4">
              Choose the environment that best represents your Kaiju&apos;s domain
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {biomes.map((biome) => {
              const Icon = biome.icon
              return (
                <motion.div
                  key={biome.id}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <Card
                    className={`p-4 cursor-pointer transition-all ${
                      selectedBiome === biome.id
                        ? 'ring-2 ring-primary'
                        : 'hover:ring-1 hover:ring-primary/50'
                    }`}
                    onClick={() => handleBiomeSelect(biome.id)}
                  >
                    <div 
                      className="h-24 rounded-lg mb-3 flex items-center justify-center"
                      style={{
                        background: `linear-gradient(135deg, ${biome.colors.primary}, ${biome.colors.secondary})`
                      }}
                    >
                      <Icon className="w-12 h-12 text-white" />
                    </div>
                    <h4 className="font-semibold">{biome.name}</h4>
                    <p className="text-sm text-muted-foreground">{biome.description}</p>
                  </Card>
                </motion.div>
              )
            })}
          </div>
        </TabsContent>

        <TabsContent value="details" className="space-y-4">
          <div>
            <Label htmlFor="territory-name">Territory Name</Label>
            <Input
              id="territory-name"
              placeholder="Enter a unique name for your territory"
              value={territoryName}
              onChange={(e) => setTerritoryName(e.target.value)}
              maxLength={50}
            />
            <p className="text-xs text-muted-foreground mt-1">
              {territoryName.length}/50 characters
            </p>
          </div>

          <div>
            <Label htmlFor="territory-description">Description</Label>
            <textarea
              id="territory-description"
              className="w-full min-h-[100px] px-3 py-2 text-sm rounded-md border bg-background resize-none"
              placeholder="Describe your territory's unique features and atmosphere..."
              value={territoryDescription}
              onChange={(e) => setTerritoryDescription(e.target.value)}
              maxLength={200}
            />
            <p className="text-xs text-muted-foreground mt-1">
              {territoryDescription.length}/200 characters
            </p>
          </div>
        </TabsContent>

        <TabsContent value="colors" className="space-y-4">
          <div>
            <Label>Color Scheme</Label>
            <p className="text-sm text-muted-foreground mb-4">
              Customize your territory&apos;s visual theme
            </p>
          </div>

          <div className="space-y-4">
            <div>
              <Label htmlFor="primary-color">Primary Color</Label>
              <div className="flex gap-2 mt-2">
                <div
                  className="w-12 h-12 rounded-lg border cursor-pointer"
                  style={{ backgroundColor: colorScheme.primary }}
                />
                <Input
                  id="primary-color"
                  type="color"
                  value={colorScheme.primary}
                  onChange={(e) => setColorScheme(prev => ({ ...prev, primary: e.target.value }))}
                  className="flex-1"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="secondary-color">Secondary Color</Label>
              <div className="flex gap-2 mt-2">
                <div
                  className="w-12 h-12 rounded-lg border cursor-pointer"
                  style={{ backgroundColor: colorScheme.secondary }}
                />
                <Input
                  id="secondary-color"
                  type="color"
                  value={colorScheme.secondary}
                  onChange={(e) => setColorScheme(prev => ({ ...prev, secondary: e.target.value }))}
                  className="flex-1"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="accent-color">Accent Color</Label>
              <div className="flex gap-2 mt-2">
                <div
                  className="w-12 h-12 rounded-lg border cursor-pointer"
                  style={{ backgroundColor: colorScheme.accent }}
                />
                <Input
                  id="accent-color"
                  type="color"
                  value={colorScheme.accent}
                  onChange={(e) => setColorScheme(prev => ({ ...prev, accent: e.target.value }))}
                  className="flex-1"
                />
              </div>
            </div>

            <Card className="p-4">
              <p className="text-sm font-medium mb-2">Preview</p>
              <div 
                className="h-32 rounded-lg relative overflow-hidden"
                style={{
                  background: `linear-gradient(135deg, ${colorScheme.primary}, ${colorScheme.secondary})`
                }}
              >
                <div
                  className="absolute bottom-0 right-0 w-20 h-20 rounded-tl-full"
                  style={{ backgroundColor: colorScheme.accent }}
                />
              </div>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="landmarks" className="space-y-4">
          <div>
            <Label>Territory Landmarks</Label>
            <p className="text-sm text-muted-foreground mb-4">
              Add special landmarks to make your territory unique
            </p>
          </div>

          <div className="grid grid-cols-3 gap-2">
            {landmarkTypes.map((type) => (
              <Button
                key={type.id}
                variant="outline"
                size="sm"
                onClick={() => addLandmark(type.id)}
                className="h-auto py-3 flex-col"
              >
                <span className="text-2xl mb-1">{type.icon}</span>
                <span className="text-xs">{type.name}</span>
              </Button>
            ))}
          </div>

          {landmarks.length > 0 && (
            <Card className="p-4">
              <div
                className="relative h-64 rounded-lg border-2 border-dashed"
                style={{
                  background: `linear-gradient(135deg, ${colorScheme.primary}20, ${colorScheme.secondary}20)`
                }}
              >
                {landmarks.map((landmark) => {
                  const landmarkType = landmarkTypes.find(t => t.id === landmark.type)
                  const sizeMap = { small: 'text-2xl', medium: 'text-3xl', large: 'text-4xl' }
                  
                  return (
                    <motion.div
                      key={landmark.id}
                      className="absolute cursor-pointer"
                      style={{
                        left: `${landmark.position.x}%`,
                        top: `${landmark.position.y}%`,
                        transform: 'translate(-50%, -50%)'
                      }}
                      whileHover={{ scale: 1.1 }}
                      onClick={() => removeLandmark(landmark.id)}
                    >
                      <span className={sizeMap[landmark.size]}>
                        {landmarkType?.icon}
                      </span>
                    </motion.div>
                  )
                })}
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                Click landmarks to remove them
              </p>
            </Card>
          )}
        </TabsContent>
      </Tabs>

      <Button
        onClick={handleComplete}
        disabled={!selectedBiome || !territoryName}
        className="w-full"
      >
        <Sparkles className="w-4 h-4 mr-2" />
        Continue to Fee Configuration
      </Button>
    </div>
  )
}