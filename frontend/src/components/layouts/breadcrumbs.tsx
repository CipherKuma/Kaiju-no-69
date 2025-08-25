"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { ChevronRight } from "lucide-react";

export interface BreadcrumbItem {
  label: string;
  href?: string;
  icon?: string | React.ReactNode;
  isCurrentPage?: boolean;
}

interface BreadcrumbsProps {
  items?: BreadcrumbItem[];
  separator?: string | React.ReactNode;
  className?: string;
  autoGenerate?: boolean;
}

const pathToLabelMap: Record<string, string> = {
  dashboard: "Dashboard",
  marketplace: "Marketplace",
  kingdoms: "Kingdoms",
  onboarding: "Onboarding",
  game: "Battle Arena",
  kaijus: "My Kaijus",
  shadows: "Shadow Army",
  battles: "Battle History",
  trading: "Trading",
  achievements: "Achievements",
  settings: "Settings",
  listings: "My Listings",
  history: "Trading History",
  leaderboard: "Leaderboard",
};

const generateBreadcrumbsFromPath = (pathname: string): BreadcrumbItem[] => {
  if (pathname === "/") {
    return [{ label: "Home", href: "/" }];
  }

  const segments = pathname.split("/").filter(Boolean);
  const breadcrumbs: BreadcrumbItem[] = [
    { label: "Home", href: "/" },
  ];

  segments.forEach((segment, index) => {
    const href = "/" + segments.slice(0, index + 1).join("/");
    const label = pathToLabelMap[segment] || segment.charAt(0).toUpperCase() + segment.slice(1);
    const isCurrentPage = index === segments.length - 1;

    breadcrumbs.push({
      label,
      href: isCurrentPage ? undefined : href,
      isCurrentPage,
    });
  });

  return breadcrumbs;
};

export function Breadcrumbs({
  items,
  separator = <ChevronRight className="w-4 h-4" />,
  className = "",
  autoGenerate = true,
}: BreadcrumbsProps) {
  const pathname = usePathname();
  
  const breadcrumbItems = items || (autoGenerate ? generateBreadcrumbsFromPath(pathname) : []);

  if (breadcrumbItems.length <= 1 && autoGenerate) {
    return null; // Don't show breadcrumbs for single-level pages
  }

  return (
    <nav className={`flex items-center space-x-2 text-sm ${className}`} aria-label="Breadcrumb">
      <ol className="flex items-center space-x-2">
        {breadcrumbItems.map((item, index) => {
          const isLast = index === breadcrumbItems.length - 1;

          return (
            <li key={item.href || item.label} className="flex items-center space-x-2">
              {index > 0 && (
                <span className="text-gray-500 flex-shrink-0">
                  {separator}
                </span>
              )}
              
              <motion.div
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05, duration: 0.2 }}
                className="flex items-center space-x-1"
              >
                {item.icon && (
                  <span className="flex-shrink-0">
                    {typeof item.icon === "string" ? item.icon : item.icon}
                  </span>
                )}
                
                {item.href && !item.isCurrentPage ? (
                  <Link
                    href={item.href}
                    className="text-gray-400 hover:text-purple-400 transition-colors truncate max-w-[150px] md:max-w-none"
                  >
                    {item.label}
                  </Link>
                ) : (
                  <span
                    className={`truncate max-w-[150px] md:max-w-none ${
                      isLast || item.isCurrentPage
                        ? "text-purple-400 font-medium"
                        : "text-gray-300"
                    }`}
                    aria-current={isLast || item.isCurrentPage ? "page" : undefined}
                  >
                    {item.label}
                  </span>
                )}
              </motion.div>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}