import { create } from 'zustand';
import { devtools, subscribeWithSelector } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import { logger } from './middleware';
import type { Kaiju, Territory, Position } from './types';

interface GameState {
  // Kaiju Management
  kaijus: Map<string, Kaiju>;
  activeKaijuId: string | null;
  kaijuSpawnPoints: Position[];
  
  // Territory Management
  territories: Map<string, Territory>;
  selectedTerritoryId: string | null;
  contestedTerritories: string[];
  
  // Shadow Positions (global view)
  shadowPositions: Map<string, { shadowId: string; position: Position; userId: string }>;
  
  // Game State
  gamePhase: 'preparation' | 'active' | 'ending' | 'ended';
  currentRound: number;
  turnTimer: number;
  isMyTurn: boolean;
  selectedUnits: string[];
  hoveredUnitId: string | null;
  
  // Camera/View State
  cameraPosition: Position;
  zoomLevel: number;
  
  // Actions - Kaiju
  spawnKaiju: (kaiju: Kaiju) => void;
  updateKaiju: (kaijuId: string, updates: Partial<Kaiju>) => void;
  removeKaiju: (kaijuId: string) => void;
  setActiveKaiju: (kaijuId: string | null) => void;
  moveKaiju: (kaijuId: string, position: Position) => void;
  damageKaiju: (kaijuId: string, damage: number) => void;
  
  // Actions - Territory
  addTerritory: (territory: Territory) => void;
  updateTerritory: (territoryId: string, updates: Partial<Territory>) => void;
  claimTerritory: (territoryId: string, userId: string) => void;
  contestTerritory: (territoryId: string) => void;
  selectTerritory: (territoryId: string | null) => void;
  
  // Actions - Shadow Positions
  updateShadowPosition: (shadowId: string, position: Position, userId: string) => void;
  removeShadowPosition: (shadowId: string) => void;
  
  // Actions - Game State
  setGamePhase: (phase: GameState['gamePhase']) => void;
  nextRound: () => void;
  setTurnTimer: (seconds: number) => void;
  setMyTurn: (isMyTurn: boolean) => void;
  selectUnit: (unitId: string) => void;
  deselectUnit: (unitId: string) => void;
  clearSelection: () => void;
  setHoveredUnit: (unitId: string | null) => void;
  
  // Actions - Camera
  setCameraPosition: (position: Position) => void;
  moveCamera: (delta: Position) => void;
  setZoomLevel: (zoom: number) => void;
  zoomIn: () => void;
  zoomOut: () => void;
  
  // Utility
  reset: () => void;
  loadGameState: (state: Partial<GameState>) => void;
}

const initialState = {
  kaijus: new Map(),
  activeKaijuId: null,
  kaijuSpawnPoints: [],
  territories: new Map(),
  selectedTerritoryId: null,
  contestedTerritories: [],
  shadowPositions: new Map(),
  gamePhase: 'preparation' as const,
  currentRound: 1,
  turnTimer: 0,
  isMyTurn: false,
  selectedUnits: [],
  hoveredUnitId: null,
  cameraPosition: { x: 0, y: 0, z: 0 },
  zoomLevel: 1
};

