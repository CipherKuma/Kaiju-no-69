"use client";

import React, { ReactNode } from "react";
import { motion } from "framer-motion";
import { Info } from "lucide-react";

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  actions?: ReactNode;
  breadcrumbs?: ReactNode;
  className?: string;
  icon?: React.ReactNode;
  badge?: string | number;
  tooltip?: string;
}

export function PageHeader({
  title,
  subtitle,
  actions,
  breadcrumbs,
  className = "",
  icon,
  badge,
  tooltip,
}: PageHeaderProps) {
  return (
    <header className={`bg-stone-800/50 backdrop-blur-sm border-b border-purple-500/20 ${className}`}>
      <div className="px-6 py-4">
        {breadcrumbs && (
          <div className="mb-4">
            {breadcrumbs}
          </div>
        )}
        
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className="flex items-center gap-3"
            >
              {icon && (
                <div className="text-purple-400">
                  {icon}
                </div>
              )}
              <h1 className="font-orbitron font-bold text-2xl md:text-3xl text-white">
                {title}
              </h1>
              {badge && (
                <span className="px-3 py-1 bg-purple-500/20 text-purple-400 text-sm font-medium rounded-full">
                  {badge}
                </span>
              )}
              {tooltip && (
                <div className="group relative">
                  <Info className="w-5 h-5 text-gray-400 cursor-help" />
                  <div className="absolute left-0 top-full mt-2 hidden group-hover:block z-10">
                    <div className="bg-stone-800 text-gray-300 text-sm rounded-lg p-3 shadow-xl border border-purple-500/20 max-w-xs">
                      {tooltip}
                    </div>
                  </div>
                </div>
              )}
            </motion.div>
            
            {subtitle && (
              <motion.p
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: 0.1 }}
                className="mt-1 text-gray-400 text-sm md:text-base"
              >
                {subtitle}
              </motion.p>
            )}
          </div>
          
          {actions && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3, delay: 0.2 }}
              className="flex items-center gap-2"
            >
              {actions}
            </motion.div>
          )}
        </div>
      </div>
    </header>
  );
}