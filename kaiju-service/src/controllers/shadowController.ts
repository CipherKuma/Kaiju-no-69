import { Router, Request, Response, NextFunction } from 'express';
import { supabase } from '../db/supabase';
import { followKaijuSchema, updateShadowSettingsSchema } from '../utils/validation';
import { AppError } from '../middleware/errorHandler';
import { authenticateToken, AuthRequest } from '../middleware/auth';
import { swapService } from '../web3';

const router = Router();

/**
 * Follow a Kaiju
 * POST /api/shadows/follow
 * Requires authentication
 */
router.post('/follow', authenticateToken, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const validatedData = followKaijuSchema.parse(req.body);
    const userId = req.userId;

    // Check if Kaiju exists and is active
    const { data: kaiju } = await supabase
      .from('kaiju_no_69_kaijus')
      .select('id, is_active')
      .eq('id', validatedData.kaijuId)
      .single();

    if (!kaiju || !kaiju.is_active) {
      throw new AppError('Kaiju not found or inactive', 404);
    }

    // Check if already following
    const { data: existing } = await supabase
      .from('kaiju_no_69_shadows')
      .select('id')
      .eq('user_id', userId)
      .eq('kaiju_id', validatedData.kaijuId)
      .single();

    if (existing) {
      throw new AppError('Already following this Kaiju', 400);
    }

    // Create shadow relationship
    const { data: shadow, error } = await supabase
      .from('kaiju_no_69_shadows')
      .insert({
        user_id: userId,
        kaiju_id: validatedData.kaijuId,
        allocation_percentage: validatedData.allocationPercentage,
        max_position_size: validatedData.maxPositionSize
      })
      .select()
      .single();

    if (error) {
      throw new AppError('Failed to follow Kaiju', 500);
    }

    res.status(201).json({
      status: 'success',
      data: shadow
    });
  } catch (error) {
    next(error);
  }
});

/**
 * Update shadow settings
 * PUT /api/shadows/:id/settings
 * Requires authentication
 */
router.put('/:id/settings', authenticateToken, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const validatedData = updateShadowSettingsSchema.parse(req.body);
    const userId = req.userId;

    // Check ownership
    const { data: shadow } = await supabase
      .from('kaiju_no_69_shadows')
      .select('user_id')
      .eq('id', id)
      .single();

    if (!shadow || shadow.user_id !== userId) {
      throw new AppError('Not authorized to update this shadow', 403);
    }

    // Update shadow settings
    const { data: updated, error } = await supabase
      .from('kaiju_no_69_shadows')
      .update({
        allocation_percentage: validatedData.allocationPercentage,
        max_position_size: validatedData.maxPositionSize,
        is_active: validatedData.isActive
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw new AppError('Failed to update shadow settings', 500);
    }

    res.json({
      status: 'success',
      data: updated
    });
  } catch (error) {
    next(error);
  }
});

/**
 * Unfollow a Kaiju
 * DELETE /api/shadows/:id
 * Requires authentication
 */
router.delete('/:id', authenticateToken, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const userId = req.userId;

    // Check ownership
    const { data: shadow } = await supabase
      .from('kaiju_no_69_shadows')
      .select('user_id')
      .eq('id', id)
      .single();

    if (!shadow || shadow.user_id !== userId) {
      throw new AppError('Not authorized to delete this shadow', 403);
    }

    // Check for active positions
    const { data: activePositions } = await supabase
      .from('kaiju_no_69_shadow_positions')
      .select('id')
      .eq('shadow_id', id)
      .in('status', ['pending', 'active']);

    if (activePositions && activePositions.length > 0) {
      throw new AppError('Cannot unfollow with active positions', 400);
    }

    // Delete shadow
    const { error } = await supabase
      .from('kaiju_no_69_shadows')
      .delete()
      .eq('id', id);

    if (error) {
      throw new AppError('Failed to unfollow Kaiju', 500);
    }

    res.json({
      status: 'success',
      message: 'Successfully unfollowed Kaiju'
    });
  } catch (error) {
    next(error);
  }
});

/**
 * Get user's shadows
 * GET /api/shadows
 * Requires authentication
 */
