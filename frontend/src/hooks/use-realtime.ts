import { useState, useEffect, useCallback, useRef } from 'react';
import { realtimeClient, realtimeEvents, RealtimeEventType } from '@/lib/api/realtime';
import { 
  TradeExecution, 
  ChatMessage, 
  Position 
} from '@/types/models';

// Connection status hook
export const useSocketConnection = () => {
  const [connected, setConnected] = useState(false);
  const [latency, setLatency] = useState(0);

  useEffect(() => {
    const unsubscribe = realtimeClient.onConnectionChange(setConnected);
    return unsubscribe;
  }, []);

  const connect = useCallback((options?: any) => {
    realtimeClient.connect(options);
  }, []);

  const disconnect = useCallback(() => {
    realtimeClient.disconnect();
  }, []);

  return {
    connected,
    latency,
    connect,
    disconnect,
    connectionState: realtimeClient.getConnectionState(),
  };
};

// Live trading feed hook
export const useLiveTradingFeed = (kaijuIds?: string[]) => {
  const [trades, setTrades] = useState<TradeExecution[]>([]);
  const [paused, setPaused] = useState(false);
  const maxTrades = 50; // Keep last 50 trades

  useEffect(() => {
    if (paused) return;

    // Subscribe to trading feed
    realtimeClient.subscribeToTradingFeed(kaijuIds);

    const unsubscribe = realtimeEvents.onTradeExecuted((trade: TradeExecution) => {
      setTrades(prev => {
        const newTrades = [trade, ...prev].slice(0, maxTrades);
        return newTrades;
      });
    });

    return () => {
      unsubscribe();
      realtimeClient.unsubscribeFromTradingFeed();
    };
  }, [kaijuIds, paused]);

  const clearTrades = useCallback(() => {
    setTrades([]);
  }, []);

  const pauseFeed = useCallback(() => {
    setPaused(true);
  }, []);

  const resumeFeed = useCallback(() => {
    setPaused(false);
  }, []);

  return {
    trades,
    paused,
    pauseFeed,
    resumeFeed,
    clearTrades,
  };
};

// Kaiju online status hook
export const useKaijuStatus = (kaijuIds: string[]) => {
  const [statuses, setStatuses] = useState<Record<string, boolean>>({});

  useEffect(() => {
    realtimeClient.subscribeToKaiju(kaijuIds);

    const unsubscribeOnline = realtimeClient.on(
      RealtimeEventType.KAIJU_ONLINE,
      ({ kaijuId }: { kaijuId: string }) => {
        setStatuses(prev => ({ ...prev, [kaijuId]: true }));
      }
    );

    const unsubscribeOffline = realtimeClient.on(
      RealtimeEventType.KAIJU_OFFLINE,
      ({ kaijuId }: { kaijuId: string }) => {
        setStatuses(prev => ({ ...prev, [kaijuId]: false }));
      }
    );

    return () => {
      unsubscribeOnline();
      unsubscribeOffline();
      realtimeClient.unsubscribeFromKaiju(kaijuIds);
    };
  }, [kaijuIds]);

  return statuses;
};

// Performance updates hook
export const usePerformanceUpdates = (kaijuIds: string[]) => {
  const [updates, setUpdates] = useState<Record<string, any>>({});

  useEffect(() => {
    realtimeClient.subscribeToKaiju(kaijuIds);

    const unsubscribe = realtimeEvents.onPerformanceUpdate(
      ({ kaijuId, performance }: { kaijuId: string; performance: any }) => {
        setUpdates(prev => ({ ...prev, [kaijuId]: performance }));
      }
    );

    return () => {
      unsubscribe();
      realtimeClient.unsubscribeFromKaiju(kaijuIds);
    };
  }, [kaijuIds]);

  return updates;
};

