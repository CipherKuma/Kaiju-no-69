"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  FloatingKaiju, 
  PulsingElement 
} from "@/components/ui/animated-components";
import { Kaiju } from "@/types/models";
import { 
  Users, 
  TrendingUp, 
  TrendingDown, 
  Crown,
  DollarSign,
  Percent
} from "lucide-react";
import { LineChart, Line, ResponsiveContainer, Tooltip } from "recharts";
import { theme } from "@/lib/theme";

interface KaijuCardProps {
  kaiju: Kaiju;
  onBecomeShadow?: () => void;
  onViewKingdom?: () => void;
  onQuickView?: () => void;
  isCompareMode?: boolean;
  isSelected?: boolean;
}

export function KaijuCard({ 
  kaiju, 
  onBecomeShadow, 
  onViewKingdom,
  onQuickView: _onQuickView,
  isCompareMode = false,
  isSelected = false
}: KaijuCardProps) {
  const [_isHovered, setIsHovered] = useState(false);
  
  // Generate sample chart data from daily returns
  const chartData = kaiju.performance.dailyReturns?.slice(-30).map((day, index) => ({
    day: index,
    value: day.return
  })) || Array.from({ length: 30 }, (_, i) => ({
    day: i,
    value: Math.random() * 10 - 5
  }));

  const isPositivePerformance = kaiju.performance.last30Days >= 0;
  const performanceColor = isPositivePerformance ? theme.colors.success.DEFAULT : theme.colors.danger.DEFAULT;



  return (
    <motion.div
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
      whileHover={{ scale: 1.02 }}
      transition={{ type: "spring", stiffness: 300, damping: 20 }}
    >
      <Card className={`relative overflow-hidden bg-stone-800 text-stone-200 transition-all duration-300 ${
        isSelected ? 'ring-2 ring-purple-500 ring-opacity-50' : ''
      }`}>
        {/* Online Indicator */}
        {kaiju.isOnline && (
          <PulsingElement>
            <div className="absolute top-4 right-4 z-10">
              <div className="w-3 h-3 bg-green-500 rounded-full shadow-[0_0_10px_rgba(34,197,94,0.5)]" />
            </div>
          </PulsingElement>
        )}

        <CardHeader className="relative pb-0">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <FloatingKaiju>
                <Avatar className="h-16 w-16 border-2 border-primary/20">
                  <AvatarImage src={kaiju.imageUrl} alt={kaiju.name} />
                  <AvatarFallback>{kaiju.name.slice(0, 2).toUpperCase()}</AvatarFallback>
                </Avatar>
              </FloatingKaiju>
              <div>
                <h3 className="font-heading text-lg font-bold">{kaiju.name}</h3>
               
              </div>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="mt-4 grid grid-cols-2 gap-2">
            <div className="flex items-center gap-1 text-sm">
              <Users className="h-4 w-4 text-muted-foreground" />
              <span className="font-medium">{kaiju.shadows.length}</span>
              <span className="text-muted-foreground">Shadows</span>
            </div>
            <div className="flex items-center gap-1 text-sm">
              <Crown className="h-4 w-4 text-yellow-500" />
              <span className="font-medium">{kaiju.popularity || 0}</span>
              <span className="text-muted-foreground">Score</span>
            </div>
          </div>
        </CardHeader>

        <CardContent className="pt-4">
          {/* Performance Chart */}
          <div className="relative h-24 mb-4">
            <div className="absolute top-0 left-0 text-sm font-medium flex items-center gap-1">
              <span className="text-muted-foreground">30D:</span>
              <span className={isPositivePerformance ? "text-green-500" : "text-red-500"}>
                {isPositivePerformance ? <TrendingUp className="h-4 w-4 inline" /> : <TrendingDown className="h-4 w-4 inline" />}
                {Math.abs(kaiju.performance.last30Days).toFixed(2)}%
              </span>
            </div>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <Tooltip
                  contentStyle={{
                    backgroundColor: "rgba(0, 0, 0, 0.8)",
                    border: "1px solid rgba(255, 255, 255, 0.1)",
                    borderRadius: "8px",
                  }}
                  labelStyle={{ color: "#888" }}
                />
                <Line
                  type="monotone"
                  dataKey="value"
                  stroke={performanceColor}
                  strokeWidth={2}
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Fee Information */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground flex items-center gap-1">
                <DollarSign className="h-4 w-4" />
                Entry Fee
              </span>
              <span className="font-mono font-medium">
                {kaiju.entryFee} ETH
              </span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground flex items-center gap-1">
                <Percent className="h-4 w-4" />
                Profit Share
              </span>
              <span className="font-mono font-medium">
                {kaiju.profitShare}%
              </span>
            </div>
          </div>

          {/* Trading Style Badge */}
          {kaiju.tradingStyle && (
            <div className="mt-3">
              <Badge variant="outline" className="text-xs text-white">
                {kaiju.tradingStyle.charAt(0).toUpperCase() + kaiju.tradingStyle.slice(1)} Trader
              </Badge>
            </div>
          )}
        </CardContent>

        <CardFooter className="pt-0 pb-4 gap-2">
          {isCompareMode ? (
            <div className="w-full text-center py-2">
              <p className="text-sm text-stone-400">
                {isSelected ? '✓ Selected for comparison' : 'Select to compare'}
              </p>
            </div>
          ) : (
            <>
              <Button
                variant="default"
                size="sm"
                className="flex-1 bg-gradient-to-r bg-stone-900 border-stone-900 hover:border-white border-[1px] text-stone-200 hover:bg-stone-900 cursor-pointer"
                onClick={onBecomeShadow}
              >
                Sacrifice Yourself
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="flex-1 text-stone-800 cursor-pointer"
                onClick={onViewKingdom}
              >
                View Den
              </Button>
            </>
          )}
        </CardFooter>

       
      </Card>
    </motion.div>
  );
}