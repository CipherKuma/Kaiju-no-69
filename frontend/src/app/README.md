# App Directory - Next.js App Router

This directory contains the application routes using Next.js 15 App Router.

## Routes

### `/` (Home)
Landing page with introduction to Kaiju no. 69

### `/dashboard`
Multi-shadow dashboard showing:
- Active shadow performance
- Portfolio aggregation
- Shadow NFT gallery
- Management controls

### `/kingdoms/[id]`
Dynamic route for viewing individual Kaiju territories:
- PixiJS game view
- Interactive zones (chat, trading post, statistics)
- Real-time shadow movements
- Environmental effects based on market conditions

### `/marketplace`
Kaiju discovery hub featuring:
- Grid of available Kaiju traders
- Performance metrics and charts
- Filtering by profitability, popularity, online status
- Quick shadow creation interface

### `/onboarding`
New user onboarding flow:
- Wallet connection
- Introduction to shadow transformation
- First shadow creation wizard
- Tutorial for game mechanics

## File Structure

Each route follows Next.js conventions:
- `page.tsx`: Route component
- `layout.tsx`: Route-specific layout (optional)
- `loading.tsx`: Loading state (optional)
- `error.tsx`: Error boundary (optional)

## Metadata

Routes can export metadata for SEO:
```typescript
export const metadata = {
  title: 'Dashboard | Kaiju no. 69',
  description: 'Manage your shadow portfolio'
};
```