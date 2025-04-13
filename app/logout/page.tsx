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
    <div className="h-screen w-full flex flex-col items-center justify-center bg-background">
      {/* Spinner */}
      <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-primary mb-4"></div>
      
      {/* Message */}
      <h2 className="text-2xl font-semibold text-foreground">Logging out...</h2>
      <p className="text-muted-foreground mt-2">Please wait while we securely log you out.</p>
    </div>
  );
} 