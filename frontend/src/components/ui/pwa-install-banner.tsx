"use client";

import React, { useState } from 'react';
import { usePWA } from '@/hooks/use-pwa';
import { X, Download, Smartphone } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function PWAInstallBanner() {
  const { isInstallable, promptInstall } = usePWA();
  const [isDismissed, setIsDismissed] = useState(false);

  if (!isInstallable || isDismissed) return null;

  const handleInstall = async () => {
    const installed = await promptInstall();
    if (installed) {
      // Track installation
      console.log('App installed successfully');
    }
  };

  return (
    <div className="fixed bottom-20 left-4 right-4 sm:left-auto sm:right-4 sm:w-96 z-50 animate-in slide-in-from-bottom">
      <div className="bg-card border rounded-lg shadow-lg p-4">
        <div className="flex items-start gap-3">
          <div className="p-2 bg-primary/10 rounded-lg">
            <Smartphone className="h-6 w-6 text-primary" />
          </div>
          
          <div className="flex-1">
            <h3 className="font-semibold mb-1">Install Kaiju No. 69</h3>
            <p className="text-sm text-muted-foreground mb-3">
              Install our app for a better experience with offline access and push notifications.
            </p>
            
            <div className="flex gap-2">
              <Button
                size="sm"
                onClick={handleInstall}
                className="gap-2"
              >
                <Download className="h-4 w-4" />
                Install
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setIsDismissed(true)}
              >
                Not Now
              </Button>
            </div>
          </div>
          
          <button
            onClick={() => setIsDismissed(true)}
            className="text-muted-foreground hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

// Update available banner
export function PWAUpdateBanner() {
  const { isUpdateAvailable, updateApp } = usePWA();
  const [isDismissed, setIsDismissed] = useState(false);

  if (!isUpdateAvailable || isDismissed) return null;

  return (
    <div className="fixed top-0 left-0 right-0 bg-primary text-primary-foreground p-3 text-center z-50">
      <div className="container mx-auto flex items-center justify-center gap-4">
        <p className="text-sm font-medium">
          A new version of Kaiju No. 69 is available!
        </p>
        <div className="flex gap-2">
          <Button
            size="sm"
            variant="secondary"
            onClick={updateApp}
          >
            Update Now
          </Button>
          <button
            onClick={() => setIsDismissed(true)}
            className="text-primary-foreground/80 hover:text-primary-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

// Offline indicator
export function OfflineIndicator() {
  const { isOnline } = usePWA();

  if (isOnline) return null;

  return (
    <div className="fixed top-0 left-0 right-0 bg-warning text-warning-foreground p-2 text-center z-50">
      <p className="text-sm font-medium">
        You are currently offline. Some features may be limited.
      </p>
    </div>
  );
}