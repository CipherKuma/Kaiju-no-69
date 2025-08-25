'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { Sparkles } from 'lucide-react';
import { useAccount, useBalance, useSwitchChain } from 'wagmi';
import { ConnectButton } from '@/ui/web3/ConnectButton';

export default function LandingPage() {
  const [showRoleSelection, setShowRoleSelection] = useState(false);
  const router = useRouter();
  
  // Web3 hooks
  const { address, isConnected, chain } = useAccount();
  const { switchChain } = useSwitchChain();
  const { data: balance } = useBalance({
    address,
    chainId: 360, // Shape mainnet
  });
  
  // Auto-switch to Shape mainnet when connected
  useEffect(() => {
    if (isConnected && chain && chain.id !== 360) {
      try {
        switchChain({ chainId: 360 });
      } catch (error) {
        console.error('Failed to switch to Shape mainnet:', error);
      }
    }
  }, [isConnected, chain, switchChain]);

  const handleStart = () => {
    setShowRoleSelection(true);
  };

  const handleRoleSelect = (role: 'kaiju' | 'shadow') => {
    if (role === 'kaiju') {
      router.push('/create-kaiju');
    } else {
      router.push('/marketplace');
    }
  };

  return (
    <div className="relative min-h-screen overflow-hidden">
      {/* Video Background */}
      <video
        autoPlay
        loop
        muted
        playsInline
        className="absolute inset-0 w-full h-full object-cover"
      >
        <source src="/landscape.mp4" type="video/mp4" />
      </video>
      
      {/* Dark Overlay for better text visibility */}
      <div className="absolute inset-0 bg-black/50" />
      
      {/* Content */}
      <div className="relative z-10 min-h-screen flex flex-col items-center justify-center p-8">
        <AnimatePresence mode="wait">
          {!showRoleSelection ? (
            <motion.div
              key="landing"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.5 }}
              className="text-center max-w-4xl mx-auto"
            >
              {/* Title */}
              <motion.h1 
                className="text-6xl md:text-8xl font-bold font-heading mb-6 text-white"
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.2, duration: 0.6 }}
              >
                Kaiju no. 69
              </motion.h1>
              
              {/* Description */}
              <motion.p 
                className="text-xl md:text-2xl text-gray-200 mb-12 leading-relaxed"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.4, duration: 0.6 }}
              >
                Enter a world where legendary trading beasts roam digital territories. 
                Become a powerful Kaiju trader or sacrifice yourself as a Shadow to follow 
                their devastating market strategies.
              </motion.p>
              
              {/* Wallet Connection / Start Button */}
              {!isConnected ? (
                <motion.div
                  className="flex flex-col items-center gap-6"
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.6, duration: 0.4 }}
                >
                  <ConnectButton />
                </motion.div>
              ) : (
                <motion.div
                  className="flex flex-col items-center gap-6"
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.6, duration: 0.4 }}
                >
                  {/* Wallet Info */}
                  <div className="text-center">
                    <p className="text-sm text-gray-400 mb-2">Connected Wallet</p>
                    <p className="text-lg font-mono text-white mb-1">
                      {address?.slice(0, 6)}...{address?.slice(-4)}
                    </p>
                    <p className="text-sm text-gray-300">
                      Balance: {balance ? `${parseFloat(balance.formatted).toFixed(4)} ETH` : '0 ETH'}
                    </p>
                  </div>
                  
                  {/* Start Button */}
                  <button
                    onClick={handleStart}
                    className="px-12 py-6 bg-stone-700 
                             text-white text-2xl font-bold rounded-xl shadow-2xl transform transition-all 
                             hover:scale-105 active:scale-95 flex items-center gap-3 cursor-pointer"
                  >
                    <Sparkles className="w-6 h-6" />
                    Start Your Journey
                  </button>
                  
                  {/* Built on Shape */}
                  <div className="flex items-center gap-2 mt-4">
                    <span className="text-sm text-gray-400">Built on</span>
                    <img 
                      src="/shape-logo.png" 
                      alt="Shape" 
                      className="h-8"
                      onError={(e) => {
                        // Fallback to text if logo not found
                        e.currentTarget.style.display = 'none';
                        e.currentTarget.nextElementSibling?.classList.remove('hidden');
                      }}
                    />
                    <span className="hidden text-xl font-bold text-white">SHAPE</span>
                  </div>
                </motion.div>
              )}
            </motion.div>
          ) : (
            <motion.div
              key="role-selection"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ duration: 0.5 }}
              className="w-full max-w-6xl mx-auto"
            >
              <motion.h2 
                className="text-4xl md:text-6xl font-bold font-heading text-center mb-12 text-white"
                initial={{ y: -20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.2 }}
              >
                Choose Your Destiny
              </motion.h2>
              
              <div className="grid md:grid-cols-2 gap-12">
                {/* Kaiju Option */}
                <motion.div
                  initial={{ x: -50, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ delay: 0.3 }}
                  onClick={() => handleRoleSelect('kaiju')}
                  className="relative overflow-hidden cursor-pointer group"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  {/* Glowing border effect */}
                  <div className="absolute inset-0 rounded-lg bg-gradient-to-r from-red-600 via-orange-500 to-red-600 opacity-75 blur-lg group-hover:opacity-100 transition-opacity" />
                  
                  {/* Card content */}
                  <div className="relative bg-black/90 backdrop-blur-sm rounded-lg border border-red-900/50 overflow-hidden">
                    {/* Background pattern */}
                    <div className="absolute inset-0 opacity-10">
                      <div className="absolute inset-0 bg-gradient-to-br from-red-600/20 to-transparent" />
                      <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_50%,rgba(239,68,68,0.1)_0%,transparent_50%)]" />
                    </div>
                    
                    {/* Character Image */}
                    <div className="relative h-64 overflow-hidden">
                      <img 
                        src="/kaiju.png" 
                        alt="Kaiju" 
                        className="w-full h-full object-cover transform scale-110 group-hover:scale-125 transition-transform duration-700"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent" />
                      
                      {/* Floating particles effect */}
                      <div className="absolute inset-0 overflow-hidden">
                        <div className="absolute w-2 h-2 bg-red-500 rounded-full animate-pulse top-10 left-10" />
                        <div className="absolute w-1 h-1 bg-orange-400 rounded-full animate-pulse top-20 right-20 animation-delay-200" />
                        <div className="absolute w-3 h-3 bg-red-400 rounded-full animate-pulse bottom-10 left-20 animation-delay-400" />
                      </div>
                    </div>
                    
                    <div className="relative p-8">
                      {/* Title with game font */}
                      <h3 className="font-pixel text-2xl text-red-500 mb-6 text-center tracking-wider animate-pulse">
                        KAIJU
                      </h3>
                      
                      {/* Description with better styling */}
                      <p className="text-gray-300 text-sm leading-relaxed mb-6 font-mono">
                        Create and deploy AI-powered trading agents on Shape mainnet. Your Kaiju executes trades autonomously using advanced algorithms, earning fees from followers who copy your strategies.
                      </p>
                      
                      {/* Stats/Features in game style */}
                      <div className="space-y-2">
                        <div className="flex items-center gap-3 text-sm">
                          <div className="w-2 h-2 bg-red-500 rotate-45" />
                          <span className="text-gray-400 font-mono">Deploy Trading Algorithm</span>
                        </div>
                        <div className="flex items-center gap-3 text-sm">
                          <div className="w-2 h-2 bg-red-500 rotate-45" />
                          <span className="text-gray-400 font-mono">Generate Unique Appearance</span>
                        </div>
                        <div className="flex items-center gap-3 text-sm">
                          <div className="w-2 h-2 bg-red-500 rotate-45" />
                          <span className="text-gray-400 font-mono">Earn Shadow Fees</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
                
                {/* Shadow Option */}
                <motion.div
                  initial={{ x: 50, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ delay: 0.4 }}
                  onClick={() => handleRoleSelect('shadow')}
                  className="relative overflow-hidden cursor-pointer group"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  {/* Glowing border effect */}
                  <div className="absolute inset-0 rounded-lg bg-gradient-to-r from-purple-600 via-blue-500 to-purple-600 opacity-75 blur-lg group-hover:opacity-100 transition-opacity" />
                  
                  {/* Card content */}
                  <div className="relative bg-black/90 backdrop-blur-sm rounded-lg border border-purple-900/50 overflow-hidden">
                    {/* Background pattern */}
                    <div className="absolute inset-0 opacity-10">
                      <div className="absolute inset-0 bg-gradient-to-br from-purple-600/20 to-transparent" />
                      <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_50%,rgba(147,51,234,0.1)_0%,transparent_50%)]" />
                    </div>
                    
                    {/* Character Image */}
                    <div className="relative h-64 overflow-hidden">
                      <img 
                        src="/shadow.png" 
                        alt="Shadow" 
                        className="w-full h-full object-cover transform scale-110 group-hover:scale-125 transition-transform duration-700"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent" />
                      
                      {/* Floating particles effect */}
                      <div className="absolute inset-0 overflow-hidden">
                        <div className="absolute w-2 h-2 bg-purple-500 rounded-full animate-pulse top-15 right-10" />
                        <div className="absolute w-1 h-1 bg-blue-400 rounded-full animate-pulse top-30 left-15 animation-delay-300" />
                        <div className="absolute w-3 h-3 bg-purple-400 rounded-full animate-pulse bottom-20 right-25 animation-delay-500" />
                      </div>
                    </div>
                    
                    <div className="relative p-8">
                      {/* Title with game font */}
                      <h3 className="font-pixel text-2xl text-purple-500 mb-6 text-center tracking-wider animate-pulse">
                        SHADOW
                      </h3>
                      
                      {/* Description with better styling */}
                      <p className="text-gray-300 text-sm leading-relaxed mb-6 font-mono">
                        Mint policy NFTs to automatically copy successful Kaiju trading strategies. Shadow NFTs execute the same trades as their chosen Kaiju, sharing profits while paying performance fees.
                      </p>
                      
                      {/* Stats/Features in game style */}
                      <div className="space-y-2">
                        <div className="flex items-center gap-3 text-sm">
                          <div className="w-2 h-2 bg-purple-500 rotate-45" />
                          <span className="text-gray-400 font-mono">Choose Proven Kaiju</span>
                        </div>
                        <div className="flex items-center gap-3 text-sm">
                          <div className="w-2 h-2 bg-purple-500 rotate-45" />
                          <span className="text-gray-400 font-mono">Mint Unique NFT</span>
                        </div>
                        <div className="flex items-center gap-3 text-sm">
                          <div className="w-2 h-2 bg-purple-500 rotate-45" />
                          <span className="text-gray-400 font-mono">Auto-Copy Trades</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              </div>
              
              {/* Back Button */}
              <motion.button
                onClick={() => setShowRoleSelection(false)}
                className="mt-8 mx-auto block text-gray-400 hover:text-white transition-colors"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.6 }}
              >
                ← Back
              </motion.button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
