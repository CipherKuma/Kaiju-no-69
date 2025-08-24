"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  Clock, 
  DollarSign, 
  Shield, 
  TrendingUp, 
  Calendar,
  ShoppingCart,
  Filter
} from "lucide-react";
import { useAccount } from "wagmi";
import { useNotifications } from "@/components/ui/notification";
import { formatDistanceToNow } from "date-fns";

interface ShadowListing {
  id: string;
  tokenId: string;
  seller: {
    address: string;
    ens?: string;
  };
  price: number;
  originalPrice: number;
  daysRemaining: number;
  performance: {
    totalReturn: number;
    winRate: number;
    totalTrades: number;
  };
  listedAt: Date;
  imageUrl: string;
}

interface ShadowMarketplaceProps {
  kaijuId: string;
}

// Generate mock listings
const generateMockListings = (): ShadowListing[] => {
  return Array.from({ length: 12 }, (_, i) => ({
    id: `listing-${i}`,
    tokenId: `#${2000 + i}`,
    seller: {
      address: `0x${Math.random().toString(16).substr(2, 40)}`,
      ens: Math.random() > 0.5 ? `seller${i}.eth` : undefined,
    },
    price: Math.random() * 0.05 + 0.01,
    originalPrice: 0.1,
    daysRemaining: Math.floor(Math.random() * 28) + 2,
    performance: {
      totalReturn: (Math.random() - 0.3) * 100,
      winRate: Math.random() * 100,
      totalTrades: Math.floor(Math.random() * 50) + 10,
    },
    listedAt: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000),
    imageUrl: '/shadow.png',
  })).sort((a, b) => b.daysRemaining - a.daysRemaining);
};

