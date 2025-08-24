import { io, Socket } from 'socket.io-client';
import { tokenManager } from './client';
import { 
  TradeExecution, 
  Shadow, 
  Kaiju, 
  ChatMessage,
  RealtimeEvent,
  Position 
} from '@/types/models';

// Configuration
const WS_URL = process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:3001';
const RECONNECT_ATTEMPTS = 5;
const RECONNECT_DELAY = 1000;

// Event types
export enum RealtimeEventType {
  // Connection events
  CONNECT = 'connect',
  DISCONNECT = 'disconnect',
  ERROR = 'error',
  RECONNECT = 'reconnect',
  
  // Trading events
  TRADE_EXECUTED = 'trade:executed',
  TRADE_UPDATED = 'trade:updated',
  
  // Shadow events
  SHADOW_POSITION_UPDATE = 'shadow:position',
  SHADOW_STATUS_CHANGE = 'shadow:status',
  SHADOW_EXPIRED = 'shadow:expired',
  
  // Kaiju events
  KAIJU_ONLINE = 'kaiju:online',
  KAIJU_OFFLINE = 'kaiju:offline',
  KAIJU_PERFORMANCE_UPDATE = 'kaiju:performance',
  
  // Territory events
  TERRITORY_CHAT = 'territory:chat',
  TERRITORY_EVENT = 'territory:event',
  TERRITORY_USER_JOIN = 'territory:user:join',
  TERRITORY_USER_LEAVE = 'territory:user:leave',
  
  // Market events
  PRICE_UPDATE = 'market:price',
  GAS_UPDATE = 'market:gas',
  
  // System events
  NOTIFICATION = 'notification',
  ACHIEVEMENT = 'achievement',
}

// Subscription options
export interface SubscriptionOptions {
  kaijuIds?: string[];
  territoryIds?: string[];
  shadowIds?: string[];
  chains?: string[];
  assets?: string[];
}

// Event handlers
export type EventHandler<T = any> = (data: T) => void;
export type ErrorHandler = (error: Error) => void;

class RealtimeClient {
  private socket: Socket | null = null;
  private subscriptions: Map<string, Set<EventHandler>> = new Map();
  private connectionListeners: Set<(connected: boolean) => void> = new Set();
  private messageQueue: { event: string; data: any }[] = [];
  private reconnectAttempts = 0;
  private options: SubscriptionOptions = {};

  constructor() {
    // Auto-connect on instantiation
    if (typeof window !== 'undefined') {
      this.connect();
    }
  }

