"use client";

import React, { useEffect } from 'react';
import { useResponsive, useKeyboardShortcuts } from '@/hooks';
import { cn } from '@/lib/utils';

interface ResponsiveLayoutProps {
  children: React.ReactNode;
  className?: string;
  enableKeyboardShortcuts?: boolean;
}

export function ResponsiveLayout({
  children,
  className,
  enableKeyboardShortcuts = true,
}: ResponsiveLayoutProps) {
  const { deviceType, orientation, isOnline } = useResponsive();

  // Desktop keyboard shortcuts
  useKeyboardShortcuts(enableKeyboardShortcuts ? {
    'ctrl+k': () => {
      // Open command palette/search
      const event = new CustomEvent('openCommandPalette');
      window.dispatchEvent(event);
    },
    'ctrl+/': () => {
      // Toggle help menu
      const event = new CustomEvent('toggleHelpMenu');
      window.dispatchEvent(event);
    },
    'ctrl+b': () => {
      // Toggle sidebar
      const event = new CustomEvent('toggleSidebar');
      window.dispatchEvent(event);
    },
    'escape': () => {
      // Close modals
      const event = new CustomEvent('closeModal');
      window.dispatchEvent(event);
    },
    'ctrl+shift+d': () => {
      // Toggle debug mode
      const event = new CustomEvent('toggleDebugMode');
      window.dispatchEvent(event);
    },
    'alt+1': () => {
      // Navigate to dashboard
      window.location.href = '/dashboard';
    },
    'alt+2': () => {
      // Navigate to marketplace
      window.location.href = '/marketplace';
    },
    'alt+3': () => {
      // Navigate to kingdoms
      window.location.href = '/kingdoms';
    },
  } : {});

  // Add device-specific classes to body
  useEffect(() => {
    document.body.className = cn(
      document.body.className,
      `device-${deviceType}`,
      `orientation-${orientation}`,
      !isOnline && 'offline'
    );
  }, [deviceType, orientation, isOnline]);

  return (
    <div
      className={cn(
        'min-h-viewport transition-all duration-300',
        {
          // Desktop specific styles
          'hover:shadow-lg': deviceType === 'desktop',
          
          // Tablet specific styles
          'touch-manipulation': deviceType === 'tablet',
          
          // Mobile specific styles
          'safe-area-top safe-area-bottom': deviceType === 'mobile',
        },
        className
      )}
      data-device={deviceType}
      data-orientation={orientation}
    >
      {/* Offline indicator */}
      {!isOnline && (
        <div className="fixed top-0 left-0 right-0 bg-warning text-white p-2 text-center z-50">
          You are currently offline. Some features may be limited.
        </div>
      )}
      
      {children}
    </div>
  );
}

// Desktop-specific multi-column layout
interface MultiColumnLayoutProps {
  sidebar?: React.ReactNode;
  main: React.ReactNode;
  aside?: React.ReactNode;
  className?: string;
}

export function MultiColumnLayout({
  sidebar,
  main,
  aside,
  className,
}: MultiColumnLayoutProps) {
  const { deviceType } = useResponsive();

  if (deviceType !== 'desktop') {
    return <>{main}</>;
  }

  return (
    <div className={cn('flex h-viewport', className)}>
      {sidebar && (
        <div className="w-64 flex-shrink-0 border-r border-border overflow-y-auto">
          {sidebar}
        </div>
      )}
      
      <div className="flex-1 overflow-y-auto">
        {main}
      </div>
      
      {aside && (
        <div className="w-80 flex-shrink-0 border-l border-border overflow-y-auto">
          {aside}
        </div>
      )}
    </div>
  );
}

// Hoverable card component for desktop
interface HoverableCardProps {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
  hoverEffect?: 'lift' | 'glow' | 'scale';
}

export function HoverableCard({
  children,
  className,
  onClick,
  hoverEffect = 'lift',
}: HoverableCardProps) {
  const { deviceType } = useResponsive();
  const isDesktop = deviceType === 'desktop';

  const hoverClasses = {
    lift: 'hover:-translate-y-1 hover:shadow-xl',
    glow: 'hover:ring-2 hover:ring-primary hover:ring-opacity-50',
    scale: 'hover:scale-105',
  };

  return (
    <div
      className={cn(
        'transition-all duration-200 cursor-pointer',
        isDesktop && hoverClasses[hoverEffect],
        className
      )}
      onClick={onClick}
    >
      {children}
    </div>
  );
}

// Keyboard shortcut indicator for desktop
interface KeyboardShortcutProps {
  keys: string[];
  className?: string;
}

export function KeyboardShortcut({ keys, className }: KeyboardShortcutProps) {
  const { deviceType } = useResponsive();

  if (deviceType !== 'desktop') return null;

  return (
    <div className={cn('inline-flex items-center gap-1', className)}>
      {keys.map((key, index) => (
        <React.Fragment key={key}>
          <kbd className="px-2 py-1 text-xs font-mono bg-muted rounded border border-border">
            {key}
          </kbd>
          {index < keys.length - 1 && <span className="text-muted-foreground">+</span>}
        </React.Fragment>
      ))}
    </div>
  );
}