'use client';

import { useRef, useEffect, useState } from 'react';
import * as PIXI from 'pixi.js';
import { PixiApp } from './PixiApp';
import { TerritoryManager } from '@/lib/game/pixi/TerritoryManager';
import { TradingPostOverlay } from '../TradingPostOverlay';
import { realtimeClient, realtimeEvents, RealtimeEventType } from '@/lib/api/realtime';
import { ChatMessage, TradeExecution, Position } from '@/types/models';

interface KingdomTerritoryViewProps {
  kaijuId: string;
  width?: number;
  height?: number;
  worldWidth?: number;
  worldHeight?: number;
  enableAudio?: boolean;
  enableTouch?: boolean;
  enableParticles?: boolean;
  debugMode?: boolean;
}

export const KingdomTerritoryView: React.FC<KingdomTerritoryViewProps> = ({
  kaijuId,
  width,
  height,
  worldWidth = 2400,
  worldHeight = 1600,
  enableAudio = true,
  enableTouch = true,
  enableParticles = true,
  debugMode = false,
}) => {
  const [screenSize, setScreenSize] = useState({ width: 800, height: 600 });
  
  useEffect(() => {
    const updateScreenSize = () => {
      setScreenSize({
        width: window.innerWidth,
        height: window.innerHeight
      });
    };
    
    updateScreenSize();
    window.addEventListener('resize', updateScreenSize);
    
    return () => window.removeEventListener('resize', updateScreenSize);
  }, []);
  
  const canvasWidth = width || screenSize.width;
  const canvasHeight = height || screenSize.height;
  const territoryManagerRef = useRef<TerritoryManager | null>(null);
  const [gameReady, setGameReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [connectedPlayers, setConnectedPlayers] = useState<Map<string, { position: Position; name: string }>>(new Map());
  const [tradingPostOpen, setTradingPostOpen] = useState(false);
  const [tradingPostData, setTradingPostData] = useState<{
    zoneId: string;
    territoryId: string;
    territoryName: string;
    position: { x: number; y: number };
  } | null>(null);
  
  // UI card visibility states
  const [showTerritoryInfo, setShowTerritoryInfo] = useState(true);
  const [showTradingPerformance, setShowTradingPerformance] = useState(true);
  const [showDailyObjectives, setShowDailyObjectives] = useState(true);
  const [showOnlinePlayers, setShowOnlinePlayers] = useState(true);
  const [showHotkeyGuide, setShowHotkeyGuide] = useState(true);
  const [showMinimap, setShowMinimap] = useState(true);

  const handlePixiReady = async (app: PIXI.Application) => {
    try {
      setLoading(true);
      
      const territoryManager = new TerritoryManager(app, {
        worldWidth,
        worldHeight,
        enableAudio,
        enableTouch,
        enableParticles,
        debugMode,
      });

      territoryManagerRef.current = territoryManager;

      // Set up Trading Post overlay event listener
      territoryManager.on('trading-post-open', (data: {
        zoneId: string;
        territoryId: string;
        territoryName: string;
        position: { x: number; y: number };
      }) => {
        setTradingPostData(data);
        setTradingPostOpen(true);
      });

      await territoryManager.initialize();

      // Create territory with mixed biomes
      await territoryManager.createMixedTerritory(kaijuId);

      // Create the ruling Kaiju
      const kaiju = territoryManager.createKaiju(kaijuId, { 
        x: worldWidth / 2, 
        y: worldHeight / 2 
      });

      if (kaiju) {
        // Clear any existing shadows first to prevent stacking
        territoryManager.clearAllShadows();
        
        // Create many shadow NPCs around the world
        territoryManager.createShadowNPCs(15); // Create 15 shadow NPCs
        
        // Create shadow figures following the Kaiju
        territoryManager.createShadowFigures(kaijuId, 5); // Increase to 5 followers
        
        // Create the user's shadow with distinct appearance
        const userShadow = territoryManager.createUserShadow('user', {
          x: worldWidth / 2 - 100,
          y: worldHeight / 2 - 100
        });

        if (userShadow) {
          // Camera follows user's shadow
          territoryManager.followUserShadow('user');
        }
        
        // Mark the kaiju as the leader
        territoryManager.markKaijuAsLeader(kaijuId);
      }

      // Create interactive zones
      territoryManager.createInteractiveZones([
        { type: 'chat', position: { x: worldWidth / 4, y: worldHeight / 4 } },
        { type: 'trading', position: { x: (worldWidth * 3) / 4, y: worldHeight / 4 } },
        { type: 'statistics', position: { x: worldWidth / 2, y: (worldHeight * 3) / 4 } }
      ]);

      // Start environmental features
      territoryManager.startDayNightCycle();
      // Weather system removed - not needed

      territoryManager.playMusic('game');
      setGameReady(true);
      setLoading(false);

      // Initialize WebSocket connection for real-time updates
      setupRealtimeConnection(kaijuId, territoryManager);
    } catch (err) {
      console.error('Failed to initialize territory:', err);
      setError('Failed to initialize kingdom territory');
      setLoading(false);
    }
  };

  const setupRealtimeConnection = (kaijuId: string, territoryManager: TerritoryManager) => {
    // Connect to WebSocket for this territory
    realtimeClient.connect({
      territoryIds: [kaijuId],
      kaijuIds: [kaijuId],
    });

    // Join the territory room
    realtimeClient.joinTerritory(kaijuId);

    // Set up shadow position update handler
    const unsubscribeShadowPosition = realtimeEvents.onShadowPositionUpdate((data: { shadowId: string; position: Position; playerName?: string }) => {
      territoryManager.updateShadowPosition(data.shadowId, data.position, data.playerName);
      
      // Update connected players state
      if (data.playerName) {
        setConnectedPlayers(prev => {
          const newMap = new Map(prev);
          newMap.set(data.shadowId, { position: data.position, name: data.playerName });
          return newMap;
        });
      }
    });

    // Set up trade execution broadcast handler
    const unsubscribeTradeExecution = realtimeEvents.onTradeExecuted((trade: TradeExecution) => {
      territoryManager.showTradeExecution(trade);
    });

    // Set up territory chat handler
    const unsubscribeTerritoryChat = realtimeEvents.onTerritoryChat((message: ChatMessage) => {
      territoryManager.showChatMessage(message);
    });

    // Set up user join/leave handlers
    const unsubscribeUserJoin = realtimeClient.on(RealtimeEventType.TERRITORY_USER_JOIN, (data: { userId: string; userName: string; shadowId: string; position: Position }) => {
      territoryManager.addPlayerShadow(data.shadowId, data.position, data.userName);
      setConnectedPlayers(prev => {
        const newMap = new Map(prev);
        newMap.set(data.shadowId, { position: data.position, name: data.userName });
        return newMap;
      });
    });

    const unsubscribeUserLeave = realtimeClient.on(RealtimeEventType.TERRITORY_USER_LEAVE, (data: { shadowId: string }) => {
      territoryManager.removePlayerShadow(data.shadowId);
      setConnectedPlayers(prev => {
        const newMap = new Map(prev);
        newMap.delete(data.shadowId);
        return newMap;
      });
    });

    // Store unsubscribe functions for cleanup
    territoryManager.setRealtimeUnsubscribeFunctions([
      unsubscribeShadowPosition,
      unsubscribeTradeExecution,
      unsubscribeTerritoryChat,
      unsubscribeUserJoin,
      unsubscribeUserLeave,
    ]);

    // Send position updates when user shadow moves
    territoryManager.onUserShadowMove((position: Position) => {
      realtimeClient.updateShadowPosition('user', position);
    });
  };

  const getBiomeFromKaijuId = (id: string): 'fire' | 'water' | 'earth' | 'air' => {
    // Simple mapping based on last digit or character of ID
    const lastChar = id.slice(-1);
    const biomes: Array<'fire' | 'water' | 'earth' | 'air'> = ['fire', 'water', 'earth', 'air'];
    
    // If it's a number, use it directly
    if (!isNaN(Number(lastChar))) {
      return biomes[Number(lastChar) % 4];
    }
    
    // Otherwise use character code
    const hash = lastChar.charCodeAt(0);
    return biomes[hash % 4];
  };

  useEffect(() => {
    return () => {
      if (territoryManagerRef.current) {
        territoryManagerRef.current.destroy();
      }
      // Clean up WebSocket connection
      realtimeClient.leaveTerritory(kaijuId);
      realtimeClient.disconnect();
    };
  }, [kaijuId]);

  const handleToggleMinimap = () => {
    if (territoryManagerRef.current) {
      territoryManagerRef.current.toggleMinimap();
    }
  };

  const handleToggleStats = () => {
    if (territoryManagerRef.current) {
      territoryManagerRef.current.toggleDebugStats();
    }
  };

  if (error) {
    return (
      <div className="flex items-center justify-center h-full bg-red-100 text-red-700 rounded-lg">
        <div className="text-center">
          <p className="text-lg font-semibold">Error Loading Territory</p>
          <p className="text-sm mt-2">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative w-full h-full bg-gray-900 overflow-hidden flex items-center justify-center">
      <PixiApp
        width={canvasWidth}
        height={canvasHeight}
        backgroundColor={0x1a1a2e}
        onReady={handlePixiReady}
      />
      
      {/* UI Toggle Buttons */}
      {gameReady && (
        <>
          <div className="absolute top-4 left-1/2 transform -translate-x-1/2 flex gap-2">
            <button
              onClick={() => setShowTerritoryInfo(!showTerritoryInfo)}
              className={`px-2 py-1 text-xs rounded ${showTerritoryInfo ? 'bg-blue-600/80' : 'bg-gray-600/80'} text-white hover:bg-blue-700/80`}
            >
              Info
            </button>
            <button
              onClick={() => setShowTradingPerformance(!showTradingPerformance)}
              className={`px-2 py-1 text-xs rounded ${showTradingPerformance ? 'bg-green-600/80' : 'bg-gray-600/80'} text-white hover:bg-green-700/80`}
            >
              Performance
            </button>
            <button
              onClick={() => setShowDailyObjectives(!showDailyObjectives)}
              className={`px-2 py-1 text-xs rounded ${showDailyObjectives ? 'bg-yellow-600/80' : 'bg-gray-600/80'} text-white hover:bg-yellow-700/80`}
            >
              Quests
            </button>
            <button
              onClick={() => setShowOnlinePlayers(!showOnlinePlayers)}
              className={`px-2 py-1 text-xs rounded ${showOnlinePlayers ? 'bg-purple-600/80' : 'bg-gray-600/80'} text-white hover:bg-purple-700/80`}
            >
              Players
            </button>
            <button
              onClick={() => setShowHotkeyGuide(!showHotkeyGuide)}
              className={`px-2 py-1 text-xs rounded ${showHotkeyGuide ? 'bg-orange-600/80' : 'bg-gray-600/80'} text-white hover:bg-orange-700/80`}
            >
              Controls
            </button>
            <button
              onClick={() => setShowMinimap(!showMinimap)}
              className={`px-2 py-1 text-xs rounded ${showMinimap ? 'bg-indigo-600/80' : 'bg-gray-600/80'} text-white hover:bg-indigo-700/80`}
            >
              Map
            </button>
          </div>
          
          {/* Territory Info */}
          {showTerritoryInfo && (
            <div className="absolute top-4 left-4 bg-black/60 text-white p-4 rounded backdrop-blur-sm">
              <h3 className="text-lg font-bold mb-2">Kingdom Territory</h3>
              <p className="text-sm text-gray-300">Kaiju ID: {kaijuId}</p>
              <p className="text-sm text-gray-300">World: Mixed Terrain</p>
              <p className="text-sm text-blue-400">Players Online: {connectedPlayers.size}</p>
              <div className="mt-2 text-xs text-gray-400">
                <p>Controls:</p>
                <p>• WASD or Arrow Keys to move</p>
                <p>• Click to move to location</p>
              </div>
            </div>
          )}

          {/* Game Stats HUD */}
          {showTradingPerformance && (
            <div className="absolute top-4 right-4 bg-black/60 text-white p-3 rounded backdrop-blur-sm">
              <h4 className="text-sm font-semibold mb-2">Trading Performance</h4>
              <div className="space-y-1 text-xs">
                <div className="flex justify-between">
                  <span className="text-gray-400">PnL Today:</span>
                  <span className="text-green-400">+12.5%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Win Rate:</span>
                  <span className="text-blue-400">72%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Trades:</span>
                  <span className="text-gray-200">143</span>
                </div>
              </div>
            </div>
          )}
          
          {/* Connected Players List */}
          {showOnlinePlayers && connectedPlayers.size > 0 && (
            <div className="absolute bottom-20 left-4 bg-black/60 text-white p-3 rounded backdrop-blur-sm max-w-48">
              <h4 className="text-sm font-semibold mb-2">Online Players</h4>
              <div className="space-y-1 max-h-32 overflow-y-auto">
                {Array.from(connectedPlayers.entries()).map(([shadowId, player]) => (
                  <div key={shadowId} className="text-xs text-gray-300 flex items-center">
                    <div className="w-2 h-2 bg-green-400 rounded-full mr-2"></div>
                    {player.name || `Shadow ${shadowId.slice(-3)}`}
                  </div>
                ))}
              </div>
            </div>
          )}
          
          {/* Quest/Objective Tracker */}
          {showDailyObjectives && (
            <div className="absolute top-32 right-4 bg-black/60 text-white p-3 rounded backdrop-blur-sm max-w-64">
              <h4 className="text-sm font-semibold mb-2 text-yellow-400">Daily Objectives</h4>
              <div className="space-y-2 text-xs">
                <div className="flex items-start">
                  <span className="text-green-400 mr-2">✓</span>
                  <span className="text-gray-300 line-through">Complete 10 trades</span>
                </div>
                <div className="flex items-start">
                  <span className="text-gray-500 mr-2">○</span>
                  <span className="text-gray-200">Visit 3 Trading Posts (1/3)</span>
                </div>
                <div className="flex items-start">
                  <span className="text-gray-500 mr-2">○</span>
                  <span className="text-gray-200">Chat with 5 players (2/5)</span>
                </div>
              </div>
            </div>
          )}
          
          {/* Hotkey Guide */}
          {showHotkeyGuide && (
            <div className="absolute bottom-4 left-4 bg-black/40 text-white p-2 rounded backdrop-blur-sm text-xs">
              <div className="grid grid-cols-2 gap-x-4 gap-y-1">
                <div><span className="text-gray-400">Move:</span> WASD</div>
                <div><span className="text-gray-400">Chat:</span> Enter</div>
                <div><span className="text-gray-400">Map:</span> M</div>
                <div><span className="text-gray-400">Trade:</span> T</div>
              </div>
            </div>
          )}
          
          {/* Minimap */}
          {showMinimap && (
            <div className="absolute bottom-20 right-4 bg-black/60 p-2 rounded backdrop-blur-sm">
              <div className="w-32 h-32 bg-gray-800 rounded relative overflow-hidden">
                <div className="absolute inset-0 opacity-50">
                  {/* Mixed biome background */}
                  <div className="w-full h-full grid grid-cols-2 grid-rows-2">
                    <div className="bg-orange-600" /> {/* Fire */}
                    <div className="bg-blue-600" />   {/* Water */}
                    <div className="bg-green-600" />  {/* Earth */}
                    <div className="bg-gray-400" />   {/* Air */}
                  </div>
                </div>
                {/* Player position indicator */}
                <div className="absolute w-2 h-2 bg-green-400 rounded-full animate-pulse" 
                     style={{ 
                       left: '50%', 
                       top: '50%',
                       transform: 'translate(-50%, -50%)'
                     }} />
                {/* Other players */}
                {connectedPlayers.size > 0 && Array.from(connectedPlayers.entries()).slice(0, 5).map(([id], i) => (
                  <div key={id} 
                       className="absolute w-1 h-1 bg-blue-400 rounded-full"
                       style={{ 
                         left: `${30 + i * 15}%`, 
                         top: `${30 + i * 10}%` 
                       }} />
                ))}
                {/* Leader Kaiju position */}
                <div className="absolute w-3 h-3 bg-yellow-400 rounded-full border border-yellow-600" 
                     style={{ 
                       left: '50%', 
                       top: '40%',
                       transform: 'translateX(-50%)'
                     }} />
              </div>
              <div className="text-xs text-gray-400 text-center mt-1">Minimap</div>
            </div>
          )}
          
          {/* Performance Monitor */}
          <div className="absolute bottom-4 right-4 bg-black/60 text-white p-2 rounded backdrop-blur-sm text-xs">
            <div id="fps-counter">FPS: --</div>
          </div>
        </>
      )}

      {loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/70 backdrop-blur-sm">
          <div className="text-center text-white">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
            <div className="text-lg">Loading Kingdom Territory...</div>
            <div className="text-sm text-gray-400 mt-2">Generating mixed terrain world</div>
          </div>
        </div>
      )}

      {/* Trading Post Overlay */}
      {tradingPostOpen && tradingPostData && (
        <TradingPostOverlay
          isOpen={tradingPostOpen}
          onClose={() => {
            setTradingPostOpen(false);
            setTradingPostData(null);
          }}
          territoryId={tradingPostData.territoryId}
          territoryName={tradingPostData.territoryName}
        />
      )}
    </div>
  );
};