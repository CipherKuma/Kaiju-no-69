const { ethers } = require('hardhat');
const chalk = require('chalk');
const fs = require('fs');
const path = require('path');

// Uniswap V2 contract artifacts
const UniswapV2Factory = require('@uniswap/v2-core/build/UniswapV2Factory.json');
const UniswapV2Router02 = require('@uniswap/v2-periphery/build/UniswapV2Router02.json');
const UniswapV2Pair = require('@uniswap/v2-core/build/UniswapV2Pair.json');
const WETH9 = require('@uniswap/v2-periphery/build/WETH9.json');

class DexDeployer {
  constructor(network) {
    this.network = network;
    this.deployments = {};
  }

  async deployToken(name, symbol, decimals, initialSupply) {
    console.log(chalk.yellow(`Deploying ${symbol}...`));
    
    const TestToken = await ethers.getContractFactory("TestToken");
    const token = await TestToken.deploy(
      name,
      symbol,
      decimals,
      ethers.parseUnits(initialSupply, decimals)
    );
    await token.waitForDeployment();
    
    const address = await token.getAddress();
    console.log(chalk.green(`✓ ${symbol} deployed at: ${address}`));
    
    return address;
  }

  async deployWETH() {
    console.log(chalk.yellow(`Deploying WETH...`));
    
    const WETH = await ethers.getContractFactory("WETH");
    const weth = await WETH.deploy();
    await weth.waitForDeployment();
    
    const address = await weth.getAddress();
    console.log(chalk.green(`✓ WETH deployed at: ${address}`));
    
    return address;
  }

  async deployUniswapV2() {
    const [deployer] = await ethers.getSigners();
    console.log(chalk.blue(`\n=== Deploying Uniswap V2 on ${this.network.name} ===`));
    console.log(`Deployer: ${deployer.address}`);
    
    // Deploy Factory
    console.log(chalk.yellow(`Deploying UniswapV2Factory...`));
    const Factory = new ethers.ContractFactory(
      UniswapV2Factory.abi,
      UniswapV2Factory.bytecode,
      deployer
    );
    const factory = await Factory.deploy(deployer.address);
    await factory.waitForDeployment();
    const factoryAddress = await factory.getAddress();
    console.log(chalk.green(`✓ Factory deployed at: ${factoryAddress}`));
    
    // Calculate init code hash from UniswapV2Pair bytecode
    const initCodeHash = ethers.keccak256(`0x${UniswapV2Pair.evm.bytecode.object}`);
    console.log(chalk.cyan(`Init Code Hash: ${initCodeHash}`));
    
    // Deploy Router
    console.log(chalk.yellow(`Deploying UniswapV2Router02...`));
    const Router = new ethers.ContractFactory(
      UniswapV2Router02.abi,
      UniswapV2Router02.bytecode,
      deployer
    );
    const router = await Router.deploy(factoryAddress, this.deployments.WETH);
    await router.waitForDeployment();
    const routerAddress = await router.getAddress();
    console.log(chalk.green(`✓ Router deployed at: ${routerAddress}`));
    
    return {
      factory: factoryAddress,
      router: routerAddress,
      initCodeHash: initCodeHash
    };
  }

  async createPair(factoryAddress, tokenA, tokenB) {
    const factory = await ethers.getContractAt(
      UniswapV2Factory.abi,
      factoryAddress
    );
    
    console.log(chalk.yellow(`Creating pair for ${tokenA} - ${tokenB}...`));
    const tx = await factory.createPair(tokenA, tokenB);
    await tx.wait();
    
    const pairAddress = await factory.getPair(tokenA, tokenB);
    console.log(chalk.green(`✓ Pair created at: ${pairAddress}`));
    
    return pairAddress;
  }

  async addLiquidity(routerAddress, tokenA, tokenB, amountA, amountB) {
    const router = await ethers.getContractAt(
      UniswapV2Router02.abi,
      routerAddress
    );
    
    const [signer] = await ethers.getSigners();
    
    // Approve tokens
    const tokenAContract = await ethers.getContractAt("TestToken", tokenA);
    const tokenBContract = await ethers.getContractAt("TestToken", tokenB);
    
    await tokenAContract.approve(routerAddress, amountA);
    await tokenBContract.approve(routerAddress, amountB);
    
    console.log(chalk.yellow(`Adding liquidity...`));
    const deadline = Math.floor(Date.now() / 1000) + 60 * 20;
    
    const tx = await router.addLiquidity(
      tokenA,
      tokenB,
      amountA,
      amountB,
      0,
      0,
      signer.address,
      deadline
    );
    
    await tx.wait();
    console.log(chalk.green(`✓ Liquidity added`));
  }

  async addLiquidityETH(routerAddress, token, tokenAmount, ethAmount) {
    const router = await ethers.getContractAt(
      UniswapV2Router02.abi,
      routerAddress
    );
    
    const [signer] = await ethers.getSigners();
    
    // Approve token
    const tokenContract = await ethers.getContractAt("TestToken", token);
    await tokenContract.approve(routerAddress, tokenAmount);
    
    console.log(chalk.yellow(`Adding ETH liquidity...`));
    const deadline = Math.floor(Date.now() / 1000) + 60 * 20;
    
    const tx = await router.addLiquidityETH(
      token,
      tokenAmount,
      0,
      0,
      signer.address,
      deadline,
      { value: ethAmount }
    );
    
    await tx.wait();
    console.log(chalk.green(`✓ ETH Liquidity added`));
  }

