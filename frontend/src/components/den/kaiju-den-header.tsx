"use client";

import { Kaiju } from "@/types/models";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  TrendingUp, 
  TrendingDown, 
  Users, 
  Activity, 
  ExternalLink,
  Share2,
  Twitter
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useNotifications } from "@/components/ui/notification";

interface KaijuDenHeaderProps {
  kaiju: Kaiju;
}

export function KaijuDenHeader({ kaiju }: KaijuDenHeaderProps) {
  const router = useRouter();
  const { showNotification } = useNotifications();
  const isPositivePerformance = kaiju.performance?.last30Days >= 0;

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: `${kaiju.name}'s Den`,
        text: `Check out ${kaiju.name}'s trading performance!`,
        url: window.location.href,
      });
    } else {
      navigator.clipboard.writeText(window.location.href);
      showNotification({
        type: "success",
        title: "Link copied!",
        message: "Den link has been copied to clipboard",
      });
    }
  };

  const handleTwitterShare = () => {
    const text = `Check out ${kaiju.name}'s Den on @KaijuNo69! 30D Performance: ${kaiju.performance?.last30Days?.toFixed(2) || '0.00'}%`;
    const url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(window.location.href)}`;
    window.open(url, '_blank');
  };

  return (
    <div className="bg-stone-900/80 backdrop-blur-sm rounded-xl p-8 border border-stone-700">
      <div className="flex flex-col lg:flex-row gap-8">
        {/* Kaiju Info */}
        <div className="flex items-start gap-6">
          <Avatar className="h-24 w-24 border-4 border-stone-700">
            <AvatarImage src={kaiju.imageUrl} alt={kaiju.name} />
            <AvatarFallback>{kaiju.name.slice(0, 2).toUpperCase()}</AvatarFallback>
          </Avatar>
          
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-3xl font-heading font-bold text-stone-200">{kaiju.name}'s Den</h1>
              {kaiju.isOnline && (
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse" />
                  <span className="text-sm text-green-500">Online</span>
                </div>
              )}
            </div>
            
            <p className="text-stone-400 mb-3">{kaiju.traderTitle}</p>
            
            <div className="flex flex-wrap gap-2">
              <Badge variant="outline" className="text-xs">
                {kaiju.tradingStyle?.charAt(0).toUpperCase() + kaiju.tradingStyle?.slice(1)} Trader
              </Badge>
              <Badge variant="secondary" className="text-xs">
                {kaiju.territoryId?.charAt(0).toUpperCase() + kaiju.territoryId?.slice(1)} Territory
              </Badge>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="flex-1 grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-stone-800/50 rounded-lg p-4">
            <div className="flex items-center gap-2 text-stone-400 mb-1">
              {isPositivePerformance ? (
                <TrendingUp className="h-4 w-4 text-green-500" />
              ) : (
                <TrendingDown className="h-4 w-4 text-red-500" />
              )}
              <span className="text-sm">30D Performance</span>
            </div>
            <p className={`text-2xl font-bold ${isPositivePerformance ? 'text-green-500' : 'text-red-500'}`}>
              {kaiju.performance?.last30Days?.toFixed(2) || '0.00'}%
            </p>
          </div>

          <div className="bg-stone-800/50 rounded-lg p-4">
            <div className="flex items-center gap-2 text-stone-400 mb-1">
              <Users className="h-4 w-4" />
              <span className="text-sm">Total Shadows</span>
            </div>
            <p className="text-2xl font-bold text-stone-200">{kaiju.shadows?.length || 0}</p>
          </div>

          <div className="bg-stone-800/50 rounded-lg p-4">
            <div className="flex items-center gap-2 text-stone-400 mb-1">
              <Activity className="h-4 w-4" />
              <span className="text-sm">Win Rate</span>
            </div>
            <p className="text-2xl font-bold text-stone-200">{kaiju.performance?.winRate || 0}%</p>
          </div>

          <div className="bg-stone-800/50 rounded-lg p-4">
            <div className="flex items-center gap-2 text-stone-400 mb-1">
              <span className="text-sm">TVL</span>
            </div>
            <p className="text-2xl font-bold text-stone-200">{kaiju.performance?.totalValueLocked?.toFixed(2) || '0.00'} ETH</p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-col gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={() => window.open(`https://opensea.io/collection/kaiju-no-69-${kaiju.id}`, '_blank')}
            className="flex items-center gap-2"
          >
            <ExternalLink className="h-4 w-4" />
            View on OpenSea
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            onClick={handleShare}
            className="flex items-center gap-2"
          >
            <Share2 className="h-4 w-4" />
            Share Den
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            onClick={handleTwitterShare}
            className="flex items-center gap-2"
          >
            <Twitter className="h-4 w-4" />
            Share on X
          </Button>
        </div>
      </div>
    </div>
  );
}