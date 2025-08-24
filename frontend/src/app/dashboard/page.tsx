"use client";

import { useState, useEffect } from "react";
import { 
  ShadowCard, 
  PortfolioAggregation, 
  ShadowNFTGallery,
  ManagementPanel,
  EmergencyControls 
} from "@/components/dashboard";
import { StaggerContainer, StaggerItem } from "@/components/ui/animated-components";
import { Shadow, Kaiju, TradeExecution } from "@/types/models";
import { useMyShadows } from "@/hooks/use-shadow";
import { useKaijuList } from "@/hooks/use-kaiju";
import { useTradingFeed } from "@/hooks/use-trading";

export default function DashboardPage() {
  const { data: shadows, isLoading: shadowsLoading } = useMyShadows();
  const { data: kaijuListData } = useKaijuList();
  const kaijus = kaijuListData?.data || [];
  const tradingFeedQuery = useTradingFeed();
  const recentTrades = tradingFeedQuery.data?.pages?.[0]?.data || [];
  const [activeTab, setActiveTab] = useState<"overview" | "gallery" | "manage" | "emergency">("overview");
  
  const handleQuickAction = (action: string, shadowId: string) => {
    switch (action) {
      case "kingdom":
        // Navigate to shadow kingdom interface
        console.log(`Entering kingdom for shadow ${shadowId}`);
        // router.push(`/shadow/${shadowId}/kingdom`);
        break;
      case "view":
        // Show detailed shadow information
        console.log(`Viewing details for shadow ${shadowId}`);
        // setSelectedShadow(shadowId);
        break;
      case "pause":
        // Toggle shadow active state
        console.log(`Toggling pause for shadow ${shadowId}`);
        // Add actual pause/resume logic here
        break;
      case "policy":
        // Open policy adjustment modal
        console.log(`Adjusting policy for shadow ${shadowId}`);
        setActiveTab("manage");
        break;
      case "self-destruct":
        // Show confirmation and execute self-destruct
        if (window.confirm("Are you sure you want to self-destruct this shadow? This action cannot be undone.")) {
          console.log(`Self-destructing shadow ${shadowId}`);
          // Add actual self-destruct logic here
        }
        break;
      default:
        console.log(`Unknown action: ${action} for shadow ${shadowId}`);
    }
  };
  
  const getKaijuById = (kaijuId: string) => {
    return kaijus.find(k => k.id === kaijuId);
  };
  
  const getTradesForShadow = (shadow: Shadow) => {
    return recentTrades.filter(trade => trade.kaijuId === shadow.kaijuId);
  };
  
  if (shadowsLoading) {
    return (
      <div className="container mx-auto py-8 flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-gray-400">Loading your shadows...</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="container mx-auto py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2">Multi-Shadow Dashboard</h1>
        <p className="text-gray-400">Manage and track your shadow portfolio</p>
      </div>
      
      {/* Tab Navigation */}
      <div className="flex gap-2 mb-8">
        <button
          onClick={() => setActiveTab("overview")}
          className={`px-4 py-2 rounded-lg transition-colors ${
            activeTab === "overview"
              ? "bg-primary text-white"
              : "bg-stone-800 hover:bg-gray-700 text-gray-300"
          }`}
        >
          Overview
        </button>
        <button
          onClick={() => setActiveTab("gallery")}
          className={`px-4 py-2 rounded-lg transition-colors ${
            activeTab === "gallery"
              ? "bg-primary text-white"
              : "bg-stone-800 hover:bg-gray-700 text-gray-300"
          }`}
        >
          NFT Gallery
        </button>
        <button
          onClick={() => setActiveTab("manage")}
          className={`px-4 py-2 rounded-lg transition-colors ${
            activeTab === "manage"
              ? "bg-primary text-white"
              : "bg-stone-800 hover:bg-gray-700 text-gray-300"
          }`}
        >
          Manage
        </button>
        <button
          onClick={() => setActiveTab("emergency")}
          className={`px-4 py-2 rounded-lg transition-colors ${
            activeTab === "emergency"
              ? "bg-red-600 text-white"
              : "bg-stone-800 hover:bg-gray-700 text-gray-300"
          }`}
        >
          Emergency
        </button>
      </div>
      
      {/* Content */}
      {activeTab === "overview" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Portfolio Aggregation - Full Width on Large Screens */}
          <div className="lg:col-span-3">
            <PortfolioAggregation shadows={shadows || []} kaijus={kaijus} />
          </div>
          
          {/* Active Shadow Cards */}
          <div className="lg:col-span-3">
            <h2 className="text-2xl font-semibold mb-4">Active Shadows</h2>
            <StaggerContainer className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {shadows?.map((shadow) => {
                const kaiju = getKaijuById(shadow.kaijuId);
                if (!kaiju) return null;
                
                return (
                  <StaggerItem key={shadow.nftId}>
                    <ShadowCard
                      shadow={shadow}
                      kaiju={kaiju}
                      recentTrades={getTradesForShadow(shadow)}
                      onQuickAction={handleQuickAction}
                    />
                  </StaggerItem>
                );
              })}
            </StaggerContainer>
          </div>
        </div>
      )}
      
      {activeTab === "gallery" && (
        <ShadowNFTGallery
          shadows={shadows || []}
          kaijus={kaijus}
          onSelectShadow={(shadow) => {
            console.log("Selected shadow:", shadow);
          }}
        />
      )}
      
      {activeTab === "manage" && (
        <ManagementPanel
          shadows={shadows || []}
          kaijus={kaijus}
          onUpdatePolicy={(shadowId, policy) => {
            console.log("Update policy:", shadowId, policy);
          }}
          onBatchOperation={(operation, shadowIds) => {
            console.log("Batch operation:", operation, shadowIds);
          }}
          onExportData={() => {
            console.log("Export data");
          }}
        />
      )}
      
      {activeTab === "emergency" && (
        <EmergencyControls
          shadows={shadows || []}
          kaijus={kaijus}
          onEmergencyStopAll={() => {
            console.log("Emergency stop all");
          }}
          onToggleShadow={(shadowId, active) => {
            console.log("Toggle shadow:", shadowId, active);
          }}
          onSetStopLoss={(shadowId, percentage) => {
            console.log("Set stop loss:", shadowId, percentage);
          }}
        />
      )}
    </div>
  );
}