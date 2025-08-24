# Types Directory

TypeScript type definitions for the Kaiju no. 69 application.

## Structure

### Core Types

#### User
```typescript
interface User {
  address: string;
  shadows: Shadow[];
  policies: TradingPolicy[];
  vincentAgent?: VincentAgent;
}
```

#### Kaiju
```typescript
interface Kaiju {
  id: string;
  name: string;
  imageUrl: string;
  performance: Performance;
  territory: Territory;
  isOnline: boolean;
  shadows: Shadow[];
}
```

#### Shadow
```typescript
interface Shadow {
  kaijuId: string;
  nftId: string;
  expiresAt: Date;
  policies: TradingPolicy[];
  currentPL: number;
}
```

#### Territory
```typescript
interface Territory {
  id: string;
  biome: 'fire' | 'water' | 'earth' | 'air';
  kaijuId: string;
  activeShadows: Shadow[];
  interactiveZones: Zone[];
}
```

### Additional Types

- **Trading Types**: Policies, trade executions, performance metrics
- **Game Types**: Sprites, game state, animations
- **API Types**: Response structures, error types
- **Web3 Types**: Transaction types, contract interfaces

## Usage

```typescript
import { User, Kaiju, Shadow } from '@/types';
```