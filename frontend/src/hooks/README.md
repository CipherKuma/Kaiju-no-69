# Hooks Directory

Custom React hooks for the Kaiju no. 69 application.

## Purpose

This directory contains reusable hooks that encapsulate complex logic and provide clean interfaces for components.

## Common Hooks

### Data Fetching Hooks
- `useKaiju`: Fetch and manage individual Kaiju data
- `useKaijuList`: Fetch filtered lists of Kaiju with pagination
- `useShadow`: Manage shadow NFT data and operations
- `useTradingFeed`: Subscribe to real-time trading updates

### Web3 Hooks
- Custom wrappers around wagmi hooks
- Transaction management with UI feedback
- Contract interaction helpers
- Multi-token balance tracking

### Real-time Hooks
- `useSocket`: WebSocket connection management
- `useSocketEvent`: Event subscription system
- `useRealtimeData`: Stream specific data types
- `useChat`: Territory chat functionality

### Game Hooks
- `usePixi`: PixiJS application management
- `useGameState`: Game state synchronization
- `useAnimation`: Animation frame updates

## Usage

```typescript
import { useKaiju, useTradingFeed } from '@/hooks';

function MyComponent() {
  const { data: kaiju, isLoading } = useKaiju(kaijuId);
  const trades = useTradingFeed({ filter: 'following' });
  // ...
}
```