const { ethers } = require('ethers');
const chalk = require('chalk');
const { getWallet, getNetwork, networks } = require('../config');

// TestToken ABI with mintPublic function
const TESTTOKEN_ABI = [
  "function mintPublic(address to, uint256 amount) public",
  "function decimals() external view returns (uint8)",
  "function symbol() external view returns (string)",
  "function balanceOf(address owner) external view returns (uint256)"
];

class TokenDistributor {
  constructor(networkName) {
    this.networkName = networkName;
    this.network = getNetwork(networkName);
    this.wallet = getWallet(networkName);
    this.userAddress = '0x6B9ad963c764a06A7ef8ff96D38D0cB86575eC00';
  }

  async getTokenContract(tokenAddress) {
    return new ethers.Contract(tokenAddress, TESTTOKEN_ABI, this.wallet);
  }

  async mintTokens(tokenAddress, tokenName, totalAmount) {
    try {
      console.log(chalk.blue(`\n📍 Minting ${totalAmount} ${tokenName} on ${this.network.name}...`));
      
      const contract = await this.getTokenContract(tokenAddress);
      const decimals = await contract.decimals();
      const symbol = await contract.symbol();
      
      console.log(`Token: ${symbol}, Decimals: ${decimals}`);
      
      // Calculate amount in wei (with decimals)
      const amountInWei = ethers.parseUnits(totalAmount.toString(), decimals);
      
      // Since mintPublic has a limit of 1000 tokens per call, we need to split large amounts
      const maxPerCall = ethers.parseUnits('1000', decimals);
      const calls = [];
      let remaining = amountInWei;
      
      while (remaining > 0n) {
        const thisAmount = remaining > maxPerCall ? maxPerCall : remaining;
        calls.push(thisAmount);
        remaining -= thisAmount;
      }
      
      console.log(`Will require ${calls.length} mint calls (max 1000 per call)`);
      
      let totalMinted = 0n;
      for (let i = 0; i < calls.length; i++) {
        const amount = calls[i];
        const readableAmount = ethers.formatUnits(amount, decimals);
        
        console.log(chalk.yellow(`  Mint call ${i+1}/${calls.length}: ${readableAmount} ${symbol}...`));
        
        const tx = await contract.mintPublic(this.userAddress, amount);
        const receipt = await tx.wait();
        
        totalMinted += amount;
        console.log(chalk.green(`  ✓ Minted ${readableAmount} ${symbol} (tx: ${tx.hash})`));
      }
      
      // Verify final balance
      const balance = await contract.balanceOf(this.userAddress);
      const readableBalance = ethers.formatUnits(balance, decimals);
      
      console.log(chalk.green(`✅ Successfully minted ${totalAmount} ${tokenName}`));
      console.log(chalk.green(`   Final balance: ${readableBalance} ${symbol}`));
      
      return true;
      
    } catch (error) {
      console.log(chalk.red(`❌ Failed to mint ${tokenName}:`, error.message));
      return false;
    }
  }

