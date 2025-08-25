import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase/server';

// GET /api/kaijus - Get list of kaijus with pagination and sorting
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const sortBy = searchParams.get('sortBy') || 'created_at';
    const sortOrder = searchParams.get('sortOrder') || 'desc';

    const offset = (page - 1) * limit;

    // Build query
    let query = supabaseServer
      .from('kaijus')
      .select(`
        *,
        owner:users!owner_id(id, wallet_address),
        shadow_count:shadows(count)
      `, { count: 'exact' })
      .order(sortBy, { ascending: sortOrder === 'asc' })
      .range(offset, offset + limit - 1);

    const { data: kaijus, error, count } = await query;

    if (error) {
      throw error;
    }

    const totalPages = Math.ceil((count || 0) / limit);

    return NextResponse.json({
      status: 'success',
      data: {
        kaijus: kaijus || [],
        pagination: {
          page,
          limit,
          total: count || 0,
          totalPages
        }
      }
    });
  } catch (error) {
    console.error('Error fetching kaijus:', error);
    return NextResponse.json(
      { 
        error: 'Failed to fetch kaijus',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// POST /api/kaijus - Create a new kaiju
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      nftCollectionAddress,
      name,
      bio,
      algorithmUrl,
      kaijuImageUrl,
      shadowImageUrl
    } = body;

    // Get the user from the authorization header
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const token = authHeader.substring(7);
    const tokenData = JSON.parse(Buffer.from(token, 'base64').toString());
    const userId = tokenData.userId;

    // Validate required fields
    if (!nftCollectionAddress || !name || !algorithmUrl || !kaijuImageUrl || !shadowImageUrl) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Create the kaiju
    const { data: kaiju, error } = await supabaseServer
      .from('kaijus')
      .insert([{
        nft_collection_address: nftCollectionAddress,
        name,
        bio: bio || '',
        owner_id: userId,
        algorithm_url: algorithmUrl,
        kaiju_image_url: kaijuImageUrl,
        shadow_image_url: shadowImageUrl,
        is_active: true,
        avg_pnl_percentage: 0,
        wins: 0,
        losses: 0
      }])
      .select()
      .single();

    if (error) {
      throw error;
    }

    return NextResponse.json({
      status: 'success',
      data: kaiju
    });
  } catch (error) {
    console.error('Error creating kaiju:', error);
    return NextResponse.json(
      { 
        error: 'Failed to create kaiju',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}