export function ShadowMarketplace({ kaijuId }: ShadowMarketplaceProps) {
  const { address, isConnected } = useAccount();
  const { showNotification } = useNotifications();
  const [listings, setListings] = useState<ShadowListing[]>(generateMockListings());
  const [filter, setFilter] = useState<'all' | 'profitable' | 'cheap'>('all');
  const [sortBy, setSortBy] = useState<'price' | 'performance' | 'days'>('days');
  const [selectedListing, setSelectedListing] = useState<ShadowListing | null>(null);

  const filteredListings = listings.filter(listing => {
    if (filter === 'profitable') return listing.performance.totalReturn > 0;
    if (filter === 'cheap') return listing.price < 0.05;
    return true;
  }).sort((a, b) => {
    switch (sortBy) {
      case 'price':
        return a.price - b.price;
      case 'performance':
        return b.performance.totalReturn - a.performance.totalReturn;
      default:
        return b.daysRemaining - a.daysRemaining;
    }
  });

  const handleBuy = async (listing: ShadowListing) => {
    if (!isConnected) {
      showNotification({
        type: "error",
        title: "Connect Wallet",
        message: "Please connect your wallet to buy shadows",
      });
      return;
    }

    setSelectedListing(listing);
    
    // In production, initiate purchase transaction
    setTimeout(() => {
      showNotification({
        type: "info",
        title: "Purchase Initiated",
        message: `Buying Shadow ${listing.tokenId} for ${listing.price} ETH`,
      });
      setSelectedListing(null);
    }, 2000);
  };

  const discount = (listing: ShadowListing) => {
    return Math.round((1 - listing.price / listing.originalPrice) * 100);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h3 className="text-xl font-semibold mb-2">Shadow Marketplace</h3>
        <p className="text-stone-400">
          Buy existing Shadow NFTs with remaining subscription time at discounted prices
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-stone-800/50 p-4">
          <div className="flex items-center gap-2 text-stone-400 mb-1">
            <Shield className="h-4 w-4" />
            <span className="text-sm">Listed Shadows</span>
          </div>
          <p className="text-2xl font-bold">{listings.length}</p>
        </Card>
        
        <Card className="bg-stone-800/50 p-4">
          <div className="flex items-center gap-2 text-stone-400 mb-1">
            <DollarSign className="h-4 w-4" />
            <span className="text-sm">Avg. Price</span>
          </div>
          <p className="text-2xl font-bold">
            {(listings.reduce((sum, l) => sum + l.price, 0) / listings.length).toFixed(3)} ETH
          </p>
        </Card>
        
        <Card className="bg-stone-800/50 p-4">
          <div className="flex items-center gap-2 text-stone-400 mb-1">
            <TrendingUp className="h-4 w-4" />
            <span className="text-sm">Avg. Discount</span>
          </div>
          <p className="text-2xl font-bold text-green-500">
            -{Math.round(listings.reduce((sum, l) => sum + discount(l), 0) / listings.length)}%
          </p>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-4 items-center justify-between">
        <div className="flex gap-2">
          <button
            onClick={() => setFilter('all')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              filter === 'all' 
                ? 'bg-stone-700 text-white' 
                : 'bg-stone-800/50 text-stone-400 hover:bg-stone-700/50'
            }`}
          >
            All
          </button>
          <button
            onClick={() => setFilter('profitable')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              filter === 'profitable' 
                ? 'bg-green-900/50 text-green-400' 
                : 'bg-stone-800/50 text-stone-400 hover:bg-stone-700/50'
            }`}
          >
            Profitable
          </button>
          <button
            onClick={() => setFilter('cheap')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              filter === 'cheap' 
                ? 'bg-blue-900/50 text-blue-400' 
                : 'bg-stone-800/50 text-stone-400 hover:bg-stone-700/50'
            }`}
          >
            Under 0.05 ETH
          </button>
        </div>

        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value as any)}
          className="px-4 py-2 rounded-lg bg-stone-800 text-stone-200 text-sm"
        >
          <option value="days">Most Days Left</option>
          <option value="price">Lowest Price</option>
          <option value="performance">Best Performance</option>
        </select>
      </div>

      {/* Listings Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredListings.map((listing) => (
          <Card key={listing.id} className="bg-stone-800/50 overflow-hidden">
            <div className="relative">
              <img 
                src={listing.imageUrl} 
                alt={`Shadow ${listing.tokenId}`}
                className="w-full h-40 object-cover"
              />
              <div className="absolute top-2 right-2">
                <Badge variant="secondary" className="bg-black/80 backdrop-blur-sm">
                  {listing.tokenId}
                </Badge>
              </div>
              <div className="absolute top-2 left-2">
                <Badge variant="default" className="bg-green-600/90 backdrop-blur-sm">
                  -{discount(listing)}%
                </Badge>
              </div>
            </div>

            <div className="p-4 space-y-3">
              {/* Price */}
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-2xl font-bold">{listing.price.toFixed(3)} ETH</p>
                  <p className="text-sm text-stone-500 line-through">{listing.originalPrice} ETH</p>
                </div>
                <div className="text-right">
                  <div className="flex items-center gap-1 text-yellow-500">
                    <Clock className="h-4 w-4" />
                    <span className="font-semibold">{listing.daysRemaining}d</span>
                  </div>
                  <p className="text-xs text-stone-400">remaining</p>
                </div>
              </div>

              {/* Performance */}
              <div className="grid grid-cols-3 gap-2 text-center">
                <div>
                  <p className={`text-sm font-semibold ${
                    listing.performance.totalReturn >= 0 ? 'text-green-500' : 'text-red-500'
                  }`}>
                    {listing.performance.totalReturn >= 0 ? '+' : ''}{listing.performance.totalReturn.toFixed(1)}%
                  </p>
                  <p className="text-xs text-stone-500">Return</p>
                </div>
                <div>
                  <p className="text-sm font-semibold">{listing.performance.winRate.toFixed(0)}%</p>
                  <p className="text-xs text-stone-500">Win Rate</p>
                </div>
                <div>
                  <p className="text-sm font-semibold">{listing.performance.totalTrades}</p>
                  <p className="text-xs text-stone-500">Trades</p>
                </div>
              </div>

              {/* Seller */}
              <div className="flex items-center justify-between text-sm">
                <span className="text-stone-400">Seller:</span>
                <span>
                  {listing.seller.ens || `${listing.seller.address.slice(0, 6)}...${listing.seller.address.slice(-4)}`}
                </span>
              </div>

              {/* Listed Time */}
              <div className="flex items-center gap-1 text-xs text-stone-500">
                <Calendar className="h-3 w-3" />
                <span>Listed {formatDistanceToNow(listing.listedAt, { addSuffix: true })}</span>
              </div>

              {/* Buy Button */}
              <Button
                onClick={() => handleBuy(listing)}
                className="w-full bg-gradient-to-r from-purple-600 to-purple-700"
                disabled={selectedListing?.id === listing.id}
              >
                {selectedListing?.id === listing.id ? (
                  'Processing...'
                ) : (
                  <>
                    <ShoppingCart className="h-4 w-4 mr-2" />
                    Buy Shadow
                  </>
                )}
              </Button>
            </div>
          </Card>
        ))}
      </div>

      {/* Empty State */}
      {filteredListings.length === 0 && (
        <Card className="bg-stone-800/50 p-8 text-center">
          <p className="text-stone-400">No shadows available matching your criteria</p>
        </Card>
      )}
    </div>
  );
}