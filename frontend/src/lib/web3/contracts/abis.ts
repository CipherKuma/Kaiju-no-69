// Shadow NFT Contract ABI
export const SHADOW_NFT_ABI = [
  {
    inputs: [
      { name: 'tokenId', type: 'uint256' },
      { name: 'metadata', type: 'string' },
    ],
    name: 'mintShadow',
    outputs: [],
    stateMutability: 'payable',
    type: 'function',
  },
  {
    inputs: [{ name: 'tokenId', type: 'uint256' }],
    name: 'ownerOf',
    outputs: [{ name: '', type: 'address' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [{ name: 'owner', type: 'address' }],
    name: 'balanceOf',
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, name: 'from', type: 'address' },
      { indexed: true, name: 'to', type: 'address' },
      { indexed: true, name: 'tokenId', type: 'uint256' },
    ],
    name: 'Transfer',
    type: 'event',
  },
] as const

// Policy Contract ABI
export const POLICY_CONTRACT_ABI = [
  {
    inputs: [
      { name: 'policyId', type: 'uint256' },
      { name: 'shadowNftId', type: 'uint256' },
      { name: 'policyType', type: 'uint8' },
      { name: 'premium', type: 'uint256' },
    ],
    name: 'createPolicy',
    outputs: [],
    stateMutability: 'payable',
    type: 'function',
  },
  {
    inputs: [{ name: 'policyId', type: 'uint256' }],
    name: 'claimPolicy',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [{ name: 'policyId', type: 'uint256' }],
    name: 'getPolicy',
    outputs: [
      { name: 'owner', type: 'address' },
      { name: 'shadowNftId', type: 'uint256' },
      { name: 'policyType', type: 'uint8' },
      { name: 'premium', type: 'uint256' },
      { name: 'isActive', type: 'bool' },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, name: 'policyId', type: 'uint256' },
      { indexed: true, name: 'owner', type: 'address' },
      { indexed: false, name: 'shadowNftId', type: 'uint256' },
    ],
    name: 'PolicyCreated',
    type: 'event',
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, name: 'policyId', type: 'uint256' },
      { indexed: true, name: 'claimer', type: 'address' },
      { indexed: false, name: 'amount', type: 'uint256' },
    ],
    name: 'PolicyClaimed',
    type: 'event',
  },
] as const