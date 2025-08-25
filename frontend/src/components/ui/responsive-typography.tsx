"use client";

import React, { useState } from 'react';
import { cn } from '@/lib/utils';
import { useResponsive } from '@/hooks';

interface ResponsiveTextProps {
  children: React.ReactNode;
  className?: string;
  as?: 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6' | 'p' | 'span' | 'div';
  size?: 'xs' | 'sm' | 'base' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl' | '5xl';
  weight?: 'normal' | 'medium' | 'semibold' | 'bold';
  align?: 'left' | 'center' | 'right' | 'justify';
  clamp?: boolean;
}

export function ResponsiveText({
  children,
  className,
  as: Component = 'p',
  size = 'base',
  weight = 'normal',
  align = 'left',
  clamp = false,
}: ResponsiveTextProps) {
  const { deviceType: _deviceType } = useResponsive();

  const sizeClasses = {
    xs: 'text-xs sm:text-sm',
    sm: 'text-sm sm:text-base',
    base: 'text-base sm:text-lg',
    lg: 'text-lg sm:text-xl lg:text-2xl',
    xl: 'text-xl sm:text-2xl lg:text-3xl',
    '2xl': 'text-2xl sm:text-3xl lg:text-4xl',
    '3xl': 'text-3xl sm:text-4xl lg:text-5xl',
    '4xl': 'text-4xl sm:text-5xl lg:text-6xl',
    '5xl': 'text-5xl sm:text-6xl lg:text-7xl',
  };

  const weightClasses = {
    normal: 'font-normal',
    medium: 'font-medium',
    semibold: 'font-semibold',
    bold: 'font-bold',
  };

  const alignClasses = {
    left: 'text-left',
    center: 'text-center',
    right: 'text-right',
    justify: 'text-justify',
  };

  return (
    <Component
      className={cn(
        sizeClasses[size],
        weightClasses[weight],
        alignClasses[align],
        clamp && 'line-clamp-3',
        className
      )}
    >
      {children}
    </Component>
  );
}

// Fluid typography with CSS clamp
interface FluidTextProps {
  children: React.ReactNode;
  className?: string;
  as?: 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6' | 'p' | 'span' | 'div';
  minSize: number;
  maxSize: number;
  minViewport?: number;
  maxViewport?: number;
}

export function FluidText({
  children,
  className,
  as: Component = 'p',
  minSize,
  maxSize,
  minViewport = 320,
  maxViewport = 1200,
}: FluidTextProps) {
  // Calculate fluid typography
  const slope = (maxSize - minSize) / (maxViewport - minViewport);
  const yAxisIntersection = -minViewport * slope + minSize;
  
  const clampValue = `clamp(${minSize}px, ${yAxisIntersection}px + ${slope * 100}vw, ${maxSize}px)`;

  return (
    <Component
      className={className}
      style={{ fontSize: clampValue }}
    >
      {children}
    </Component>
  );
}

// Responsive heading component
interface ResponsiveHeadingProps {
  children: React.ReactNode;
  level: 1 | 2 | 3 | 4 | 5 | 6;
  className?: string;
  responsive?: boolean;
}

export function ResponsiveHeading({
  children,
  level,
  className,
  responsive = true,
}: ResponsiveHeadingProps) {
  const Tag = `h${level}` as keyof React.JSX.IntrinsicElements;

  const headingClasses = {
    1: responsive ? 'text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold' : 'text-5xl font-bold',
    2: responsive ? 'text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold' : 'text-4xl font-bold',
    3: responsive ? 'text-xl sm:text-2xl md:text-3xl lg:text-4xl font-semibold' : 'text-3xl font-semibold',
    4: responsive ? 'text-lg sm:text-xl md:text-2xl lg:text-3xl font-semibold' : 'text-2xl font-semibold',
    5: responsive ? 'text-base sm:text-lg md:text-xl lg:text-2xl font-medium' : 'text-xl font-medium',
    6: responsive ? 'text-sm sm:text-base md:text-lg lg:text-xl font-medium' : 'text-lg font-medium',
  };

  return (
    <Tag className={cn(headingClasses[level], 'font-heading', className)}>
      {children}
    </Tag>
  );
}

// Truncated text with responsive behavior
interface TruncatedTextProps {
  children: string;
  lines?: number;
  showFullOnMobile?: boolean;
  className?: string;
}

export function TruncatedText({
  children,
  lines = 3,
  showFullOnMobile = false,
  className,
}: TruncatedTextProps) {
  const { deviceType } = useResponsive();
  const [isExpanded, setIsExpanded] = useState(false);

  const shouldTruncate = !isExpanded && !(showFullOnMobile && deviceType === 'mobile');

  return (
    <div className={className}>
      <p
        className={cn(
          shouldTruncate && `line-clamp-${lines}`,
          'transition-all duration-300'
        )}
      >
        {children}
      </p>
      {children.length > 150 && (
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="text-primary hover:underline text-sm mt-1"
        >
          {isExpanded ? 'Show less' : 'Show more'}
        </button>
      )}
    </div>
  );
}

// Responsive font scale provider
interface FontScaleProviderProps {
  children: React.ReactNode;
  scale?: number;
}

export function FontScaleProvider({ children, scale = 1 }: FontScaleProviderProps) {
  const { deviceType } = useResponsive();
  
  // Adjust scale based on device
  const deviceScale = {
    mobile: scale * 0.9,
    tablet: scale,
    desktop: scale * 1.1,
  };

  return (
    <div
      style={{
        fontSize: `${deviceScale[deviceType]}rem`,
      }}
    >
      {children}
    </div>
  );
}