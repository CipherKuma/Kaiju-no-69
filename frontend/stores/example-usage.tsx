import React from 'react';
import { 
  useUserStore, 
  useGameStore, 
  useTradingStore, 
  useUIStore,
  selectTheme,
  selectActiveKaiju
} from './index';

// Example 1: Using store directly
export function UserProfile() {
  const { user, walletAddress, connectWallet, disconnectWallet } = useUserStore();
  
  return (
    <div>
      {user ? (
        <>
          <h2>Welcome, {user.username}!</h2>
          {walletAddress ? (
            <button onClick={disconnectWallet}>Disconnect Wallet</button>
          ) : (
            <button onClick={() => connectWallet('0x123...', 1)}>Connect Wallet</button>
          )}
        </>
      ) : (
        <p>Please log in</p>
      )}
    </div>
  );
}

// Example 2: Using selectors for optimized re-renders
export function ThemeToggle() {
  const theme = useUserStore(selectTheme);
  const toggleTheme = useUserStore(state => state.toggleTheme);
  
  return (
    <button onClick={toggleTheme}>
      Current theme: {theme}
    </button>
  );
}

// Example 3: Cross-store interaction
export function GameTrading() {
  const activeKaiju = useGameStore(selectActiveKaiju);
  const executeBuyOrder = useTradingStore(state => state.executeBuyOrder);
  const showNotification = useUIStore(state => state.showNotification);
  
  const handleBuyKaijuShares = async () => {
    if (!activeKaiju) {
      showNotification({
        type: 'error',
        title: 'No Kaiju Selected',
        message: 'Please select a kaiju to trade'
      });
      return;
    }
    
    try {
      await executeBuyOrder(`KAIJU-${activeKaiju.id}`, 100, 50);
      showNotification({
        type: 'success',
        title: 'Order Placed',
        message: `Bought 100 shares of ${activeKaiju.name}`
      });
    } catch (error) {
      showNotification({
        type: 'error',
        title: 'Order Failed',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  };
  
  return (
    <button onClick={handleBuyKaijuShares}>
      Buy {activeKaiju?.name || 'Kaiju'} Shares
    </button>
  );
}

// Example 4: Modal management
export function ConfirmModal() {
  const { openModal, closeModal } = useUIStore();
  
  const showConfirmDialog = () => {
    openModal({
      id: 'confirm-action',
      type: 'confirm',
      title: 'Confirm Action',
      content: 'Are you sure you want to proceed?',
      actions: [
        {
          label: 'Cancel',
          variant: 'secondary',
          handler: () => closeModal('confirm-action')
        },
        {
          label: 'Confirm',
          variant: 'primary',
          handler: () => {
            console.log('Confirmed!');
            closeModal('confirm-action');
          }
        }
      ]
    });
  };
  
  return <button onClick={showConfirmDialog}>Show Confirm Dialog</button>;
}

// Example 5: Loading state management
export function DataLoader() {
  const { setComponentLoading } = useUIStore();
  const isLoading = useUIStore(state => state.componentLoading.get('data-loader'));
  
  const loadData = async () => {
    setComponentLoading('data-loader', true);
    
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000));
      console.log('Data loaded!');
    } finally {
      setComponentLoading('data-loader', false);
    }
  };
  
  return (
    <button onClick={loadData} disabled={isLoading}>
      {isLoading ? 'Loading...' : 'Load Data'}
    </button>
  );
}

// Example 6: Subscribing to store changes
export function StoreSubscriber() {
  React.useEffect(() => {
    // Subscribe to authentication changes
    const unsubAuth = useUserStore.subscribe((state) => {
      console.log('Auth state changed:', state.isAuthenticated);
    });
    
    // Subscribe to game phase changes
    const unsubGame = useGameStore.subscribe((state) => {
      console.log('Game phase changed:', state.gamePhase);
    });
    
    return () => {
      unsubAuth();
      unsubGame();
    };
  }, []);
  
  return null;
}