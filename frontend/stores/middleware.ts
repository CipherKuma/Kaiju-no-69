import { StateCreator, StoreMutatorIdentifier } from 'zustand';

type Logger = <
  T,
  Mps extends [StoreMutatorIdentifier, unknown][] = [],
  Mcs extends [StoreMutatorIdentifier, unknown][] = []
>(
  f: StateCreator<T, Mps, Mcs>,
  name?: string
) => StateCreator<T, Mps, Mcs>;

type LoggerImpl = <T>(
  f: StateCreator<T, [], []>,
  name?: string
) => StateCreator<T, [], []>;

const loggerImpl: LoggerImpl = (f, name) => (set, get, store) => {
  const loggedSet: typeof set = ((...args: any[]) => {
    const prevState = get();
    // @ts-ignore - TypeScript has issues with rest parameters and overloaded types
    set(...args);
    const nextState = get();
    
    if (process.env.NODE_ENV === 'development') {
      console.group(`[${name || 'Store'}] State Update`);
      console.log('Previous State:', prevState);
      console.log('Next State:', nextState);
      console.log('Diff:', getStateDiff(prevState as Record<string, unknown>, nextState as Record<string, unknown>));
      console.groupEnd();
    }
  }) as typeof set;

  return f(loggedSet, get, store);
};

export const logger = loggerImpl as Logger;

function getStateDiff(prev: any, next: any): Record<string, any> {
  const diff: Record<string, any> = {};
  
  for (const key in next) {
    if (prev[key] !== next[key]) {
      diff[key] = {
        prev: prev[key],
        next: next[key]
      };
    }
  }
  
  return diff;
}

export const createPersistMiddleware = <T extends object>(
  storeName: string,
  options?: {
    partialize?: (state: T) => Partial<T>;
    version?: number;
    migrate?: (persistedState: any, version: number) => T;
  }
) => {
  return (config: StateCreator<T>) => {
    return (set: any, get: any, api: any) => {
      const storage = {
        getItem: (name: string) => {
          const str = localStorage.getItem(name);
          if (!str) return null;
          return JSON.parse(str);
        },
        setItem: (name: string, value: any) => {
          localStorage.setItem(name, JSON.stringify(value));
        },
        removeItem: (name: string) => {
          localStorage.removeItem(name);
        }
      };

      let hasHydrated = false;

      const persistedState = storage.getItem(storeName);
      
      if (persistedState) {
        const migrated = options?.migrate 
          ? options.migrate(persistedState.state, persistedState.version || 0)
          : persistedState.state;
          
        const initialState = config(set, get, api);
        set({ ...initialState, ...migrated }, true);
      }

      const originalSet = set;
      set = (partial: any, replace?: any) => {
        originalSet(partial, replace);
        const state = get();
        const stateToPersist = options?.partialize ? options.partialize(state) : state;
        
        storage.setItem(storeName, {
          state: stateToPersist,
          version: options?.version || 1
        });
      };

      const state = config(set, get, api);

      return {
        ...state,
        _hasHydrated: () => hasHydrated,
        _hydrate: () => {
          if (!hasHydrated) {
            hasHydrated = true;
            const persistedState = storage.getItem(storeName);
            if (persistedState) {
              const migrated = options?.migrate 
                ? options.migrate(persistedState.state, persistedState.version || 0)
                : persistedState.state;
              set({ ...migrated }, true);
            }
          }
        }
      };
    };
  };
};