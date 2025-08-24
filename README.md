# Kaiju No. 69 - Automated Copy Trading Platform

A decentralized trading platform where expert traders (Kaijus) create trading algorithms, and followers (Shadows) automatically copy their trades on Shape Sepolia. Built with a comprehensive DeFi ecosystem deployed across 5 EVM testnets.

## 🏗️ Architecture Overview

The platform consists of three main components:

1. **Frontend (Next.js)** - User interface for connecting wallets, following Kaijus, and monitoring positions
2. **Kaiju Service (Express/TypeScript)** - Central backend service managing users, trades, and shadow operations  
3. **Trading Algorithms (Express/TypeScript)** - Individual trading bots run by Kaiju owners

### System Flow
```
Trading Algorithm → Posts Trade → Kaiju Service → Executes for all Shadows
                                        ↓
                                  Supabase DB
                                        ↓
                                  Frontend UI
```

### Key Features
- **Automated Copy Trading**: Shadows automatically copy trades from their followed Kaijus
- **Server Wallets**: Secure server-side wallet management for automated trading
- **Multiple DeFi Operations**: Support for token swaps, liquidity provision, and perpetual trading
- **Risk Management**: Configurable position sizes and allocation percentages
- **Performance Tracking**: Real-time PnL tracking and analytics

## 🚀 Quick Start

### Setting up the Platform

```bash
# Clone the repository
git clone https://github.com/yourusername/kaiju-no-69.git
cd kaiju-no-69

# Setup Kaiju Service
cd kaiju-service
npm install
cp .env.example .env
# Configure environment variables
npm run dev

# Setup Trading Algorithm (in another terminal)
cd ../trading-algorithm
npm install
cp .env.example .env
# Configure KAIJU_ID and ALGORITHM_KEY
npm run dev

# Setup Frontend (in another terminal)
cd ../frontend
npm install
npm run dev
```

### Testing DeFi Operations

```bash
# Install dependencies
cd testing-trading
npm install

# Check balances on all networks
npm run swap shapeSepolia balances
npm run swap arbitrumSepolia balances
npm run swap baseSepolia balances
npm run swap sepolia balances
npm run swap polygonAmoy balances
```

## 🗄️ Database Schema

Key tables (all prefixed with `kaiju_no_69_`):
- `users` - User wallets and server wallets  
- `kaijus` - Trading algorithms and their performance
- `shadows` - User-Kaiju following relationships
- `trades` - Trade signals from Kaijus
- `shadow_positions` - Individual positions for each shadow

## 📡 API Endpoints

### Authentication
- `POST /api/auth/connect` - Connect wallet and create/fetch user
- `GET /api/auth/profile` - Get user profile

### Kaiju Management  
- `POST /api/kaijus` - Create new Kaiju
- `GET /api/kaijus` - List all active Kaijus
- `GET /api/kaijus/:id` - Get Kaiju details
- `PUT /api/kaijus/:id` - Update Kaiju settings

### Shadow Operations
- `POST /api/shadows/follow` - Follow a Kaiju
- `PUT /api/shadows/:id/settings` - Update shadow settings  
- `DELETE /api/shadows/:id` - Unfollow a Kaiju
- `GET /api/shadows/positions` - Get all positions

### Trading (Called by Algorithms)
- `POST /api/trades` - Post new trade signal
- `GET /api/kaijus/:id/trades/active` - Get active trades
- `POST /api/trades/:id/close` - Close a position

## 🤖 Trading Algorithm Integration

Trading algorithms communicate with the main service via REST API:

```typescript
import { KaijuServiceClient } from './api/KaijuServiceClient';

const client = new KaijuServiceClient(
  'http://localhost:3000',
  'your-kaiju-id',
  'your-algorithm-key'
);

// Post a swap trade
await client.postTrade({
  tradeType: 'swap',
  confidenceLevel: 85,
  entryData: {
    type: 'swap',
    data: {
      tokenIn: '0x...USDC',
      tokenOut: '0x...WETH',
      amountIn: '1000000000', // 1000 USDC
      minAmountOut: '400000000000000000' // 0.4 WETH
    }
  }
});
```

## ⚙️ Environment Variables

### Kaiju Service (.env)
```
PORT=3000
SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_KEY=your_service_key
JWT_SECRET=your_jwt_secret
SHAPE_SEPOLIA_RPC_URL=your_rpc_url
WALLET_ENCRYPTION_KEY=32_char_encryption_key
```

