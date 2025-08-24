import { Router, Request, Response, NextFunction } from 'express';
import { supabase } from '../db/supabase';
import { createTradeSchema, closeTradeSchema } from '../utils/validation';
import { AppError } from '../middleware/errorHandler';
import { WalletService } from '../utils/wallet';
import { getProvider, swapService, liquidityService, perpsService } from '../web3';
import { Trade, TradeType } from '../db/supabase';

const router = Router();
const walletService = new WalletService();

/**
 * Validate algorithm request
 */
const validateAlgorithmRequest = async (kaijuId: string, algorithmKey: string): Promise<boolean> => {
  // In production, implement proper algorithm authentication
  // For now, we'll check if the kaiju exists
  const { data: kaiju } = await supabase
    .from('kaiju_no_69_kaijus')
    .select('id, algorithm_url')
    .eq('id', kaijuId)
    .single();

  return !!kaiju;
};

/**
 * Execute trade for a shadow
 */
const executeShadowTrade = async (
  trade: Trade,
  shadowId: string,
  shadowUserId: string,
  allocationPercentage: number,
  maxPositionSize: number
): Promise<void> => {
  try {
    // Get user's server wallet
    const { data: user } = await supabase
      .from('kaiju_no_69_users')
      .select('server_wallet_address, server_wallet_private_key')
      .eq('id', shadowUserId)
      .single();

    if (!user) {
      throw new Error('User not found');
    }

    // Create wallet instance
    const wallet = walletService.getWallet(user.server_wallet_private_key, getProvider());

    // Calculate position size based on confidence and allocation
    const confidenceFactor = trade.confidence_level / 100;
    const baseAllocation = maxPositionSize * (allocationPercentage / 100);
    const allocatedAmount = baseAllocation * confidenceFactor;

    // Create position entry
    const { data: position, error: positionError } = await supabase
      .from('kaiju_no_69_shadow_positions')
      .insert({
        shadow_id: shadowId,
        trade_id: trade.id,
        status: 'pending',
        allocated_amount: allocatedAmount,
        actual_amount: allocatedAmount
      })
      .select()
      .single();

    if (positionError || !position) {
      throw new Error('Failed to create position');
    }

    let txHash: string;

    // Execute trade based on type
    switch (trade.trade_type) {
      case 'swap':
        const swapData = trade.entry_data.data;
        txHash = await swapService.executeSwap({
          tokenIn: swapData.tokenIn,
          tokenOut: swapData.tokenOut,
          amountIn: swapData.amountIn,
          minAmountOut: swapData.minAmountOut,
          wallet
        });
        break;

      case 'add_liquidity':
        const liquidityData = trade.entry_data.data;
        txHash = await liquidityService.addLiquidity({
          tokenA: liquidityData.tokenA,
          tokenB: liquidityData.tokenB,
          amountA: liquidityData.amountA,
          amountB: liquidityData.amountB,
          wallet
        });
        break;

      case 'perps_long':
      case 'perps_short':
        const perpsData = trade.entry_data.data;
        const perpsResult = await perpsService.openPosition({
          asset: perpsData.asset,
          size: perpsData.size,
          isLong: perpsData.isLong,
          leverage: perpsData.leverage,
          wallet
        });
        txHash = perpsResult.txHash;
        break;

      default:
        throw new Error('Unsupported trade type');
    }

    // Update position with tx hash
    await supabase
      .from('kaiju_no_69_shadow_positions')
      .update({
        status: 'active',
        entry_tx_hash: txHash
      })
      .eq('id', position.id);

  } catch (error) {
    console.error(`Failed to execute trade for shadow ${shadowId}:`, error);
    // Mark position as failed
    await supabase
      .from('kaiju_no_69_shadow_positions')
      .update({ status: 'failed' })
      .eq('shadow_id', shadowId)
      .eq('trade_id', trade.id);
  }
};

/**
 * Create new trade
 * POST /api/trades
 * Called by trading algorithms
 */
router.post('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const validatedData = createTradeSchema.parse(req.body);
    const algorithmKey = req.headers['x-algorithm-key'] as string;

    // Validate algorithm
    if (!await validateAlgorithmRequest(validatedData.kaijuId, algorithmKey)) {
      throw new AppError('Invalid algorithm credentials', 401);
    }

    // Create trade entry
    const { data: trade, error: tradeError } = await supabase
      .from('kaiju_no_69_trades')
      .insert({
        kaiju_id: validatedData.kaijuId,
        trade_type: validatedData.tradeType,
        confidence_level: validatedData.confidenceLevel,
        entry_data: validatedData.entryData,
        status: 'pending'
      })
      .select()
      .single();

    if (tradeError || !trade) {
      throw new AppError('Failed to create trade', 500);
    }

    // Get all active shadows for this kaiju
    const { data: shadows } = await supabase
      .from('kaiju_no_69_shadows')
      .select('id, user_id, allocation_percentage, max_position_size')
      .eq('kaiju_id', validatedData.kaijuId)
      .eq('is_active', true);

    // Execute trades for all shadows asynchronously
    const shadowPromises = shadows?.map(shadow => 
      executeShadowTrade(
        trade,
        shadow.id,
        shadow.user_id,
        shadow.allocation_percentage,
        shadow.max_position_size
      )
    ) || [];

    // Don't wait for all shadows to complete
    Promise.all(shadowPromises).then(() => {
      // Update trade status when all shadows are processed
      supabase
        .from('kaiju_no_69_trades')
        .update({ status: 'active' })
        .eq('id', trade.id)
        .then(() => console.log(`Trade ${trade.id} activated`));
    });

    res.status(201).json({
      status: 'success',
      data: {
        tradeId: trade.id,
        shadowCount: shadows?.length || 0
      }
    });
  } catch (error) {
    next(error);
  }
});

