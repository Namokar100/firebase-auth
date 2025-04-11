import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { cleanupExpiredTokens } from '@/lib/token';

/**
 * API route to clean up expired verification tokens
 * This can be called by a scheduled job/cron task
 * Protected by a secret key for security
 */
export async function POST(request: NextRequest) {
  try {
    // Validate authentication
    const headersList = await headers();
    const authHeader = headersList.get('authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ 
        success: false, 
        message: 'Authentication required' 
      }, { status: 401 });
    }
    
    // Use a secure token from environment variables
    // This should be set to a long, random string in production
    const expectedToken = process.env.TOKEN_CLEANUP_SECRET || process.env.NEXTAUTH_SECRET;
    const providedToken = authHeader.substring(7); // Remove 'Bearer '
    
    if (!expectedToken || providedToken !== expectedToken) {
      return NextResponse.json({ 
        success: false, 
        message: 'Invalid authorization' 
      }, { status: 403 });
    }
    
    // Clean up expired tokens
    const count = await cleanupExpiredTokens();
    
    return NextResponse.json({ 
      success: true, 
      message: `Successfully cleaned up ${count} expired tokens.` 
    });
  } catch (error: any) {
    console.error('Error cleaning up tokens:', error);
    
    return NextResponse.json({ 
      success: false, 
      message: 'Error cleaning up tokens', 
      error: error.message 
    }, { status: 500 });
  }
} 