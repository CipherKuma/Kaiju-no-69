import { Router, Request, Response, NextFunction } from 'express';
import { supabase } from '../db/supabase';
import { createKaijuSchema, updateKaijuSchema } from '../utils/validation';
import { AppError } from '../middleware/errorHandler';
import { authenticateToken, AuthRequest } from '../middleware/auth';

const router = Router();

/**
 * Create new Kaiju
 * POST /api/kaijus
 * Requires authentication
 */
router.post('/', authenticateToken, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const validatedData = createKaijuSchema.parse(req.body);
    const userId = req.userId;

    // Check if name already exists
    const { data: existing } = await supabase
      .from('kaiju_no_69_kaijus')
      .select('id')
      .eq('name', validatedData.name)
      .single();

    if (existing) {
      throw new AppError('Kaiju name already exists', 400);
    }

    // Create Kaiju
    const { data: kaiju, error } = await supabase
      .from('kaiju_no_69_kaijus')
      .insert({
        nft_collection_address: validatedData.nftCollectionAddress,
        name: validatedData.name,
        bio: validatedData.bio || '',
        owner_id: userId,
        algorithm_url: validatedData.algorithmUrl,
        kaiju_image_url: validatedData.kaijuImageUrl,
        shadow_image_url: validatedData.shadowImageUrl
      })
      .select()
      .single();

    if (error) {
      throw new AppError('Failed to create Kaiju', 500);
    }

    res.status(201).json({
      status: 'success',
      data: kaiju
    });
  } catch (error) {
    next(error);
  }
});

/**
 * Get all active Kaijus
 * GET /api/kaijus
 */
router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { page = 1, limit = 20, sortBy = 'avg_pnl_percentage' } = req.query;
    const offset = (Number(page) - 1) * Number(limit);

    const { data: kaijus, error, count } = await supabase
      .from('kaiju_no_69_kaijus')
      .select(`
        *,
        owner:owner_id (
          id,
          wallet_address
        ),
        shadow_count:kaiju_no_69_shadows(count)
      `, { count: 'exact' })
      .eq('is_active', true)
      .order(sortBy as string, { ascending: false })
      .range(offset, offset + Number(limit) - 1);

    if (error) {
      throw new AppError('Failed to fetch Kaijus', 500);
    }

    res.json({
      status: 'success',
      data: {
        kaijus,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total: count || 0,
          totalPages: Math.ceil((count || 0) / Number(limit))
        }
      }
    });
  } catch (error) {
    next(error);
  }
});

/**
 * Get Kaiju by ID
 * GET /api/kaijus/:id
 */
router.get('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    const { data: kaiju, error } = await supabase
      .from('kaiju_no_69_kaijus')
      .select(`
        *,
        owner:owner_id (
          id,
          wallet_address
        ),
        shadows:kaiju_no_69_shadows (
          id,
          user_id,
          allocation_percentage,
          total_profit_loss
        ),
        recent_trades:kaiju_no_69_trades (
          id,
          trade_type,
          status,
          confidence_level,
          created_at
        )
      `)
      .eq('id', id)
      .single();

    if (error || !kaiju) {
      throw new AppError('Kaiju not found', 404);
    }

    // Calculate additional stats
    const totalShadows = kaiju.shadows?.length || 0;
    const totalVolume = kaiju.shadows?.reduce((sum: number, shadow: any) => 
      sum + (shadow.total_profit_loss || 0), 0) || 0;

    res.json({
      status: 'success',
      data: {
        ...kaiju,
        stats: {
          totalShadows,
          totalVolume,
          winRate: kaiju.wins + kaiju.losses > 0 
            ? (kaiju.wins / (kaiju.wins + kaiju.losses) * 100).toFixed(2) 
            : 0
        }
      }
    });
  } catch (error) {
    next(error);
  }
});

/**
 * Update Kaiju
 * PUT /api/kaijus/:id
 * Requires authentication and ownership
 */
router.put('/:id', authenticateToken, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const validatedData = updateKaijuSchema.parse(req.body);
    const userId = req.userId;

    // Check ownership
    const { data: kaiju } = await supabase
      .from('kaiju_no_69_kaijus')
      .select('owner_id')
      .eq('id', id)
      .single();

    if (!kaiju || kaiju.owner_id !== userId) {
      throw new AppError('Not authorized to update this Kaiju', 403);
    }

    // Update Kaiju
    const { data: updated, error } = await supabase
      .from('kaiju_no_69_kaijus')
      .update({
        name: validatedData.name,
        bio: validatedData.bio,
        algorithm_url: validatedData.algorithmUrl,
        is_active: validatedData.isActive
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw new AppError('Failed to update Kaiju', 500);
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
 * Get Kaiju performance metrics
 * GET /api/kaijus/:id/performance
 */
router.get('/:id/performance', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { period = '7d' } = req.query;

    // Calculate date range
    const endDate = new Date();
    const startDate = new Date();
    
    switch (period) {
      case '24h':
        startDate.setDate(startDate.getDate() - 1);
        break;
      case '7d':
        startDate.setDate(startDate.getDate() - 7);
        break;
      case '30d':
        startDate.setDate(startDate.getDate() - 30);
        break;
      case 'all':
        startDate.setFullYear(2020);
        break;
    }

    // Get trades in period
    const { data: trades, error } = await supabase
      .from('kaiju_no_69_trades')
      .select(`
        id,
        trade_type,
        status,
        created_at,
        closed_at,
        shadow_positions:kaiju_no_69_shadow_positions (
          profit_loss,
          allocated_amount
        )
      `)
      .eq('kaiju_id', id)
      .gte('created_at', startDate.toISOString())
      .lte('created_at', endDate.toISOString());

    if (error) {
      throw new AppError('Failed to fetch performance data', 500);
    }

    // Calculate metrics
    const totalTrades = trades?.length || 0;
    const closedTrades = trades?.filter(t => t.status === 'closed') || [];
    const profitableTrades = closedTrades.filter(t => {
      const totalPnL = t.shadow_positions?.reduce((sum: number, pos: any) => 
        sum + (pos.profit_loss || 0), 0) || 0;
      return totalPnL > 0;
    });

    const totalPnL = closedTrades.reduce((sum, trade) => {
      const tradePnL = trade.shadow_positions?.reduce((s: number, pos: any) => 
        s + (pos.profit_loss || 0), 0) || 0;
      return sum + tradePnL;
    }, 0);

    res.json({
      status: 'success',
      data: {
        period,
        totalTrades,
        closedTrades: closedTrades.length,
        profitableTrades: profitableTrades.length,
        winRate: closedTrades.length > 0 
          ? (profitableTrades.length / closedTrades.length * 100).toFixed(2)
          : 0,
        totalPnL,
        trades: trades?.map(t => ({
          ...t,
          shadow_positions: undefined,
          totalPnL: t.shadow_positions?.reduce((sum: number, pos: any) => 
            sum + (pos.profit_loss || 0), 0) || 0
        }))
      }
    });
  } catch (error) {
    next(error);
  }
});

export default router;