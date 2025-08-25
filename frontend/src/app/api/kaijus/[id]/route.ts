import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase/server';

// GET /api/kaijus/[id] - Get single kaiju details
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const { data: kaiju, error } = await supabaseServer
      .from('kaijus')
      .select(`
        *,
        owner:users!owner_id(id, wallet_address),
        shadow_count:shadows(count)
      `)
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json(
          { error: 'Kaiju not found' },
          { status: 404 }
        );
      }
      throw error;
    }

    // Calculate additional stats
    const totalShadows = kaiju.shadow_count?.[0]?.count || 0;
    const winRate = kaiju.wins + kaiju.losses > 0
      ? ((kaiju.wins / (kaiju.wins + kaiju.losses)) * 100).toFixed(2)
      : '0.00';

    return NextResponse.json({
      status: 'success',
      data: {
        ...kaiju,
        stats: {
          totalShadows,
          totalVolume: 0, // Would need to calculate from trades
          winRate: `${winRate}%`
        }
      }
    });
  } catch (error) {
    console.error('Error fetching kaiju:', error);
    return NextResponse.json(
      { 
        error: 'Failed to fetch kaiju',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}