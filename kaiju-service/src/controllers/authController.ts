import { Router, Request, Response, NextFunction } from 'express';
import { supabase } from '../db/supabase';
import { WalletService } from '../utils/wallet';
import { generateToken } from '../middleware/auth';
import { connectWalletSchema } from '../utils/validation';
import { AppError } from '../middleware/errorHandler';

const router = Router();
const walletService = new WalletService();

/**
 * Connect wallet and create/fetch user
 * POST /api/auth/connect
 */
router.post('/connect', async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Validate request
    const { walletAddress } = connectWalletSchema.parse(req.body);

    // Check if user exists
    const { data: existingUser, error: fetchError } = await supabase
      .from('kaiju_no_69_users')
      .select('*')
      .eq('wallet_address', walletAddress)
      .single();

    if (fetchError && fetchError.code !== 'PGRST116') {
      throw new AppError('Database error', 500);
    }

    let user;

    if (existingUser) {
      user = existingUser;
    } else {
      // Generate new server wallet
      const { address: serverAddress, privateKey } = walletService.generateWallet();
      const encryptedPrivateKey = walletService.encryptPrivateKey(privateKey);

      // Create new user
      const { data: newUser, error: createError } = await supabase
        .from('kaiju_no_69_users')
        .insert({
          wallet_address: walletAddress,
          server_wallet_address: serverAddress,
          server_wallet_private_key: encryptedPrivateKey
        })
        .select()
        .single();

      if (createError) {
        throw new AppError('Failed to create user', 500);
      }

      user = newUser;
    }

    // Generate JWT
    const token = generateToken(user.id, user.wallet_address);

    res.json({
      status: 'success',
      data: {
        token,
        user: {
          id: user.id,
          walletAddress: user.wallet_address,
          serverWalletAddress: user.server_wallet_address,
          createdAt: user.created_at
        }
      }
    });
  } catch (error) {
    next(error);
  }
});

/**
 * Get user profile
 * GET /api/auth/profile
 * Requires authentication
 */
router.get('/profile', async (req: Request, res: Response, next: NextFunction) => {
  try {
    // This endpoint would require authentication middleware
    // For now, we'll assume the user ID is passed in headers
    const userId = req.headers['x-user-id'];

    if (!userId) {
      throw new AppError('User ID required', 401);
    }

    const { data: user, error } = await supabase
      .from('kaiju_no_69_users')
      .select('id, wallet_address, server_wallet_address, created_at, updated_at')
      .eq('id', userId)
      .single();

    if (error || !user) {
      throw new AppError('User not found', 404);
    }

    // Get user's kaijus
    const { data: kaijus } = await supabase
      .from('kaiju_no_69_kaijus')
      .select('id, name, nft_collection_address, avg_pnl_percentage, wins, losses')
      .eq('owner_id', userId);

    // Get user's shadows
    const { data: shadows } = await supabase
      .from('kaiju_no_69_shadows')
      .select(`
        id,
        allocation_percentage,
        max_position_size,
        total_profit_loss,
        is_active,
        kaiju:kaiju_id (
          id,
          name,
          nft_collection_address
        )
      `)
      .eq('user_id', userId);

    res.json({
      status: 'success',
      data: {
        user: {
          id: user.id,
          walletAddress: user.wallet_address,
          serverWalletAddress: user.server_wallet_address,
          createdAt: user.created_at,
          updatedAt: user.updated_at
        },
        kaijus: kaijus || [],
        shadows: shadows || []
      }
    });
  } catch (error) {
    next(error);
  }
});

export default router;