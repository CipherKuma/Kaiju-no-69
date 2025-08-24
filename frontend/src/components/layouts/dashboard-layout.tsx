"use client";

import React, { ReactNode, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Navigation, NavItem } from "./navigation";
import { PageHeader } from "./page-header";
import { 
  Home, 
  Users, 
  Trophy, 
  ChartBar, 
  Settings, 
  HelpCircle,
  ChevronLeft,
  Menu,
  X,
  Zap,
  Shield,
  Coins,
  Swords,
  Target
} from "lucide-react";

interface DashboardLayoutProps {
  children: ReactNode;
  title?: string;
  subtitle?: string;
  actions?: ReactNode;
}

const sidebarItems: NavItem[] = [
  { 
    name: "Overview", 
    href: "/dashboard", 
    icon: <Home className="w-5 h-5" />,
    color: "text-purple-400"
  },
  { 
    name: "My Kaijus", 
    href: "/dashboard/kaijus", 
    icon: <Users className="w-5 h-5" />, 
    badge: 12,
    color: "text-green-400"
  },
  { 
    name: "Shadow Army", 
    href: "/dashboard/shadows", 
    icon: <Shield className="w-5 h-5" />, 
    badge: 156,
    color: "text-red-400"
  },
  { 
    name: "Battle History", 
    href: "/dashboard/battles", 
    icon: <Swords className="w-5 h-5" />,
    color: "text-yellow-400"
  },
  { 
    name: "Trading", 
    href: "/dashboard/trading", 
    icon: <Coins className="w-5 h-5" />,
    color: "text-blue-400"
  },
  { 
    name: "Achievements", 
    href: "/dashboard/achievements", 
    icon: <Trophy className="w-5 h-5" />, 
    badge: "NEW",
    color: "text-indigo-400"
  },
  { 
    name: "Settings", 
    href: "/dashboard/settings", 
    icon: <Settings className="w-5 h-5" /> 
  },
];

export function DashboardLayout({
  children,
  title = "Dashboard",
  subtitle,
  actions,
}: DashboardLayoutProps) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-gray-900">
      {/* Desktop Layout */}
      <div className="hidden md:flex">
        {/* Sidebar */}
        <AnimatePresence mode="wait">
          {isSidebarOpen && (
            <motion.aside
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: 280, opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="bg-stone-800 border-r border-purple-500/20 overflow-hidden"
            >
              <div className="p-6">
                <div className="flex items-center justify-between mb-8">
                  <h2 className="font-orbitron font-bold text-xl text-purple-400">
                    Command Center
                  </h2>
                  <button
                    onClick={() => setIsSidebarOpen(false)}
                    className="p-2 rounded-lg text-gray-400 hover:text-purple-400 hover:bg-purple-500/10 transition-all"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                </div>
                
                <Navigation
                  items={sidebarItems}
                  orientation="vertical"
                  variant="primary"
                />
              </div>
            </motion.aside>
          )}
        </AnimatePresence>

        {/* Main Content */}
        <div className="flex-1 flex flex-col">
          {/* Collapsed Sidebar Toggle */}
          {!isSidebarOpen && (
            <button
              onClick={() => setIsSidebarOpen(true)}
              className="fixed left-4 top-4 z-40 p-2 bg-stone-800 rounded-lg text-gray-400 hover:text-purple-400 transition-colors"
            >
              <ChevronLeft className="w-5 h-5 rotate-180" />
            </button>
          )}

          {/* Page Header */}
          <PageHeader title={title} subtitle={subtitle} actions={actions} />

          {/* Page Content */}
          <main className="flex-1 p-6 overflow-auto">
            {children}
          </main>
        </div>
      </div>

      {/* Tablet Layout (Collapsible Sidebar) */}
      <div className="hidden sm:flex md:hidden">
        {/* Collapsible Sidebar */}
        <AnimatePresence>
          {isSidebarOpen && (
            <motion.aside
              initial={{ x: -280 }}
              animate={{ x: 0 }}
              exit={{ x: -280 }}
              transition={{ duration: 0.3 }}
              className="fixed left-0 top-0 h-full w-72 bg-stone-800 border-r border-purple-500/20 z-40"
            >
              <div className="p-6">
                <div className="flex items-center justify-between mb-8">
                  <h2 className="font-orbitron font-bold text-xl text-purple-400">
                    Command Center
                  </h2>
                  <button
                    onClick={() => setIsSidebarOpen(false)}
                    className="text-gray-400 hover:text-purple-400 transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
                
                <Navigation
                  items={sidebarItems}
                  orientation="vertical"
                  variant="primary"
                />
              </div>
            </motion.aside>
          )}
        </AnimatePresence>

        {/* Overlay */}
        {isSidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsSidebarOpen(false)}
            className="fixed inset-0 bg-black/50 z-30"
          />
        )}

        {/* Main Content */}
        <div className="flex-1 flex flex-col">
          <button
            onClick={() => setIsSidebarOpen(true)}
            className="fixed left-4 top-4 z-20 p-2 bg-stone-800 rounded-lg text-gray-400 hover:text-purple-400 transition-colors"
          >
            <Menu className="w-5 h-5" />
          </button>

          <PageHeader title={title} subtitle={subtitle} actions={actions} className="pl-16" />
          
          <main className="flex-1 p-6 overflow-auto">
            {children}
          </main>
        </div>
      </div>

      {/* Mobile Layout (Stacked) */}
      <div className="sm:hidden">
        {/* Mobile Header */}
        <header className="sticky top-0 z-30 bg-stone-800 border-b border-purple-500/20 px-4 py-3">
          <div className="flex items-center justify-between">
            <button
              onClick={() => setIsMobileSidebarOpen(true)}
              className="text-gray-400 hover:text-purple-400 transition-colors"
            >
              <Menu className="w-6 h-6" />
            </button>
            
            <h1 className="font-orbitron font-bold text-lg text-purple-400">
              {title}
            </h1>
            
            <div className="w-6" /> {/* Spacer for centering */}
          </div>
        </header>

        {/* Mobile Sidebar */}
        <AnimatePresence>
          {isMobileSidebarOpen && (
            <>
              <motion.aside
                initial={{ x: -280 }}
                animate={{ x: 0 }}
                exit={{ x: -280 }}
                transition={{ duration: 0.3 }}
                className="fixed left-0 top-0 h-full w-72 bg-stone-800 z-50"
              >
                <div className="p-4">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="font-orbitron font-bold text-xl text-purple-400">
                      Menu
                    </h2>
                    <button
                      onClick={() => setIsMobileSidebarOpen(false)}
                      className="text-gray-400 hover:text-purple-400 transition-colors"
                    >
                      <X className="w-6 h-6" />
                    </button>
                  </div>
                  
                  <Navigation
                    items={sidebarItems}
                    orientation="vertical"
                    variant="primary"
                  />
                </div>
              </motion.aside>

              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setIsMobileSidebarOpen(false)}
                className="fixed inset-0 bg-black/50 z-40"
              />
            </>
          )}
        </AnimatePresence>

        {/* Mobile Content */}
        <main className="p-4 pb-20">
          {subtitle && (
            <p className="text-gray-400 text-sm mb-4">{subtitle}</p>
          )}
          {children}
        </main>
      </div>
    </div>
  );
}