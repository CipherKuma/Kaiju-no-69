# Trading Components

This directory contains all trading-related components for the Kaiju No. 69 platform.

## Components

### TradingFeed

The main live trading feed component that displays real-time trade executions across all Kaiju territories.

**Features:**
- WebSocket integration for live updates via `useLiveTradingFeed` hook
- Historical data loading with infinite scroll via `useTradingFeed` hook
- Filtering by trade type (buy/sell/swap/arbitrage)
- Minimum value threshold filtering
- Pause/resume functionality
- Expandable trade cards with full transaction details
- Animated entry/exit for trades
- P&L visualization with color coding
- Shadow participant count display
- Mock data fallback for demos

**Usage:**
```tsx
import { TradingFeed } from '@/components/trading';

// Basic usage
<TradingFeed />

// With specific Kaiju filter
<TradingFeed kaijuIds={["kaiju-1", "kaiju-2"]} />

// With custom styling
<TradingFeed className="h-[600px] border rounded-lg" />
```

### TradingFeedDemo

A pre-configured demo component that showcases the trading feed with a styled container.

**Usage:**
```tsx
import { TradingFeedDemo } from '@/components/trading';

<TradingFeedDemo />
```

### Trading Feed Animations

A collection of animated components specifically designed for the trading feed:

- **TradeTypeBadge**: Animated badge showing trade type with icons
- **PnLIndicator**: Animated P&L display with glow effects for profits
- **LiveIndicator**: Pulsing dot for live status
- **ShadowCount**: Visual representation of shadow participants
- **SuccessBurst**: Particle effect for successful profitable trades
- **VolumeIndicator**: Animated bar showing trade volume

**Usage:**
```tsx
import { 
  TradeTypeBadge, 
  PnLIndicator, 
  LiveIndicator 
} from '@/components/trading';

// Trade type badge
<TradeTypeBadge type="buy" />

// P&L indicator
<PnLIndicator value={125.50} percentage={5.02} />

// Live status
<LiveIndicator />
```

## Animation Variants

The components use custom animation variants:

- `tradeEntryAnimation`: Spring-based entry for new trades
- `profitCelebrationAnimation`: Celebration effect for profitable trades
- `lossShakeAnimation`: Shake effect for losses
- `pendingPulseAnimation`: Pulse for pending transactions

## Mock Data

For development and demos, mock trade data is available:

```tsx
import { mockTrades, generateRandomTrade } from '@/lib/mock-data/trading-feed';

// Use pre-defined mock trades
const trades = mockTrades;

// Generate a random trade
const newTrade = generateRandomTrade();
```

## Styling

Components use the design system tokens:
- Trade type colors: `text-success`, `text-danger`, `text-primary`, `text-secondary`
- Background variants: `bg-success/10`, etc.
- Standard spacing and typography from the theme

## Performance Considerations

- Trade feed uses virtualization for long lists (via infinite scroll)
- Animations are GPU-accelerated using Framer Motion
- WebSocket messages are batched for efficiency
- Mock data is lazy-loaded only when needed

## Future Enhancements

- [ ] Advanced filtering UI with date ranges
- [ ] Trade analytics and aggregations
- [ ] Export functionality for trade history
- [ ] Customizable trade card layouts
- [ ] Sound effects for trade events
- [ ] Mobile swipe gestures for actions