import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase/server';

// GET /api/kaijus/[id]/performance - Get kaiju performance data
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const searchParams = request.nextUrl.searchParams;
    const period = searchParams.get('period') || '30d';

    // Calculate date range based on period
    const now = new Date();
    let startDate = new Date();
    
    switch (period) {
      case '24h':
        startDate.setDate(now.getDate() - 1);
        break;
      case '7d':
        startDate.setDate(now.getDate() - 7);
        break;
      case '30d':
        startDate.setDate(now.getDate() - 30);
        break;
      case '90d':
        startDate.setDate(now.getDate() - 90);
        break;
      case '1y':
        startDate.setFullYear(now.getFullYear() - 1);
        break;
      case 'all':
        startDate = new Date('2000-01-01'); // Far past date
        break;
      default:
        startDate.setDate(now.getDate() - 30);
    }

    // Get trades for the kaiju within the period
    const { data: trades, error } = await supabaseServer
      .from('trades')
      .select(`
        *,
        shadow_positions(
          profit_loss
        )
      `)
      .eq('kaiju_id', id)
      .gte('created_at', startDate.toISOString())
      .order('created_at', { ascending: false });

    if (error) {
      throw error;
    }

    // Calculate performance metrics
    const totalTrades = trades?.length || 0;
    const closedTrades = trades?.filter(t => t.status === 'closed') || [];
    const profitableTrades = closedTrades.filter(t => {
      const totalPnL = t.shadow_positions?.reduce((sum: number, pos: any) => 
        sum + (pos.profit_loss || 0), 0) || 0;
      return totalPnL > 0;
    });

    const totalPnL = closedTrades.reduce((sum, trade) => {
      const tradePnL = trade.shadow_positions?.reduce((tSum: number, pos: any) => 
        tSum + (pos.profit_loss || 0), 0) || 0;
      return sum + tradePnL;
    }, 0);

    const winRate = closedTrades.length > 0
      ? ((profitableTrades.length / closedTrades.length) * 100).toFixed(2)
      : '0.00';

    return NextResponse.json({
      status: 'success',
      data: {
        period,
        totalTrades,
        closedTrades: closedTrades.length,
        profitableTrades: profitableTrades.length,
        winRate: `${winRate}%`,
        totalPnL,
        trades: trades?.map(trade => ({
          ...trade,
          totalPnL: trade.shadow_positions?.reduce((sum: number, pos: any) => 
            sum + (pos.profit_loss || 0), 0) || 0
        })) || []
      }
    });
  } catch (error) {
    console.error('Error fetching kaiju performance:', error);
    return NextResponse.json(
      { 
        error: 'Failed to fetch kaiju performance',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}