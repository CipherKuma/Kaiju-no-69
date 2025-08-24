import { ethers } from 'ethers';
import { getProvider } from '../provider';
import { CONTRACTS } from '../contracts/addresses';
import { ERC20_ABI, UNISWAP_V2_ROUTER_ABI, UNISWAP_V2_PAIR_ABI } from '../contracts/abis';
import { AppError } from '../../middleware/errorHandler';

export interface AddLiquidityParams {
  tokenA: string;
  tokenB: string;
  amountA: string;
  amountB: string;
  wallet: ethers.Wallet;
}

export interface RemoveLiquidityParams {
  tokenA: string;
  tokenB: string;
  liquidity: string;
  wallet: ethers.Wallet;
}

export class LiquidityService {
  private router: ethers.Contract;

  constructor() {
    this.router = new ethers.Contract(
      CONTRACTS.UNISWAP_V2_ROUTER,
      UNISWAP_V2_ROUTER_ABI,
      getProvider()
    );
  }

  async addLiquidity(params: AddLiquidityParams): Promise<string> {
    const { tokenA, tokenB, amountA, amountB, wallet } = params;

    try {
      // Approve both tokens
      await this.approveToken(tokenA, amountA, wallet);
      await this.approveToken(tokenB, amountB, wallet);

      // Calculate minimum amounts (95% of desired)
      const amountAMin = (BigInt(amountA) * BigInt(95)) / BigInt(100);
      const amountBMin = (BigInt(amountB) * BigInt(95)) / BigInt(100);

      // Add liquidity
      const deadline = Math.floor(Date.now() / 1000) + 60 * 20; // 20 minutes
      const routerWithSigner = this.router.connect(wallet);

      const tx = await routerWithSigner.addLiquidity(
        tokenA,
        tokenB,
        amountA,
        amountB,
        amountAMin.toString(),
        amountBMin.toString(),
        wallet.address,
        deadline
      );

      const receipt = await tx.wait();
      return receipt.hash;
    } catch (error) {
      console.error('Add liquidity error:', error);
      throw new AppError('Failed to add liquidity', 500);
    }
  }

  async removeLiquidity(params: RemoveLiquidityParams): Promise<string> {
    const { tokenA, tokenB, liquidity, wallet } = params;

    try {
      // Get pair address
      const pairAddress = await this.getPairAddress(tokenA, tokenB);
      
      // Approve LP tokens
      const pairContract = new ethers.Contract(pairAddress, UNISWAP_V2_PAIR_ABI, wallet);
      const allowance = await pairContract.allowance(wallet.address, CONTRACTS.UNISWAP_V2_ROUTER);
      
      if (allowance < BigInt(liquidity)) {
        const approveTx = await pairContract.approve(
          CONTRACTS.UNISWAP_V2_ROUTER,
          ethers.MaxUint256
        );
        await approveTx.wait();
      }

      // Remove liquidity
      const deadline = Math.floor(Date.now() / 1000) + 60 * 20; // 20 minutes
      const routerWithSigner = this.router.connect(wallet);

      const tx = await routerWithSigner.removeLiquidity(
        tokenA,
        tokenB,
        liquidity,
        0, // Accept any amount of tokenA
        0, // Accept any amount of tokenB
        wallet.address,
        deadline
      );

      const receipt = await tx.wait();
      return receipt.hash;
    } catch (error) {
      console.error('Remove liquidity error:', error);
      throw new AppError('Failed to remove liquidity', 500);
    }
  }

  async getLiquidityPosition(tokenA: string, tokenB: string, walletAddress: string): Promise<{
    liquidity: string;
    tokenAAmount: string;
    tokenBAmount: string;
  }> {
    try {
      const pairAddress = await this.getPairAddress(tokenA, tokenB);
      const pairContract = new ethers.Contract(pairAddress, UNISWAP_V2_PAIR_ABI, getProvider());
      
      const [liquidity, totalSupply, reserves] = await Promise.all([
        pairContract.balanceOf(walletAddress),
        pairContract.totalSupply(),
        pairContract.getReserves()
      ]);

      if (liquidity === BigInt(0)) {
        return {
          liquidity: '0',
          tokenAAmount: '0',
          tokenBAmount: '0'
        };
      }

      // Calculate share of reserves
      const share = liquidity * BigInt(1e18) / totalSupply;
      const tokenAAmount = (reserves[0] * share) / BigInt(1e18);
      const tokenBAmount = (reserves[1] * share) / BigInt(1e18);

      return {
        liquidity: liquidity.toString(),
        tokenAAmount: tokenAAmount.toString(),
        tokenBAmount: tokenBAmount.toString()
      };
    } catch (error) {
      console.error('Get liquidity position error:', error);
      throw new AppError('Failed to get liquidity position', 500);
    }
  }

  private async approveToken(token: string, amount: string, wallet: ethers.Wallet): Promise<void> {
    const tokenContract = new ethers.Contract(token, ERC20_ABI, wallet);
    const allowance = await tokenContract.allowance(wallet.address, CONTRACTS.UNISWAP_V2_ROUTER);

    if (allowance < BigInt(amount)) {
      const approveTx = await tokenContract.approve(
        CONTRACTS.UNISWAP_V2_ROUTER,
        ethers.MaxUint256
      );
      await approveTx.wait();
    }
  }

  private async getPairAddress(tokenA: string, tokenB: string): Promise<string> {
    const factory = new ethers.Contract(
      CONTRACTS.UNISWAP_V2_FACTORY,
      ['function getPair(address tokenA, address tokenB) external view returns (address pair)'],
      getProvider()
    );
    
    const pairAddress = await factory.getPair(tokenA, tokenB);
    if (pairAddress === ethers.ZeroAddress) {
      throw new AppError('Liquidity pair does not exist', 400);
    }
    
    return pairAddress;
  }
}