### Trading Algorithm (.env)
```
KAIJU_SERVICE_URL=http://localhost:3000
KAIJU_ID=your_kaiju_uuid
ALGORITHM_KEY=your_algorithm_key
MIN_CONFIDENCE_THRESHOLD=70
```

## 🌐 Deployed Networks

### Production-Ready Networks (Full DEX + Swaps)

#### 1. Shape Sepolia ✅
- **Explorer**: https://explorer-sepolia.shape.network
- **Status**: Fully functional with 1M+ tokens
- **All features working**: Tokens, DEX, Swaps, Liquidity

#### 2. Arbitrum Sepolia ✅  
- **Explorer**: https://sepolia.arbiscan.io
- **Status**: Fully functional with 1M+ tokens
- **All features working**: Tokens, DEX, Swaps, Liquidity

### Token-Ready Networks (Partial DEX)

#### 3. Base Sepolia ⚠️
- **Explorer**: https://sepolia.basescan.org
- **Status**: Tokens deployed, DEX partial
- **Working**: Token distribution, ETH→Token swaps

#### 4. Ethereum Sepolia ⚠️
- **Explorer**: https://sepolia.etherscan.io  
- **Status**: Tokens deployed, Factory deployed
- **Working**: Token distribution

#### 5. Polygon Amoy ⚠️
- **Explorer**: https://amoy.polygonscan.com
- **Status**: Tokens deployed, Factory deployed
- **Working**: Token distribution

## 📋 Contract Addresses

### Shape Sepolia
```json
{
  "WETH": "0x83dF0Ed0b4f3D1D057cB56494b8c7eE417265489",
  "USDC": "0x183F03D0e64d75fe62b5cb0F8c330A1707F15d3A",
  "USDT": "0x28e9112381A9c4Da0B98a0A3F65af704bd7DaAc0",
  "DAI": "0xB0FC35262d8383bE97b90D01b3F5572007E7A10E",
  "LINK": "0x83B085E9F68757972279826612553D398FD24C8b",
  "SHAPE": "0x92F84329447e08bc02470A583f4c558E5f6BF05c",
  "uniswapV2Factory": "0xbab6d9Dc29B0aFE195D4FFf5e24Dc456eCd3686C",
  "uniswapV2Router": "0x92ED5E27Bea8bAbF79Cbc62e843062F6406f7644"
}
```

### Arbitrum Sepolia
```json
{
  "WETH": "0x8F85839666aeb022b921AF01B560b9BE56569a2c",
  "USDC": "0x773d64029E11408B2D455e5931Bc5F1C2e828b6B",
  "USDT": "0xab11cda079c613eFA68C35dC46e4C05E0b1e1645",
  "DAI": "0xCAe1c804932AB07d3428774058eC14Fb4dfb2baB",
  "LINK": "0x9AE94c5AB869e8f467854d25278d8b4B6f532d3b",
  "SHAPE": "0xF4f58442A12c5322098B6390c8e000f84d069B4E",
  "uniswapV2Factory": "0xA8AF2629d4AeF4Ab451d03bF571e08Ed38543f00",
  "uniswapV2Router": "0xA212B4a2a56364d1b9d48070320519c3735e49eC"
}
```

*Full addresses for all networks available in `/deployments` directory*

## 🎮 Available DeFi Actions

### 1. Token Distribution (All Networks) ✅
```bash
# Distribute test tokens to your wallet
npm run distribute-tokens distribute shapeSepolia
npm run distribute-tokens distribute arbitrumSepolia  
npm run distribute-tokens distribute baseSepolia
npm run distribute-tokens distribute sepolia
npm run distribute-tokens distribute polygonAmoy

# Check all balances
npm run distribute-tokens balances shapeSepolia
```

Each distribution provides:
- 10,000 USDC (6 decimals)
- 10,000 USDT (6 decimals)
- 1,000 DAI (18 decimals)
- 100 LINK (18 decimals)
- 10,000 SHAPE (18 decimals)

### 2. Token Swaps (Shape & Arbitrum) ✅
```bash
# Swap ETH to USDC
npm run swap shapeSepolia swapETHToUSDC 0.01
npm run swap arbitrumSepolia swapETHToUSDC 0.01

# Swap USDC to ETH
npm run swap shapeSepolia swapUSDCToETH 50
npm run swap arbitrumSepolia swapUSDCToETH 50

# Swap between tokens
npm run swap shapeSepolia swapTokens USDC USDT 100
```

