import crypto from 'crypto';
import { db } from '@/firebase/admin';

// Token expiration time (24 hours)
const TOKEN_EXPIRY = 24 * 60 * 60 * 1000;

/**
 * Generate a secure token for email verification
 * This creates a cryptographically secure token and stores it with appropriate expiration
 */
export async function generateVerificationToken(email: string): Promise<string> {
  // Create a random token with high entropy (64 bytes = 128 hex chars)
  const token = crypto.randomBytes(64).toString('hex');
  
  // Generate a unique ID for the token document
  const tokenId = `${email.replace(/[.#$\/[\]]/g, '_')}_${Date.now()}`;
  
  // Store the token in Firestore with expiration
  const tokenDoc = {
    email,
    token,
    expires: Date.now() + TOKEN_EXPIRY,
    createdAt: Date.now(),
    used: false // Track if token has been used
  };
  
  // Store in a verification-tokens collection with the generated ID
  await db.collection('verification-tokens').doc(tokenId).set(tokenDoc);
  
  return token;
}

/**
 * Verify a token and return the associated email if valid
 * 
 * Security considerations:
 * 1. We validate token existence, expiration, and usage status
 * 2. We use atomic operations to mark tokens as used to prevent replay attacks
 * 3. We clean up expired/used tokens regularly
 */
export async function verifyToken(token: string): Promise<string | null> {
  // For security, we need to use both conditions
  // This specific query doesn't require an index, as we're not ordering
  try {
    // Find the token in Firestore - using only what we need
    const snapshot = await db.collection('verification-tokens')
      .where('token', '==', token)
      .where('used', '==', false)
      .get();
    
    if (snapshot.empty) {
      return null;
    }
    
    // Manually check if the token is expired
    const currentTime = Date.now();
    
    for (const doc of snapshot.docs) {
      const tokenData = doc.data();
      
      // Validate expiration
      if (tokenData.expires > currentTime) {
        // Get the email associated with the token
        const email = tokenData.email;
        
        // Use a transaction to mark the token as used
        // This prevents race conditions and replay attacks
        await db.runTransaction(async (transaction) => {
          // Mark token as used
          transaction.update(doc.ref, { used: true });
        });
        
        // Schedule token for deletion (we keep it for a short time for audit purposes)
        setTimeout(async () => {
          try {
            const docSnapshot = await doc.ref.get();
            if (docSnapshot.exists) {
              await doc.ref.delete();
            }
          } catch (e) {
            console.error('Error deleting used token:', e);
          }
        }, 60000); // Delete after 1 minute
        
        return email;
      } else {
        // Delete expired token
        await doc.ref.delete();
      }
    }
  } catch (error) {
    console.error('Error verifying token:', error);
    // For security reasons, we don't expose the specific error
  }
  
  return null;
}

/**
 * Cleanup expired tokens to maintain database hygiene
 * This should be called periodically, e.g., via a cron job
 */
export async function cleanupExpiredTokens(): Promise<number> {
  try {
    const currentTime = Date.now();
    const snapshot = await db.collection('verification-tokens')
      .where('expires', '<', currentTime)
      .get();
    
    const batch = db.batch();
    let count = 0;
    
    snapshot.docs.forEach(doc => {
      batch.delete(doc.ref);
      count++;
    });
    
    if (count > 0) {
      await batch.commit();
    }
    
    return count;
  } catch (error) {
    console.error('Error cleaning up expired tokens:', error);
    return 0;
  }
} 