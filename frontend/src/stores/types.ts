export interface User {
  id: string;
  username: string;
  email?: string;
  avatar?: string;
  createdAt: Date;
  lastActive: Date;
}

export interface UserPreferences {
  theme: 'light' | 'dark';
  soundEnabled: boolean;
  notificationsEnabled: boolean;
  autoSaveEnabled: boolean;
  language: 'en' | 'ja' | 'es' | 'fr';
}

export interface Shadow {
  id: string;
  name: string;
  position: Position;
  level: number;
  health: number;
  maxHealth: number;
  damage: number;
  status: 'idle' | 'moving' | 'attacking' | 'defending';
}

export interface Position {
  x: number;
  y: number;
  z?: number;
}

export interface Kaiju {
  id: string;
  name: string;
  type: string;
  level: number;
  health: number;
  maxHealth: number;
  damage: number;
  defense: number;
  abilities: Ability[];
  position: Position;
  status: 'dormant' | 'active' | 'attacking' | 'retreating';
}

export interface Ability {
  id: string;
  name: string;
  damage: number;
  cooldown: number;
  currentCooldown: number;
  range: number;
  areaOfEffect: number;
}

export interface Territory {
  id: string;
  name: string;
  owner?: string;
  bounds: {
    topLeft: Position;
    bottomRight: Position;
  };
  resources: Resource[];
  defenseLevel: number;
  status: 'neutral' | 'contested' | 'controlled';
}

export interface Resource {
  id: string;
  type: 'energy' | 'minerals' | 'biomass';
  amount: number;
  regenerationRate: number;
}

export interface Trade {
  id: string;
  timestamp: Date;
  type: 'buy' | 'sell';
  asset: string;
  amount: number;
  price: number;
  total: number;
  status: 'pending' | 'completed' | 'failed' | 'cancelled';
  userId: string;
}

export interface Portfolio {
  totalValue: number;
  availableBalance: number;
  holdings: Holding[];
  performance: PerformanceMetrics;
}

export interface Holding {
  asset: string;
  amount: number;
  averagePrice: number;
  currentPrice: number;
  value: number;
  profitLoss: number;
  profitLossPercentage: number;
}

export interface PerformanceMetrics {
  dailyReturn: number;
  weeklyReturn: number;
  monthlyReturn: number;
  totalReturn: number;
  winRate: number;
  totalTrades: number;
  profitableTrades: number;
}

export interface PolicyParameters {
  // Stop-loss parameters
  stopLossPercentage?: number;
  stopLossAmount?: number;
  
  // Take-profit parameters
  takeProfitPercentage?: number;
  takeProfitAmount?: number;
  
  // Trailing-stop parameters
  trailingStopPercentage?: number;
  activationPrice?: number;
  
  // DCA (Dollar Cost Averaging) parameters
  dcaAmount?: number;
  dcaInterval?: 'hourly' | 'daily' | 'weekly' | 'monthly';
  dcaCount?: number;
  
  // Common parameters
  asset?: string;
  maxOrderSize?: number;
  minOrderSize?: number;
}

export interface Policy {
  id: string;
  name: string;
  type: 'stop-loss' | 'take-profit' | 'trailing-stop' | 'dca';
  enabled: boolean;
  parameters: PolicyParameters;
}

export interface Notification {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message?: string;
  timestamp: Date;
  duration?: number;
  action?: {
    label: string;
    handler: () => void;
  };
}

export interface Modal {
  id: string;
  type: 'confirm' | 'alert' | 'custom';
  title?: string;
  content?: React.ReactNode;
  actions?: ModalAction[];
  onClose?: () => void;
}

export interface ModalAction {
  label: string;
  variant?: 'primary' | 'secondary' | 'danger';
  handler: () => void;
}

export interface ComponentState {
  id: string;
  isActive: boolean;
  isLoading: boolean;
  error?: string;
  data?: unknown;
}