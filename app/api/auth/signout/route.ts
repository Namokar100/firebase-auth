import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

/**
 * API route to handle user sign out
 * This clears the session cookie
 */
export async function POST(request: NextRequest) {
  try {
    // Clear the session cookie
    const cookieStore = await cookies();
    cookieStore.delete('session');
    
    return NextResponse.json({ 
      success: true, 
      message: 'Signed out successfully' 
    });
  } catch (error: any) {
    console.error('Error signing out:', error);
    
    return NextResponse.json({ 
      success: false, 
      message: 'Error signing out', 
      error: error.message 
    }, { status: 500 });
  }
} 