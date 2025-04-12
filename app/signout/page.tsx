'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { auth } from '@/firebase/client';
import { signOut as firebaseSignOut } from 'firebase/auth';
import { toast } from 'sonner';

export default function SignOutPage() {
  const router = useRouter();

  useEffect(() => {
    async function performSignOut() {
      try {
        // Clear Firebase auth state
        await firebaseSignOut(auth);
        
        // Clear cached user data
        localStorage.removeItem('authUser');
        
        // Clear server-side session
        const response = await fetch('/api/auth/signout', { 
          method: 'POST',
          headers: {
            'Cache-Control': 'no-cache, no-store',
          },
        });
        
        if (!response.ok) {
          throw new Error('Failed to sign out on server');
        }
        
        // Show success message with hardcoded text
        toast.success('Signed out successfully', {
          id: 'sign-out-success',
          duration: 3000
        });
        
        // Add a short delay before redirect to ensure the toast is shown
        setTimeout(() => {
          // Redirect to sign-in page
          router.push('/sign-in');
        }, 500);
      } catch (error) {
        console.error('Error during signout:', error);
        toast.error('An error occurred during sign out');
        
        // Attempt to redirect to sign-in even if there was an error
        setTimeout(() => {
          router.push('/sign-in');
        }, 500);
      }
    }

    performSignOut();
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