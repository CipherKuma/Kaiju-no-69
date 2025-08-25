import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import { logger } from './middleware';
import type { Modal, Notification, ComponentState } from './types';

interface UIState {
  // Modal Management
  modals: Modal[];
  activeModalId: string | null;
  modalStack: string[];
  
  // Loading States
  globalLoading: boolean;
  loadingMessage: string | null;
  componentLoading: Map<string, boolean>;
  
  // Notifications
  notifications: Notification[];
  maxNotifications: number;
  defaultNotificationDuration: number;
  
  // Component States
  componentStates: Map<string, ComponentState>;
  activeComponents: Set<string>;
  
  // UI Preferences
  sidebarCollapsed: boolean;
  panelPositions: Map<string, { x: number; y: number; width: number; height: number }>;
  activeTab: string | null;
  expandedSections: Set<string>;
  
  // Actions - Modals
  openModal: (modal: Modal) => void;
  closeModal: (modalId?: string) => void;
  closeAllModals: () => void;
  updateModal: (modalId: string, updates: Partial<Modal>) => void;
  pushModal: (modal: Modal) => void;
  popModal: () => void;
  
  // Actions - Loading
  setGlobalLoading: (loading: boolean, message?: string) => void;
  setComponentLoading: (componentId: string, loading: boolean) => void;
  clearAllLoading: () => void;
  
  // Actions - Notifications
  showNotification: (notification: Omit<Notification, 'id' | 'timestamp'>) => void;
  removeNotification: (notificationId: string) => void;
  clearNotifications: () => void;
  showSuccess: (title: string, message?: string) => void;
  showError: (title: string, message?: string) => void;
  showWarning: (title: string, message?: string) => void;
  showInfo: (title: string, message?: string) => void;
  
  // Actions - Component States
  registerComponent: (componentId: string, initialState?: Partial<ComponentState>) => void;
  unregisterComponent: (componentId: string) => void;
  updateComponentState: (componentId: string, updates: Partial<ComponentState>) => void;
  setComponentActive: (componentId: string, active: boolean) => void;
  setComponentError: (componentId: string, error: string | null) => void;
  
  // Actions - UI Preferences
  toggleSidebar: () => void;
  setSidebarCollapsed: (collapsed: boolean) => void;
  updatePanelPosition: (panelId: string, position: { x: number; y: number; width: number; height: number }) => void;
  setActiveTab: (tabId: string | null) => void;
  toggleSection: (sectionId: string) => void;
  expandSection: (sectionId: string) => void;
  collapseSection: (sectionId: string) => void;
  
  // Utility
  reset: () => void;
  resetUIPreferences: () => void;
}

const initialState = {
  modals: [] as Modal[],
  activeModalId: null as string | null,
  modalStack: [] as string[],
  globalLoading: false,
  loadingMessage: null as string | null,
  componentLoading: new Map<string, boolean>(),
  notifications: [] as Notification[],
  maxNotifications: 5,
  defaultNotificationDuration: 5000,
  componentStates: new Map<string, ComponentState>(),
  activeComponents: new Set<string>(),
  sidebarCollapsed: false,
  panelPositions: new Map<string, { x: number; y: number; width: number; height: number }>(),
  activeTab: null as string | null,
  expandedSections: new Set<string>()
};