router.get('/', authenticateToken, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.userId;

    const { data: shadows, error } = await supabase
      .from('kaiju_no_69_shadows')
      .select(`
        *,
        kaiju:kaiju_id (
          id,
          name,
          nft_collection_address,
          avg_pnl_percentage,
          wins,
          losses
        )
      `)
      .eq('user_id', userId)
      .order('joined_at', { ascending: false });

    if (error) {
      throw new AppError('Failed to fetch shadows', 500);
    }

    res.json({
      status: 'success',
      data: shadows || []
    });
  } catch (error) {
    next(error);
  }
});

/**
 * Get shadow positions
 * GET /api/shadows/positions
 * Requires authentication
 */
router.get('/positions', authenticateToken, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.userId;
    const { status = 'all', kaijuId } = req.query;

    // Build query
    let query = supabase
      .from('kaiju_no_69_shadow_positions')
      .select(`
        *,
        shadow:shadow_id (
          id,
          kaiju:kaiju_id (
            id,
            name
          )
        ),
        trade:trade_id (
          id,
          trade_type,
          entry_data,
          exit_data,
          confidence_level
        )
      `)
      .eq('shadow.user_id', userId);

    // Filter by status
    if (status !== 'all') {
      query = query.eq('status', status);
    }

    // Filter by kaiju
    if (kaijuId) {
      query = query.eq('shadow.kaiju_id', kaijuId);
    }

    const { data: positions, error } = await query.order('created_at', { ascending: false });

    if (error) {
      throw new AppError('Failed to fetch positions', 500);
    }

    // Calculate total stats
    const activePositions = positions?.filter(p => p.status === 'active') || [];
    const totalActiveValue = activePositions.reduce((sum, pos) => sum + Number(pos.actual_amount || 0), 0);
    const totalPnL = positions?.reduce((sum, pos) => sum + Number(pos.profit_loss || 0), 0) || 0;

    res.json({
      status: 'success',
      data: {
        positions: positions || [],
        stats: {
          totalPositions: positions?.length || 0,
          activePositions: activePositions.length,
          totalActiveValue,
          totalPnL
        }
      }
    });
  } catch (error) {
    next(error);
  }
});

/**
 * Get portfolio summary
 * GET /api/shadows/portfolio
 * Requires authentication
 */
router.get('/portfolio', authenticateToken, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.userId;

    // Get user data
    const { data: user } = await supabase
      .from('kaiju_no_69_users')
      .select('server_wallet_address')
      .eq('id', userId)
      .single();

    if (!user) {
      throw new AppError('User not found', 404);
    }

    // Get all shadows with positions
    const { data: shadows } = await supabase
      .from('kaiju_no_69_shadows')
      .select(`
        *,
        kaiju:kaiju_id (
          id,
          name,
          avg_pnl_percentage
        ),
        positions:kaiju_no_69_shadow_positions (
          id,
          status,
          allocated_amount,
          profit_loss
        )
      `)
      .eq('user_id', userId);

    // Get token balances
    const tokenBalances = await Promise.all([
      swapService.checkTokenBalance('0x183F03D0e64d75fe62b5cb0F8c330A1707F15d3A', user.server_wallet_address), // USDC
      swapService.checkTokenBalance('0x83dF0Ed0b4f3D1D057cB56494b8c7eE417265489', user.server_wallet_address), // WETH
    ]);

    // Calculate portfolio metrics
    const totalPnL = shadows?.reduce((sum, shadow) => 
      sum + Number(shadow.total_profit_loss || 0), 0) || 0;
    
    const activeShadows = shadows?.filter(s => s.is_active).length || 0;
    const totalPositions = shadows?.reduce((sum, shadow) => 
      sum + (shadow.positions?.length || 0), 0) || 0;

    res.json({
      status: 'success',
      data: {
        balances: {
          USDC: tokenBalances[0],
          WETH: tokenBalances[1]
        },
        stats: {
          totalPnL,
          activeShadows,
          totalPositions,
          totalShadows: shadows?.length || 0
        },
        shadows: shadows?.map(s => ({
          ...s,
          activePositions: s.positions?.filter(p => p.status === 'active').length || 0,
          totalPositions: s.positions?.length || 0
        }))
      }
    });
  } catch (error) {
    next(error);
  }
});

export default router;