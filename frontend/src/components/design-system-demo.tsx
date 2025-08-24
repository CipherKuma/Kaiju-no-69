"use client";

import { useState } from "react";
import {
  FloatingKaiju,
  GlowingElement,
  PulsingElement,
  ShakeOnDamage,
  FadeInUp,
  StaggerContainer,
  StaggerItem,
  TerritoryAnimation,
  DamageImpact,
  BattleEntrance,
  VictoryAnimation,
} from "@/components/ui/animated-components";
import { useTheme } from "@/hooks/use-theme";

export default function DesignSystemDemo() {
  const [showDamage, setShowDamage] = useState(false);
  const [showVictory, setShowVictory] = useState(false);
  const { colors, fonts } = useTheme();

  return (
    <div className="min-h-screen bg-background p-8 space-y-12">
      {/* Typography Section */}
      <section className="space-y-6">
        <h1 className="text-6xl font-heading text-primary">Kaiju No. 69</h1>
        <h2 className="text-4xl font-heading text-secondary">Typography System</h2>
        <p className="text-lg font-sans">
          Body text using Inter font for excellent readability.
        </p>
        <p className="font-pixel text-warning">GAME OVER! INSERT COIN TO CONTINUE...</p>
        <code className="font-mono text-success">0x742d35Cc6634C0532925a3b844Bc9e</code>
      </section>

      {/* Color Palette */}
      <section className="space-y-4">
        <h2 className="text-3xl font-heading">Color System</h2>
        <div className="grid grid-cols-4 gap-4">
          <div className="p-4 bg-primary text-white rounded-lg">Primary</div>
          <div className="p-4 bg-secondary text-white rounded-lg">Secondary</div>
          <div className="p-4 bg-success text-white rounded-lg">Success</div>
          <div className="p-4 bg-warning text-white rounded-lg">Warning</div>
          <div className="p-4 bg-danger text-white rounded-lg">Danger</div>
          <div className="p-4 bg-dark text-white rounded-lg">Dark</div>
        </div>
      </section>

      {/* Territory Colors */}
      <section className="space-y-4">
        <h2 className="text-3xl font-heading">Territory Colors</h2>
        <div className="grid grid-cols-4 gap-4">
          <TerritoryAnimation territory="fire">
            <div className="p-8 bg-territory-fire text-white rounded-lg font-heading">
              FIRE
            </div>
          </TerritoryAnimation>
          <TerritoryAnimation territory="water">
            <div className="p-8 bg-territory-water text-white rounded-lg font-heading">
              WATER
            </div>
          </TerritoryAnimation>
          <TerritoryAnimation territory="earth">
            <div className="p-8 bg-territory-earth text-white rounded-lg font-heading">
              EARTH
            </div>
          </TerritoryAnimation>
          <TerritoryAnimation territory="air">
            <div className="p-8 bg-territory-air text-white rounded-lg font-heading">
              AIR
            </div>
          </TerritoryAnimation>
        </div>
      </section>

      {/* Animation Demos */}
      <section className="space-y-8">
        <h2 className="text-3xl font-heading">Animation System</h2>
        
        <div className="grid grid-cols-3 gap-8">
          {/* Floating Animation */}
          <div className="text-center space-y-4">
            <h3 className="text-xl font-heading">Floating Kaiju</h3>
            <FloatingKaiju>
              <div className="w-24 h-24 bg-primary rounded-full mx-auto flex items-center justify-center text-white font-bold">
                KAIJU
              </div>
            </FloatingKaiju>
          </div>

          {/* Glowing Element */}
          <div className="text-center space-y-4">
            <h3 className="text-xl font-heading">Glowing Effect</h3>
            <GlowingElement className="w-32 h-32 bg-secondary mx-auto flex items-center justify-center text-white font-bold">
              ACTIVE
            </GlowingElement>
          </div>

          {/* Pulsing Element */}
          <div className="text-center space-y-4">
            <h3 className="text-xl font-heading">Pulse Animation</h3>
            <PulsingElement>
              <div className="w-24 h-24 bg-success rounded-lg mx-auto flex items-center justify-center text-white font-bold">
                PULSE
              </div>
            </PulsingElement>
          </div>
        </div>

        {/* Interactive Animations */}
        <div className="grid grid-cols-2 gap-8">
          {/* Damage Animation */}
          <div className="text-center space-y-4">
            <h3 className="text-xl font-heading">Damage Effects</h3>
            <div className="space-x-4">
              <ShakeOnDamage trigger={showDamage}>
                <DamageImpact trigger={showDamage}>
                  <div className="w-32 h-32 bg-danger rounded-lg mx-auto flex items-center justify-center text-white font-bold">
                    HIT ME!
                  </div>
                </DamageImpact>
              </ShakeOnDamage>
            </div>
            <button
              onClick={() => {
                setShowDamage(true);
                setTimeout(() => setShowDamage(false), 600);
              }}
              className="px-4 py-2 bg-danger text-white rounded-lg font-heading"
            >
              Trigger Damage
            </button>
          </div>

          {/* Victory Animation */}
          <div className="text-center space-y-4">
            <h3 className="text-xl font-heading">Victory Animation</h3>
            <VictoryAnimation trigger={showVictory}>
              <div className="w-32 h-32 bg-warning rounded-lg mx-auto flex items-center justify-center text-white font-bold">
                WINNER!
              </div>
            </VictoryAnimation>
            <button
              onClick={() => {
                setShowVictory(true);
                setTimeout(() => setShowVictory(false), 1000);
              }}
              className="px-4 py-2 bg-warning text-white rounded-lg font-heading"
            >
              Trigger Victory
            </button>
          </div>
        </div>

        {/* Battle Entrance */}
        <div className="text-center space-y-4">
          <h3 className="text-xl font-heading">Battle Entrance</h3>
          <BattleEntrance>
            <div className="w-48 h-48 bg-gradient-to-br from-primary to-secondary rounded-lg mx-auto flex items-center justify-center text-white font-heading text-2xl">
              KAIJU APPEARS!
            </div>
          </BattleEntrance>
        </div>

        {/* Stagger Animation */}
        <div className="space-y-4">
          <h3 className="text-xl font-heading">Stagger Animation</h3>
          <StaggerContainer className="grid grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((item) => (
              <StaggerItem key={item}>
                <FadeInUp>
                  <div className="p-6 bg-primary/20 border-2 border-primary rounded-lg text-center font-heading">
                    Item {item}
                  </div>
                </FadeInUp>
              </StaggerItem>
            ))}
          </StaggerContainer>
        </div>
      </section>
    </div>
  );
}