export const useUIStore = create<UIState>()(
  logger(
    devtools(
      immer((set, get) => ({
        ...initialState,

        openModal: (modal) => {
          set((state) => {
            const existingIndex = state.modals.findIndex(m => m.id === modal.id);
            if (existingIndex >= 0) {
              state.modals[existingIndex] = modal;
            } else {
              state.modals.push(modal);
            }
            state.activeModalId = modal.id;
          });
        },

        closeModal: (modalId) => {
          set((state) => {
            const idToClose = modalId || state.activeModalId;
            if (!idToClose) return;

            const modal = state.modals.find(m => m.id === idToClose);
            if (modal?.onClose) {
              modal.onClose();
            }

            state.modals = state.modals.filter(m => m.id !== idToClose);
            state.modalStack = state.modalStack.filter(id => id !== idToClose);
            
            if (state.activeModalId === idToClose) {
              state.activeModalId = state.modalStack[state.modalStack.length - 1] || null;
            }
          });
        },

        closeAllModals: () => {
          set((state) => {
            state.modals.forEach(modal => {
              if (modal.onClose) {
                modal.onClose();
              }
            });
            state.modals = [];
            state.modalStack = [];
            state.activeModalId = null;
          });
        },

        updateModal: (modalId, updates) => {
          set((state) => {
            const modal = state.modals.find(m => m.id === modalId);
            if (modal) {
              Object.assign(modal, updates);
            }
          });
        },

        pushModal: (modal) => {
          set((state) => {
            state.modals.push(modal);
            state.modalStack.push(modal.id);
            state.activeModalId = modal.id;
          });
        },

        popModal: () => {
          set((state) => {
            if (state.modalStack.length === 0) return;
            
            const modalId = state.modalStack.pop();
            if (modalId) {
              const modal = state.modals.find(m => m.id === modalId);
              if (modal?.onClose) {
                modal.onClose();
              }
              state.modals = state.modals.filter(m => m.id !== modalId);
            }
            
            state.activeModalId = state.modalStack[state.modalStack.length - 1] || null;
          });
        },

        setGlobalLoading: (loading, message) => {
          set((state) => {
            state.globalLoading = loading;
            state.loadingMessage = message || null;
          });
        },

        setComponentLoading: (componentId, loading) => {
          set((state) => {
            state.componentLoading.set(componentId, loading);
          });
        },

        clearAllLoading: () => {
          set((state) => {
            state.globalLoading = false;
            state.loadingMessage = null;
            state.componentLoading.clear();
          });
        },

        showNotification: (notification) => {
          const id = Date.now().toString();
          const fullNotification: Notification = {
            ...notification,
            id,
            timestamp: new Date(),
            duration: notification.duration || get().defaultNotificationDuration
          };

          set((state) => {
            state.notifications.unshift(fullNotification);
            if (state.notifications.length > state.maxNotifications) {
              state.notifications = state.notifications.slice(0, state.maxNotifications);
            }
          });

          // Auto-remove notification after duration
          if (fullNotification.duration && fullNotification.duration > 0) {
            setTimeout(() => {
              get().removeNotification(id);
            }, fullNotification.duration);
          }
        },

        removeNotification: (notificationId) => {
          set((state) => {
            state.notifications = state.notifications.filter(n => n.id !== notificationId);
          });
        },

        clearNotifications: () => {
          set((state) => {
            state.notifications = [];
          });
        },

        showSuccess: (title, message) => {
          get().showNotification({ type: 'success', title, message });
        },

        showError: (title, message) => {
          get().showNotification({ type: 'error', title, message });
        },

        showWarning: (title, message) => {
          get().showNotification({ type: 'warning', title, message });
        },

        showInfo: (title, message) => {
          get().showNotification({ type: 'info', title, message });
        },

        registerComponent: (componentId, initialState) => {
          set((state) => {
            state.componentStates.set(componentId, {
              id: componentId,
              isActive: false,
              isLoading: false,
              ...initialState
            });
          });
        },

        unregisterComponent: (componentId) => {
          set((state) => {
            state.componentStates.delete(componentId);
            state.activeComponents.delete(componentId);
            state.componentLoading.delete(componentId);
          });
        },

        updateComponentState: (componentId, updates) => {
          set((state) => {
            const componentState = state.componentStates.get(componentId);
            if (componentState) {
              Object.assign(componentState, updates);
            }
          });
        },

        setComponentActive: (componentId, active) => {
          set((state) => {
            const componentState = state.componentStates.get(componentId);
            if (componentState) {
              componentState.isActive = active;
            }
            
            if (active) {
              state.activeComponents.add(componentId);
            } else {
              state.activeComponents.delete(componentId);
            }
          });
        },

        setComponentError: (componentId, error) => {
          set((state) => {
            const componentState = state.componentStates.get(componentId);
            if (componentState) {
              componentState.error = error || undefined;
            }
          });
        },

        toggleSidebar: () => {
          set((state) => {
            state.sidebarCollapsed = !state.sidebarCollapsed;
          });
        },

        setSidebarCollapsed: (collapsed) => {
          set((state) => {
            state.sidebarCollapsed = collapsed;
          });
        },

        updatePanelPosition: (panelId, position) => {
          set((state) => {
            state.panelPositions.set(panelId, position);
          });
        },

        setActiveTab: (tabId) => {
          set((state) => {
            state.activeTab = tabId;
          });
        },

        toggleSection: (sectionId) => {
          set((state) => {
            if (state.expandedSections.has(sectionId)) {
              state.expandedSections.delete(sectionId);
            } else {
              state.expandedSections.add(sectionId);
            }
          });
        },

        expandSection: (sectionId) => {
          set((state) => {
            state.expandedSections.add(sectionId);
          });
        },

        collapseSection: (sectionId) => {
          set((state) => {
            state.expandedSections.delete(sectionId);
          });
        },

        reset: () => {
          set(() => ({
            ...initialState,
            componentLoading: new Map(),
            componentStates: new Map(),
            activeComponents: new Set(),
            panelPositions: new Map(),
            expandedSections: new Set()
          }));
        },

        resetUIPreferences: () => {
          set((state) => {
            state.sidebarCollapsed = false;
            state.panelPositions.clear();
            state.activeTab = null;
            state.expandedSections.clear();
          });
        }
      })),
      { name: 'ui-store' }
    ),
    'UIStore'
  )
);

// Selectors for optimized re-renders
export const selectModals = (state: UIState) => state.modals;
export const selectActiveModal = (state: UIState) => 
  state.modals.find(m => m.id === state.activeModalId) || null;
export const selectIsModalOpen = (modalId: string) => (state: UIState) => 
  state.modals.some(m => m.id === modalId);
export const selectNotifications = (state: UIState) => state.notifications;
export const selectIsGlobalLoading = (state: UIState) => state.globalLoading;
export const selectIsComponentLoading = (componentId: string) => (state: UIState) => 
  state.componentLoading.get(componentId) || false;
export const selectComponentState = (componentId: string) => (state: UIState) => 
  state.componentStates.get(componentId) || null;
export const selectIsSidebarCollapsed = (state: UIState) => state.sidebarCollapsed;
export const selectIsSectionExpanded = (sectionId: string) => (state: UIState) => 
  state.expandedSections.has(sectionId);