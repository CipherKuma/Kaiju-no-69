"use client";

import { useState } from "react";
import { Kaiju } from "@/types/models";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ExternalLink, Copy, CheckCircle, DollarSign, Tag, TrendingUp, Package, Image as ImageIcon } from "lucide-react";
import { useAccount } from "wagmi";
import { useNotifications } from "@/components/ui/notification";

interface KaijuNFTManagementProps {
  kaiju: Kaiju;
}

export function KaijuNFTManagement({ kaiju }: KaijuNFTManagementProps) {
  const { address, isConnected } = useAccount();
  const { showNotification } = useNotifications();
  const [listingPrice, setListingPrice] = useState('');
  const [isListing, setIsListing] = useState(false);
  
  // Mock NFT data
  const nftData = {
    contractAddress: '0x1234567890abcdef1234567890abcdef12345678',
    tokenId: '69',
    totalSupply: 10000,
    holders: 3427,
    floorPrice: 0.5,
    volume24h: 125.4,
    listed: 234,
    royalty: 2.5,
  };

  const handleCopyAddress = () => {
    navigator.clipboard.writeText(nftData.contractAddress);
    showNotification({
      type: "success",
      title: "Copied!",
      message: "Contract address copied to clipboard",
    });
  };

  const handleListNFT = async () => {
    if (!listingPrice || parseFloat(listingPrice) <= 0) {
      showNotification({
        type: "error",
        title: "Invalid price",
        message: "Please enter a valid listing price",
      });
      return;
    }

    setIsListing(true);
    
    // Simulate listing process
    setTimeout(() => {
      showNotification({
        type: "success",
        title: "NFT Listed!",
        message: `Your Kaiju NFT has been listed for ${listingPrice} ETH`,
      });
      setIsListing(false);
      setListingPrice('');
    }, 2000);
  };

  return (
    <div className="space-y-6">
      {/* NFT Overview */}
      <Card className="bg-stone-800/50 p-6">
        <div className="flex items-start justify-between">
          <div className="flex gap-6">
            <div className="w-32 h-32 rounded-lg overflow-hidden bg-stone-700">
              <img 
                src={kaiju.imageUrl} 
                alt={kaiju.name}
                className="w-full h-full object-cover"
              />
            </div>
            
            <div>
              <h3 className="text-xl font-bold mb-2">{kaiju.name} NFT Collection</h3>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-stone-400">Contract:</span>
                  <code className="text-xs bg-stone-900 px-2 py-1 rounded">
                    {nftData.contractAddress.slice(0, 6)}...{nftData.contractAddress.slice(-4)}
                  </code>
                  <button
                    onClick={handleCopyAddress}
                    className="p-1 hover:bg-stone-700 rounded transition-colors"
                  >
                    <Copy className="h-3 w-3" />
                  </button>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-stone-400">Token ID:</span>
                  <span className="font-mono">#{nftData.tokenId}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-stone-400">Royalty:</span>
                  <span>{nftData.royalty}%</span>
                </div>
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => window.open(`https://opensea.io/collection/kaiju-no-69`, '_blank')}
              className="flex items-center gap-2"
            >
              <ExternalLink className="h-4 w-4" />
              View on OpenSea
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => window.open(`https://blur.io/collection/kaiju-no-69`, '_blank')}
              className="flex items-center gap-2"
            >
              <ExternalLink className="h-4 w-4" />
              View on Blur
            </Button>
          </div>
        </div>
      </Card>

      {/* Market Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-stone-800/50 p-4">
          <div className="flex items-center gap-2 text-stone-400 mb-1">
            <DollarSign className="h-4 w-4" />
            <span className="text-sm">Floor Price</span>
          </div>
          <p className="text-2xl font-bold">{nftData.floorPrice} ETH</p>
          <p className="text-xs text-green-500">+12.5%</p>
        </Card>

        <Card className="bg-stone-800/50 p-4">
          <div className="flex items-center gap-2 text-stone-400 mb-1">
            <TrendingUp className="h-4 w-4" />
            <span className="text-sm">24h Volume</span>
          </div>
          <p className="text-2xl font-bold">{nftData.volume24h} ETH</p>
          <p className="text-xs text-green-500">+45.2%</p>
        </Card>

        <Card className="bg-stone-800/50 p-4">
          <div className="flex items-center gap-2 text-stone-400 mb-1">
            <Package className="h-4 w-4" />
            <span className="text-sm">Listed</span>
          </div>
          <p className="text-2xl font-bold">{nftData.listed}</p>
          <p className="text-xs text-stone-400">{((nftData.listed / nftData.totalSupply) * 100).toFixed(1)}%</p>
        </Card>

        <Card className="bg-stone-800/50 p-4">
          <div className="flex items-center gap-2 text-stone-400 mb-1">
            <Tag className="h-4 w-4" />
            <span className="text-sm">Holders</span>
          </div>
          <p className="text-2xl font-bold">{nftData.holders.toLocaleString()}</p>
          <p className="text-xs text-stone-400">/ {nftData.totalSupply.toLocaleString()}</p>
        </Card>
      </div>

      {/* Management Tabs */}
      <Tabs defaultValue="list" className="w-full">
        <TabsList className="grid w-full grid-cols-3 bg-stone-800">
          <TabsTrigger value="list">List NFT</TabsTrigger>
          <TabsTrigger value="offers">Offers</TabsTrigger>
          <TabsTrigger value="activity">Activity</TabsTrigger>
        </TabsList>

        <TabsContent value="list" className="mt-6">
          <Card className="bg-stone-800/50 p-6">
            <h3 className="text-lg font-semibold mb-4">List Your Kaiju NFT</h3>
            
            {!isConnected ? (
              <div className="text-center py-8">
                <p className="text-stone-400">Connect your wallet to list your NFT</p>
              </div>
            ) : (
              <div className="space-y-4">
                <div>
                  <Label htmlFor="price">Listing Price (ETH)</Label>
                  <div className="flex gap-2 mt-2">
                    <Input
                      id="price"
                      type="number"
                      step="0.01"
                      placeholder="0.00"
                      value={listingPrice}
                      onChange={(e) => setListingPrice(e.target.value)}
                      className="flex-1"
                    />
                    <Button
                      onClick={() => setListingPrice(nftData.floorPrice.toString())}
                      variant="outline"
                      size="sm"
                    >
                      Floor
                    </Button>
                    <Button
                      onClick={() => setListingPrice((nftData.floorPrice * 0.9).toFixed(2))}
                      variant="outline"
                      size="sm"
                    >
                      -10%
                    </Button>
                  </div>
                </div>

                <div className="bg-stone-900/50 rounded-lg p-4 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-stone-400">Listing Price</span>
                    <span>{listingPrice || '0'} ETH</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-stone-400">Platform Fee (2.5%)</span>
                    <span>{(parseFloat(listingPrice || '0') * 0.025).toFixed(4)} ETH</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-stone-400">Creator Royalty ({nftData.royalty}%)</span>
                    <span>{(parseFloat(listingPrice || '0') * nftData.royalty / 100).toFixed(4)} ETH</span>
                  </div>
                  <div className="border-t border-stone-700 pt-2">
                    <div className="flex justify-between font-semibold">
                      <span>You Receive</span>
                      <span>
                        {(parseFloat(listingPrice || '0') * (1 - 0.025 - nftData.royalty / 100)).toFixed(4)} ETH
                      </span>
                    </div>
                  </div>
                </div>

                <Button
                  onClick={handleListNFT}
                  disabled={!listingPrice || isListing}
                  className="w-full bg-gradient-to-r from-purple-600 to-purple-700"
                >
                  {isListing ? 'Listing...' : 'List NFT on OpenSea'}
                </Button>
              </div>
            )}
          </Card>
        </TabsContent>

        <TabsContent value="offers" className="mt-6">
          <Card className="bg-stone-800/50 p-6">
            <h3 className="text-lg font-semibold mb-4">Active Offers</h3>
            <div className="space-y-3">
              {[
                { from: '0xabcd...efgh', amount: 0.45, expires: '2 hours' },
                { from: '0x1234...5678', amount: 0.42, expires: '5 hours' },
                { from: '0x9876...5432', amount: 0.38, expires: '1 day' },
              ].map((offer, i) => (
                <div key={i} className="flex items-center justify-between p-4 bg-stone-900/50 rounded-lg">
                  <div>
                    <p className="font-medium">{offer.amount} ETH</p>
                    <p className="text-sm text-stone-400">From {offer.from}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-stone-400">Expires in {offer.expires}</p>
                    <div className="flex gap-2 mt-2">
                      <Button size="sm" variant="outline">Decline</Button>
                      <Button size="sm" className="bg-green-600 hover:bg-green-700">Accept</Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="activity" className="mt-6">
          <Card className="bg-stone-800/50 p-6">
            <h3 className="text-lg font-semibold mb-4">Recent Activity</h3>
            <div className="space-y-3">
              {[
                { type: 'sale', price: 0.52, from: '0xabcd...efgh', to: '0x1234...5678', time: '2 hours ago' },
                { type: 'listing', price: 0.55, from: '0x9876...5432', time: '5 hours ago' },
                { type: 'sale', price: 0.48, from: '0x5555...6666', to: '0x7777...8888', time: '1 day ago' },
                { type: 'offer', price: 0.45, from: '0x1111...2222', time: '1 day ago' },
              ].map((activity, i) => (
                <div key={i} className="flex items-center justify-between p-4 bg-stone-900/50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${
                      activity.type === 'sale' ? 'bg-green-900/50' : 
                      activity.type === 'listing' ? 'bg-blue-900/50' : 
                      'bg-yellow-900/50'
                    }`}>
                      {activity.type === 'sale' ? <CheckCircle className="h-4 w-4 text-green-500" /> :
                       activity.type === 'listing' ? <Tag className="h-4 w-4 text-blue-500" /> :
                       <DollarSign className="h-4 w-4 text-yellow-500" />}
                    </div>
                    <div>
                      <p className="font-medium capitalize">{activity.type}</p>
                      {activity.type === 'sale' && (
                        <p className="text-sm text-stone-400">{activity.from} → {activity.to}</p>
                      )}
                      {activity.type !== 'sale' && (
                        <p className="text-sm text-stone-400">By {activity.from}</p>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold">{activity.price} ETH</p>
                    <p className="text-sm text-stone-400">{activity.time}</p>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}