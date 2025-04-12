import { NextRequest, NextResponse } from 'next/server';
import { auth, db } from '@/firebase/admin';
import { verifyToken } from '@/lib/token';

/**
 * Handler for email verification callback
 * This verifies our custom token and updates user status
 */
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const token = searchParams.get('token');
  const redirectUrl = new URL('/sign-in', request.url);
  
  // Check if token exists
  if (!token) {
    redirectUrl.searchParams.set('error', 'invalid_token');
    return NextResponse.redirect(redirectUrl);
  }
  
  try {
    // Verify our custom token
    const email = await verifyToken(token);
    
    if (!email) {
      redirectUrl.searchParams.set('error', 'expired_token');
      return NextResponse.redirect(redirectUrl);
    }
    
    try {
      // Get the user record
      const userRecord = await auth.getUserByEmail(email);
      
      // If it's not already verified, update the user
      if (!userRecord.emailVerified) {
        // Set email as verified in Firebase Auth
        await auth.updateUser(userRecord.uid, { emailVerified: true });
        
        // Update email verification status in Firestore
        await db.collection('users').doc(userRecord.uid).update({
          emailVerified: true
        });
      }
      
      // Add a timestamp to ensure the URL is unique each time and cache won't block the toast
      redirectUrl.searchParams.set('verified', 'true');
      redirectUrl.searchParams.set('t', Date.now().toString());
      return NextResponse.redirect(redirectUrl);
    } catch (userError) {
      console.error('Error updating user verification status:', userError);
      redirectUrl.searchParams.set('error', 'user_update_failed');
      redirectUrl.searchParams.set('t', Date.now().toString());
      return NextResponse.redirect(redirectUrl);
    }
  } catch (error) {
    console.error('Error verifying email token:', error);
    redirectUrl.searchParams.set('error', 'verification_failed');
    redirectUrl.searchParams.set('t', Date.now().toString());
    return NextResponse.redirect(redirectUrl);
  }
} 