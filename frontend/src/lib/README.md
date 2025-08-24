# Library Directory

This directory contains core business logic, utilities, and integrations.

## Structure

### `/store`
Zustand state management stores:
- **User Store**: Authentication, wallet connection, user preferences
- **Game Store**: Kaiju data, territory states, shadow positions
- **Trading Store**: Live trade feeds, portfolio data, policies
- **UI Store**: Modal management, loading states, notifications

### `/game`
Game engine utilities and PixiJS integration:
- Game initialization and setup
- Sprite loading and animation systems
- Collision detection
- Camera controls
- Performance optimization utilities

### `/web3`
Web3 integration using wagmi and viem:
- Wallet connection configuration
- Smart contract interactions
- Transaction management
- Gas estimation utilities
- Contract event listeners

### `/api`
API client functions for backend communication:
- Kaiju data fetching
- Shadow management endpoints
- Trading operations
- Real-time data subscriptions
- Error handling and retry logic

## Usage

```typescript
import { useUserStore } from '@/lib/store';
import { wagmiConfig } from '@/lib/web3';
import { apiClient } from '@/lib/api';
```