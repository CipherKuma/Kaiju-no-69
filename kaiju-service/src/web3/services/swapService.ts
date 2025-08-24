import { ethers } from 'ethers';
import { getProvider } from '../provider';
import { CONTRACTS } from '../contracts/addresses';
import { ERC20_ABI, UNISWAP_V2_ROUTER_ABI } from '../contracts/abis';
import { AppError } from '../../middleware/errorHandler';

export interface SwapParams {
  tokenIn: string;
  tokenOut: string;
  amountIn: string;
  minAmountOut: string;
  wallet: ethers.Wallet;
}

export class SwapService {
  private router: ethers.Contract;

  constructor() {
    this.router = new ethers.Contract(
      CONTRACTS.UNISWAP_V2_ROUTER,
      UNISWAP_V2_ROUTER_ABI,
      getProvider()
    );
  }

  async executeSwap(params: SwapParams): Promise<string> {
    const { tokenIn, tokenOut, amountIn, minAmountOut, wallet } = params;

    try {
      // Check allowance
      const tokenInContract = new ethers.Contract(tokenIn, ERC20_ABI, wallet);
      const allowance = await tokenInContract.allowance(wallet.address, CONTRACTS.UNISWAP_V2_ROUTER);

      // Approve if needed
      if (allowance < BigInt(amountIn)) {
        const approveTx = await tokenInContract.approve(
          CONTRACTS.UNISWAP_V2_ROUTER,
          ethers.MaxUint256
        );
        await approveTx.wait();
      }

      // Execute swap
      const deadline = Math.floor(Date.now() / 1000) + 60 * 20; // 20 minutes
      const path = [tokenIn, tokenOut];

      const routerWithSigner = this.router.connect(wallet);
      const tx = await routerWithSigner.swapExactTokensForTokens(
        amountIn,
        minAmountOut,
        path,
        wallet.address,
        deadline
      );

      const receipt = await tx.wait();
      return receipt.hash;
    } catch (error) {
      console.error('Swap error:', error);
      throw new AppError('Failed to execute swap', 500);
    }
  }

  async getAmountOut(tokenIn: string, tokenOut: string, amountIn: string): Promise<string> {
    try {
      const path = [tokenIn, tokenOut];
      const amounts = await this.router.getAmountsOut(amountIn, path);
      return amounts[amounts.length - 1].toString();
    } catch (error) {
      console.error('Get amount out error:', error);
      throw new AppError('Failed to get swap quote', 500);
    }
  }

  async checkTokenBalance(tokenAddress: string, walletAddress: string): Promise<string> {
    try {
      const token = new ethers.Contract(tokenAddress, ERC20_ABI, getProvider());
      const balance = await token.balanceOf(walletAddress);
      return balance.toString();
    } catch (error) {
      console.error('Balance check error:', error);
      throw new AppError('Failed to check token balance', 500);
    }
  }
}