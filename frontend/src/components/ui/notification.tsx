'use client';

import React, { createContext, useContext, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, CheckCircle, AlertCircle, Info, AlertTriangle } from 'lucide-react';

export type NotificationType = 'success' | 'error' | 'warning' | 'info';

export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message?: string;
  duration?: number;
  action?: {
    label: string;
    onClick: () => void;
  };
}

interface NotificationContextType {
  notifications: Notification[];
  showNotification: (notification: Omit<Notification, 'id'>) => void;
  removeNotification: (id: string) => void;
  clearNotifications: () => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within NotificationProvider');
  }
  return context;
};

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);

  const showNotification = useCallback((notification: Omit<Notification, 'id'>) => {
    const id = Date.now().toString();
    const newNotification = { ...notification, id };
    
    setNotifications(prev => [...prev, newNotification]);

    if (notification.duration !== 0) {
      setTimeout(() => {
        removeNotification(id);
      }, notification.duration || 5000);
    }
  }, []);

  const removeNotification = useCallback((id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  }, []);

  const clearNotifications = useCallback(() => {
    setNotifications([]);
  }, []);

  return (
    <NotificationContext.Provider value={{ notifications, showNotification, removeNotification, clearNotifications }}>
      {children}
      <NotificationContainer />
    </NotificationContext.Provider>
  );
};

const NotificationContainer: React.FC = () => {
  const { notifications, removeNotification } = useNotifications();

  return (
    <div className="fixed top-20 right-4 z-50 space-y-2 max-w-sm w-full pointer-events-none">
      <AnimatePresence>
        {notifications.map(notification => (
          <NotificationItem
            key={notification.id}
            notification={notification}
            onRemove={() => removeNotification(notification.id)}
          />
        ))}
      </AnimatePresence>
    </div>
  );
};

interface NotificationItemProps {
  notification: Notification;
  onRemove: () => void;
}

const NotificationItem: React.FC<NotificationItemProps> = ({ notification, onRemove }) => {
  const icons = {
    success: <CheckCircle className="w-5 h-5 text-green-400" />,
    error: <AlertCircle className="w-5 h-5 text-red-400" />,
    warning: <AlertTriangle className="w-5 h-5 text-yellow-400" />,
    info: <Info className="w-5 h-5 text-blue-400" />,
  };

  const backgrounds = {
    success: 'bg-green-900/90 border-green-500/30',
    error: 'bg-red-900/90 border-red-500/30',
    warning: 'bg-yellow-900/90 border-yellow-500/30',
    info: 'bg-blue-900/90 border-blue-500/30',
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 50, scale: 0.9 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      exit={{ opacity: 0, x: 50, scale: 0.9 }}
      className={`pointer-events-auto flex items-start gap-3 p-4 rounded-lg border backdrop-blur-sm shadow-xl ${backgrounds[notification.type]}`}
    >
      <div className="flex-shrink-0">
        {icons[notification.type]}
      </div>
      
      <div className="flex-1 min-w-0">
        <h4 className="text-sm font-semibold text-white">
          {notification.title}
        </h4>
        {notification.message && (
          <p className="mt-1 text-xs text-gray-300">
            {notification.message}
          </p>
        )}
        {notification.action && (
          <button
            onClick={notification.action.onClick}
            className="mt-2 text-xs font-medium text-purple-400 hover:text-purple-300 transition-colors"
          >
            {notification.action.label}
          </button>
        )}
      </div>

      <button
        onClick={onRemove}
        className="flex-shrink-0 p-1 rounded hover:bg-white/10 transition-colors"
      >
        <X className="w-4 h-4 text-gray-400" />
      </button>
    </motion.div>
  );
};