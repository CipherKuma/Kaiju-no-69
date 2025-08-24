"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Shadow, Kaiju } from "@/types/models";
import { 
  AlertTriangle, 
  StopCircle, 
  PlayCircle, 
  Shield,
  Bell,
  X,
  AlertOctagon
} from "lucide-react";
import { theme } from "@/lib/theme";

interface EmergencyControlsProps {
  shadows: Shadow[];
  kaijus: Kaiju[];
  onEmergencyStopAll: () => void;
  onToggleShadow: (shadowId: string, active: boolean) => void;
  onSetStopLoss: (shadowId: string, percentage: number) => void;
}

interface RiskAlert {
  id: string;
  type: "high-loss" | "rapid-trades" | "low-balance" | "high-exposure";
  severity: "warning" | "critical";
  shadowId: string;
  message: string;
  timestamp: Date;
}

export function EmergencyControls({
  shadows,
  kaijus,
  onEmergencyStopAll,
  onToggleShadow,
  onSetStopLoss,
}: EmergencyControlsProps) {
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [alerts, setAlerts] = useState<RiskAlert[]>([
    // Mock alerts - in real app, these would come from real-time monitoring
    {
      id: "1",
      type: "high-loss",
      severity: "critical",
      shadowId: shadows[0]?.nftId || "",
      message: "Shadow approaching 25% loss threshold",
      timestamp: new Date(),
    },
  ]);
  
  const getKaiju = (shadow: Shadow) => {
    return kaijus.find(k => k.id === shadow.kaijuId);
  };
  
  const handleEmergencyStop = () => {
    onEmergencyStopAll();
    setShowConfirmation(false);
  };
  
  const dismissAlert = (alertId: string) => {
    setAlerts(alerts.filter(a => a.id !== alertId));
  };
  
  const getAlertIcon = (type: RiskAlert["type"]) => {
    switch (type) {
      case "high-loss":
        return <AlertOctagon className="text-red-500" size={20} />;
      case "rapid-trades":
        return <AlertTriangle className="text-yellow-500" size={20} />;
      case "low-balance":
        return <Shield className="text-orange-500" size={20} />;
      case "high-exposure":
        return <AlertTriangle className="text-red-500" size={20} />;
    }
  };
  
  return (
    <div className="space-y-6">
      {/* Emergency Stop All */}
      <motion.div
        whileHover={{ scale: 1.02 }}
        className="bg-red-900/20 border-2 border-red-600 rounded-xl p-6"
      >
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-xl font-bold text-red-500 mb-2">Emergency Controls</h3>
            <p className="text-gray-400">
              Immediately stop all shadow trading activities
            </p>
          </div>
          <button
            onClick={() => setShowConfirmation(true)}
            className="px-6 py-3 bg-red-600 hover:bg-red-700 rounded-lg font-semibold transition-colors flex items-center gap-2"
          >
            <StopCircle size={20} />
            STOP ALL
          </button>
        </div>
      </motion.div>
      
      {/* Risk Alerts */}
      {alerts.length > 0 && (
        <div className="bg-gray-900 rounded-xl p-6 border border-gray-800">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Bell className="text-yellow-500" size={20} />
            Risk Alerts
          </h3>
          <div className="space-y-3">
            {alerts.map((alert) => {
              const shadow = shadows.find(s => s.nftId === alert.shadowId);
              const kaiju = shadow ? getKaiju(shadow) : null;
              
              return (
                <motion.div
                  key={alert.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className={`flex items-center justify-between p-4 rounded-lg ${
                    alert.severity === "critical"
                      ? "bg-red-900/20 border border-red-600"
                      : "bg-yellow-900/20 border border-yellow-600"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    {getAlertIcon(alert.type)}
                    <div>
                      <p className="font-medium">{alert.message}</p>
                      {kaiju && (
                        <p className="text-sm text-gray-400">
                          {kaiju.name} - Shadow #{alert.shadowId}
                        </p>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={() => dismissAlert(alert.id)}
                    className="text-gray-400 hover:text-white transition-colors"
                  >
                    <X size={20} />
                  </button>
                </motion.div>
              );
            })}
          </div>
        </div>
      )}
      
      {/* Individual Shadow Controls */}
      <div className="bg-gray-900 rounded-xl p-6 border border-gray-800">
        <h3 className="text-lg font-semibold mb-4">Individual Shadow Controls</h3>
        <div className="space-y-4">
          {shadows.map((shadow) => {
            const kaiju = getKaiju(shadow);
            if (!kaiju) return null;
            
            return (
              <div
                key={shadow.nftId}
                className="flex items-center justify-between p-4 bg-stone-800 rounded-lg"
              >
                <div className="flex items-center gap-3">
                  <img
                    src={kaiju.imageUrl}
                    alt={kaiju.name}
                    className="w-10 h-10 rounded-full"
                  />
                  <div>
                    <p className="font-medium">{kaiju.name}</p>
                    <p className="text-sm text-gray-400">
                      P&L: <span
                        style={{
                          color: shadow.currentPL >= 0
                            ? theme.colors.success.DEFAULT
                            : theme.colors.danger.DEFAULT,
                        }}
                      >
                        {shadow.currentPL >= 0 ? "+" : ""}${shadow.currentPL.toLocaleString()}
                      </span>
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center gap-4">
                  {/* Stop Loss Input */}
                  <div className="flex items-center gap-2">
                    <label className="text-sm text-gray-400">Stop Loss:</label>
                    <input
                      type="number"
                      defaultValue={25}
                      min={5}
                      max={50}
                      step={5}
                      onChange={(e) => onSetStopLoss(shadow.nftId, Number(e.target.value))}
                      className="w-16 px-2 py-1 text-sm bg-gray-700 rounded border border-gray-600 focus:border-primary focus:outline-none"
                    />
                    <span className="text-sm text-gray-400">%</span>
                  </div>
                  
                  {/* Pause/Resume Button */}
                  <button
                    onClick={() => onToggleShadow(shadow.nftId, !shadow.isActive)}
                    className={`px-3 py-1 rounded-lg transition-colors flex items-center gap-2 ${
                      shadow.isActive
                        ? "bg-yellow-600 hover:bg-yellow-700"
                        : "bg-green-600 hover:bg-green-700"
                    }`}
                  >
                    {shadow.isActive ? (
                      <>
                        <StopCircle size={16} />
                        Pause
                      </>
                    ) : (
                      <>
                        <PlayCircle size={16} />
                        Resume
                      </>
                    )}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
      
      {/* Auto Stop-Loss Triggers */}
      <div className="bg-gray-900 rounded-xl p-6 border border-gray-800">
        <h3 className="text-lg font-semibold mb-4">Auto Stop-Loss Triggers</h3>
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-stone-800 rounded-lg p-4">
            <h4 className="font-medium mb-2">Portfolio Loss Limit</h4>
            <p className="text-sm text-gray-400 mb-3">
              Stop all trading when total portfolio loss exceeds:
            </p>
            <div className="flex items-center gap-2">
              <input
                type="number"
                defaultValue={30}
                min={10}
                max={50}
                step={5}
                className="w-20 px-3 py-2 bg-gray-700 rounded border border-gray-600 focus:border-primary focus:outline-none"
              />
              <span className="text-gray-400">%</span>
            </div>
          </div>
          
          <div className="bg-stone-800 rounded-lg p-4">
            <h4 className="font-medium mb-2">Daily Loss Limit</h4>
            <p className="text-sm text-gray-400 mb-3">
              Stop all trading when daily loss exceeds:
            </p>
            <div className="flex items-center gap-2">
              <span className="text-gray-400">$</span>
              <input
                type="number"
                defaultValue={1000}
                min={100}
                step={100}
                className="w-24 px-3 py-2 bg-gray-700 rounded border border-gray-600 focus:border-primary focus:outline-none"
              />
            </div>
          </div>
        </div>
      </div>
      
      {/* Confirmation Modal */}
      <AnimatePresence>
        {showConfirmation && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-80 z-50 flex items-center justify-center p-4"
            onClick={() => setShowConfirmation(false)}
          >
            <motion.div
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.9 }}
              className="bg-gray-900 rounded-xl p-8 max-w-md w-full border-2 border-red-600"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="text-center mb-6">
                <AlertOctagon className="text-red-500 mx-auto mb-4" size={48} />
                <h2 className="text-2xl font-bold mb-2">Emergency Stop Confirmation</h2>
                <p className="text-gray-400">
                  This will immediately stop ALL shadow trading activities. 
                  Are you sure you want to proceed?
                </p>
              </div>
              
              <div className="flex gap-4">
                <button
                  onClick={() => setShowConfirmation(false)}
                  className="flex-1 py-3 bg-stone-800 hover:bg-gray-700 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleEmergencyStop}
                  className="flex-1 py-3 bg-red-600 hover:bg-red-700 rounded-lg font-semibold transition-colors"
                >
                  STOP ALL TRADING
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}