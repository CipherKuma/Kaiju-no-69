import { ethers } from 'ethers';
import { AppError } from '../middleware/errorHandler';

let provider: ethers.JsonRpcProvider;

export const getProvider = (): ethers.JsonRpcProvider => {
  if (!provider) {
    if (!process.env.SHAPE_SEPOLIA_RPC_URL) {
      throw new AppError('SHAPE_SEPOLIA_RPC_URL not configured', 500);
    }
    
    provider = new ethers.JsonRpcProvider(process.env.SHAPE_SEPOLIA_RPC_URL);
  }
  
  return provider;
};

export const SHAPE_SEPOLIA_CHAIN_ID = 10124;

export const validateNetwork = async (): Promise<boolean> => {
  try {
    const network = await getProvider().getNetwork();
    return Number(network.chainId) === SHAPE_SEPOLIA_CHAIN_ID;
  } catch (error) {
    console.error('Error validating network:', error);
    return false;
  }
};