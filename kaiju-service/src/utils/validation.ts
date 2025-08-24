import { z } from 'zod';

// Auth validation schemas
export const connectWalletSchema = z.object({
  walletAddress: z.string().regex(/^0x[a-fA-F0-9]{40}$/, 'Invalid wallet address')
});

// Kaiju validation schemas
export const createKaijuSchema = z.object({
  nftCollectionAddress: z.string().regex(/^0x[a-fA-F0-9]{40}$/, 'Invalid NFT collection address'),
  name: z.string().min(1).max(50),
  bio: z.string().max(500).optional(),
  algorithmUrl: z.string().url('Invalid algorithm URL'),
  kaijuImageUrl: z.string().url('Invalid kaiju image URL'),
  shadowImageUrl: z.string().url('Invalid shadow image URL')
});

export const updateKaijuSchema = z.object({
  name: z.string().min(1).max(50).optional(),
  bio: z.string().max(500).optional(),
  algorithmUrl: z.string().url('Invalid algorithm URL').optional(),
  isActive: z.boolean().optional()
});

// Shadow validation schemas
export const followKaijuSchema = z.object({
  kaijuId: z.string().uuid(),
  allocationPercentage: z.number().min(0.01).max(100),
  maxPositionSize: z.number().positive()
});

export const updateShadowSettingsSchema = z.object({
  allocationPercentage: z.number().min(0.01).max(100).optional(),
  maxPositionSize: z.number().positive().optional(),
  isActive: z.boolean().optional()
});

// Trade validation schemas
export const tradeTypeSchema = z.enum(['swap', 'add_liquidity', 'remove_liquidity', 'perps_long', 'perps_short']);

export const swapDataSchema = z.object({
  tokenIn: z.string().regex(/^0x[a-fA-F0-9]{40}$/),
  tokenOut: z.string().regex(/^0x[a-fA-F0-9]{40}$/),
  amountIn: z.string(),
  minAmountOut: z.string()
});

export const liquidityDataSchema = z.object({
  tokenA: z.string().regex(/^0x[a-fA-F0-9]{40}$/),
  tokenB: z.string().regex(/^0x[a-fA-F0-9]{40}$/),
  amountA: z.string(),
  amountB: z.string()
});

export const perpsDataSchema = z.object({
  asset: z.string(),
  size: z.string(),
  leverage: z.number().min(1).max(100),
  isLong: z.boolean()
});

export const createTradeSchema = z.object({
  kaijuId: z.string().uuid(),
  tradeType: tradeTypeSchema,
  confidenceLevel: z.number().min(0).max(100),
  entryData: z.discriminatedUnion('type', [
    z.object({ type: z.literal('swap'), data: swapDataSchema }),
    z.object({ type: z.literal('liquidity'), data: liquidityDataSchema }),
    z.object({ type: z.literal('perps'), data: perpsDataSchema })
  ])
});

export const closeTradeSchema = z.object({
  exitData: z.any().optional()
});