-- Kaiju No. 69 Database Schema for Supabase

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Create enum types
CREATE TYPE trade_type AS ENUM ('swap', 'add_liquidity', 'remove_liquidity', 'perps_long', 'perps_short');
CREATE TYPE trade_status AS ENUM ('pending', 'active', 'closed', 'failed');
CREATE TYPE position_status AS ENUM ('pending', 'active', 'closed', 'failed');

-- Users table
CREATE TABLE kaiju_no_69_users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    wallet_address TEXT UNIQUE NOT NULL,
    server_wallet_address TEXT UNIQUE NOT NULL,
    server_wallet_private_key TEXT NOT NULL, -- Should be encrypted
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Kaijus table
CREATE TABLE kaiju_no_69_kaijus (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nft_collection_address TEXT NOT NULL,
    name TEXT UNIQUE NOT NULL,
    bio TEXT,
    owner_id UUID NOT NULL REFERENCES kaiju_no_69_users(id) ON DELETE CASCADE,
    algorithm_url TEXT NOT NULL,
    kaiju_image_url TEXT NOT NULL,
    shadow_image_urls TEXT[] NOT NULL -- JSON array of URLs,
    is_active BOOLEAN DEFAULT true,
    profit_deposit_address TEXT NOT NULL,
    sacrifice_fee NUMERIC(20, 6) NOT NULL, -- in ETH
    profit_share_percentage NUMERIC(5, 2) CHECK (profit_share_percentage >= 0 AND profit_share_percentage <= 100) NOT NULL,
    total_shadows INTEGER DEFAULT
    avg_pnl_percentage NUMERIC(10, 2) DEFAULT 0,
    wins INTEGER DEFAULT 0,
    losses INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Shadows table (users following kaijus)
CREATE TABLE kaiju_no_69_shadows (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES kaiju_no_69_users(id) ON DELETE CASCADE,
    kaiju_id UUID NOT NULL REFERENCES kaiju_no_69_kaijus(id) ON DELETE CASCADE,
    allocation_percentage NUMERIC(5, 2) CHECK (allocation_percentage > 0 AND allocation_percentage <= 100),
    max_position_size NUMERIC(20, 6), -- in USD
    is_active BOOLEAN DEFAULT true,
    total_profit_loss NUMERIC(20, 6) DEFAULT 0,
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, kaiju_id)
);

-- Trades table
CREATE TABLE kaiju_no_69_trades (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    kaiju_id UUID NOT NULL REFERENCES kaiju_no_69_kaijus(id) ON DELETE CASCADE,
    trade_type trade_type NOT NULL,
    status trade_status DEFAULT 'pending',
    confidence_level NUMERIC(5, 2) CHECK (confidence_level >= 0 AND confidence_level <= 100),
    entry_data JSONB NOT NULL,
    exit_data JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    closed_at TIMESTAMP WITH TIME ZONE
);

-- Shadow positions table
CREATE TABLE kaiju_no_69_shadow_positions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    shadow_id UUID NOT NULL REFERENCES kaiju_no_69_shadows(id) ON DELETE CASCADE,
    trade_id UUID NOT NULL REFERENCES kaiju_no_69_trades(id) ON DELETE CASCADE,
    status position_status DEFAULT 'pending',
    allocated_amount NUMERIC(20, 6),
    actual_amount NUMERIC(20, 6),
    entry_tx_hash TEXT,
    exit_tx_hash TEXT,
    profit_loss NUMERIC(20, 6),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better query performance
CREATE INDEX idx_kaijus_owner_id ON kaiju_no_69_kaijus(owner_id);
CREATE INDEX idx_kaijus_is_active ON kaiju_no_69_kaijus(is_active);
CREATE INDEX idx_shadows_user_id ON kaiju_no_69_shadows(user_id);
CREATE INDEX idx_shadows_kaiju_id ON kaiju_no_69_shadows(kaiju_id);
CREATE INDEX idx_shadows_is_active ON kaiju_no_69_shadows(is_active);
CREATE INDEX idx_trades_kaiju_id ON kaiju_no_69_trades(kaiju_id);
CREATE INDEX idx_trades_status ON kaiju_no_69_trades(status);
CREATE INDEX idx_trades_created_at ON kaiju_no_69_trades(created_at);
CREATE INDEX idx_shadow_positions_shadow_id ON kaiju_no_69_shadow_positions(shadow_id);
CREATE INDEX idx_shadow_positions_trade_id ON kaiju_no_69_shadow_positions(trade_id);
CREATE INDEX idx_shadow_positions_status ON kaiju_no_69_shadow_positions(status);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_kaiju_no_69_users_updated_at BEFORE UPDATE ON kaiju_no_69_users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_kaiju_no_69_kaijus_updated_at BEFORE UPDATE ON kaiju_no_69_kaijus
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_kaiju_no_69_shadow_positions_updated_at BEFORE UPDATE ON kaiju_no_69_shadow_positions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Row Level Security (RLS) Policies
ALTER TABLE kaiju_no_69_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE kaiju_no_69_kaijus ENABLE ROW LEVEL SECURITY;
ALTER TABLE kaiju_no_69_shadows ENABLE ROW LEVEL SECURITY;
ALTER TABLE kaiju_no_69_trades ENABLE ROW LEVEL SECURITY;
ALTER TABLE kaiju_no_69_shadow_positions ENABLE ROW LEVEL SECURITY;

