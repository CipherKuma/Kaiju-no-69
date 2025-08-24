# Layout Components Documentation

This document outlines all the layout components created for the Kaiju No. 69 application, ensuring responsive design, PWA compatibility, and excellent user experience.

## Overview

All layout components follow these principles:
- Mobile-first responsive design
- PWA compatibility with offline support
- Smooth transitions and loading states
- Accessibility best practices
- Modern Lucide React icons

## Components

### 1. MainLayout (`main-layout.tsx`)
The primary application wrapper with:
- **Responsive Navigation**: Desktop header, mobile bottom navigation
- **Wallet Connection**: Integrated wallet connect with loading states
- **Notification System**: Toast notifications for user feedback
- **Offline Support**: Banner showing connection status
- **Mobile Menu**: Hamburger menu for additional navigation

Features:
- Active route highlighting
- Badge support for notifications
- Smooth animations
- PWA-ready bottom navigation with safe area

### 2. DashboardLayout (`dashboard-layout.tsx`)
Specialized layout for dashboard pages:
- **Collapsible Sidebar**: Desktop sidebar with smooth transitions
- **Mobile Drawer**: Touch-friendly navigation drawer
- **Sidebar Items**: Overview, Kaiju, Stats, Energy, Shadow Realm, Earnings, Analytics
- **Icon System**: Color-coded icons for each section
- **Badge Support**: Real-time updates for counts and stats

### 3. GameLayout (`game-layout.tsx`)
Full-screen layout for PixiJS game views:
- **Loading Overlay**: Progress bar with animated Kaiju icon
- **Auto-hiding UI**: Controls hide after inactivity
- **Game Controls**: Health/Energy bars with animations
- **Mobile Controls**: Touch-optimized action buttons
- **Fullscreen Support**: Toggle between windowed and fullscreen
- **Sound Controls**: Mute/unmute functionality

Props:
- `health`, `maxHealth`, `energy`, `maxEnergy`
- `score`, `gameMode`
- `onToggleSound`, `soundEnabled`

### 4. MarketplaceLayout (`marketplace-layout.tsx`)
E-commerce style layout with filters:
- **Filter Sidebar**: Desktop sidebar, mobile drawer
- **Filter Types**: Kaiju type, Rarity, Price range, Special traits
- **Sort Options**: Recent, Price, Battle Power
- **Active Filter Count**: Visual indicator of applied filters
- **Mobile Filter Sheet**: Touch-friendly filter interface

Filter Categories:
- Kaiju Types (Fire, Water, Earth, Air)
- Rarity (Legendary, Epic, Rare, Common)
- Price Ranges
- Special Traits (Evolved, Rising Power, New Listing)

### 5. OnboardingLayout (`onboarding-layout.tsx`)
Step-by-step onboarding flow:
- **Progress Indicators**: Visual step progress with icons
- **Step Navigation**: Back button, skip option
- **Animated Transitions**: Smooth step transitions
- **Mobile Progress Bar**: Simplified mobile view
- **Content Container**: Styled card for onboarding content

Steps:
1. Welcome (Sparkles icon)
2. Connect Wallet (Wallet icon)
3. Choose Kaiju (Shield icon)
4. Battle Tutorial (Swords icon)
5. Join Kingdom (Castle icon)
6. Complete Setup (Trophy icon)

### 6. NotificationSystem (`notification.tsx`)
Toast notification system:
- **Types**: Success, Error, Warning, Info
- **Features**: Auto-dismiss, action buttons, custom duration
- **Animations**: Slide in/out animations
- **Context API**: Global notification access
- **Icons**: Type-specific icons with colors

Usage:
```tsx
const { showNotification } = useNotifications();
showNotification({
  type: 'success',
  title: 'Success!',
  message: 'Your action was completed',
  action: { label: 'Undo', onClick: () => {} }
});
```

### 7. Navigation (`navigation.tsx`)
Reusable navigation component:
- **Variants**: Primary, Secondary, Minimal
- **Orientations**: Horizontal, Vertical
- **Features**: Active states, badges, disabled states
- **Icons**: Support for React components and emojis
- **Animations**: Smooth active indicator

### 8. Footer (`footer.tsx`)
Game statistics footer:
- **Live Stats**: Active players, battles, volume
- **Trend Indicators**: Up/down trends with animations
- **Social Links**: Twitter, Discord, Telegram, GitHub
- **Footer Links**: Game, Marketplace, Community, Support
- **Network Status**: Connection health indicator

### 9. Breadcrumbs (`breadcrumbs.tsx`)
Navigation breadcrumbs:
- **Auto-generation**: From URL path
- **Custom Items**: Manual breadcrumb definition
- **Icons Support**: Optional icons for items
- **Responsive**: Truncation on mobile
- **Animations**: Staggered fade-in

### 10. PageHeader (`page-header.tsx`)
Consistent page headers:
- **Title & Subtitle**: With animations
- **Actions Slot**: For page-specific actions
- **Breadcrumbs**: Optional breadcrumb integration
- **Icons & Badges**: Visual enhancements
- **Tooltips**: Help information

## Usage Examples

### Main Layout with Notification
```tsx
import { MainLayout } from '@/components/layouts';
import { useNotifications } from '@/components/ui/notification';

function MyPage() {
  const { showNotification } = useNotifications();
  
  return (
    <MainLayout>
      {/* Page content */}
    </MainLayout>
  );
}
```

### Dashboard with Sidebar
```tsx
import { DashboardLayout } from '@/components/layouts';

function DashboardPage() {
  return (
    <DashboardLayout
      title="My Dashboard"
      subtitle="Track your Kaiju progress"
    >
      {/* Dashboard content */}
    </DashboardLayout>
  );
}
```

### Game View
```tsx
import { GameLayout } from '@/components/layouts';

function GamePage() {
  return (
    <GameLayout
      health={75}
      maxHealth={100}
      energy={50}
      maxEnergy={100}
      score={1234}
      gameMode="Battle Arena"
    >
      {/* PixiJS game canvas */}
    </GameLayout>
  );
}
```

## Responsive Breakpoints

- **Mobile**: < 640px (sm)
- **Tablet**: 640px - 768px (md)
- **Desktop**: > 768px

## PWA Features

1. **Safe Area Support**: Bottom navigation respects device safe areas
2. **Touch Optimized**: All interactive elements are touch-friendly
3. **Offline Support**: Connection status monitoring
4. **Performance**: Optimized animations and transitions
5. **Accessibility**: ARIA labels and keyboard navigation

## Best Practices

1. Always wrap your app with `NotificationProvider` in the root layout
2. Use `MainLayout` for general pages
3. Use specialized layouts for specific sections
4. Maintain consistent navigation items across layouts
5. Test on various devices for responsive behavior

## Future Enhancements

- Dark/Light theme toggle
- RTL language support
- Keyboard shortcuts
- Advanced animation preferences
- Layout persistence in localStorage