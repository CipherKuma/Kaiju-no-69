"use client";

import React, { useState } from 'react';
import { useResponsive, useLongPress } from '@/hooks';
import { cn } from '@/lib/utils';
import { Grip, Grid3X3, Grid2X2, List } from 'lucide-react';
import { Button } from '@/components/ui/button';

export type GridLayout = 'list' | 'grid-2' | 'grid-3' | 'grid-4';

interface TouchOptimizedGridProps {
  children: React.ReactNode;
  defaultLayout?: GridLayout;
  allowLayoutChange?: boolean;
  className?: string;
  gap?: 'sm' | 'md' | 'lg';
}

export function TouchOptimizedGrid({
  children,
  defaultLayout = 'grid-3',
  allowLayoutChange = true,
  className,
  gap = 'md',
}: TouchOptimizedGridProps) {
  const { deviceType } = useResponsive();
  const [layout, setLayout] = useState<GridLayout>(() => {
    // Auto-adjust default layout based on device
    if (deviceType === 'mobile') return 'list';
    if (deviceType === 'tablet') return defaultLayout === 'grid-4' ? 'grid-2' : defaultLayout;
    return defaultLayout;
  });

  const gapClasses = {
    sm: 'gap-2',
    md: 'gap-4',
    lg: 'gap-6',
  };

  const gridClasses = {
    list: 'flex flex-col',
    'grid-2': 'grid grid-cols-2',
    'grid-3': 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3',
    'grid-4': 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4',
  };

  return (
    <div className={className}>
      {/* Layout switcher for tablet/desktop */}
      {allowLayoutChange && deviceType !== 'mobile' && (
        <div className="flex items-center justify-end mb-4 gap-2">
          <Button
            variant={layout === 'list' ? 'default' : 'outline'}
            size="icon"
            onClick={() => setLayout('list')}
            className="touch-target"
          >
            <List className="h-4 w-4" />
          </Button>
          <Button
            variant={layout === 'grid-2' ? 'default' : 'outline'}
            size="icon"
            onClick={() => setLayout('grid-2')}
            className="touch-target"
          >
            <Grid2X2 className="h-4 w-4" />
          </Button>
          <Button
            variant={layout === 'grid-3' ? 'default' : 'outline'}
            size="icon"
            onClick={() => setLayout('grid-3')}
            className="touch-target"
          >
            <Grid3X3 className="h-4 w-4" />
          </Button>
          {deviceType === 'desktop' && (
            <Button
              variant={layout === 'grid-4' ? 'default' : 'outline'}
              size="icon"
              onClick={() => setLayout('grid-4')}
            >
              <Grip className="h-4 w-4" />
            </Button>
          )}
        </div>
      )}

      <div className={cn(gridClasses[layout], gapClasses[gap])}>
        {children}
      </div>
    </div>
  );
}

// Touch-optimized card component
interface TouchCardProps {
  children: React.ReactNode;
  onClick?: () => void;
  onLongPress?: () => void;
  className?: string;
  selected?: boolean;
}

export function TouchCard({
  children,
  onClick,
  onLongPress,
  className,
  selected,
}: TouchCardProps) {
  const { deviceType } = useResponsive();
  const [isPressed, setIsPressed] = useState(false);

  const longPressProps = useLongPress(() => {
    if (onLongPress) {
      onLongPress();
      // Haptic feedback for supported devices
      if ('vibrate' in navigator) {
        navigator.vibrate(50);
      }
    }
  });

  const handleClick = () => {
    if (onClick && !isPressed) {
      onClick();
    }
    setIsPressed(false);
  };

  return (
    <div
      className={cn(
        'relative rounded-lg border bg-card transition-all duration-200',
        'active:scale-95',
        selected && 'ring-2 ring-primary',
        deviceType !== 'desktop' && 'touch-manipulation',
        className
      )}
      onClick={handleClick}
      {...(onLongPress ? longPressProps : {})}
      onTouchStart={() => setIsPressed(true)}
      onTouchEnd={() => setTimeout(() => setIsPressed(false), 100)}
    >
      {children}
      
      {/* Visual feedback for touch */}
      {isPressed && deviceType !== 'desktop' && (
        <div className="absolute inset-0 bg-black/5 rounded-lg pointer-events-none" />
      )}
    </div>
  );
}

// Draggable grid items for tablet
interface DraggableGridProps {
  items: Array<{ id: string; content: React.ReactNode }>;
  onReorder?: (newOrder: string[]) => void;
  className?: string;
}

export function DraggableGrid({
  items,
  onReorder,
  className,
}: DraggableGridProps) {
  const { deviceType } = useResponsive();
  const [draggedItem, setDraggedItem] = useState<string | null>(null);
  const [draggedOver, setDraggedOver] = useState<string | null>(null);

  const handleDragStart = (id: string) => {
    setDraggedItem(id);
    // Haptic feedback
    if ('vibrate' in navigator) {
      navigator.vibrate(50);
    }
  };

  const handleDragOver = (e: React.DragEvent, id: string) => {
    e.preventDefault();
    setDraggedOver(id);
  };

  const handleDrop = (e: React.DragEvent, dropId: string) => {
    e.preventDefault();
    
    if (draggedItem && draggedItem !== dropId) {
      const dragIndex = items.findIndex(item => item.id === draggedItem);
      const dropIndex = items.findIndex(item => item.id === dropId);
      
      const newOrder = [...items];
      const [removed] = newOrder.splice(dragIndex, 1);
      newOrder.splice(dropIndex, 0, removed);
      
      onReorder?.(newOrder.map(item => item.id));
    }
    
    setDraggedItem(null);
    setDraggedOver(null);
  };

  if (deviceType === 'mobile') {
    // Simple list for mobile
    return (
      <div className={cn('space-y-4', className)}>
        {items.map(item => (
          <div key={item.id}>{item.content}</div>
        ))}
      </div>
    );
  }

  return (
    <div className={cn('grid grid-cols-2 lg:grid-cols-3 gap-4', className)}>
      {items.map(item => (
        <div
          key={item.id}
          draggable={deviceType === 'tablet'}
          onDragStart={() => handleDragStart(item.id)}
          onDragOver={(e) => handleDragOver(e, item.id)}
          onDrop={(e) => handleDrop(e, item.id)}
          className={cn(
            'cursor-move transition-opacity',
            draggedItem === item.id && 'opacity-50',
            draggedOver === item.id && 'ring-2 ring-primary'
          )}
        >
          {item.content}
        </div>
      ))}
    </div>
  );
}