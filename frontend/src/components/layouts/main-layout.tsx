"use client";

import React, { ReactNode, useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Wallet, Menu, X, Home, Castle, ShoppingCart, Swords } from "lucide-react";
import { useNotifications } from "@/components/ui/notification";

interface MainLayoutProps {
  children: ReactNode;
}

interface NavItem {
  name: string;
  href: string;
  icon: React.ReactNode;
  badge?: number;
}

const navItems: NavItem[] = [
  { name: "Dashboard", href: "/dashboard", icon: <Home className="w-5 h-5" /> },
  { name: "Kingdoms", href: "/kingdoms", icon: <Castle className="w-5 h-5" /> },
  { name: "Marketplace", href: "/marketplace", icon: <ShoppingCart className="w-5 h-5" />, badge: 3 },
  { name: "Battle", href: "/game", icon: <Swords className="w-5 h-5" /> },
];

export function MainLayout({ children }: MainLayoutProps) {
  const pathname = usePathname();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [walletConnected, setWalletConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isOnline, setIsOnline] = useState(true);
  const { showNotification } = useNotifications();

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      showNotification({
        type: 'success',
        title: 'Connection restored',
        message: 'You are back online',
      });
    };

    const handleOffline = () => {
      setIsOnline(false);
      showNotification({
        type: 'error',
        title: 'Connection lost',
        message: 'Please check your internet connection',
        duration: 0,
      });
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [showNotification]);

  const handleWalletConnect = async () => {
    setIsLoading(true);
    
    try {
      // TODO: Implement actual wallet connection
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      if (!walletConnected) {
        setWalletConnected(true);
        showNotification({
          type: 'success',
          title: 'Wallet connected',
          message: 'Successfully connected to 0x1234...5678',
          action: {
            label: 'View account',
            onClick: () => console.log('View account'),
          },
        });
      } else {
        setWalletConnected(false);
        showNotification({
          type: 'info',
          title: 'Wallet disconnected',
          message: 'You have been disconnected from your wallet',
        });
      }
    } catch (error) {
      showNotification({
        type: 'error',
        title: 'Connection failed',
        message: 'Failed to connect wallet. Please try again.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900">
      {/* Offline Banner */}
      <AnimatePresence>
        {!isOnline && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="bg-red-500 text-white text-center py-2 text-sm font-medium"
          >
            You are currently offline
          </motion.div>
        )}
      </AnimatePresence>

      {/* Desktop Navigation Header */}
      <header className="hidden md:block sticky top-0 z-40 bg-gray-900/80 backdrop-blur-lg border-b border-purple-500/20">
        <nav className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            {/* Logo */}
            <Link href="/" className="flex items-center space-x-3 group">
              <motion.div
                whileHover={{ rotate: 10, scale: 1.1 }}
                transition={{ type: "spring", stiffness: 400 }}
                className="text-3xl"
              >
                🦖
              </motion.div>
              <h1 className="font-pixel text-xl text-purple-400 group-hover:text-purple-300 transition-colors">
                Kaiju No. 69
              </h1>
            </Link>

            {/* Navigation Links */}
            <div className="flex items-center space-x-6">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`relative flex items-center space-x-2 px-4 py-2 rounded-lg transition-all duration-200 ${
                    pathname === item.href
                      ? "bg-purple-500/20 text-purple-400"
                      : "text-gray-400 hover:text-purple-400 hover:bg-purple-500/10"
                  }`}
                >
                  {item.icon}
                  <span className="font-orbitron">{item.name}</span>
                  {item.badge && (
                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                      {item.badge}
                    </span>
                  )}
                </Link>
              ))}
            </div>

            {/* Wallet Connection */}
            <button
              onClick={handleWalletConnect}
              disabled={isLoading}
              className={`flex items-center space-x-2 px-6 py-2.5 rounded-lg font-orbitron font-bold transition-all duration-200 ${
                walletConnected
                  ? "bg-green-500/20 text-green-400 border border-green-500/50 hover:bg-green-500/30"
                  : "bg-purple-500/20 text-purple-400 border border-purple-500/50 hover:bg-purple-500/30"
              } ${isLoading ? "opacity-50 cursor-not-allowed" : ""}`}
            >
              {isLoading ? (
                <>
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                    className="w-4 h-4 border-2 border-current border-t-transparent rounded-full"
                  />
                  <span>Connecting...</span>
                </>
              ) : (
                <>
                  <Wallet className="w-4 h-4" />
                  <span>{walletConnected ? "0x1234...5678" : "Connect Wallet"}</span>
                </>
              )}
            </button>
          </div>
        </nav>
      </header>

      {/* Mobile Top Bar */}
      <header className="md:hidden sticky top-0 z-40 bg-gray-900/80 backdrop-blur-lg border-b border-purple-500/20">
        <div className="flex items-center justify-between px-4 py-3">
          <Link href="/" className="flex items-center space-x-2">
            <span className="text-2xl">🦖</span>
            <h1 className="font-pixel text-sm text-purple-400">KN69</h1>
          </Link>
          
          <div className="flex items-center space-x-3">
            <button
              onClick={handleWalletConnect}
              disabled={isLoading}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-md font-orbitron text-xs font-bold transition-all duration-200 ${
                walletConnected
                  ? "bg-green-500/20 text-green-400"
                  : "bg-purple-500/20 text-purple-400"
              }`}
            >
              <Wallet className="w-3.5 h-3.5" />
              <span>{walletConnected ? "0x12...78" : "Connect"}</span>
            </button>

            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="p-2 rounded-md text-gray-400 hover:text-purple-400 hover:bg-purple-500/10 transition-all"
            >
              {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Menu Overlay */}
        <AnimatePresence>
          {isMobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="absolute top-full left-0 right-0 bg-gray-900/95 backdrop-blur-lg border-b border-purple-500/20"
            >
              <div className="p-4 space-y-2">
                {navItems.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-all duration-200 ${
                      pathname === item.href
                        ? "bg-purple-500/20 text-purple-400"
                        : "text-gray-400 hover:text-purple-400 hover:bg-purple-500/10"
                    }`}
                  >
                    {item.icon}
                    <span className="font-orbitron">{item.name}</span>
                    {item.badge && (
                      <span className="ml-auto bg-red-500 text-white text-xs rounded-full px-2 py-0.5">
                        {item.badge}
                      </span>
                    )}
                  </Link>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      {/* Main Content Area with Loading States */}
      <main className="flex-1 pb-20 md:pb-0">
        <AnimatePresence mode="wait">
          <motion.div
            key={pathname}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
          >
            {children}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Mobile Bottom Navigation */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-gray-900/90 backdrop-blur-lg border-t border-purple-500/20 safe-area-bottom">
        <div className="grid grid-cols-4 gap-1 px-2 py-2">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`relative flex flex-col items-center justify-center py-2 rounded-lg transition-all duration-200 ${
                pathname === item.href
                  ? "bg-purple-500/20 text-purple-400"
                  : "text-gray-400 active:scale-95"
              }`}
            >
              <div className="relative">
                {item.icon}
                {item.badge && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] rounded-full w-4 h-4 flex items-center justify-center">
                    {item.badge}
                  </span>
                )}
              </div>
              <span className="text-[10px] font-orbitron mt-1">{item.name}</span>
            </Link>
          ))}
        </div>
      </nav>
    </div>
  );
}