# DeFi Testing Scripts for EVM Testnets

A comprehensive testing suite for DeFi protocols on EVM testnets including token swapping, liquidity provision, and lending/borrowing.

## 🚀 Features

- **Token Swapping**: Uniswap V2/V3 integration
- **Liquidity Provision**: Add/remove liquidity to AMM pools
- **Lending/Borrowing**: Aave protocol integration
- **Multi-Network Support**: Sepolia, Arbitrum Sepolia, Base Sepolia, Polygon Amoy
- **Easy CLI Interface**: Simple commands for common DeFi operations

## 📋 Supported Networks

| Network | Chain ID | Currency | Uniswap V2 | Uniswap V3 | Aave V3 |
|---------|----------|----------|------------|------------|---------|
| Ethereum Sepolia | 11155111 | ETH | ✅ | ✅ | ✅ |
| Arbitrum Sepolia | 421614 | ETH | ❌ | ✅ | ✅ |
| Base Sepolia | 84532 | ETH | ❌ | ✅ | ❌ |
| Polygon Amoy | 80002 | MATIC | ❌ | ✅ | ❌ |

## 🛠 Setup

### 1. Install Dependencies

```bash
cd testing-trading
npm install
```

### 2. Environment Configuration

Create your environment file:

```bash
npm run setup all
```

Or manually create `.env` file:

```env
PRIVATE_KEY=your_private_key_here_without_0x
SEPOLIA_RPC=https://rpc.sepolia.org
```

### 3. Fund Your Wallets

Get test tokens from faucets:

```bash
node scripts/setup.js faucets sepolia
```

**Faucet Links:**
- Sepolia ETH: https://sepoliafaucet.com/
- Arbitrum Sepolia: https://faucet.quicknode.com/arbitrum/sepolia
- Base Sepolia: https://faucet.quicknode.com/base/sepolia
- Polygon Amoy: https://faucet.polygon.technology/

### 4. Test Connection

```bash
node scripts/setup.js test sepolia
```

## 📖 Usage

### Token Swapping

```bash
# Check balances
npm run swap sepolia balances

# Swap 0.01 ETH for USDC using Uniswap V2
npm run swap sepolia swapETHToUSDC 0.01

# Swap 5 USDC for ETH
npm run swap sepolia swapUSDCToETH 5

# Swap using Uniswap V3
npm run swap sepolia swapETHToUSDCV3 0.01
```

**Available Commands:**
- `balances` - Display token balances
- `swapETHToUSDC <amount>` - Swap ETH to USDC (V2)
- `swapUSDCToETH <amount>` - Swap USDC to ETH (V2)
- `swapETHToUSDCV3 <amount>` - Swap ETH to USDC (V3)

### Liquidity Provision

```bash
# Check LP positions
npm run liquidity sepolia positions

# Add liquidity (0.01 ETH + 10 USDC)
npm run liquidity sepolia addETHUSDC 0.01 10

# Remove liquidity
npm run liquidity sepolia removeETHUSDC 0.001

# Mint V3 position
npm run liquidity sepolia mintV3 0.01 10 3000
```

**Available Commands:**
- `positions` - Display LP positions
- `addETHUSDC <eth> <usdc>` - Add liquidity to ETH/USDC pool
- `removeETHUSDC <lpAmount>` - Remove liquidity
- `mintV3 <eth> <usdc> <fee>` - Mint V3 position (fee: 500, 3000, 10000)

### Lending/Borrowing (Aave)

```bash
# Check lending positions
npm run lending sepolia positions

# Supply 10 USDC as collateral
npm run lending sepolia supplyUSDC 10

# Borrow 5 USDC against collateral
npm run lending sepolia borrowUSDC 5

# Repay 5 USDC
npm run lending sepolia repayUSDC 5

# Withdraw all USDC
npm run lending sepolia withdrawUSDC max
```

**Available Commands:**
- `positions` - Display lending/borrowing positions
- `supplyUSDC <amount>` - Supply USDC as collateral
- `withdrawUSDC <amount|max>` - Withdraw supplied USDC
- `borrowUSDC <amount> [stable|variable]` - Borrow USDC (default: variable)
- `repayUSDC <amount|max> [stable|variable]` - Repay borrowed USDC

## 📁 Project Structure

```
testing-trading/
├── config.js              # Network configurations
├── package.json            # Dependencies and scripts
├── .env                   # Environment variables
├── scripts/
│   ├── setup.js           # Setup and testing utilities
│   ├── swap.js            # Token swapping (Uniswap)
│   ├── liquidity.js       # Liquidity provision (Uniswap)
│   └── lending.js         # Lending/borrowing (Aave)
└── README.md              # This file
```

## 🔧 Advanced Usage

### Custom Network Configuration

Edit `config.js` to add custom networks or update contract addresses:

```javascript
const networks = {
  customNetwork: {
    name: 'Custom Network',
    chainId: 123456,
    rpc: 'https://custom-rpc.com',
    currency: 'ETH',
    contracts: {
      uniswapV2Router: '0x...',
      // Add other contract addresses
    }
  }
};
```

### Script Integration

Use the classes in your own scripts:

```javascript
const { SwapTester } = require('./scripts/swap');
const { LiquidityTester } = require('./scripts/liquidity');
const { LendingTester } = require('./scripts/lending');

async function myCustomStrategy() {
  const swapper = new SwapTester('sepolia');
  
  // Your custom DeFi strategy here
  await swapper.swapETHForTokensV2(...);
}
```

## ⚠️ Important Notes

### Security
- **Never use real funds on mainnet with these scripts**
- **Never commit your private key to version control**
- **Always test on testnets first**

### Gas Fees
- Keep some native tokens (ETH/MATIC) for gas fees
- Testnet transactions still require gas
- Failed transactions consume gas

### Slippage
- Default slippage is 0.5%
- High slippage may be needed for low liquidity pairs
- Monitor for MEV attacks on testnets

### Rate Limits
- Public RPCs have rate limits
- Use private RPC endpoints for heavy testing
- Add delays between transactions if needed

## 🛟 Troubleshooting

### Common Issues

**"Insufficient funds for gas"**
```bash
# Get test ETH from faucets
node scripts/setup.js faucets sepolia
```

**"Private key required"**
```bash
# Create and configure .env file
node scripts/setup.js env
# Then edit .env with your private key
```

**"Network not supported"**
```bash
# Check available networks
node scripts/setup.js test
```

**"Pair does not exist"**
- The trading pair might not exist on the testnet
- Try a different token pair
- Check if tokens are available on the network

### Debug Mode

Enable verbose logging by setting:
```env
DEBUG=true
```

## 🚀 Next Steps

1. **Get Test Funds**: Fund your wallet with testnet tokens
2. **Basic Trading**: Start with simple ETH/USDC swaps
3. **Liquidity Provision**: Try adding liquidity to pools
4. **Advanced Strategies**: Combine multiple operations
5. **Custom Scripts**: Build your own DeFi strategies

## 📚 Resources

- [Uniswap Documentation](https://docs.uniswap.org/)
- [Aave Developer Docs](https://docs.aave.com/developers/)
- [Ethers.js Documentation](https://docs.ethers.io/)
- [Ethereum Testnets](https://ethereum.org/en/developers/docs/networks/)

## 🤝 Contributing

Feel free to add more protocols, networks, or features:
1. Fork the project
2. Add your changes
3. Test on testnets
4. Submit a pull request

## ⚖️ License

Use at your own risk. This is for educational and testing purposes only.

---

**Happy Testing! 🎉**

Remember: Always test thoroughly on testnets before using any code with real funds.