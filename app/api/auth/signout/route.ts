import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

/**
 * API route to handle user sign out
 * This clears the session cookie
 */
export async function POST(request: NextRequest) {
  try {
    // Clear the session cookie using the syntax exactly as specified
    const cookieStore = await cookies();
    cookieStore.delete('session');
    
    // Return response with strict cache control headers
    return NextResponse.json({ 
      success: true, 
      message: 'Signed out successfully' 
    }, { 
      status: 200,
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0, private',
        'Pragma': 'no-cache',
        'Expires': '0',
        'SameSite': 'Strict',
        'Surrogate-Control': 'no-store',
        'Clear-Site-Data': '"cookies", "storage", "cache"'
      }
    });
  } catch (error: any) {
    console.error('Error signing out:', error);
    
    return NextResponse.json({ 
      success: false, 
      message: 'Error signing out', 
      error: error.message 
    }, { 
      status: 500,
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0, private',
        'Pragma': 'no-cache',
        'Expires': '0',
        'SameSite': 'Strict',
        'Clear-Site-Data': '"cookies", "storage", "cache"'
      }
    });
  }
} 