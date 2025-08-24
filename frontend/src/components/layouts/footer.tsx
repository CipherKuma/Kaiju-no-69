"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { 
  Users, 
  Swords, 
  Shield, 
  Coins,
  Twitter,
  MessageCircle,
  Send,
  Github,
  Activity,
  TrendingUp,
  TrendingDown
} from "lucide-react";

interface GameStat {
  label: string;
  value: string | number;
  change?: number;
  icon?: React.ReactNode;
}

export function Footer() {
  const [stats, setStats] = useState<GameStat[]>([
    { label: "Active Players", value: "0", icon: <Users className="w-5 h-5" /> },
    { label: "Total Battles", value: "0", icon: <Swords className="w-5 h-5" /> },
    { label: "Kaijus Minted", value: "0", icon: <Shield className="w-5 h-5" /> },
    { label: "Total Volume", value: "0 SOL", icon: <Coins className="w-5 h-5" /> },
  ]);

  // Simulate live stats updates
  useEffect(() => {
    const interval = setInterval(() => {
      setStats([
        { 
          label: "Active Players", 
          value: Math.floor(Math.random() * 5000 + 10000).toLocaleString(),
          change: Math.random() * 10 - 5,
          icon: <Users className="w-5 h-5" /> 
        },
        { 
          label: "Total Battles", 
          value: Math.floor(Math.random() * 100000 + 500000).toLocaleString(),
          change: Math.random() * 20,
          icon: <Swords className="w-5 h-5" /> 
        },
        { 
          label: "Kaijus Minted", 
          value: Math.floor(Math.random() * 10000 + 50000).toLocaleString(),
          change: Math.random() * 5,
          icon: <Shield className="w-5 h-5" /> 
        },
        { 
          label: "Total Volume", 
          value: `${Math.floor(Math.random() * 50000 + 100000).toLocaleString()} SOL`,
          change: Math.random() * 15 - 7.5,
          icon: <Coins className="w-5 h-5" /> 
        },
      ]);
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  const socialLinks = [
    { name: "Twitter", href: "#", icon: <Twitter className="w-5 h-5" /> },
    { name: "Discord", href: "#", icon: <MessageCircle className="w-5 h-5" /> },
    { name: "Telegram", href: "#", icon: <Send className="w-5 h-5" /> },
    { name: "GitHub", href: "#", icon: <Github className="w-5 h-5" /> },
  ];

  const footerLinks = [
    {
      title: "Game",
      links: [
        { name: "How to Play", href: "/guide" },
        { name: "Battle Mechanics", href: "/mechanics" },
        { name: "Kaiju Types", href: "/kaiju-types" },
        { name: "Territories", href: "/territories" },
      ],
    },
    {
      title: "Marketplace",
      links: [
        { name: "Browse Kaijus", href: "/marketplace" },
        { name: "My Listings", href: "/marketplace/listings" },
        { name: "Trading History", href: "/marketplace/history" },
        { name: "Leaderboard", href: "/leaderboard" },
      ],
    },
    {
      title: "Community",
      links: [
        { name: "Forums", href: "/forums" },
        { name: "Events", href: "/events" },
        { name: "Tournaments", href: "/tournaments" },
        { name: "DAO", href: "/dao" },
      ],
    },
    {
      title: "Support",
      links: [
        { name: "FAQ", href: "/faq" },
        { name: "Contact", href: "/contact" },
        { name: "Bug Reports", href: "/bugs" },
        { name: "Terms", href: "/terms" },
      ],
    },
  ];

  return (
    <footer className="bg-gray-900 border-t border-purple-500/20">
      {/* Game Stats Bar */}
      <div className="bg-stone-800/50 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {stats.map((stat, index) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="text-center"
              >
                <div className="flex items-center justify-center space-x-2">
                  <div className="text-purple-400">{stat.icon}</div>
                  <div className="text-left">
                    <p className="text-xs text-gray-400">{stat.label}</p>
                    <div className="flex items-center space-x-2">
                      <p className="font-mono font-bold text-purple-400">
                        {stat.value}
                      </p>
                      {stat.change !== undefined && (
                        <div className={`flex items-center space-x-0.5 text-xs ${stat.change > 0 ? "text-green-400" : "text-red-400"}`}>
                          {stat.change > 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                          <span>{Math.abs(stat.change).toFixed(1)}%</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      {/* Main Footer Content */}
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-8">
          {/* Brand Section */}
          <div className="col-span-2 md:col-span-4 lg:col-span-1">
            <div className="flex items-center space-x-2 mb-4">
              <span className="text-4xl">🦖</span>
              <h3 className="font-pixel text-xl text-purple-400">Kaiju No. 69</h3>
            </div>
            <p className="text-gray-400 text-sm mb-6">
              The ultimate on-chain battle arena where legendary Kaijus fight for supremacy across elemental territories.
            </p>
            
            {/* Social Links */}
            <div className="flex space-x-3">
              {socialLinks.map((social) => (
                <Link
                  key={social.name}
                  href={social.href}
                  className="w-10 h-10 bg-stone-800 hover:bg-purple-500/20 rounded-lg flex items-center justify-center transition-colors"
                  title={social.name}
                >
                  {social.icon}
                </Link>
              ))}
            </div>
          </div>

          {/* Link Sections */}
          {footerLinks.map((section) => (
            <div key={section.title}>
              <h4 className="font-orbitron font-bold text-purple-400 mb-4">
                {section.title}
              </h4>
              <ul className="space-y-2">
                {section.links.map((link) => (
                  <li key={link.name}>
                    <Link
                      href={link.href}
                      className="text-gray-400 hover:text-purple-400 text-sm transition-colors"
                    >
                      {link.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom Bar */}
        <div className="mt-12 pt-8 border-t border-gray-800">
          <div className="flex flex-col md:flex-row items-center justify-between space-y-4 md:space-y-0">
            <p className="text-gray-500 text-sm text-center md:text-left">
              © 2024 Kaiju No. 69. All rights reserved. Built on Solana.
            </p>
            
            <div className="flex items-center space-x-6 text-sm">
              <Link href="/privacy" className="text-gray-500 hover:text-purple-400 transition-colors">
                Privacy Policy
              </Link>
              <Link href="/terms" className="text-gray-500 hover:text-purple-400 transition-colors">
                Terms of Service
              </Link>
              <div className="flex items-center space-x-2 text-gray-500">
                <Activity className="w-4 h-4 text-green-400 animate-pulse" />
                <span>Network: Healthy</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}