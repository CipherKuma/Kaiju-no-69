"use client";

import React from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useResponsive } from '@/hooks';
import { cn } from '@/lib/utils';
import { 
  Home, 
  ShoppingBag, 
  Castle, 
  User,
  Gamepad2
} from 'lucide-react';

interface NavItem {
  icon: React.ReactNode;
  label: string;
  href: string;
}

const navItems: NavItem[] = [
  {
    icon: <Home className="h-5 w-5" />,
    label: 'Home',
    href: '/dashboard',
  },
  {
    icon: <Castle className="h-5 w-5" />,
    label: 'Kingdoms',
    href: '/kingdoms',
  },
  {
    icon: <Gamepad2 className="h-5 w-5" />,
    label: 'Play',
    href: '/play',
  },
  {
    icon: <ShoppingBag className="h-5 w-5" />,
    label: 'Market',
    href: '/marketplace',
  },
  {
    icon: <User className="h-5 w-5" />,
    label: 'Profile',
    href: '/profile',
  },
];

export function MobileBottomNav() {
  const pathname = usePathname();
  const router = useRouter();
  const { deviceType } = useResponsive();

  if (deviceType !== 'mobile') return null;

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-background border-t border-border safe-area-bottom z-40">
      <div className="flex items-center justify-around">
        {navItems.map((item) => {
          const isActive = pathname.startsWith(item.href);
          
          return (
            <button
              key={item.href}
              onClick={() => router.push(item.href)}
              className={cn(
                'flex flex-col items-center gap-1 py-2 px-3 flex-1',
                'transition-colors touch-manipulation',
                isActive 
                  ? 'text-primary' 
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              {item.icon}
              <span className="text-xs">{item.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}

// Mobile-optimized header with simplified controls
interface MobileHeaderProps {
  title?: string;
  showBack?: boolean;
  actions?: React.ReactNode;
  className?: string;
}

export function MobileHeader({
  title,
  showBack,
  actions,
  className,
}: MobileHeaderProps) {
  const router = useRouter();
  const { deviceType } = useResponsive();

  if (deviceType !== 'mobile') return null;

  return (
    <header className={cn(
      'sticky top-0 z-30 bg-background border-b border-border',
      'safe-area-top',
      className
    )}>
      <div className="flex items-center justify-between h-14 px-4">
        <div className="flex items-center gap-2">
          {showBack && (
            <button
              onClick={() => router.back()}
              className="p-2 -ml-2 touch-target"
            >
              <svg
                className="h-5 w-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 19l-7-7 7-7"
                />
              </svg>
            </button>
          )}
          {title && (
            <h1 className="font-semibold text-lg truncate">{title}</h1>
          )}
        </div>
        
        {actions && (
          <div className="flex items-center gap-1">
            {actions}
          </div>
        )}
      </div>
    </header>
  );
}

// Stacked mobile layout wrapper
interface MobileLayoutProps {
  header?: React.ReactNode;
  children: React.ReactNode;
  showBottomNav?: boolean;
  className?: string;
}

export function MobileLayout({
  header,
  children,
  showBottomNav = true,
  className,
}: MobileLayoutProps) {
  const { deviceType } = useResponsive();

  if (deviceType !== 'mobile') {
    return <>{children}</>;
  }

  return (
    <div className="min-h-viewport flex flex-col">
      {header}
      
      <main className={cn(
        'flex-1 overflow-y-auto',
        showBottomNav && 'pb-16', // Account for bottom nav
        className
      )}>
        {children}
      </main>
      
      {showBottomNav && <MobileBottomNav />}
    </div>
  );
}

// Pull-to-refresh wrapper for mobile
interface PullToRefreshWrapperProps {
  children: React.ReactNode;
  onRefresh: () => Promise<void>;
  className?: string;
}

export function PullToRefreshWrapper({
  children,
  onRefresh,
  className,
}: PullToRefreshWrapperProps) {
  const { isPulling, pullDistance } = usePullToRefresh(onRefresh);
  const { deviceType } = useResponsive();

  if (deviceType !== 'mobile') {
    return <>{children}</>;
  }

  return (
    <div className={cn('relative pull-to-refresh', className)}>
      {/* Pull indicator */}
      <div
        className={cn(
          'absolute top-0 left-0 right-0 flex items-center justify-center',
          'transition-all duration-200',
          isPulling ? 'opacity-100' : 'opacity-0'
        )}
        style={{
          height: `${pullDistance}px`,
          transform: `translateY(-${pullDistance}px)`,
        }}
      >
        <div className={cn(
          'w-8 h-8 rounded-full border-2 border-primary',
          isPulling && 'animate-spin'
        )} />
      </div>
      
      {/* Content */}
      <div
        style={{
          transform: `translateY(${pullDistance}px)`,
          transition: pullDistance === 0 ? 'transform 0.2s' : 'none',
        }}
      >
        {children}
      </div>
    </div>
  );
}

// Simplified mobile form controls
interface MobileFormFieldProps {
  label: string;
  children: React.ReactNode;
  error?: string;
  className?: string;
}

export function MobileFormField({
  label,
  children,
  error,
  className,
}: MobileFormFieldProps) {
  return (
    <div className={cn('mb-4', className)}>
      <label className="block text-sm font-medium mb-2">
        {label}
      </label>
      <div className="relative">
        {children}
      </div>
      {error && (
        <p className="mt-1 text-sm text-destructive">{error}</p>
      )}
    </div>
  );
}

// Mobile action sheet component
interface MobileActionSheetProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
}

export function MobileActionSheet({
  open,
  onClose,
  title,
  children,
}: MobileActionSheetProps) {
  const { deviceType } = useResponsive();

  if (!open || deviceType !== 'mobile') return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 z-40"
        onClick={onClose}
      />
      
      {/* Sheet */}
      <div className={cn(
        'fixed bottom-0 left-0 right-0 z-50',
        'bg-background rounded-t-2xl',
        'safe-area-bottom animate-in slide-in-from-bottom'
      )}>
        {/* Handle */}
        <div className="flex justify-center pt-3 pb-2">
          <div className="w-12 h-1 bg-muted rounded-full" />
        </div>
        
        {title && (
          <h3 className="px-6 pb-4 text-lg font-semibold">
            {title}
          </h3>
        )}
        
        <div className="px-6 pb-6 max-h-[60vh] overflow-y-auto">
          {children}
        </div>
      </div>
    </>
  );
}

import { usePullToRefresh } from '@/hooks/use-gestures';