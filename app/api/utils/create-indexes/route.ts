import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/firebase/admin';
import { headers } from 'next/headers';

/**
 * Development utility to help create necessary Firestore indexes
 * This route is highly secured and only available in development mode
 * with proper authorization
 */
export async function GET(request: NextRequest) {
  try {
    // Only allow this in development
    if (process.env.NODE_ENV !== 'development') {
      return NextResponse.json({
        success: false,
        message: 'This utility is only available in development mode',
      }, { status: 403 });
    }

    // Add a development-only secret token check
    const headersList = headers();
    const authHeader = headersList.get('authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({
        success: false,
        message: 'Authentication required',
      }, { status: 401 });
    }
    
    const token = authHeader.substring(7); // Remove 'Bearer '
    const devToken = process.env.DEV_UTILITY_TOKEN || 'dev-token-firebase-auth-util';
    
    if (token !== devToken) {
      return NextResponse.json({
        success: false,
        message: 'Invalid authorization',
      }, { status: 403 });
    }

    // First, create a test token
    const testDoc = {
      email: 'test@example.com',
      token: 'test-token-' + Date.now(),
      expires: Date.now() + 3600000,
      createdAt: Date.now(),
      used: false
    };
    
    // Use a unique ID to prevent collisions
    const docId = `test_token_${Date.now()}`;
    const docRef = db.collection('verification-tokens').doc(docId);
    await docRef.set(testDoc);
    
    // Attempt to query with multiple where clauses to force index creation
    try {
      await db.collection('verification-tokens')
        .where('token', '==', testDoc.token)
        .where('expires', '>', Date.now())
        .get();
      
      // Try the other needed query
      await db.collection('verification-tokens')
        .where('token', '==', testDoc.token)
        .where('used', '==', false)
        .get();
    } catch (error: any) {
      // Cleanup test document regardless of outcome
      try { await docRef.delete(); } catch (e) {}
      
      if (error.code === 9 && error.message.includes('index')) {
        // Extract the index creation URL
        const indexUrl = error.message.match(/https:\/\/console\.firebase\.google\.com[^\s]+/)?.[0] || '';
        
        // Generate Firebase CLI command for creating the index
        const cliCommand = `firebase firestore:indexes --project ${process.env.FIREBASE_PROJECT_ID}`;
        
        return NextResponse.json({
          success: false,
          message: 'Index required',
          indexUrl,
          cliCommand,
          instructions: 'Please visit the URL above to create the required index, or use the Firebase CLI command.',
          errorDetails: error.message
        });
      }
      
      throw error;
    }
    
    // Cleanup test document
    await docRef.delete();
    
    // Output security recommendations
    return NextResponse.json({
      success: true,
      message: 'Indexes appear to be working correctly',
      securityRecommendations: [
        'Ensure Firestore security rules are properly configured',
        'Set up scheduled cleanup of expired tokens',
        'Consider implementing rate limiting for token generation',
        'Use HTTPS for all production traffic',
      ],
      // Include some sample security rules
      sampleFirestoreRules: `
service cloud.firestore {
  match /databases/{database}/documents {
    // Regular users should never directly access verification tokens
    match /verification-tokens/{token} {
      allow read: if false;
      allow write: if false;
    }
    
    // User data can only be read by the authenticated user or admin
    match /users/{userId} {
      allow read: if request.auth != null && (request.auth.uid == userId || request.auth.token.admin == true);
      allow write: if request.auth != null && (request.auth.uid == userId || request.auth.token.admin == true);
    }
  }
}
      `
    });
    
  } catch (error: any) {
    console.error('Error in index creation utility:', error);
    
    return NextResponse.json({
      success: false, 
      message: error.message || 'An error occurred',
      error: error.toString()
    }, { status: 500 });
  }
} 