"use client";

import React, { useState } from 'react';
import { 
  ResponsiveLayout, 
  MultiColumnLayout, 
  ResponsiveSidebar,
  CollapsibleSection,
  TouchNavItem,
  TouchOptimizedGrid,
  TouchCard,
  MobileLayout,
  MobileHeader,
  MobileActionSheet,
  HoverableCard,
  KeyboardShortcut
} from '@/components/layouts';
import { 
  ResponsiveImage, 
  ResponsiveHeading, 
  ResponsiveText,
  FluidText,
  TruncatedText
} from '@/components/ui';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useResponsive, useSwipeGestures, useLongPress } from '@/hooks';
import { Home, Settings, User, Bell } from 'lucide-react';

export default function ResponsiveTestPage() {
  const { deviceType, orientation, width, height, isOnline } = useResponsive();
  const [showActionSheet, setShowActionSheet] = useState(false);
  const [selectedCard, setSelectedCard] = useState<number | null>(null);
  const containerRef = React.useRef<HTMLDivElement | null>(null);

  // Test swipe gestures
  useSwipeGestures(containerRef as React.RefObject<HTMLElement>, {
    onSwipeLeft: () => console.log('Swiped left'),
    onSwipeRight: () => console.log('Swiped right'),
    onSwipeUp: () => console.log('Swiped up'),
    onSwipeDown: () => console.log('Swiped down'),
  });

  // Test long press
  const longPressProps = useLongPress(() => {
    console.log('Long pressed!');
    setShowActionSheet(true);
  });

  const sidebarContent = (
    <div className="space-y-4">
      <CollapsibleSection title="Navigation">
        <TouchNavItem icon={<Home />} label="Dashboard" href="/dashboard" />
        <TouchNavItem icon={<Settings />} label="Settings" onClick={() => console.log('Settings')} />
        <TouchNavItem icon={<User />} label="Profile" href="/profile" />
      </CollapsibleSection>
      
      <CollapsibleSection title="Notifications">
        <TouchNavItem icon={<Bell />} label="All Notifications" />
        <TouchNavItem icon={<Bell />} label="Unread" active />
      </CollapsibleSection>
    </div>
  );

  const mainContent = (
    <div className="p-4 space-y-8">
      {/* Device Info */}
      <div className="bg-card rounded-lg p-6 border">
        <ResponsiveHeading level={2}>Device Information</ResponsiveHeading>
        <div className="grid grid-cols-2 gap-4 mt-4">
          <div>
            <Badge variant="outline">{deviceType}</Badge>
            <p className="text-sm text-muted-foreground mt-1">Device Type</p>
          </div>
          <div>
            <Badge variant="outline">{orientation}</Badge>
            <p className="text-sm text-muted-foreground mt-1">Orientation</p>
          </div>
          <div>
            <Badge variant="outline">{width}x{height}</Badge>
            <p className="text-sm text-muted-foreground mt-1">Viewport</p>
          </div>
          <div>
            <Badge variant={isOnline ? 'default' : 'destructive'}>
              {isOnline ? 'Online' : 'Offline'}
            </Badge>
            <p className="text-sm text-muted-foreground mt-1">Network</p>
          </div>
        </div>
      </div>

      {/* Typography Test */}
      <div className="space-y-4">
        <ResponsiveHeading level={1}>Responsive Typography Test</ResponsiveHeading>
        <FluidText minSize={16} maxSize={24} as="p">
          This text scales fluidly between 16px and 24px based on viewport width.
        </FluidText>
        <ResponsiveText size="lg" weight="medium">
          This is responsive text that adapts to different screen sizes.
        </ResponsiveText>
        <TruncatedText lines={2}>
          Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.
        </TruncatedText>
      </div>

      {/* Grid Test */}
      <div>
        <ResponsiveHeading level={3} className="mb-4">Touch Optimized Grid</ResponsiveHeading>
        <TouchOptimizedGrid defaultLayout="grid-3">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <TouchCard
              key={i}
              onClick={() => setSelectedCard(i)}
              onLongPress={() => setShowActionSheet(true)}
              selected={selectedCard === i}
            >
              <div className="p-4">
                <ResponsiveImage
                  src={`https://picsum.photos/seed/${i}/400/300`}
                  alt={`Test image ${i}`}
                  aspectRatio="16:9"
                  className="mb-3"
                />
                <ResponsiveText weight="semibold">Card {i}</ResponsiveText>
                <ResponsiveText size="sm" className="text-muted-foreground">
                  Tap to select, long press for options
                </ResponsiveText>
              </div>
            </TouchCard>
          ))}
        </TouchOptimizedGrid>
      </div>

      {/* Desktop-specific features */}
      {deviceType === 'desktop' && (
        <div className="space-y-4">
          <ResponsiveHeading level={3}>Desktop Features</ResponsiveHeading>
          <div className="grid grid-cols-3 gap-4">
            <HoverableCard hoverEffect="lift">
              <div className="p-6 bg-card border rounded-lg">
                <h4 className="font-semibold mb-2">Hover Lift Effect</h4>
                <p className="text-sm text-muted-foreground">
                  This card lifts on hover
                </p>
                <div className="mt-4">
                  <KeyboardShortcut keys={['Ctrl', 'K']} />
                </div>
              </div>
            </HoverableCard>
            
            <HoverableCard hoverEffect="glow">
              <div className="p-6 bg-card border rounded-lg">
                <h4 className="font-semibold mb-2">Hover Glow Effect</h4>
                <p className="text-sm text-muted-foreground">
                  This card glows on hover
                </p>
                <div className="mt-4">
                  <KeyboardShortcut keys={['Alt', '1']} />
                </div>
              </div>
            </HoverableCard>
            
            <HoverableCard hoverEffect="scale">
              <div className="p-6 bg-card border rounded-lg">
                <h4 className="font-semibold mb-2">Hover Scale Effect</h4>
                <p className="text-sm text-muted-foreground">
                  This card scales on hover
                </p>
                <div className="mt-4">
                  <KeyboardShortcut keys={['Ctrl', '/']} />
                </div>
              </div>
            </HoverableCard>
          </div>
        </div>
      )}

      {/* Swipe test area */}
      <div 
        ref={containerRef}
        className="bg-muted rounded-lg p-8 text-center swipeable"
        {...longPressProps}
      >
        <ResponsiveText size="lg" weight="semibold">
          Interactive Touch Area
        </ResponsiveText>
        <ResponsiveText size="sm" className="text-muted-foreground mt-2">
          {deviceType === 'mobile' || deviceType === 'tablet' 
            ? 'Try swiping in any direction or long press'
            : 'Touch gestures work best on mobile devices'
          }
        </ResponsiveText>
      </div>
    </div>
  );

  // Different layouts based on device
  if (deviceType === 'mobile') {
    return (
      <MobileLayout
        header={<MobileHeader title="Responsive Test" showBack />}
        showBottomNav={true}
      >
        {mainContent}
        
        <MobileActionSheet
          open={showActionSheet}
          onClose={() => setShowActionSheet(false)}
          title="Options"
        >
          <div className="space-y-2">
            <Button variant="outline" className="w-full justify-start">
              Share
            </Button>
            <Button variant="outline" className="w-full justify-start">
              Edit
            </Button>
            <Button variant="outline" className="w-full justify-start text-destructive">
              Delete
            </Button>
          </div>
        </MobileActionSheet>
      </MobileLayout>
    );
  }

  if (deviceType === 'tablet') {
    return (
      <ResponsiveLayout>
        <div className="flex h-viewport">
          <ResponsiveSidebar defaultOpen={false}>
            {sidebarContent}
          </ResponsiveSidebar>
          <main className="flex-1 overflow-y-auto">
            {mainContent}
          </main>
        </div>
      </ResponsiveLayout>
    );
  }

  // Desktop layout
  return (
    <ResponsiveLayout>
      <MultiColumnLayout
        sidebar={sidebarContent}
        main={mainContent}
        aside={
          <div className="p-4">
            <ResponsiveHeading level={4}>Quick Actions</ResponsiveHeading>
            <div className="space-y-2 mt-4">
              <Button className="w-full">Create New</Button>
              <Button variant="outline" className="w-full">Import</Button>
              <Button variant="outline" className="w-full">Export</Button>
            </div>
          </div>
        }
      />
    </ResponsiveLayout>
  );
}