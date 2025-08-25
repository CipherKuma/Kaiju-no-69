"use client";

import { Kaiju } from "@/types/models";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { 
  FloatingKaiju, 
  PulsingElement,
  FadeInUp 
} from "@/components/ui/animated-components";
import {
  Star,
  TrendingUp,
  TrendingDown,
  Users,
  DollarSign,
  Percent,
  Activity,
  Target,
  Shield,
  Zap,
  Award,
  Calendar,
  BarChart3,
  Crown
} from "lucide-react";
import { LineChart, Line, BarChart, Bar, ResponsiveContainer, XAxis, YAxis, CartesianGrid, Tooltip } from "recharts";
import { theme } from "@/lib/theme";

interface KaijuQuickViewModalProps {
  kaiju: Kaiju;
  isOpen: boolean;
  onClose: () => void;
  onBecomeShadow: () => void;
  onViewKingdom: () => void;
  isFavorite?: boolean;
  onToggleFavorite?: () => void;
}

export function KaijuQuickViewModal({
  kaiju,
  isOpen,
  onClose,
  onBecomeShadow,
  onViewKingdom,
  isFavorite,
  onToggleFavorite
}: KaijuQuickViewModalProps) {
  // Performance metrics
  const isPositivePerformance = kaiju.performance.last30Days >= 0;
  const performanceColor = isPositivePerformance ? theme.colors.success.DEFAULT : theme.colors.danger.DEFAULT;
  
  // Chart data
  const dailyReturnsData = kaiju.performance.dailyReturns?.slice(-30).map((day) => ({
    date: new Date(day.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    return: day.return,
    volume: day.volume
  })) || [];

  // Performance stats
  const stats = [
    {
      label: "30D Return",
      value: `${isPositivePerformance ? '+' : ''}${kaiju.performance.last30Days.toFixed(2)}%`,
      icon: isPositivePerformance ? TrendingUp : TrendingDown,
      color: performanceColor
    },
    {
      label: "Total Return",
      value: `${kaiju.performance.totalReturn >= 0 ? '+' : ''}${kaiju.performance.totalReturn.toFixed(2)}%`,
      icon: BarChart3,
      color: kaiju.performance.totalReturn >= 0 ? theme.colors.success.DEFAULT : theme.colors.danger.DEFAULT
    },
    {
      label: "Win Rate",
      value: `${kaiju.performance.winRate.toFixed(1)}%`,
      icon: Target,
      color: theme.colors.primary.DEFAULT
    },
    {
      label: "Total Trades",
      value: kaiju.performance.totalTrades.toLocaleString(),
      icon: Activity,
      color: theme.colors.secondary.DEFAULT
    },
    {
      label: "Sharpe Ratio",
      value: kaiju.performance.sharpeRatio?.toFixed(2) || "N/A",
      icon: Shield,
      color: theme.colors.warning.DEFAULT
    },
    {
      label: "Max Drawdown",
      value: `${kaiju.performance.maxDrawdown?.toFixed(1) || 0}%`,
      icon: TrendingDown,
      color: theme.colors.danger.DEFAULT
    }
  ];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden">
        <DialogHeader className="relative">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-4">
              <FloatingKaiju>
                <Avatar className="h-20 w-20 border-2 border-primary/20">
                  <AvatarImage src={kaiju.imageUrl} alt={kaiju.name} />
                  <AvatarFallback>{kaiju.name.slice(0, 2).toUpperCase()}</AvatarFallback>
                </Avatar>
              </FloatingKaiju>
              <div>
                <DialogTitle className="font-heading text-2xl flex items-center gap-2">
                  {kaiju.name}
                  {kaiju.isOnline && (
                    <PulsingElement>
                      <div className="w-3 h-3 bg-green-500 rounded-full" />
                    </PulsingElement>
                  )}
                </DialogTitle>
                <DialogDescription className="text-base">
                  {kaiju.traderTitle || "Master Trader"}
                </DialogDescription>
                <div className="flex items-center gap-2 mt-2">
                  <Badge variant="outline">
                    {kaiju.tradingStyle ? kaiju.tradingStyle.charAt(0).toUpperCase() + kaiju.tradingStyle.slice(1) : "Balanced"} Trader
                  </Badge>
                  <Badge className="bg-purple-500">
                    <Crown className="h-3 w-3 mr-1" />
                    Rank #{Math.floor(Math.random() * 100) + 1}
                  </Badge>
                </div>
              </div>
            </div>
            {onToggleFavorite && (
              <Button
                variant="ghost"
                size="icon"
                onClick={onToggleFavorite}
              >
                <Star className={`h-5 w-5 ${isFavorite ? 'text-yellow-500 fill-yellow-500' : 'text-muted-foreground'}`} />
              </Button>
            )}
          </div>
        </DialogHeader>

        <Tabs defaultValue="overview" className="mt-4">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="performance">Performance</TabsTrigger>
            <TabsTrigger value="details">Details</TabsTrigger>
          </TabsList>

          <ScrollArea className="h-[400px] mt-4">
            <TabsContent value="overview" className="space-y-4">
              {/* Quick Stats Grid */}
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {stats.map((stat) => (
                  <FadeInUp key={stat.label}>
                    <div className="bg-card p-4 rounded-lg border">
                      <div className="flex items-center gap-2 text-muted-foreground text-sm mb-1">
                        <stat.icon className="h-4 w-4" style={{ color: stat.color }} />
                        {stat.label}
                      </div>
                      <div className="text-2xl font-bold" style={{ color: stat.color }}>
                        {stat.value}
                      </div>
                    </div>
                  </FadeInUp>
                ))}
              </div>

              <Separator />

              {/* Shadow Information */}
              <div className="space-y-3">
                <h3 className="font-heading text-lg">Shadow Information</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground flex items-center gap-1">
                        <Users className="h-4 w-4" />
                        Active Shadows
                      </span>
                      <span className="font-mono font-medium">
                        {kaiju.shadows.length}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground flex items-center gap-1">
                        <DollarSign className="h-4 w-4" />
                        Entry Fee
                      </span>
                      <span className="font-mono font-medium">
                        {kaiju.entryFee} ETH
                      </span>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground flex items-center gap-1">
                        <Percent className="h-4 w-4" />
                        Profit Share
                      </span>
                      <span className="font-mono font-medium">
                        {kaiju.profitShare}%
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground flex items-center gap-1">
                        <Award className="h-4 w-4" />
                        Popularity Score
                      </span>
                      <span className="font-mono font-medium">
                        {kaiju.popularity || 0}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <Separator />

              {/* Description */}
              {kaiju.description && (
                <div className="space-y-2">
                  <h3 className="font-heading text-lg">About</h3>
                  <p className="text-sm text-muted-foreground">
                    {kaiju.description}
                  </p>
                </div>
              )}
            </TabsContent>

            <TabsContent value="performance" className="space-y-4">
              {/* Performance Chart */}
              <div className="space-y-2">
                <h3 className="font-heading text-lg">30-Day Performance</h3>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={dailyReturnsData}>
                      <CartesianGrid strokeDasharray="3 3" className="opacity-20" />
                      <XAxis 
                        dataKey="date" 
                        className="text-xs"
                        tick={{ fill: theme.colors.dark.DEFAULT }}
                      />
                      <YAxis 
                        className="text-xs"
                        tick={{ fill: theme.colors.dark.DEFAULT }}
                      />
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
                        dataKey="return"
                        stroke={theme.colors.primary.DEFAULT}
                        strokeWidth={2}
                        dot={false}
                        name="Return %"
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Volume Chart */}
              <div className="space-y-2">
                <h3 className="font-heading text-lg">Trading Volume</h3>
                <div className="h-48">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={dailyReturnsData}>
                      <CartesianGrid strokeDasharray="3 3" className="opacity-20" />
                      <XAxis 
                        dataKey="date" 
                        className="text-xs"
                        tick={{ fill: theme.colors.dark.DEFAULT }}
                      />
                      <YAxis 
                        className="text-xs"
                        tick={{ fill: theme.colors.dark.DEFAULT }}
                      />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "rgba(0, 0, 0, 0.8)",
                          border: "1px solid rgba(255, 255, 255, 0.1)",
                          borderRadius: "8px",
                        }}
                        labelStyle={{ color: "#888" }}
                      />
                      <Bar
                        dataKey="volume"
                        fill={theme.colors.secondary.DEFAULT}
                        name="Volume"
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="details" className="space-y-4">
              {/* Trading Details */}
              <div className="space-y-3">
                <h3 className="font-heading text-lg">Trading Details</h3>
                <div className="space-y-2">
                  <div className="flex items-center justify-between py-2">
                    <span className="text-sm text-muted-foreground">Preferred Trading Hours</span>
                    <Badge variant="outline">24/7</Badge>
                  </div>
                  <Separator />
                  <div className="flex items-center justify-between py-2">
                    <span className="text-sm text-muted-foreground">Supported Chains</span>
                    <div className="flex gap-1">
                      <Badge variant="outline">ETH</Badge>
                      <Badge variant="outline">Polygon</Badge>
                      <Badge variant="outline">Arbitrum</Badge>
                    </div>
                  </div>
                  <Separator />
                  <div className="flex items-center justify-between py-2">
                    <span className="text-sm text-muted-foreground">Main DEXes</span>
                    <div className="flex gap-1">
                      <Badge variant="outline">Uniswap</Badge>
                      <Badge variant="outline">1inch</Badge>
                    </div>
                  </div>
                  <Separator />
                  <div className="flex items-center justify-between py-2">
                    <span className="text-sm text-muted-foreground">Risk Level</span>
                    <div className="flex items-center gap-1">
                      {Array.from({ length: 5 }, (_, i) => (
                        <Zap
                          key={i}
                          className={`h-4 w-4 ${
                            i < 3 ? 'text-yellow-500 fill-yellow-500' : 'text-gray-300'
                          }`}
                        />
                      ))}
                    </div>
                  </div>
                  <Separator />
                  <div className="flex items-center justify-between py-2">
                    <span className="text-sm text-muted-foreground">Created</span>
                    <span className="text-sm flex items-center gap-1">
                      <Calendar className="h-4 w-4" />
                      {new Date(Date.now() - Math.random() * 90 * 24 * 60 * 60 * 1000).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </div>

              {/* Recent Achievements */}
              <div className="space-y-3">
                <h3 className="font-heading text-lg">Recent Achievements</h3>
                <div className="space-y-2">
                  <div className="flex items-center gap-3 p-3 bg-card rounded-lg border">
                    <Award className="h-8 w-8 text-yellow-500" />
                    <div>
                      <p className="font-medium">Top Performer</p>
                      <p className="text-xs text-muted-foreground">Ranked #1 in weekly returns</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-3 bg-card rounded-lg border">
                    <Users className="h-8 w-8 text-blue-500" />
                    <div>
                      <p className="font-medium">Shadow Master</p>
                      <p className="text-xs text-muted-foreground">100+ active shadows</p>
                    </div>
                  </div>
                </div>
              </div>
            </TabsContent>
          </ScrollArea>
        </Tabs>

        <div className="flex gap-2 mt-4">
          <Button
            variant="default"
            className="flex-1"
            onClick={onBecomeShadow}
          >
            Become Shadow
          </Button>
          <Button
            variant="outline"
            className="flex-1"
            onClick={onViewKingdom}
          >
            View Kingdom
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}