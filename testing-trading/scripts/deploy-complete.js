const { ethers } = require('hardhat');
const chalk = require('chalk');
const fs = require('fs');
const path = require('path');

// Contract addresses from the partial deployment
const SHAPE_SEPOLIA_DEPLOYMENT = {
  WETH: '0x83dF0Ed0b4f3D1D057cB56494b8c7eE417265489',
  USDC: '0x183F03D0e64d75fe62b5cb0F8c330A1707F15d3A',
  USDT: '0x28e9112381A9c4Da0B98a0A3F65af704bd7DaAc0',
  DAI: '0xB0FC35262d8383bE97b90D01b3F5572007E7A10E',
  LINK: '0x83B085E9F68757972279826612553D398FD24C8b',
  SHAPE: '0x92F84329447e08bc02470A583f4c558E5f6BF05c',
  uniswapV2Factory: '0xbab6d9Dc29B0aFE195D4FFf5e24Dc456eCd3686C',
  uniswapV2Router: '0x92ED5E27Bea8bAbF79Cbc62e843062F6406f7644',
  initCodeHash: '0x96e8ac4277198ff8b6f785478aa9a39f403cb768dd02cbee326c3e7da348845f'
};

async function saveDeployment(networkName, deployments) {
  const deploymentsDir = path.join(__dirname, '..', 'deployments');
  if (!fs.existsSync(deploymentsDir)) {
    fs.mkdirSync(deploymentsDir);
  }
  
  const filePath = path.join(deploymentsDir, `${networkName}.json`);
  fs.writeFileSync(filePath, JSON.stringify(deployments, null, 2));
  console.log(chalk.green(`✓ Deployments saved to ${filePath}`));
}

async function main() {
  const networkName = process.env.HARDHAT_NETWORK || 'localhost';
  
  if (networkName === 'shapeSepolia') {
    // Save the Shape Sepolia deployment
    await saveDeployment('shapeSepolia', SHAPE_SEPOLIA_DEPLOYMENT);
    
    // Update config
    const { updateNetworkConfig } = require('./update-deployments');
    updateNetworkConfig('shapeSepolia', SHAPE_SEPOLIA_DEPLOYMENT);
    
    console.log(chalk.magenta(`\n🎉 Shape Sepolia deployment saved!`));
    console.log(chalk.cyan('Deployed Contracts:'));
    console.log(JSON.stringify(SHAPE_SEPOLIA_DEPLOYMENT, null, 2));
  }
}

if (require.main === module) {
  main()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}

module.exports = { SHAPE_SEPOLIA_DEPLOYMENT };