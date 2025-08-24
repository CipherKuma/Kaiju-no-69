"use client";

import React, { ReactNode } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { 
  ChevronLeft, 
  Check, 
  SkipForward,
  Sparkles,
  Wallet,
  Shield,
  Swords,
  Castle,
  Trophy
} from "lucide-react";

interface OnboardingLayoutProps {
  children: ReactNode;
  currentStep: number;
  totalSteps: number;
  stepTitle?: string;
  onBack?: () => void;
  onSkip?: () => void;
  showSkip?: boolean;
}

interface Step {
  number: number;
  title: string;
  icon?: React.ReactNode;
}

const getSteps = (total: number): Step[] => {
  const defaultSteps = [
    { title: "Welcome", icon: <Sparkles className="w-5 h-5" /> },
    { title: "Connect Wallet", icon: <Wallet className="w-5 h-5" /> },
    { title: "Choose Your First Kaiju", icon: <Shield className="w-5 h-5" /> },
    { title: "Battle Tutorial", icon: <Swords className="w-5 h-5" /> },
    { title: "Join a Kingdom", icon: <Castle className="w-5 h-5" /> },
    { title: "Complete Setup", icon: <Trophy className="w-5 h-5" /> },
  ];
  
  return Array.from({ length: total }, (_, i) => ({
    number: i + 1,
    title: defaultSteps[i]?.title || `Step ${i + 1}`,
    icon: defaultSteps[i]?.icon,
  }));
};

export function OnboardingLayout({
  children,
  currentStep,
  totalSteps,
  stepTitle,
  onBack,
  onSkip,
  showSkip = true,
}: OnboardingLayoutProps) {
  const progress = (currentStep / totalSteps) * 100;
  const steps = getSteps(totalSteps);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900 flex flex-col">
      {/* Header */}
      <header className="relative z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            {/* Logo */}
            <Link href="/" className="flex items-center space-x-2">
              <span className="text-3xl">🦖</span>
              <h1 className="font-pixel text-xl text-purple-400">Kaiju No. 69</h1>
            </Link>

            {/* Skip Button */}
            {showSkip && onSkip && currentStep < totalSteps && (
              <button
                onClick={onSkip}
                className="flex items-center space-x-1 text-gray-400 hover:text-purple-400 transition-colors font-orbitron text-sm"
              >
                <SkipForward className="w-4 h-4" />
                <span>Skip Onboarding</span>
              </button>
            )}
          </div>
        </div>

        {/* Progress Bar */}
        <div className="bg-stone-800/50 backdrop-blur-sm">
          <div className="container mx-auto px-4 py-6">
            {/* Step Title */}
            <div className="text-center mb-4">
              <div className="flex items-center justify-center space-x-3 mb-2">
                {steps[currentStep - 1]?.icon && (
                  <motion.div 
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", delay: 0.2 }}
                    className="text-purple-400"
                  >
                    {steps[currentStep - 1].icon}
                  </motion.div>
                )}
                <h2 className="font-orbitron font-bold text-2xl text-white">
                  {stepTitle || steps[currentStep - 1]?.title}
                </h2>
              </div>
              <p className="text-gray-400 text-sm">
                Step {currentStep} of {totalSteps}
              </p>
            </div>

            {/* Desktop Progress Indicators */}
            <div className="hidden md:flex items-center justify-center space-x-2 mb-6">
              {steps.map((step, index) => {
                const isActive = index + 1 === currentStep;
                const isCompleted = index + 1 < currentStep;
                
                return (
                  <div key={step.number} className="flex items-center">
                    <motion.div
                      initial={false}
                      animate={{
                        scale: isActive ? 1.2 : 1,
                        backgroundColor: isCompleted 
                          ? "rgb(168 85 247)" // purple-500
                          : isActive 
                          ? "rgb(147 51 234)" // purple-600
                          : "rgb(55 65 81)", // gray-700
                      }}
                      transition={{ duration: 0.3 }}
                      className={`w-10 h-10 rounded-full flex items-center justify-center font-orbitron font-bold ${
                        isCompleted || isActive ? "text-white" : "text-gray-400"
                      }`}
                    >
                      {isCompleted ? (
                        <Check className="w-5 h-5" />
                      ) : step.icon ? (
                        <div className="text-xs">{step.icon}</div>
                      ) : (
                        step.number
                      )}
                    </motion.div>
                    
                    {index < steps.length - 1 && (
                      <div className="w-12 h-0.5 mx-2">
                        <div className="h-full bg-gray-700 relative overflow-hidden">
                          <motion.div
                            initial={false}
                            animate={{
                              width: isCompleted ? "100%" : "0%",
                            }}
                            transition={{ duration: 0.5 }}
                            className="absolute inset-y-0 left-0 bg-purple-500"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Mobile Progress Bar */}
            <div className="md:hidden">
              <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${progress}%` }}
                  transition={{ duration: 0.5, ease: "easeOut" }}
                  className="h-full bg-gradient-to-r from-purple-500 to-purple-400"
                />
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 container mx-auto px-4 py-8 flex items-center justify-center">
        <motion.div
          key={currentStep}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.3 }}
          className="w-full max-w-2xl"
        >
          <div className="bg-stone-800/30 backdrop-blur-sm rounded-2xl border border-purple-500/20 p-8">
            {children}
          </div>
        </motion.div>
      </main>

      {/* Navigation Footer */}
      <footer className="bg-stone-800/50 backdrop-blur-sm border-t border-purple-500/20">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            {/* Back Button */}
            <div>
              {currentStep > 1 && onBack ? (
                <button
                  onClick={onBack}
                  className="flex items-center space-x-2 px-4 py-2 text-gray-400 hover:text-purple-400 transition-colors"
                >
                  <ChevronLeft className="w-5 h-5" />
                  <span className="font-orbitron">Back</span>
                </button>
              ) : (
                <div className="w-24" /> // Spacer for alignment
              )}
            </div>

            {/* Step Indicator (Mobile) */}
            <div className="md:hidden flex space-x-1">
              {Array.from({ length: totalSteps }, (_, i) => (
                <div
                  key={i}
                  className={`w-2 h-2 rounded-full transition-colors ${
                    i + 1 === currentStep
                      ? "bg-purple-400 w-6"
                      : i + 1 < currentStep
                      ? "bg-purple-600"
                      : "bg-gray-600"
                  }`}
                />
              ))}
            </div>

            {/* Next/Complete Button is expected to be provided by the page */}
            <div className="w-24" /> {/* Spacer for alignment */}
          </div>
        </div>
      </footer>
    </div>
  );
}