// Territory chat hook
export const useTerritoryChat = (territoryId: string) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [users, setUsers] = useState<string[]>([]);

  useEffect(() => {
    if (!territoryId) return;

    realtimeClient.joinTerritory(territoryId);

    const unsubscribeChat = realtimeEvents.onTerritoryChat((message: ChatMessage) => {
      if (message.territoryId === territoryId) {
        setMessages(prev => [...prev, message]);
      }
    });

    const unsubscribeUserJoin = realtimeClient.on(
      RealtimeEventType.TERRITORY_USER_JOIN,
      ({ userId }: { userId: string }) => {
        setUsers(prev => [...prev.filter(id => id !== userId), userId]);
      }
    );

    const unsubscribeUserLeave = realtimeClient.on(
      RealtimeEventType.TERRITORY_USER_LEAVE,
      ({ userId }: { userId: string }) => {
        setUsers(prev => prev.filter(id => id !== userId));
      }
    );

    return () => {
      unsubscribeChat();
      unsubscribeUserJoin();
      unsubscribeUserLeave();
      realtimeClient.leaveTerritory(territoryId);
    };
  }, [territoryId]);

  const sendMessage = useCallback((message: string) => {
    realtimeClient.sendChatMessage(territoryId, message);
  }, [territoryId]);

  return {
    messages,
    users,
    sendMessage,
  };
};

// Shadow position tracking hook
export const useShadowPositions = (shadowIds: string[]) => {
  const [positions, setPositions] = useState<Record<string, Position>>({});

  useEffect(() => {
    realtimeClient.subscribeToShadows(shadowIds);

    const unsubscribe = realtimeEvents.onShadowPositionUpdate(
      ({ shadowId, position }: { shadowId: string; position: Position }) => {
        setPositions(prev => ({ ...prev, [shadowId]: position }));
      }
    );

    return () => {
      unsubscribe();
      realtimeClient.unsubscribeFromShadows(shadowIds);
    };
  }, [shadowIds]);

  const updatePosition = useCallback((shadowId: string, position: Position) => {
    realtimeClient.updateShadowPosition(shadowId, position);
  }, []);

  return {
    positions,
    updatePosition,
  };
};

// Price updates hook
export const usePriceUpdates = (assets: string[]) => {
  const [prices, setPrices] = useState<Record<string, { price: number; change: number }>>({});

  useEffect(() => {
    realtimeClient.subscribeToAssets(assets);

    const unsubscribe = realtimeEvents.onPriceUpdate(
      ({ asset, price, change }: { asset: string; price: number; change: number }) => {
        setPrices(prev => ({ ...prev, [asset]: { price, change } }));
      }
    );

    return () => {
      unsubscribe();
    };
  }, [assets]);

  return prices;
};

// Notification hook
export const useRealtimeNotifications = () => {
  const [notifications, setNotifications] = useState<any[]>([]);

  useEffect(() => {
    const unsubscribe = realtimeClient.on(
      RealtimeEventType.NOTIFICATION,
      (notification: any) => {
        setNotifications(prev => [notification, ...prev.slice(0, 9)]); // Keep last 10
      }
    );

    return unsubscribe;
  }, []);

  const clearNotifications = useCallback(() => {
    setNotifications([]);
  }, []);

  return {
    notifications,
    clearNotifications,
  };
};

// Custom hook for territory game events
export const useTerritoryEvents = (territoryId: string) => {
  const [events, setEvents] = useState<any[]>([]);

  useEffect(() => {
    if (!territoryId) return;

    realtimeClient.subscribeToTerritories([territoryId]);

    const unsubscribe = realtimeClient.on(
      RealtimeEventType.TERRITORY_EVENT,
      (event: any) => {
        if (event.territoryId === territoryId) {
          setEvents(prev => [event, ...prev.slice(0, 19)]); // Keep last 20 events
        }
      }
    );

    return () => {
      unsubscribe();
      realtimeClient.unsubscribeFromTerritories([territoryId]);
    };
  }, [territoryId]);

  return events;
};

// Hook for managing multiple subscriptions
export const useRealtimeSubscriptions = () => {
  const subscriptionsRef = useRef<Set<() => void>>(new Set());

  const subscribe = useCallback((event: string, handler: (data: any) => void) => {
    const unsubscribe = realtimeClient.on(event, handler);
    subscriptionsRef.current.add(unsubscribe);
    return unsubscribe;
  }, []);

  const unsubscribeAll = useCallback(() => {
    subscriptionsRef.current.forEach(unsubscribe => unsubscribe());
    subscriptionsRef.current.clear();
  }, []);

  useEffect(() => {
    return () => {
      unsubscribeAll();
    };
  }, [unsubscribeAll]);

  return {
    subscribe,
    unsubscribeAll,
  };
};