"use client";

import React, { useState, useRef, useEffect } from 'react';
import { useResponsive, useSwipeGestures } from '@/hooks';
import { cn } from '@/lib/utils';
import { Menu, X, ChevronLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ResponsiveSidebarProps {
  children: React.ReactNode;
  defaultOpen?: boolean;
  className?: string;
  side?: 'left' | 'right';
}

export function ResponsiveSidebar({
  children,
  defaultOpen = true,
  className,
  side = 'left',
}: ResponsiveSidebarProps) {
  const { deviceType } = useResponsive();
  const [isOpen, setIsOpen] = useState(defaultOpen && deviceType === 'desktop');
  const sidebarRef = useRef<HTMLDivElement>(null);

  // Handle swipe gestures for tablet
  useSwipeGestures(sidebarRef as React.RefObject<HTMLElement>, {
    onSwipeLeft: side === 'right' ? () => setIsOpen(false) : undefined,
    onSwipeRight: side === 'left' ? () => setIsOpen(false) : undefined,
  });

  // Listen for toggle sidebar event
  useEffect(() => {
    const handleToggle = () => setIsOpen(prev => !prev);
    window.addEventListener('toggleSidebar', handleToggle);
    return () => window.removeEventListener('toggleSidebar', handleToggle);
  }, []);

  // Auto-collapse on mobile
  useEffect(() => {
    if (deviceType === 'mobile') {
      setIsOpen(false);
    } else if (deviceType === 'desktop') {
      setIsOpen(defaultOpen);
    }
  }, [deviceType, defaultOpen]);

  const sidebarClasses = cn(
    'fixed top-0 h-viewport bg-background border-border z-40 transition-transform duration-300',
    {
      'left-0 border-r': side === 'left',
      'right-0 border-l': side === 'right',
      '-translate-x-full': side === 'left' && !isOpen,
      'translate-x-full': side === 'right' && !isOpen,
      'translate-x-0': isOpen,
      'w-64': deviceType === 'desktop',
      'w-72': deviceType === 'tablet',
      'w-full max-w-xs': deviceType === 'mobile',
    },
    className
  );

  return (
    <>
      {/* Toggle Button - visible on tablet and mobile */}
      {deviceType !== 'desktop' && (
        <Button
          variant="ghost"
          size="icon"
          className={cn(
            'fixed top-4 z-50 touch-target',
            side === 'left' ? 'left-4' : 'right-4'
          )}
          onClick={() => setIsOpen(!isOpen)}
        >
          {isOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </Button>
      )}

      {/* Sidebar */}
      <aside
        ref={sidebarRef}
        className={sidebarClasses}
      >
        {/* Collapse button for tablet */}
        {deviceType === 'tablet' && isOpen && (
          <Button
            variant="ghost"
            size="icon"
            className={cn(
              'absolute top-4 touch-target',
              side === 'left' ? 'right-4' : 'left-4'
            )}
            onClick={() => setIsOpen(false)}
          >
            <ChevronLeft className={cn(
              'h-5 w-5',
              side === 'right' && 'rotate-180'
            )} />
          </Button>
        )}

        <div className="h-full overflow-y-auto safe-area-top safe-area-bottom p-4">
          {children}
        </div>
      </aside>

      {/* Overlay for mobile and tablet */}
      {isOpen && deviceType !== 'desktop' && (
        <div
          className="fixed inset-0 bg-black/50 z-30"
          onClick={() => setIsOpen(false)}
        />
      )}
    </>
  );
}

// Collapsible section for sidebar content
interface CollapsibleSectionProps {
  title: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
  className?: string;
}

export function CollapsibleSection({
  title,
  children,
  defaultOpen = true,
  className,
}: CollapsibleSectionProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  const { deviceType } = useResponsive();

  return (
    <div className={cn('mb-4', className)}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          'w-full flex items-center justify-between p-3 rounded-lg hover:bg-accent transition-colors',
          deviceType !== 'desktop' && 'touch-target'
        )}
      >
        <span className="font-medium">{title}</span>
        <ChevronLeft
          className={cn(
            'h-4 w-4 transition-transform',
            isOpen ? '-rotate-90' : 'rotate-0'
          )}
        />
      </button>
      
      {isOpen && (
        <div className="mt-2 space-y-1">
          {children}
        </div>
      )}
    </div>
  );
}

// Touch-friendly navigation item
interface TouchNavItemProps {
  href?: string;
  onClick?: () => void;
  icon?: React.ReactNode;
  label: string;
  active?: boolean;
  className?: string;
}

export function TouchNavItem({
  href,
  onClick,
  icon,
  label,
  active,
  className,
}: TouchNavItemProps) {
  const { deviceType } = useResponsive();
  const isTouch = deviceType !== 'desktop';

  const handleClick = () => {
    if (onClick) {
      onClick();
    } else if (href) {
      window.location.href = href;
    }
  };

  return (
    <button
      onClick={handleClick}
      className={cn(
        'w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors',
        'hover:bg-accent hover:text-accent-foreground',
        active && 'bg-accent text-accent-foreground',
        isTouch && 'touch-target min-h-[48px]',
        className
      )}
    >
      {icon && (
        <div className="flex-shrink-0">
          {icon}
        </div>
      )}
      <span className="flex-1 text-left">{label}</span>
    </button>
  );
}