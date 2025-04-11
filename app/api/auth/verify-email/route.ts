import { NextRequest, NextResponse } from 'next/server';

/**
 * Handler for email verification callback
 * Firebase automatically handles the verification token validation
 * This just provides a nice UX by redirecting to the sign-in page
 */
export async function GET(request: NextRequest) {
  // Redirect to sign-in page
  const redirectUrl = new URL('/sign-in', request.url);
  return NextResponse.redirect(redirectUrl);
} 