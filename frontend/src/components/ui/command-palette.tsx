"use client";

import React, { useState, useEffect, useRef } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import { 
  Search, 
  Home, 
  ShoppingBag, 
  Castle, 
  Settings,
  HelpCircle,
  Command,
  ArrowRight
} from 'lucide-react';

interface CommandItem {
  id: string;
  title: string;
  description?: string;
  icon?: React.ReactNode;
  shortcut?: string[];
  action: () => void;
  category?: string;
}

export function CommandPalette() {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  const commands: CommandItem[] = [
    // Navigation
    {
      id: 'nav-dashboard',
      title: 'Go to Dashboard',
      icon: <Home className="w-4 h-4" />,
      shortcut: ['Alt', '1'],
      action: () => router.push('/dashboard'),
      category: 'Navigation',
    },
    {
      id: 'nav-marketplace',
      title: 'Go to Marketplace',
      icon: <ShoppingBag className="w-4 h-4" />,
      shortcut: ['Alt', '2'],
      action: () => router.push('/marketplace'),
      category: 'Navigation',
    },
    {
      id: 'nav-kingdoms',
      title: 'Go to Kingdoms',
      icon: <Castle className="w-4 h-4" />,
      shortcut: ['Alt', '3'],
      action: () => router.push('/kingdoms'),
      category: 'Navigation',
    },
    // Actions
    {
      id: 'action-settings',
      title: 'Open Settings',
      icon: <Settings className="w-4 h-4" />,
      action: () => {
        setOpen(false);
        const event = new CustomEvent('openSettings');
        window.dispatchEvent(event);
      },
      category: 'Actions',
    },
    {
      id: 'action-help',
      title: 'Show Help',
      icon: <HelpCircle className="w-4 h-4" />,
      shortcut: ['Ctrl', '/'],
      action: () => {
        setOpen(false);
        const event = new CustomEvent('toggleHelpMenu');
        window.dispatchEvent(event);
      },
      category: 'Actions',
    },
  ];

  // Filter commands based on search
  const filteredCommands = commands.filter(cmd =>
    cmd.title.toLowerCase().includes(search.toLowerCase()) ||
    cmd.description?.toLowerCase().includes(search.toLowerCase())
  );

  // Group commands by category
  const groupedCommands = filteredCommands.reduce((acc, cmd) => {
    const category = cmd.category || 'Other';
    if (!acc[category]) acc[category] = [];
    acc[category].push(cmd);
    return acc;
  }, {} as Record<string, CommandItem[]>);

  // Listen for keyboard shortcut
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setOpen(true);
      }
    };

    const handleOpenCommand = () => setOpen(true);

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('openCommandPalette', handleOpenCommand);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('openCommandPalette', handleOpenCommand);
    };
  }, []);

  // Focus input when opened
  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 0);
    }
  }, [open]);

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!open) return;

      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          setSelectedIndex(prev => 
            prev < filteredCommands.length - 1 ? prev + 1 : 0
          );
          break;
        case 'ArrowUp':
          e.preventDefault();
          setSelectedIndex(prev => 
            prev > 0 ? prev - 1 : filteredCommands.length - 1
          );
          break;
        case 'Enter':
          e.preventDefault();
          if (filteredCommands[selectedIndex]) {
            filteredCommands[selectedIndex].action();
            setOpen(false);
            setSearch('');
          }
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [open, selectedIndex, filteredCommands]);

  // Reset selected index when search changes
  useEffect(() => {
    setSelectedIndex(0);
  }, [search]);

  let commandIndex = 0;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="p-0 overflow-hidden max-w-2xl top-[20%]">
        <div className="flex items-center px-4 py-3 border-b">
          <Search className="w-4 h-4 text-muted-foreground mr-2" />
          <Input
            ref={inputRef}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Type a command or search..."
            className="border-0 focus:ring-0 h-auto p-0 text-base"
          />
          <div className="ml-auto flex items-center gap-1 text-xs text-muted-foreground">
            <Command className="w-3 h-3" />
            <span>K</span>
          </div>
        </div>
        
        <ScrollArea className="max-h-[400px]">
          <div className="py-2">
            {Object.entries(groupedCommands).map(([category, items]) => (
              <div key={category}>
                <div className="px-4 py-2 text-xs font-medium text-muted-foreground">
                  {category}
                </div>
                {items.map((cmd) => {
                  const isSelected = commandIndex === selectedIndex;
                  commandIndex++;
                  
                  return (
                    <button
                      key={cmd.id}
                      onClick={() => {
                        cmd.action();
                        setOpen(false);
                        setSearch('');
                      }}
                      className={cn(
                        'w-full px-4 py-3 flex items-center gap-3 hover:bg-accent transition-colors',
                        isSelected && 'bg-accent'
                      )}
                    >
                      {cmd.icon && (
                        <div className="text-muted-foreground">
                          {cmd.icon}
                        </div>
                      )}
                      <div className="flex-1 text-left">
                        <div className="font-medium">{cmd.title}</div>
                        {cmd.description && (
                          <div className="text-sm text-muted-foreground">
                            {cmd.description}
                          </div>
                        )}
                      </div>
                      {cmd.shortcut && (
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          {cmd.shortcut.map((key, i) => (
                            <React.Fragment key={i}>
                              <kbd className="px-1.5 py-0.5 bg-muted rounded">
                                {key}
                              </kbd>
                              {i < cmd.shortcut!.length - 1 && '+'}
                            </React.Fragment>
                          ))}
                        </div>
                      )}
                      {isSelected && (
                        <ArrowRight className="w-4 h-4 text-muted-foreground" />
                      )}
                    </button>
                  );
                })}
              </div>
            ))}
          </div>
        </ScrollArea>
        
        <div className="px-4 py-3 border-t text-xs text-muted-foreground flex items-center justify-between">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 bg-muted rounded">↑</kbd>
              <kbd className="px-1.5 py-0.5 bg-muted rounded">↓</kbd>
              to navigate
            </span>
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 bg-muted rounded">Enter</kbd>
              to select
            </span>
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 bg-muted rounded">Esc</kbd>
              to close
            </span>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}