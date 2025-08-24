const fs = require('fs');
const path = require('path');
const chalk = require('chalk');
const { networks } = require('../config');

function updateNetworkConfig(networkName, deployments) {
  const configPath = path.join(__dirname, '..', 'config.js');
  let configContent = fs.readFileSync(configPath, 'utf8');
  
  // Find the network section
  const networkRegex = new RegExp(`${networkName}:\\s*{[^}]*contracts:\\s*{[^}]*}`, 's');
  const networkMatch = configContent.match(networkRegex);
  
  if (!networkMatch) {
    console.error(chalk.red(`Network ${networkName} not found in config`));
    return;
  }
  
  // Build new contracts section
  const contractsSection = `contracts: {
      // Tokens
      WETH: '${deployments.WETH}',
      USDC: '${deployments.USDC}',
      USDT: '${deployments.USDT}',
      DAI: '${deployments.DAI}',
      LINK: '${deployments.LINK}',
      SHAPE: '${deployments.SHAPE}',
      
      // Uniswap V2
      uniswapV2Factory: '${deployments.uniswapV2Factory}',
      uniswapV2Router: '${deployments.uniswapV2Router}',
      initCodeHash: '${deployments.initCodeHash}'
    }`;
  
  // Replace the contracts section
  const updatedNetwork = networkMatch[0].replace(/contracts:\s*{[^}]*}/, contractsSection);
  configContent = configContent.replace(networkMatch[0], updatedNetwork);
  
  fs.writeFileSync(configPath, configContent);
  console.log(chalk.green(`✓ Updated config for ${networkName}`));
}

async function main() {
  const args = process.argv.slice(2);
  
  if (args.length < 1) {
    console.log(chalk.red('Usage: node update-deployments.js <network>'));
    console.log('Available networks:', Object.keys(networks).join(', '));
    return;
  }
  
  const networkName = args[0];
  const deploymentPath = path.join(__dirname, '..', 'deployments', `${networkName}.json`);
  
  if (!fs.existsSync(deploymentPath)) {
    console.error(chalk.red(`No deployment found for ${networkName}`));
    return;
  }
  
  const deployments = JSON.parse(fs.readFileSync(deploymentPath, 'utf8'));
  updateNetworkConfig(networkName, deployments);
}

if (require.main === module) {
  main();
}

module.exports = { updateNetworkConfig };