export const useGameStore = create<GameState>()(
  logger(
    devtools(
      subscribeWithSelector(
        immer((set) => ({
          ...initialState,

          spawnKaiju: (kaiju) => {
            set((state) => {
              state.kaijus.set(kaiju.id, kaiju);
            });
          },

          updateKaiju: (kaijuId, updates) => {
            set((state) => {
              const kaiju = state.kaijus.get(kaijuId);
              if (kaiju) {
                Object.assign(kaiju, updates);
              }
            });
          },

          removeKaiju: (kaijuId) => {
            set((state) => {
              state.kaijus.delete(kaijuId);
              if (state.activeKaijuId === kaijuId) {
                state.activeKaijuId = null;
              }
            });
          },

          setActiveKaiju: (kaijuId) => {
            set((state) => {
              state.activeKaijuId = kaijuId;
            });
          },

          moveKaiju: (kaijuId, position) => {
            set((state) => {
              const kaiju = state.kaijus.get(kaijuId);
              if (kaiju) {
                kaiju.position = position;
                kaiju.status = 'active';
              }
            });
          },

          damageKaiju: (kaijuId, damage) => {
            set((state) => {
              const kaiju = state.kaijus.get(kaijuId);
              if (kaiju) {
                kaiju.health = Math.max(0, kaiju.health - damage);
                if (kaiju.health === 0) {
                  kaiju.status = 'dormant';
                }
              }
            });
          },

          addTerritory: (territory) => {
            set((state) => {
              state.territories.set(territory.id, territory);
            });
          },

          updateTerritory: (territoryId, updates) => {
            set((state) => {
              const territory = state.territories.get(territoryId);
              if (territory) {
                Object.assign(territory, updates);
              }
            });
          },

          claimTerritory: (territoryId, userId) => {
            set((state) => {
              const territory = state.territories.get(territoryId);
              if (territory) {
                territory.owner = userId;
                territory.status = 'controlled';
                state.contestedTerritories = state.contestedTerritories.filter(id => id !== territoryId);
              }
            });
          },

          contestTerritory: (territoryId) => {
            set((state) => {
              const territory = state.territories.get(territoryId);
              if (territory) {
                territory.status = 'contested';
                if (!state.contestedTerritories.includes(territoryId)) {
                  state.contestedTerritories.push(territoryId);
                }
              }
            });
          },

          selectTerritory: (territoryId) => {
            set((state) => {
              state.selectedTerritoryId = territoryId;
            });
          },

          updateShadowPosition: (shadowId, position, userId) => {
            set((state) => {
              state.shadowPositions.set(shadowId, { shadowId, position, userId });
            });
          },

          removeShadowPosition: (shadowId) => {
            set((state) => {
              state.shadowPositions.delete(shadowId);
            });
          },

          setGamePhase: (phase) => {
            set((state) => {
              state.gamePhase = phase;
            });
          },

          nextRound: () => {
            set((state) => {
              state.currentRound += 1;
              state.turnTimer = 0;
            });
          },

          setTurnTimer: (seconds) => {
            set((state) => {
              state.turnTimer = seconds;
            });
          },

          setMyTurn: (isMyTurn) => {
            set((state) => {
              state.isMyTurn = isMyTurn;
            });
          },

          selectUnit: (unitId) => {
            set((state) => {
              if (!state.selectedUnits.includes(unitId)) {
                state.selectedUnits.push(unitId);
              }
            });
          },

          deselectUnit: (unitId) => {
            set((state) => {
              state.selectedUnits = state.selectedUnits.filter(id => id !== unitId);
            });
          },

          clearSelection: () => {
            set((state) => {
              state.selectedUnits = [];
            });
          },

          setHoveredUnit: (unitId) => {
            set((state) => {
              state.hoveredUnitId = unitId;
            });
          },

          setCameraPosition: (position) => {
            set((state) => {
              state.cameraPosition = position;
            });
          },

          moveCamera: (delta) => {
            set((state) => {
              state.cameraPosition.x += delta.x;
              state.cameraPosition.y += delta.y;
              if (delta.z !== undefined && state.cameraPosition.z !== undefined) {
                state.cameraPosition.z += delta.z;
              }
            });
          },

          setZoomLevel: (zoom) => {
            set((state) => {
              state.zoomLevel = Math.max(0.1, Math.min(3, zoom));
            });
          },

          zoomIn: () => {
            set((state) => {
              state.zoomLevel = Math.min(3, state.zoomLevel * 1.1);
            });
          },

          zoomOut: () => {
            set((state) => {
              state.zoomLevel = Math.max(0.1, state.zoomLevel * 0.9);
            });
          },

          reset: () => {
            set(() => ({
              ...initialState,
              kaijus: new Map(),
              territories: new Map(),
              shadowPositions: new Map()
            }));
          },

          loadGameState: (state) => {
            set((draft) => {
              Object.assign(draft, state);
            });
          }
        }))
      ),
      { name: 'game-store' }
    ),
    'GameStore'
  )
);

// Selectors for optimized re-renders
export const selectKaijus = (state: GameState) => Array.from(state.kaijus.values());
export const selectActiveKaiju = (state: GameState) => 
  state.activeKaijuId ? state.kaijus.get(state.activeKaijuId) : null;
export const selectTerritories = (state: GameState) => Array.from(state.territories.values());
export const selectSelectedTerritory = (state: GameState) => 
  state.selectedTerritoryId ? state.territories.get(state.selectedTerritoryId) : null;
export const selectContestedTerritories = (state: GameState) => 
  state.contestedTerritories.map(id => state.territories.get(id)).filter(Boolean);
export const selectShadowPositions = (state: GameState) => Array.from(state.shadowPositions.values());
export const selectIsGameActive = (state: GameState) => state.gamePhase === 'active';
export const selectSelectedUnits = (state: GameState) => state.selectedUnits;