/**
 * Get active trades for a kaiju
 * GET /api/kaijus/:kaijuId/trades/active
 * Called by trading algorithms
 */
router.get('/kaijus/:kaijuId/trades/active', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { kaijuId } = req.params;
    const algorithmKey = req.headers['x-algorithm-key'] as string;

    // Validate algorithm
    if (!await validateAlgorithmRequest(kaijuId, algorithmKey)) {
      throw new AppError('Invalid algorithm credentials', 401);
    }

    const { data: trades, error } = await supabase
      .from('kaiju_no_69_trades')
      .select(`
        *,
        positions:kaiju_no_69_shadow_positions (
          id,
          status,
          allocated_amount,
          actual_amount
        )
      `)
      .eq('kaiju_id', kaijuId)
      .eq('status', 'active')
      .order('created_at', { ascending: false });

    if (error) {
      throw new AppError('Failed to fetch trades', 500);
    }

    res.json({
      status: 'success',
      data: trades || []
    });
  } catch (error) {
    next(error);
  }
});

/**
 * Close a trade
 * POST /api/trades/:id/close
 * Called by trading algorithms
 */
router.post('/:id/close', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const validatedData = closeTradeSchema.parse(req.body);
    const algorithmKey = req.headers['x-algorithm-key'] as string;

    // Get trade details
    const { data: trade } = await supabase
      .from('kaiju_no_69_trades')
      .select('kaiju_id, trade_type, entry_data')
      .eq('id', id)
      .single();

    if (!trade) {
      throw new AppError('Trade not found', 404);
    }

    // Validate algorithm
    if (!await validateAlgorithmRequest(trade.kaiju_id, algorithmKey)) {
      throw new AppError('Invalid algorithm credentials', 401);
    }

    // Update trade status
    const { error: updateError } = await supabase
      .from('kaiju_no_69_trades')
      .update({
        status: 'closed',
        exit_data: validatedData.exitData,
        closed_at: new Date().toISOString()
      })
      .eq('id', id);

    if (updateError) {
      throw new AppError('Failed to close trade', 500);
    }

    // Get all active positions for this trade
    const { data: positions } = await supabase
      .from('kaiju_no_69_shadow_positions')
      .select(`
        id,
        shadow_id,
        allocated_amount,
        actual_amount,
        shadow:shadow_id (
          user_id
        )
      `)
      .eq('trade_id', id)
      .eq('status', 'active');

    // Close all positions
    const closePromises = positions?.map(async (position) => {
      try {
        // Get user's wallet
        const { data: user } = await supabase
          .from('kaiju_no_69_users')
          .select('server_wallet_private_key')
          .eq('id', position.shadow.user_id)
          .single();

        if (!user) return;

        const wallet = walletService.getWallet(user.server_wallet_private_key, getProvider());

        let exitTxHash: string;
        let pnl = 0;

        // Execute closing trade based on type
        switch (trade.trade_type) {
          case 'swap':
            // For swaps, PnL is calculated based on exit swap
            if (validatedData.exitData) {
              exitTxHash = await swapService.executeSwap({
                ...validatedData.exitData,
                wallet
              });
            }
            break;

          case 'remove_liquidity':
            exitTxHash = await liquidityService.removeLiquidity({
              ...validatedData.exitData,
              wallet
            });
            break;

          case 'perps_long':
          case 'perps_short':
            const closeResult = await perpsService.closePosition(
              trade.entry_data.positionId,
              wallet
            );
            exitTxHash = closeResult.txHash;
            pnl = Number(closeResult.pnl);
            break;
        }

        // Update position
        await supabase
          .from('kaiju_no_69_shadow_positions')
          .update({
            status: 'closed',
            exit_tx_hash: exitTxHash!,
            profit_loss: pnl
          })
          .eq('id', position.id);

      } catch (error) {
        console.error(`Failed to close position ${position.id}:`, error);
        await supabase
          .from('kaiju_no_69_shadow_positions')
          .update({ status: 'failed' })
          .eq('id', position.id);
      }
    }) || [];

    // Don't wait for all positions to close
    Promise.all(closePromises);

    res.json({
      status: 'success',
      message: 'Trade close initiated'
    });
  } catch (error) {
    next(error);
  }
});

/**
 * Get trade history
 * GET /api/trades/history
 */
router.get('/history', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { kaijuId, status, page = 1, limit = 20 } = req.query;
    const offset = (Number(page) - 1) * Number(limit);

    let query = supabase
      .from('kaiju_no_69_trades')
      .select(`
        *,
        kaiju:kaiju_id (
          id,
          name
        ),
        positions:kaiju_no_69_shadow_positions (
          id,
          status,
          profit_loss
        )
      `, { count: 'exact' });

    if (kaijuId) {
      query = query.eq('kaiju_id', kaijuId);
    }

    if (status) {
      query = query.eq('status', status);
    }

    const { data: trades, error, count } = await query
      .order('created_at', { ascending: false })
      .range(offset, offset + Number(limit) - 1);

    if (error) {
      throw new AppError('Failed to fetch trade history', 500);
    }

    // Calculate aggregated stats
    const tradesWithStats = trades?.map(trade => {
      const totalPnL = trade.positions?.reduce((sum: number, pos: any) => 
        sum + (pos.profit_loss || 0), 0) || 0;
      const successfulPositions = trade.positions?.filter((pos: any) => 
        pos.status === 'closed' && pos.profit_loss > 0).length || 0;
      
      return {
        ...trade,
        positions: undefined,
        stats: {
          totalPositions: trade.positions?.length || 0,
          successfulPositions,
          totalPnL
        }
      };
    });

    res.json({
      status: 'success',
      data: {
        trades: tradesWithStats,
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

export default router;