'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { signOut } from 'firebase/auth';
import { auth } from '@/firebase/client';
import { logout } from '@/lib/actions/auth.action';
import { toast } from 'sonner';

export default function LogoutPage() {
  const router = useRouter();

  useEffect(() => {
    const performLogout = async () => {
      try {
        // Clear the cached user data
        localStorage.removeItem('authUser');
        
        // Sign out from Firebase client-side auth
        await signOut(auth);
        
        // Call the server action to clear the session cookie
        await logout();
        
        // Navigate to sign-in page after successful logout
        toast.success('Logged out successfully');
        router.push('/sign-in');
      } catch (error) {
        console.error('Error during logout:', error);
        // Even if there's an error, redirect to sign-in
        router.push('/sign-in');
      }
    };

    performLogout();
  }, [router]);

  return (
    <div className="fixed inset-0 flex items-center justify-center w-full h-full">
      <div className="bg-white dark:bg-card rounded-sm shadow-md p-6 pt-4 max-w-md w-full border border-border/40 mx-auto text-center">
        {/* Spinner */}
        <div className="animate-spin rounded-sm h-14 w-14 border-t-2 border-b-2 border-primary mb-3 mx-auto"></div>
        
        {/* Message */}
        <h2 className="text-xl font-semibold text-foreground">Logging out...</h2>
        <p className="text-muted-foreground mt-2">Please wait while we securely log you out.</p>
      </div>
    </div>
  );
} 