  // Connection management
  connect(options?: SubscriptionOptions): void {
    if (this.socket?.connected) return;
    
    if (options) {
      this.options = options;
    }

    const token = tokenManager.getAccessToken();
    
    this.socket = io(WS_URL, {
      auth: { token },
      transports: ['websocket'],
      reconnection: true,
      reconnectionAttempts: RECONNECT_ATTEMPTS,
      reconnectionDelay: RECONNECT_DELAY,
      query: this.options,
    });

    this.setupEventHandlers();
    this.processMessageQueue();
  }

  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
    this.notifyConnectionListeners(false);
  }

  private setupEventHandlers(): void {
    if (!this.socket) return;

    // Connection events
    this.socket.on('connect', () => {
      console.log('WebSocket connected');
      this.reconnectAttempts = 0;
      this.notifyConnectionListeners(true);
      this.resubscribeAll();
    });

    this.socket.on('disconnect', (reason) => {
      console.log('WebSocket disconnected:', reason);
      this.notifyConnectionListeners(false);
    });

    this.socket.on('error', (error) => {
      console.error('WebSocket error:', error);
    });

    this.socket.on('reconnect', (attemptNumber) => {
      console.log('WebSocket reconnected after', attemptNumber, 'attempts');
      this.reconnectAttempts = 0;
    });

    // Set up handlers for all subscribed events
    this.subscriptions.forEach((handlers, event) => {
      this.socket!.on(event, (data) => {
        handlers.forEach(handler => handler(data));
      });
    });
  }

  private notifyConnectionListeners(connected: boolean): void {
    this.connectionListeners.forEach(listener => listener(connected));
  }

  private processMessageQueue(): void {
    while (this.messageQueue.length > 0 && this.socket?.connected) {
      const { event, data } = this.messageQueue.shift()!;
      this.emit(event, data);
    }
  }

  private resubscribeAll(): void {
    // Resubscribe to all events after reconnection
    if (this.options.kaijuIds?.length) {
      this.subscribeToKaiju(this.options.kaijuIds);
    }
    if (this.options.territoryIds?.length) {
      this.subscribeToTerritories(this.options.territoryIds);
    }
    if (this.options.shadowIds?.length) {
      this.subscribeToShadows(this.options.shadowIds);
    }
    if (this.options.chains?.length) {
      this.subscribeToChains(this.options.chains);
    }
    if (this.options.assets?.length) {
      this.subscribeToAssets(this.options.assets);
    }
  }

  // Event subscription
  on<T = any>(event: RealtimeEventType | string, handler: EventHandler<T>): () => void {
    if (!this.subscriptions.has(event)) {
      this.subscriptions.set(event, new Set());
      
      // If socket is connected, add the listener
      if (this.socket?.connected) {
        this.socket.on(event, (data) => {
          this.subscriptions.get(event)?.forEach(h => h(data));
        });
      }
    }
    
    this.subscriptions.get(event)!.add(handler);
    
    // Return unsubscribe function
    return () => {
      const handlers = this.subscriptions.get(event);
      if (handlers) {
        handlers.delete(handler);
        if (handlers.size === 0) {
          this.subscriptions.delete(event);
          this.socket?.off(event);
        }
      }
    };
  }

  onConnectionChange(listener: (connected: boolean) => void): () => void {
    this.connectionListeners.add(listener);
    // Immediately notify of current state
    listener(this.isConnected());
    
    return () => {
      this.connectionListeners.delete(listener);
    };
  }

  // Event emission
  emit(event: string, data?: any): void {
    if (this.socket?.connected) {
      this.socket.emit(event, data);
    } else {
      // Queue message for later
      this.messageQueue.push({ event, data });
    }
  }

  // Subscription methods
  subscribeToTradingFeed(kaijuIds?: string[]): void {
    this.emit('subscribe:trading', { kaijuIds });
  }

  unsubscribeFromTradingFeed(): void {
    this.emit('unsubscribe:trading');
  }

  subscribeToKaiju(kaijuIds: string[]): void {
    this.options.kaijuIds = kaijuIds;
    this.emit('subscribe:kaiju', { kaijuIds });
  }

  unsubscribeFromKaiju(kaijuIds: string[]): void {
    this.emit('unsubscribe:kaiju', { kaijuIds });
  }

  subscribeToTerritories(territoryIds: string[]): void {
    this.options.territoryIds = territoryIds;
    this.emit('subscribe:territories', { territoryIds });
  }

  unsubscribeFromTerritories(territoryIds: string[]): void {
    this.emit('unsubscribe:territories', { territoryIds });
  }

  subscribeToShadows(shadowIds: string[]): void {
    this.options.shadowIds = shadowIds;
    this.emit('subscribe:shadows', { shadowIds });
  }

  unsubscribeFromShadows(shadowIds: string[]): void {
    this.emit('unsubscribe:shadows', { shadowIds });
  }

  subscribeToChains(chains: string[]): void {
    this.options.chains = chains;
    this.emit('subscribe:chains', { chains });
  }

  subscribeToAssets(assets: string[]): void {
    this.options.assets = assets;
    this.emit('subscribe:assets', { assets });
  }

  // Territory-specific methods
  joinTerritory(territoryId: string): void {
    this.emit('territory:join', { territoryId });
  }

  leaveTerritory(territoryId: string): void {
    this.emit('territory:leave', { territoryId });
  }

  sendChatMessage(territoryId: string, message: string): void {
    this.emit('territory:chat:send', { territoryId, message });
  }

  updateShadowPosition(shadowId: string, position: Position): void {
    this.emit('shadow:move', { shadowId, position });
  }

  // Utility methods
  isConnected(): boolean {
    return this.socket?.connected || false;
  }

  getConnectionState(): 'connected' | 'disconnected' | 'connecting' {
    if (!this.socket) return 'disconnected';
    if (this.socket.connected) return 'connected';
    return 'connecting';
  }

  getLatency(): number {
    // This would be implemented with ping/pong
    return 0;
  }
}

// Singleton instance
export const realtimeClient = new RealtimeClient();

// Typed event handlers for common events
export const realtimeEvents = {
  onTradeExecuted: (handler: EventHandler<TradeExecution>) => 
    realtimeClient.on(RealtimeEventType.TRADE_EXECUTED, handler),
    
  onShadowPositionUpdate: (handler: EventHandler<{ shadowId: string; position: Position }>) =>
    realtimeClient.on(RealtimeEventType.SHADOW_POSITION_UPDATE, handler),
    
  onKaijuStatusChange: (handler: EventHandler<{ kaijuId: string; isOnline: boolean }>) =>
    realtimeClient.on(RealtimeEventType.KAIJU_ONLINE, handler),
    
  onTerritoryChat: (handler: EventHandler<ChatMessage>) =>
    realtimeClient.on(RealtimeEventType.TERRITORY_CHAT, handler),
    
  onPerformanceUpdate: (handler: EventHandler<{ kaijuId: string; performance: any }>) =>
    realtimeClient.on(RealtimeEventType.KAIJU_PERFORMANCE_UPDATE, handler),
    
  onPriceUpdate: (handler: EventHandler<{ asset: string; price: number; change: number }>) =>
    realtimeClient.on(RealtimeEventType.PRICE_UPDATE, handler),
};