  async deployFullDex() {
    console.log(chalk.magenta(`\n🚀 Deploying Full DEX on ${this.network.name}\n`));
    
    // Deploy tokens
    console.log(chalk.blue(`\n--- Deploying Tokens ---`));
    this.deployments.WETH = await this.deployWETH();
    this.deployments.USDC = await this.deployToken("USD Coin", "USDC", 6, "1000000");
    this.deployments.USDT = await this.deployToken("Tether USD", "USDT", 6, "1000000");
    this.deployments.DAI = await this.deployToken("Dai Stablecoin", "DAI", 18, "1000000");
    this.deployments.LINK = await this.deployToken("Chainlink", "LINK", 18, "100000");
    this.deployments.SHAPE = await this.deployToken("Shape Token", "SHAPE", 18, "1000000");
    
    // Deploy Uniswap V2
    console.log(chalk.blue(`\n--- Deploying Uniswap V2 ---`));
    const uniswap = await this.deployUniswapV2();
    this.deployments.uniswapV2Factory = uniswap.factory;
    this.deployments.uniswapV2Router = uniswap.router;
    this.deployments.initCodeHash = uniswap.initCodeHash;
    
    // Create pairs
    console.log(chalk.blue(`\n--- Creating Trading Pairs ---`));
    
    // ETH pairs
    await this.createPair(uniswap.factory, this.deployments.WETH, this.deployments.USDC);
    await this.createPair(uniswap.factory, this.deployments.WETH, this.deployments.USDT);
    await this.createPair(uniswap.factory, this.deployments.WETH, this.deployments.DAI);
    await this.createPair(uniswap.factory, this.deployments.WETH, this.deployments.LINK);
    await this.createPair(uniswap.factory, this.deployments.WETH, this.deployments.SHAPE);
    
    // Stablecoin pairs
    await this.createPair(uniswap.factory, this.deployments.USDC, this.deployments.USDT);
    await this.createPair(uniswap.factory, this.deployments.USDC, this.deployments.DAI);
    
    // Add initial liquidity
    console.log(chalk.blue(`\n--- Adding Initial Liquidity ---`));
    
    // Mint tokens to deployer for liquidity
    const [deployer] = await ethers.getSigners();
    const mintAmount = "10000";
    
    for (const [tokenName, tokenAddress] of Object.entries(this.deployments)) {
      if (tokenName !== 'WETH' && tokenName.includes('USD') || tokenName === 'DAI' || tokenName === 'LINK' || tokenName === 'SHAPE') {
        const token = await ethers.getContractAt("TestToken", tokenAddress);
        const decimals = await token.decimals();
        await token.mint(deployer.address, ethers.parseUnits(mintAmount, decimals));
      }
    }
    
    // Add liquidity to ETH pairs
    await this.addLiquidityETH(
      uniswap.router,
      this.deployments.USDC,
      ethers.parseUnits("1000", 6),
      ethers.parseEther("0.3")
    );
    
    await this.addLiquidityETH(
      uniswap.router,
      this.deployments.SHAPE,
      ethers.parseUnits("10000", 18),
      ethers.parseEther("0.1")
    );
    
    // Add liquidity to stablecoin pair
    await this.addLiquidity(
      uniswap.router,
      this.deployments.USDC,
      this.deployments.USDT,
      ethers.parseUnits("1000", 6),
      ethers.parseUnits("1000", 6)
    );
    
    return this.deployments;
  }

  async saveDeployments(networkName) {
    const deploymentsDir = path.join(__dirname, '..', 'deployments');
    if (!fs.existsSync(deploymentsDir)) {
      fs.mkdirSync(deploymentsDir);
    }
    
    const filePath = path.join(deploymentsDir, `${networkName}.json`);
    fs.writeFileSync(filePath, JSON.stringify(this.deployments, null, 2));
    
    console.log(chalk.green(`\n✓ Deployments saved to ${filePath}`));
  }
}

async function main() {
  const networkName = process.env.HARDHAT_NETWORK || 'localhost';
  const { networks } = require('../config');
  const network = networks[networkName];
  
  if (!network) {
    throw new Error(`Network ${networkName} not found in config`);
  }
  
  const deployer = new DexDeployer(network);
  
  try {
    await deployer.deployFullDex();
    await deployer.saveDeployments(networkName);
    
    console.log(chalk.magenta(`\n🎉 DEX Deployment Complete on ${network.name}!\n`));
    console.log(chalk.cyan('Deployed Contracts:'));
    console.log(JSON.stringify(deployer.deployments, null, 2));
    
  } catch (error) {
    console.error(chalk.red('Deployment failed:'), error);
    process.exit(1);
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

module.exports = { DexDeployer };