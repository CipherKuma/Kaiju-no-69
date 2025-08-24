import { useState, useCallback } from 'react';
import { useAccount, useChainId } from 'wagmi';
import { writeContract, readContract, waitForTransactionReceipt } from '@wagmi/core';
import { wagmiConfig as config } from '@/lib/web3/config';
import { parseEther, formatEther, Address } from 'viem';

// Import ABIs
import KaijuCollectionFactoryABI from '@/lib/contracts/KaijuCollectionFactory.json';
import KaijuNFTABI from '@/lib/contracts/KaijuNFT.json';
import ShadowNFTABI from '@/lib/contracts/ShadowNFT.json';
import addresses from '@/lib/contracts/addresses.json';

interface GeneratedImages {
  kaiju: string;
  shadowStages: [string, string, string];
}

interface CreateKaijuParams {
  name: string;
  algorithmUrl: string;
  description?: string;
  entryFee: string; // in ETH
  profitShare: number; // percentage (0-100)
  images: GeneratedImages;
}

interface KaijuCollection {
  collectionId: number;
  kaijuContract: Address;
  shadowContract: Address;
  creator: Address;
  name: string;
  algorithmUrl: string;
  createdAt: number;
}

export function useKaijuNFT() {
  const { address } = useAccount();
  const chainId = useChainId();
  const [isCreating, setIsCreating] = useState(false);
  const [isMintingShadow, setIsMintingShadow] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Get contract addresses for current network
  const getContractAddresses = useCallback(() => {
    const networkKey = chainId === 31337 ? 'hardhat' : 
                      chainId === 11011 ? 'shapeSepolia' : 
                      chainId === 360 ? 'shapeMainnet' : 'hardhat';
    
    return addresses[networkKey as keyof typeof addresses];
  }, [chainId]);

  // Create metadata JSON for IPFS/storage
  const createMetadata = useCallback((
    name: string,
    description: string,
    imageUrl: string,
    attributes?: Array<{ trait_type: string; value: string | number }>
  ) => {
    return {
      name,
      description,
      image: imageUrl,
      attributes: attributes || [],
      external_url: `https://kaiju-no-69.vercel.app/kaiju/${name.toLowerCase().replace(/\s+/g, '-')}`,
      background_color: "000000"
    };
  }, []);

  // Create Kaiju Collection
  const createKaijuCollection = useCallback(async (params: CreateKaijuParams) => {
    if (!address) {
      throw new Error('Wallet not connected');
    }

    setIsCreating(true);
    setError(null);

    try {
      const contractAddresses = getContractAddresses();
      
      // In a real app, you would upload metadata to IPFS
      // For now, we'll use placeholder URLs with the actual image URLs
      const kaijuMetadataUri = JSON.stringify(createMetadata(
        params.name,
        params.description || `${params.name} - A powerful trading Kaiju`,
        params.images.kaiju,
        [
          { trait_type: "Type", value: "Kaiju" },
          { trait_type: "Rarity", value: "Legendary" },
          { trait_type: "Entry Fee", value: params.entryFee },
          { trait_type: "Profit Share", value: `${params.profitShare}%` }
        ]
      ));

      const shadowMetadataUris = params.images.shadowStages.map((imageUrl, index) => {
        const stageName = ['Powerful', 'Weaker', 'Weakest'][index];
        const stageDescription = [
          'A powerful shadow incarnation of the original Kaiju, radiating intense purple energy and maximum power',
          'A weaker shadow incarnation as it ages, with moderate energy and fading power over time',
          'The weakest shadow incarnation, barely visible with minimal energy, nearing complete dissolution'
        ][index];

        return JSON.stringify(createMetadata(
          `${params.name} Shadow - ${stageName}`,
          stageDescription,
          imageUrl,
          [
            { trait_type: "Type", value: "Shadow" },
            { trait_type: "Stage", value: stageName },
            { trait_type: "Stage Number", value: index + 1 },
            { trait_type: "Parent Kaiju", value: params.name },
            { trait_type: "Aging Duration", value: "30 days" }
          ]
        ));
      });

      console.log('Creating Kaiju collection with params:', {
        name: params.name,
        algorithmUrl: params.algorithmUrl,
        kaijuMetadataUri: kaijuMetadataUri.substring(0, 100) + '...',
        shadowMetadataUris: shadowMetadataUris.map(uri => uri.substring(0, 100) + '...'),
        entryFee: parseEther(params.entryFee).toString(),
        profitShare: params.profitShare * 100, // Convert to basis points
      });

      // Call contract
      const hash = await writeContract(config, {
        address: contractAddresses.KaijuCollectionFactory as Address,
        abi: KaijuCollectionFactoryABI,
        functionName: 'createKaijuCollection',
        args: [
          params.name,
          params.algorithmUrl,
          kaijuMetadataUri,
          shadowMetadataUris,
          parseEther(params.entryFee),
          params.profitShare * 100 // Convert percentage to basis points (20% = 2000)
        ]
      });

      console.log('Transaction hash:', hash);

      // Wait for transaction confirmation
      const receipt = await waitForTransactionReceipt(config, {
        hash,
      });

      console.log('Transaction confirmed:', receipt);

      // Extract collection ID from events
      // In a real app, you'd parse the events to get the collection ID
      // For now, we'll assume it's the next collection ID
      const collectionId = await getNextCollectionId();

      return {
        transactionHash: hash,
        collectionId: collectionId - 1, // Since it was incremented after creation
        receipt
      };
    } catch (error: any) {
      console.error('Failed to create Kaiju collection:', error);
      setError(error.message || 'Failed to create Kaiju collection');
      throw error;
    } finally {
      setIsCreating(false);
    }
  }, [address, getContractAddresses, createMetadata]);

  // Get next collection ID
  const getNextCollectionId = useCallback(async () => {
    const contractAddresses = getContractAddresses();
    
    const nextId = await readContract(config, {
      address: contractAddresses.KaijuCollectionFactory as Address,
      abi: KaijuCollectionFactoryABI,
      functionName: 'nextCollectionId'
    });

    return Number(nextId);
  }, [getContractAddresses]);

  // Get collection info
  const getCollection = useCallback(async (collectionId: number): Promise<KaijuCollection> => {
    const contractAddresses = getContractAddresses();
    
    const collection = await readContract(config, {
      address: contractAddresses.KaijuCollectionFactory as Address,
      abi: KaijuCollectionFactoryABI,
      functionName: 'getCollection',
      args: [collectionId]
    });

    return {
      collectionId,
      kaijuContract: collection[0],
      shadowContract: collection[1],
      creator: collection[2],
      name: collection[3],
      algorithmUrl: collection[4],
      createdAt: Number(collection[5])
    };
  }, [getContractAddresses]);

  // Get user's collections
  const getUserCollections = useCallback(async (userAddress?: Address) => {
    if (!userAddress && !address) return [];
    
    const contractAddresses = getContractAddresses();
    const targetAddress = userAddress || address!;
    
    const collectionIds = await readContract(config, {
      address: contractAddresses.KaijuCollectionFactory as Address,
      abi: KaijuCollectionFactoryABI,
      functionName: 'getCreatorCollections',
      args: [targetAddress]
    });

    // Get details for each collection
    const collections = await Promise.all(
      (collectionIds as number[]).map(id => getCollection(id))
    );

    return collections;
  }, [address, getContractAddresses, getCollection]);

  // Mint Shadow NFT
  const mintShadow = useCallback(async (collectionId: number, to?: Address) => {
    if (!address) {
      throw new Error('Wallet not connected');
    }

    setIsMintingShadow(true);
    setError(null);

    try {
      const contractAddresses = getContractAddresses();
      
      // Get shadow mint fee
      const mintFee = await readContract(config, {
        address: contractAddresses.KaijuCollectionFactory as Address,
        abi: KaijuCollectionFactoryABI,
        functionName: 'shadowMintFee'
      });

      const hash = await writeContract(config, {
        address: contractAddresses.KaijuCollectionFactory as Address,
        abi: KaijuCollectionFactoryABI,
        functionName: 'mintShadow',
        args: [collectionId, to || address],
        value: mintFee as bigint
      });

      const receipt = await waitForTransactionReceipt(config, {
        hash,
      });

      return {
        transactionHash: hash,
        mintFee: formatEther(mintFee as bigint),
        receipt
      };
    } catch (error: any) {
      console.error('Failed to mint Shadow:', error);
      setError(error.message || 'Failed to mint Shadow NFT');
      throw error;
    } finally {
      setIsMintingShadow(false);
    }
  }, [address, getContractAddresses]);

  // Get Shadow aging info
  const getShadowData = useCallback(async (shadowContract: Address, tokenId: number) => {
    const shadowData = await readContract(config, {
      address: shadowContract,
      abi: ShadowNFTABI,
      functionName: 'getShadowData',
      args: [tokenId]
    });

    const progress = await readContract(config, {
      address: shadowContract,
      abi: ShadowNFTABI,
      functionName: 'getAgingProgress',
      args: [tokenId]
    });

    return {
      mintedAt: Number(shadowData[0]),
      currentStage: Number(shadowData[1]), // 0=Powerful, 1=Weaker, 2=Weakest
      timeElapsed: Number(shadowData[2]),
      timeToNextStage: Number(shadowData[3]),
      isPinned: shadowData[4],
      pinnedStage: Number(shadowData[5]),
      agingProgress: Number(progress)
    };
  }, []);

  return {
    // State
    isCreating,
    isMintingShadow,
    error,
    
    // Actions
    createKaijuCollection,
    mintShadow,
    
    // Queries
    getCollection,
    getUserCollections,
    getShadowData,
    getNextCollectionId,
    
    // Utils
    getContractAddresses
  };
}