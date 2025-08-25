"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { KaijuCard } from "./kaiju-card";
import { KaijuQuickViewModal } from "./kaiju-quick-view-modal";
import { KaijuComparisonDialog } from "./kaiju-comparison-dialog";
import { KaijuSacrificeDialog } from "./kaiju-sacrifice-dialog";
import { Kaiju } from "@/types/models";
import { 
  Search, 
  Filter, 
  TrendingUp, 
  Users, 
  Activity,
  Star,
  StarOff
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { StaggerContainer, StaggerItem } from "@/components/ui/animated-components";
import { useDebounce } from "@/hooks/use-debounce";

interface KaijuDiscoveryHubProps {
  initialKaijus?: Kaiju[];
}

type SortOption = "performance" | "popularity" | "shadows" | "entryFee";
type TradingStyle = "all" | "aggressive" | "conservative" | "balanced" | "arbitrage";

export function KaijuDiscoveryHub({ initialKaijus = [] }: KaijuDiscoveryHubProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  // State
  const [kaijus, _setKaijus] = useState<Kaiju[]>(initialKaijus);
  const [_loading, _setLoading] = useState(false);
  const [selectedKaiju, setSelectedKaiju] = useState<Kaiju | null>(null);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [compareList, setCompareList] = useState<string[]>([]);
  const [showComparisonDialog, setShowComparisonDialog] = useState(false);
  const [sacrificeKaiju, setSacrificeKaiju] = useState<Kaiju | null>(null);
  
  // Filter states
  const [searchQuery, setSearchQuery] = useState(searchParams.get("q") || "");
  const [sortBy, setSortBy] = useState<SortOption>(
    (searchParams.get("sort") as SortOption) || "performance"
  );
  const [onlineOnly, setOnlineOnly] = useState(
    searchParams.get("online") === "true"
  );
  const [tradingStyle, setTradingStyle] = useState<TradingStyle>(
    (searchParams.get("style") as TradingStyle) || "all"
  );
  const [profitabilityRange, setProfitabilityRange] = useState<[number, number]>([
    Number(searchParams.get("minProfit") || -50),
    Number(searchParams.get("maxProfit") || 100)
  ]);
  const [popularityRange, setPopularityRange] = useState<[number, number]>([
    Number(searchParams.get("minPop") || 0),
    Number(searchParams.get("maxPop") || 1000)
  ]);

  // Debounced search
  const debouncedSearch = useDebounce(searchQuery, 300);

  // Update URL with filter parameters
  const updateURL = useCallback(() => {
    const params = new URLSearchParams();
    
    if (searchQuery) params.set("q", searchQuery);
    if (sortBy !== "performance") params.set("sort", sortBy);
    if (onlineOnly) params.set("online", "true");
    if (tradingStyle !== "all") params.set("style", tradingStyle);
    if (profitabilityRange[0] !== -50) params.set("minProfit", profitabilityRange[0].toString());
    if (profitabilityRange[1] !== 100) params.set("maxProfit", profitabilityRange[1].toString());
    if (popularityRange[0] !== 0) params.set("minPop", popularityRange[0].toString());
    if (popularityRange[1] !== 1000) params.set("maxPop", popularityRange[1].toString());
    
    const queryString = params.toString();
    router.push(`/marketplace${queryString ? `?${queryString}` : ""}`, { scroll: false });
  }, [searchQuery, sortBy, onlineOnly, tradingStyle, profitabilityRange, popularityRange, router]);

  // Filter and sort kaijus
  const filteredAndSortedKaijus = useMemo(() => {
    let filtered = [...kaijus];
    
    // Apply search filter
    if (debouncedSearch) {
      filtered = filtered.filter(kaiju =>
        kaiju.name.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
        kaiju.traderTitle?.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
        kaiju.description?.toLowerCase().includes(debouncedSearch.toLowerCase())
      );
    }
    
    // Apply online filter
    if (onlineOnly) {
      filtered = filtered.filter(kaiju => kaiju.isOnline);
    }
    
    // Apply trading style filter
    if (tradingStyle !== "all") {
      filtered = filtered.filter(kaiju => kaiju.tradingStyle === tradingStyle);
    }
    
    // Apply profitability filter
    filtered = filtered.filter(kaiju =>
      kaiju.performance.last30Days >= profitabilityRange[0] &&
      kaiju.performance.last30Days <= profitabilityRange[1]
    );
    
    // Apply popularity filter
    filtered = filtered.filter(kaiju =>
      (kaiju.popularity || 0) >= popularityRange[0] &&
      (kaiju.popularity || 0) <= popularityRange[1]
    );
    
    // Sort
    filtered.sort((a, b) => {
      switch (sortBy) {
        case "performance":
          return b.performance.last30Days - a.performance.last30Days;
        case "popularity":
          return (b.popularity || 0) - (a.popularity || 0);
        case "shadows":
          return b.shadows.length - a.shadows.length;
        case "entryFee":
          return a.entryFee - b.entryFee;
        default:
          return 0;
      }
    });
    
    return filtered;
  }, [kaijus, debouncedSearch, onlineOnly, tradingStyle, profitabilityRange, popularityRange, sortBy]);

  // Update URL when filters change
  useEffect(() => {
    updateURL();
  }, [updateURL]);

  // Load favorites from localStorage
  useEffect(() => {
    const storedFavorites = localStorage.getItem("kaiju-favorites");
    if (storedFavorites) {
      setFavorites(JSON.parse(storedFavorites));
    }
  }, []);

  // Save favorites to localStorage
  useEffect(() => {
    localStorage.setItem("kaiju-favorites", JSON.stringify(favorites));
  }, [favorites]);

  const toggleFavorite = (kaijuId: string) => {
    setFavorites(prev =>
      prev.includes(kaijuId)
        ? prev.filter(id => id !== kaijuId)
        : [...prev, kaijuId]
    );
  };

  const toggleCompare = (kaijuId: string) => {
    setCompareList(prev => {
      if (prev.includes(kaijuId)) {
        return prev.filter(id => id !== kaijuId);
      }
      if (prev.length >= 3) {
        // Max 3 kaijus for comparison
        return [...prev.slice(1), kaijuId];
      }
      return [...prev, kaijuId];
    });
  };

  const handleBecomeShadow = (kaiju: Kaiju) => {
    setSacrificeKaiju(kaiju);
  };

  const handleViewDen = (kaiju: Kaiju) => {
    router.push(`/den/${kaiju.id}`);
  };

  const handleCompare = () => {
    if (compareList.length >= 2) {
      setShowComparisonDialog(true);
    }
  };

  const selectedKaijusForComparison = useMemo(() => {
    return kaijus.filter(k => compareList.includes(k.id));
  }, [kaijus, compareList]);

  return (
    <div className="container mx-auto py-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4">
        <h1 className="font-heading text-4xl font-bold text-stone-400">
          Kaiju Discovery Hub
        </h1>
        <p className="text-muted-foreground text-lg">
          Find and follow the most powerful Kaiju traders in the metaverse
        </p>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search Kaiju by name, title, or description..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="input-ancient w-full pl-10"
          />
        </div>
        
        <Select value={sortBy} onValueChange={(value) => setSortBy(value as SortOption)}>
          <SelectTrigger className="w-full sm:w-[180px]">
            <SelectValue placeholder="Sort by..." />
          </SelectTrigger>
          <SelectContent className="bg-stone-800">
            <SelectItem value="performance">
              <div className="flex items-center gap-2 text-stone-200">
                <TrendingUp className="h-4 w-4" />
                Performance
              </div>
            </SelectItem>
            <SelectItem value="popularity">
              <div className="flex items-center gap-2 text-stone-200">
                <Star className="h-4 w-4 text-stone-200" />
                Popularity
              </div>
            </SelectItem>
            <SelectItem value="shadows">
              <div className="flex items-center gap-2 text-stone-200">
                <Users className="h-4 w-4 text-stone-200" />
                Shadow Count
              </div>
            </SelectItem>
            <SelectItem value="entryFee">
              <div className="flex items-center gap-2 text-stone-200">
                <Activity className="h-4 w-4 text-stone-200" />
                Entry Fee
              </div>
            </SelectItem>
          </SelectContent>
        </Select>

        <Sheet>
          <SheetTrigger asChild>
            <button className="btn-ancient py-2 px-2 flex items-center justify-center">
              <Filter className="h-4 w-4" />
            </button>
          </SheetTrigger>
          <SheetContent className="bg-stone-800 text-white p-4">
            <SheetHeader>
              <SheetTitle className="font-bold text-stone-200">Advanced Filters</SheetTitle>
              <SheetDescription className="text-stone-400">
                Fine-tune your search to find the perfect Kaiju
              </SheetDescription>
            </SheetHeader>
            
            <div className="mt-6 space-y-6">
              {/* Online Only */}
              <div className="flex items-center justify-between">
                <Label htmlFor="online-only">Online Only</Label>
                <Switch
                  id="online-only"
                  checked={onlineOnly}
                  onCheckedChange={setOnlineOnly}
                />
              </div>

              {/* Trading Style */}
              <div className="space-y-2">
                <Label>Trading Style</Label>
                <Select value={tradingStyle} onValueChange={(value) => setTradingStyle(value as TradingStyle)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Styles</SelectItem>
                    <SelectItem value="aggressive">Aggressive</SelectItem>
                    <SelectItem value="conservative">Conservative</SelectItem>
                    <SelectItem value="balanced">Balanced</SelectItem>
                    <SelectItem value="arbitrage">Arbitrage</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Profitability Range */}
              <div className="space-y-2">
                <Label>Profitability (30D)</Label>
                <div className="px-2">
                  <Slider
                    value={profitabilityRange}
                    onValueChange={(value) => setProfitabilityRange([value[0], value[1]])}
                    min={-50}
                    max={100}
                    step={5}
                    className="mt-2"
                  />
                  <div className="flex justify-between text-sm text-muted-foreground mt-1">
                    <span>{profitabilityRange[0]}%</span>
                    <span>{profitabilityRange[1]}%</span>
                  </div>
                </div>
              </div>

              {/* Popularity Range */}
              <div className="space-y-2">
                <Label>Popularity Score</Label>
                <div className="px-2">
                  <Slider
                    value={popularityRange}
                    onValueChange={(value) => setPopularityRange([value[0], value[1]])}
                    min={0}
                    max={1000}
                    step={50}
                    className="mt-2"
                  />
                  <div className="flex justify-between text-sm text-muted-foreground mt-1">
                    <span>{popularityRange[0]}</span>
                    <span>{popularityRange[1]}</span>
                  </div>
                </div>
              </div>

              {/* Reset Filters */}
              <button
                className="btn-ancient w-full py-3 px-4"
                onClick={() => {
                  setSearchQuery("");
                  setSortBy("performance");
                  setOnlineOnly(false);
                  setTradingStyle("all");
                  setProfitabilityRange([-50, 100]);
                  setPopularityRange([0, 1000]);
                }}
              >
                Reset Filters
              </button>
            </div>
          </SheetContent>
        </Sheet>
      </div>

      {/* Active Filters */}
      {(onlineOnly || tradingStyle !== "all" || searchQuery) && (
        <div className="flex flex-wrap gap-2">
          {onlineOnly && (
            <Badge variant="secondary" className="gap-1">
              Online Only
              <button
                onClick={() => setOnlineOnly(false)}
                className="ml-1 hover:text-destructive"
              >
                ×
              </button>
            </Badge>
          )}
          {tradingStyle !== "all" && (
            <Badge variant="secondary" className="gap-1">
              {tradingStyle} Trader
              <button
                onClick={() => setTradingStyle("all")}
                className="ml-1 hover:text-destructive"
              >
                ×
              </button>
            </Badge>
          )}
          {searchQuery && (
            <Badge variant="secondary" className="gap-1">
              Search: {searchQuery}
              <button
                onClick={() => setSearchQuery("")}
                className="ml-1 hover:text-destructive"
              >
                ×
              </button>
            </Badge>
          )}
        </div>
      )}

      {/* Compare Instructions */}
      {compareList.length === 1 && (
        <div className="bg-stone-800/50 rounded-lg p-4 border border-stone-700">
          <p className="text-sm text-stone-300">
            Select one more Kaiju to compare (you've selected {kaijus.find(k => k.id === compareList[0])?.name})
          </p>
        </div>
      )}

      {compareList.length >= 2 && (
        <div className="bg-stone-800/50 rounded-lg p-4 border border-stone-700">
          <div className="flex items-center justify-between">
            <p className="text-sm text-stone-300">
              {compareList.length} Kaijus selected for comparison
            </p>
            <button
              className="btn-ancient btn-ancient-shadow py-2 px-6 text-sm"
              onClick={handleCompare}
            >
              Compare Selected
            </button>
          </div>
        </div>
      )}

      {/* Results Count */}
      <div className="text-sm text-muted-foreground">
        Showing {filteredAndSortedKaijus.length} of {kaijus.length} Kaijus
      </div>

      {/* Kaiju Grid */}
      <StaggerContainer>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredAndSortedKaijus.map((kaiju) => (
            <StaggerItem key={kaiju.id} className="bg-stone-800">
              <div className="relative">
                {/* Favorite Button */}
                <button
                  onClick={() => toggleFavorite(kaiju.id)}
                  className="absolute top-2 right-2 z-20 p-2 rounded-full bg-background/80 backdrop-blur-sm hover:bg-background transition-colors"
                >
                  {favorites.includes(kaiju.id) ? (
                    <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                  ) : (
                    <StarOff className="h-4 w-4 text-muted-foreground" />
                  )}
                </button>

                {/* Compare Checkbox */}
                <div className="absolute top-2 left-2 z-20">
                  <label className="flex items-center gap-2 p-2 rounded-full bg-background/80 backdrop-blur-sm hover:bg-background transition-colors cursor-pointer">
                    <input
                      type="checkbox"
                      checked={compareList.includes(kaiju.id)}
                      onChange={() => toggleCompare(kaiju.id)}
                      className="w-4 h-4"
                    />
                  </label>
                </div>

                <KaijuCard
                  kaiju={kaiju}
                  onBecomeShadow={() => handleBecomeShadow(kaiju)}
                  onViewKingdom={() => handleViewDen(kaiju)}
                  onQuickView={() => setSelectedKaiju(kaiju)}
                  isCompareMode={compareList.length > 0}
                  isSelected={compareList.includes(kaiju.id)}
                />
              </div>
            </StaggerItem>
          ))}
        </div>
      </StaggerContainer>

      {/* Empty State */}
      {filteredAndSortedKaijus.length === 0 && (
        <div className="text-center py-12">
          <p className="text-muted-foreground text-lg">
            No Kaijus found matching your criteria
          </p>
          <button
            className="btn-ancient mt-4 py-3 px-6"
            onClick={() => {
              setSearchQuery("");
              setSortBy("performance");
              setOnlineOnly(false);
              setTradingStyle("all");
              setProfitabilityRange([-50, 100]);
              setPopularityRange([0, 1000]);
            }}
          >
            Clear All Filters
          </button>
        </div>
      )}

      {/* Quick View Modal */}
      {selectedKaiju && (
        <KaijuQuickViewModal
          kaiju={selectedKaiju}
          isOpen={!!selectedKaiju}
          onClose={() => setSelectedKaiju(null)}
          onBecomeShadow={() => handleBecomeShadow(selectedKaiju)}
          onViewKingdom={() => handleViewDen(selectedKaiju)}
          isFavorite={favorites.includes(selectedKaiju.id)}
          onToggleFavorite={() => toggleFavorite(selectedKaiju.id)}
        />
      )}

      {/* Comparison Dialog */}
      {showComparisonDialog && selectedKaijusForComparison.length >= 2 && (
        <KaijuComparisonDialog
          kaijus={selectedKaijusForComparison}
          isOpen={showComparisonDialog}
          onClose={() => {
            setShowComparisonDialog(false);
            setCompareList([]);
          }}
        />
      )}

      {/* Sacrifice Dialog */}
      {sacrificeKaiju && (
        <KaijuSacrificeDialog
          kaiju={sacrificeKaiju}
          isOpen={!!sacrificeKaiju}
          onClose={() => setSacrificeKaiju(null)}
        />
      )}
    </div>
  );
}