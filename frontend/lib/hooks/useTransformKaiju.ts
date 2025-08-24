import { useState, useCallback } from 'react';
import { useAccount, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { parseEther } from 'viem';
import { useMutation } from '@tanstack/react-query';
import { useTransformationStore } from '@/lib/stores/transformationStore';
import { SHADOW_NFT_ABI } from '@/lib/web3/abis/shadowNFT';
import { POLICY_CONTRACT_ABI } from '@/lib/web3/abis/policyContract';
import { DURATION_PRICING } from '@/lib/types/transformation';
import { getShadowNFTAddress, getPolicyContractAddress } from '@/lib/web3/contracts';

interface TransformKaijuParams {
  kaijuId: string;
  onSuccess?: (tokenId: string) => void;
  onError?: (error: Error) => void;
}

export function useTransformKaiju() {
  const { address, chain } = useAccount();
  const { policy, setTransforming, setTransactionHash, setNftTokenId } = useTransformationStore();
  const { writeContractAsync } = useWriteContract();
  
  const transformKaiju = useCallback(async ({ kaijuId, onSuccess, onError }: TransformKaijuParams) => {
    if (!address || !chain) {
      throw new Error('Wallet not connected');
    }

    if (!policy.duration || !policy.totalBudget || !policy.maxTradeAmount) {
      throw new Error('Policy configuration incomplete');
    }

    const shadowNFTAddress = getShadowNFTAddress(chain.id);
    const policyContractAddress = getPolicyContractAddress(chain.id);

    if (!shadowNFTAddress || !policyContractAddress) {
      throw new Error('Contracts not deployed on this network');
    }

    setTransforming(true);

    try {
      // Step 1: Create policy on-chain
      const policyTx = await writeContractAsync({
        address: policyContractAddress,
        abi: POLICY_CONTRACT_ABI,
        functionName: 'createPolicy',
        args: [
          kaijuId,
          BigInt(policy.totalBudget * 1e18), // Convert to wei
          BigInt(policy.maxTradeAmount * 1e18),
          policy.chain || 'ethereum',
          policy.dexes || ['uniswap'],
          policy.riskLevel || 3,
          policy.stopLossPercentage || 10,
          policy.duration
        ]
      });

      // Step 2: Mint Shadow NFT
      const mintValue = parseEther(DURATION_PRICING[policy.duration].toString());
      const mintTx = await writeContractAsync({
        address: shadowNFTAddress,
        abi: SHADOW_NFT_ABI,
        functionName: 'mintShadowNFT',
        args: [kaijuId, policyTx.hash],
        value: mintValue
      });

      setTransactionHash(mintTx.hash);

      // Wait for transaction confirmation
      const receipt = await waitForTransactionReceipt(mintTx.hash);
      
      // Extract token ID from events (assuming Transfer event)
      const transferEvent = receipt.logs.find(
        log => log.topics[0] === '0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef'
      );
      
      if (transferEvent && transferEvent.topics[3]) {
        const tokenId = BigInt(transferEvent.topics[3]).toString();
        setNftTokenId(tokenId);
        onSuccess?.(tokenId);
      }

      setTransforming(false);
      return mintTx.hash;
    } catch (error) {
      setTransforming(false);
      onError?.(error as Error);
      throw error;
    }
  }, [address, chain, policy, writeContractAsync, setTransforming, setTransactionHash, setNftTokenId]);

  const mutation = useMutation({
    mutationFn: transformKaiju,
    onError: (error: Error) => {
      console.error('Transform failed:', error);
    }
  });

  return {
    transformKaiju: mutation.mutate,
    isTransforming: mutation.isPending,
    error: mutation.error,
    transactionHash: mutation.data
  };
}

// Helper to wait for transaction
async function waitForTransactionReceipt(hash: string, maxAttempts = 60) {
  for (let i = 0; i < maxAttempts; i++) {
    try {
      const receipt = await fetch(`/api/transaction/${hash}`).then(r => r.json());
      if (receipt.status) return receipt;
    } catch {}
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  throw new Error('Transaction timeout');
}