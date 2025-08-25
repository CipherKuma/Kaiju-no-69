import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer, type User } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  try {
    const { walletAddress } = await request.json();

    if (!walletAddress) {
      return NextResponse.json(
        { error: 'Wallet address is required' },
        { status: 400 }
      );
    }

    // Check if user already exists
    const { data: existingUser, error: checkError } = await supabaseServer
      .from('users')
      .select('*')
      .eq('wallet_address', walletAddress.toLowerCase())
      .single();

    if (checkError && checkError.code !== 'PGRST116') { // PGRST116 = no rows found
      throw checkError;
    }

    let user: User;

    if (existingUser) {
      user = existingUser;
    } else {
      // Create new user
      const { data: newUser, error: createError } = await supabaseServer
        .from('users')
        .insert([{
          wallet_address: walletAddress.toLowerCase()
        }])
        .select()
        .single();

      if (createError) {
        throw createError;
      }

      user = newUser;
    }

    // Generate a simple JWT token (in production, use a proper auth solution)
    const token = Buffer.from(JSON.stringify({
      userId: user.id,
      walletAddress: user.wallet_address,
      timestamp: Date.now()
    })).toString('base64');

    return NextResponse.json({
      status: 'success',
      data: {
        user,
        token
      }
    });
  } catch (error) {
    console.error('Error in connect wallet:', error);
    return NextResponse.json(
      { 
        error: 'Failed to connect wallet',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}