  async distributeAllTokens() {
    console.log(chalk.magenta(`\n🚀 Starting token distribution on ${this.network.name}`));
    console.log(chalk.blue(`Target wallet: ${this.userAddress}`));
    
    const tokenDistribution = [
      { name: 'USDC', amount: 10000, address: this.network.contracts.USDC },
      { name: 'USDT', amount: 10000, address: this.network.contracts.USDT },
      { name: 'DAI', amount: 1000, address: this.network.contracts.DAI },
      { name: 'LINK', amount: 100, address: this.network.contracts.LINK },
      { name: 'SHAPE', amount: 10000, address: this.network.contracts.SHAPE }
    ];
    
    let successCount = 0;
    
    for (const token of tokenDistribution) {
      const success = await this.mintTokens(token.address, token.name, token.amount);
      if (success) successCount++;
      
      // Add small delay between mints
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    console.log(chalk.magenta(`\n📊 Distribution Summary for ${this.network.name}:`));
    console.log(chalk.green(`✅ Successful: ${successCount}/${tokenDistribution.length} tokens`));
    console.log(chalk.red(`❌ Failed: ${tokenDistribution.length - successCount}/${tokenDistribution.length} tokens`));
    
    return successCount === tokenDistribution.length;
  }

  async checkBalances() {
    console.log(chalk.blue(`\n💰 Token Balances on ${this.network.name}:`));
    
    const tokens = [
      { name: 'USDC', address: this.network.contracts.USDC },
      { name: 'USDT', address: this.network.contracts.USDT },
      { name: 'DAI', address: this.network.contracts.DAI },
      { name: 'LINK', address: this.network.contracts.LINK },
      { name: 'SHAPE', address: this.network.contracts.SHAPE }
    ];
    
    for (const token of tokens) {
      try {
        const contract = await this.getTokenContract(token.address);
        const [balance, decimals, symbol] = await Promise.all([
          contract.balanceOf(this.userAddress),
          contract.decimals(),
          contract.symbol()
        ]);
        
        const readableBalance = ethers.formatUnits(balance, decimals);
        console.log(`${symbol}: ${readableBalance}`);
      } catch (error) {
        console.log(chalk.red(`${token.name}: Error - ${error.message}`));
      }
    }
    
    // Also check native token balance
    try {
      const balance = await this.wallet.provider.getBalance(this.userAddress);
      const readableBalance = ethers.formatEther(balance);
      console.log(`${this.network.currency}: ${readableBalance}`);
    } catch (error) {
      console.log(chalk.red(`${this.network.currency}: Error - ${error.message}`));
    }
  }
}

// CLI functionality
async function main() {
  const args = process.argv.slice(2);
  
  if (args.length < 1) {
    console.log(chalk.red('Usage: node distribute-tokens.js <action> [network]'));
    console.log('Actions:');
    console.log('  distribute <network> - Distribute tokens to user wallet');
    console.log('  balances <network>   - Check token balances');
    console.log('  all                  - Distribute on all networks');
    console.log('');
    console.log('Networks:', Object.keys(networks).filter(n => n !== 'shapeSepolia').join(', '));
    return;
  }
  
  const [action, network] = args;
  
  try {
    if (action === 'all') {
      console.log(chalk.magenta('🌐 Distributing tokens on all networks...\n'));
      
      // Use the 4 main networks (exclude shapeSepolia as mentioned by user)
      const targetNetworks = ['sepolia', 'arbitrumSepolia', 'baseSepolia', 'polygonAmoy'];
      let totalSuccessful = 0;
      
      for (const networkName of targetNetworks) {
        const distributor = new TokenDistributor(networkName);
        const success = await distributor.distributeAllTokens();
        if (success) totalSuccessful++;
        
        console.log(''); // Add spacing between networks
      }
      
      console.log(chalk.magenta(`\n🎯 Overall Summary:`));
      console.log(chalk.green(`✅ Successful networks: ${totalSuccessful}/${targetNetworks.length}`));
      console.log(chalk.red(`❌ Failed networks: ${targetNetworks.length - totalSuccessful}/${targetNetworks.length}`));
      
      return;
    }
    
    if (!network) {
      console.log(chalk.red('Network required for this action'));
      console.log('Available networks:', Object.keys(networks).join(', '));
      return;
    }
    
    const distributor = new TokenDistributor(network);
    
    switch (action) {
      case 'distribute':
        await distributor.distributeAllTokens();
        break;
        
      case 'balances':
        await distributor.checkBalances();
        break;
        
      default:
        console.log(chalk.red(`Unknown action: ${action}`));
    }
    
  } catch (error) {
    console.error(chalk.red('Error:'), error.message);
    
    if (error.message.includes('PRIVATE_KEY')) {
      console.log(chalk.yellow('\n💡 Tip: Check your .env file has PRIVATE_KEY set'));
    }
  }
}

if (require.main === module) {
  main();
}

module.exports = { TokenDistributor };