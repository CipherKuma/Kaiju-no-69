import { createClient } from '@supabase/supabase-js';

if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
  throw new Error('Missing Supabase environment variables');
}

// Server-side Supabase client with service role key
// This should only be used in server-side code (API routes, server components, etc.)
export const supabaseServer = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);

// Database types (matching the backend service)
export interface User {
  id: string;
  wallet_address: string;
  server_wallet_address?: string;
  server_wallet_private_key?: string;
  created_at: Date;
  updated_at: Date;
}

export interface Kaiju {
  id: string;
  nft_collection_address: string;
  name: string;
  bio: string;
  owner_id: string;
  algorithm_url: string;
  kaiju_image_url: string;
  shadow_image_url: string;
  is_active: boolean;
  avg_pnl_percentage: number;
  wins: number;
  losses: number;
  created_at: Date;
  updated_at: Date;
}

export interface Shadow {
  id: string;
  user_id: string;
  kaiju_id: string;
  allocation_percentage: number;
  max_position_size: number;
  is_active: boolean;
  total_profit_loss: number;
  joined_at: Date;
}

export type TradeType = 'swap' | 'add_liquidity' | 'remove_liquidity' | 'perps_long' | 'perps_short';
export type TradeStatus = 'pending' | 'active' | 'closed' | 'failed';
export type PositionStatus = 'pending' | 'active' | 'closed' | 'failed';

export interface Trade {
  id: string;
  kaiju_id: string;
  trade_type: TradeType;
  status: TradeStatus;
  confidence_level: number;
  entry_data: any;
  exit_data?: any;
  created_at: Date;
  closed_at?: Date;
}

export interface ShadowPosition {
  id: string;
  shadow_id: string;
  trade_id: string;
  status: PositionStatus;
  allocated_amount: number;
  actual_amount: number;
  entry_tx_hash: string;
  exit_tx_hash?: string;
  profit_loss?: number;
  created_at: Date;
  updated_at: Date;
}