### 3. Liquidity Operations (Shape & Arbitrum) ⚠️
```bash
# Add liquidity to ETH/USDC pool
npm run liquidity shapeSepolia addETHUSDC 0.1 500

# Add liquidity to token pairs
npm run liquidity shapeSepolia addTokens USDC USDT 1000 1000

# Remove liquidity
npm run liquidity shapeSepolia remove ETH USDC 50
```

### 4. Advanced Trading Features 🚧
```bash
# Price feeds (coming soon)
npm run perps shapeSepolia prices

# Perpetual trading (in development)
npm run perps shapeSepolia openPosition ETH 100 10
```

## 🛠️ Testing Scripts

### Setup & Configuration
```bash
cd testing-trading

# Create .env file with your private key
cp .env.example .env
# Edit .env and add your PRIVATE_KEY

# Test network connections
npm run setup test sepolia
npm run setup test arbitrumSepolia

# View all contract addresses
npm run setup contracts shapeSepolia
```

### Swap Testing
```bash
# Basic swap operations
node scripts/swap.js <network> <action> [params]

# Actions:
# - balances: Check all token balances
# - swapETHToUSDC <amount>: Swap ETH for USDC
# - swapUSDCToETH <amount>: Swap USDC for ETH
# - swapTokens <tokenA> <tokenB> <amount>: Swap between tokens

# Examples:
node scripts/swap.js shapeSepolia balances
node scripts/swap.js shapeSepolia swapETHToUSDC 0.01
node scripts/swap.js arbitrumSepolia swapUSDCToETH 100
```

### Token Distribution
```bash
# Distribute tokens script
node scripts/distribute-tokens.js <action> [network]

# Actions:
# - all: Distribute on all networks
# - distribute <network>: Distribute on specific network
# - balances <network>: Check balances

# Examples:
node scripts/distribute-tokens.js all
node scripts/distribute-tokens.js distribute shapeSepolia
node scripts/distribute-tokens.js balances arbitrumSepolia
```

## 🔧 Development

### Contract Development
```bash
cd testing-trading

# Compile contracts
npx hardhat compile

# Deploy to a network
npx hardhat run scripts/deploy-dex.js --network shapeSepolia

# Verify contracts
npx hardhat verify --network shapeSepolia CONTRACT_ADDRESS
```

### Frontend Development
```bash
cd frontend

# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build
```

## 📊 Token Information

| Token | Symbol | Decimals | Initial Supply | Mint Limit |
|-------|--------|----------|----------------|------------|
| USD Coin | USDC | 6 | 1B | 1000/tx |
| Tether | USDT | 6 | 1B | 1000/tx |
| DAI | DAI | 18 | 1B | 1000/tx |
| Chainlink | LINK | 18 | 1B | 1000/tx |
| Shape Token | SHAPE | 18 | 1B | 1000/tx |
| Wrapped ETH | WETH | 18 | N/A | N/A |

## 🚨 Important Notes

1. **Test Networks Only**: All contracts are deployed on testnets. Do not send real funds.

2. **Mint Limits**: The `mintPublic` function has a limit of 1000 tokens per transaction for safety.

3. **Gas Requirements**: 
   - Shape/Arbitrum/Base: ~0.1 ETH recommended
   - Ethereum Sepolia: ~0.2 ETH recommended  
   - Polygon Amoy: ~0.5 MATIC recommended

4. **Private Key Security**: Never commit your private key. Use environment variables.

## 🎯 Ready DeFi Actions Summary

### ✅ Fully Working (Shape & Arbitrum Sepolia)
- Token minting/distribution (all 6 tokens)
- ETH ↔ Token swaps (all pairs)
- Token ↔ Token swaps (all pairs)
- Balance checking
- Approval management
- Basic liquidity operations

### ⚠️ Partially Working (Base, Ethereum, Polygon)
- Token minting/distribution
- Balance checking
- ETH → Token swaps (Base only)
- Approval management

### 🚧 In Development
- Perpetual trading contracts
- Advanced liquidity management
- Cross-chain bridging
- Yield farming
- Governance tokens

## 📝 License

MIT License - See LICENSE file for details

## 🤝 Contributing

Contributions are welcome! Please read our contributing guidelines before submitting PRs.

## 📞 Support

- Documentation: Check `/testing-trading/README.md` for detailed testing guides
- Issues: Submit on GitHub Issues
- Community: Join our Discord server

---

**Built with ❤️ for the DeFi community**