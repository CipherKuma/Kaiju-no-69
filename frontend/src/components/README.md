# Components Directory

This directory contains all React components organized by feature area.

## Structure

### `/ui`
Base UI components using shadcn/ui and custom styling. These are reusable components like buttons, cards, modals, etc.

### `/game`
Game-related components for the PixiJS integration, including:
- Territory rendering components
- Game canvas wrapper
- Sprite management
- Interactive zone components

### `/kaiju`
Components related to Kaiju entities:
- Kaiju discovery hub for browsing traders
- Kaiju cards showing performance metrics
- Kaiju avatars with animations
- Kaiju detail views

### `/trading`
Trading and shadow transformation components:
- Shadow transformation interface
- Policy builder for Vincent agents
- Trading feed displays
- Performance charts and metrics

### `/layouts`
Layout components for different sections:
- Main application layout
- Dashboard layout
- Game view layout
- Marketplace layout

## Usage

Import components from their respective subdirectories:
```typescript
import { KaijuCard } from '@/components/kaiju';
import { TradingFeed } from '@/components/trading';
```