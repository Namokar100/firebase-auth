'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { auth } from '@/firebase/client';
import { signOut as firebaseSignOut } from 'firebase/auth';
import { toast } from 'sonner';

export default function SignOutPage() {
  const router = useRouter();

  useEffect(() => {
    let redirectTimer: NodeJS.Timeout;

    async function performSignOut() {
      try {
        // Clear Firebase auth state
        await firebaseSignOut(auth);
        
        // Clear any cached data
        localStorage.removeItem('authUser');
        localStorage.removeItem('userData');
        sessionStorage.clear();
        
        // Try to clear cookies directly using document.cookie
        // This is a fallback approach for client-side
        document.cookie.split(';').forEach(cookie => {
          document.cookie = cookie.replace(/^ +/, '').replace(/=.*/, `=;expires=${new Date(0).toUTCString()};path=/`);
        });
        
        // Clear server-side session
        try {
          const response = await fetch('/api/auth/signout', { 
            method: 'POST',
            headers: {
              'Cache-Control': 'no-cache, no-store',
            },
            cache: 'no-store',
          });
          
          if (!response.ok) {
            console.error('Failed to sign out on server');
          }
        } catch (apiError) {
          console.error('API error during sign out:', apiError);
        }
        
        // Show success message
        toast.success('Signed out successfully', {
          id: 'sign-out-success',
          duration: 2000
        });
        
        // Force redirect using window.location after a short delay
        // This is more reliable in production than Next.js router
        redirectTimer = setTimeout(() => {
          window.location.href = '/sign-in';
        }, 500);
      } catch (error) {
        console.error('Error during signout:', error);
        toast.error('An error occurred during sign out');
        
        // Even on error, redirect to sign-in page
        redirectTimer = setTimeout(() => {
          window.location.href = '/sign-in';
        }, 500);
      }
    }

    performSignOut();
    
    // Cleanup function to prevent memory leaks
    return () => {
      if (redirectTimer) clearTimeout(redirectTimer);
    };
  }, [router]);

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <h1 className="text-2xl font-bold mb-4">Signing out...</h1>
        <p>Please wait while we securely sign you out.</p>
      </div>
    </div>
  );
} 