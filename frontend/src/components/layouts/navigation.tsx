"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";

export interface NavItem {
  name: string;
  href: string;
  icon?: string | React.ReactNode;
  badge?: string | number;
  disabled?: boolean;
  color?: string;
}

interface NavigationProps {
  items: NavItem[];
  orientation?: "horizontal" | "vertical";
  variant?: "primary" | "secondary" | "minimal";
  className?: string;
}

export function Navigation({
  items,
  orientation = "horizontal",
  variant = "primary",
  className = "",
}: NavigationProps) {
  const pathname = usePathname();

  const isActive = (href: string) => {
    if (href === "/") return pathname === href;
    return pathname.startsWith(href);
  };

  const getItemClasses = (item: NavItem) => {
    const baseClasses = "relative flex items-center transition-all duration-200";
    const orientationClasses = 
      orientation === "horizontal" 
        ? "px-4 py-2 space-x-2" 
        : "px-4 py-3 space-x-3 w-full";
    
    const variantClasses = {
      primary: `rounded-lg font-orbitron ${
        isActive(item.href)
          ? "bg-purple-500/20 text-purple-400"
          : "text-gray-400 hover:text-purple-400 hover:bg-purple-500/10"
      }`,
      secondary: `border-b-2 ${
        isActive(item.href)
          ? "border-purple-400 text-purple-400"
          : "border-transparent text-gray-400 hover:text-purple-400"
      }`,
      minimal: `${
        isActive(item.href)
          ? "text-purple-400"
          : "text-gray-400 hover:text-purple-400"
      }`,
    };

    const disabledClasses = item.disabled 
      ? "opacity-50 cursor-not-allowed pointer-events-none" 
      : "";

    return `${baseClasses} ${orientationClasses} ${variantClasses[variant]} ${disabledClasses}`;
  };

  const containerClasses = 
    orientation === "horizontal" 
      ? "flex items-center space-x-2" 
      : "flex flex-col space-y-1";

  return (
    <nav className={`${containerClasses} ${className}`}>
      {items.map((item) => (
        <Link
          key={item.href}
          href={item.disabled ? "#" : item.href}
          className={getItemClasses(item)}
        >
          {isActive(item.href) && variant === "primary" && (
            <motion.div
              layoutId="nav-indicator"
              className="absolute inset-0 bg-purple-500/20 rounded-lg"
              transition={{ type: "spring", bounce: 0.25, duration: 0.5 }}
            />
          )}
          
          <span className="relative z-10 flex items-center space-x-2">
            {item.icon && (
              <span className={`flex-shrink-0 ${item.color || ''}`}>
                {typeof item.icon === "string" ? item.icon : item.icon}
              </span>
            )}
            <span>{item.name}</span>
          </span>

          {item.badge && (
            <span className="relative z-10 ml-auto">
              <span className="px-2 py-0.5 text-xs font-bold bg-purple-500/20 text-purple-400 rounded-full">
                {item.badge}
              </span>
            </span>
          )}
        </Link>
      ))}
    </nav>
  );
}