-- Users can only see their own data
CREATE POLICY "Users can view own profile" ON kaiju_no_69_users
    FOR SELECT USING (auth.uid()::text = wallet_address);

-- Anyone can view active kaijus
CREATE POLICY "Anyone can view active kaijus" ON kaiju_no_69_kaijus
    FOR SELECT USING (is_active = true);

-- Kaiju owners can update their own kaijus
CREATE POLICY "Owners can update own kaijus" ON kaiju_no_69_kaijus
    FOR UPDATE USING (owner_id IN (
        SELECT id FROM kaiju_no_69_users WHERE wallet_address = auth.uid()::text
    ));

-- Users can view their own shadow relationships
CREATE POLICY "Users can view own shadows" ON kaiju_no_69_shadows
    FOR SELECT USING (user_id IN (
        SELECT id FROM kaiju_no_69_users WHERE wallet_address = auth.uid()::text
    ));

-- Anyone can view active trades
CREATE POLICY "Anyone can view trades" ON kaiju_no_69_trades
    FOR SELECT USING (true);

-- Users can view their own positions
CREATE POLICY "Users can view own positions" ON kaiju_no_69_shadow_positions
    FOR SELECT USING (shadow_id IN (
        SELECT id FROM kaiju_no_69_shadows WHERE user_id IN (
            SELECT id FROM kaiju_no_69_users WHERE wallet_address = auth.uid()::text
        )
    ));

-- Function to calculate Kaiju PnL after trade closes
CREATE OR REPLACE FUNCTION update_kaiju_pnl()
RETURNS TRIGGER AS $$
DECLARE
    total_positions INTEGER;
    profitable_positions INTEGER;
    total_pnl NUMERIC;
BEGIN
    IF NEW.status = 'closed' AND OLD.status != 'closed' THEN
        -- Count total and profitable positions for this trade
        SELECT 
            COUNT(*),
            COUNT(CASE WHEN profit_loss > 0 THEN 1 END),
            COALESCE(AVG(profit_loss), 0)
        INTO total_positions, profitable_positions, total_pnl
        FROM kaiju_no_69_shadow_positions
        WHERE trade_id = NEW.id AND status = 'closed';

        -- Update kaiju stats
        IF total_pnl > 0 THEN
            UPDATE kaiju_no_69_kaijus
            SET wins = wins + 1,
                avg_pnl_percentage = (
                    SELECT AVG(
                        CASE 
                            WHEN sp.allocated_amount > 0 THEN (sp.profit_loss / sp.allocated_amount) * 100
                            ELSE 0
                        END
                    )
                    FROM kaiju_no_69_shadow_positions sp
                    JOIN kaiju_no_69_trades t ON sp.trade_id = t.id
                    WHERE t.kaiju_id = NEW.kaiju_id AND t.status = 'closed'
                )
            WHERE id = NEW.kaiju_id;
        ELSE
            UPDATE kaiju_no_69_kaijus
            SET losses = losses + 1,
                avg_pnl_percentage = (
                    SELECT AVG(
                        CASE 
                            WHEN sp.allocated_amount > 0 THEN (sp.profit_loss / sp.allocated_amount) * 100
                            ELSE 0
                        END
                    )
                    FROM kaiju_no_69_shadow_positions sp
                    JOIN kaiju_no_69_trades t ON sp.trade_id = t.id
                    WHERE t.kaiju_id = NEW.kaiju_id AND t.status = 'closed'
                )
            WHERE id = NEW.kaiju_id;
        END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_kaiju_pnl_trigger
AFTER UPDATE ON kaiju_no_69_trades
FOR EACH ROW
EXECUTE FUNCTION update_kaiju_pnl();

-- Function to update shadow total PnL
CREATE OR REPLACE FUNCTION update_shadow_total_pnl()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.status = 'closed' AND OLD.status != 'closed' AND NEW.profit_loss IS NOT NULL THEN
        UPDATE kaiju_no_69_shadows
        SET total_profit_loss = total_profit_loss + NEW.profit_loss
        WHERE id = NEW.shadow_id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_shadow_pnl_trigger
AFTER UPDATE ON kaiju_no_69_shadow_positions
FOR EACH ROW
EXECUTE FUNCTION update_shadow_total_pnl();