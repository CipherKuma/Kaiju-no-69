import { DeFiExecutor } from './defi/DeFiExecutor.js';
import { logger } from './utils/logger.js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../.env') });

async function testDeFiExecutor() {
  const privateKey = process.env.PRIVATE_KEY;
  
  if (!privateKey) {
    logger.error('PRIVATE_KEY not found in .env file');
    return;
  }
  
  try {
    logger.info('Initializing DeFi Executor for Shape Sepolia...');
    const defiExecutor = new DeFiExecutor(privateKey);
    
    // Get account status
    logger.info('Fetching account status...');
    const status = await defiExecutor.getAccountStatus();
    console.log('\n=== Account Status ===');
    console.log(`Address: ${status.address}`);
    console.log(`Network: ${status.network}`);
    console.log(`Portfolio Value: $${status.portfolioValue.toFixed(2)}`);
    console.log('\n=== Token Balances ===');
    Object.entries(status.balances).forEach(([token, data]: [string, any]) => {
      console.log(`${token}: ${data.balance} ${data.symbol}`);
    });
    
    if (status.perpAccount) {
      console.log('\n=== Perpetual Account ===');
      console.log(`Total Collateral: ${status.perpAccount.totalCollateral} USDC`);
      console.log(`Available Collateral: ${status.perpAccount.availableCollateral} USDC`);
      console.log(`Active Positions: ${status.perpAccount.positionCount}`);
    }
    
    // Test a small swap if there's ETH balance
    const ethBalance = parseFloat(status.balances.ETH.balance);
    if (ethBalance > 0.001) {
      console.log('\n=== Testing Swap Functionality ===');
      console.log('Simulating ETH -> USDC swap signal...');
      
      const testSignal = {
        symbol: 'ETH/USDC',
        action: 'SELL' as const,
        confidence: 0.8,
        reason: 'Test swap execution',
        timestamp: new Date(),
        positionSize: 0.01, // 1% of portfolio
      };
      
      console.log('Would execute:', testSignal);
      // Uncomment to actually execute:
      // const result = await defiExecutor.executeSpotTrade(testSignal);
      // console.log('Swap result:', result);
    }
    
    logger.info('DeFi Executor test completed successfully');
    
  } catch (error) {
    logger.error('Error testing DeFi Executor', { error });
  }
}

// Run the test
testDeFiExecutor();