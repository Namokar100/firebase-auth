'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { auth } from '@/firebase/client';
import { signOut as firebaseSignOut } from 'firebase/auth';
import { toast } from 'sonner';

export default function SignOutPage() {
  const router = useRouter();
  const [isNetworkError, setIsNetworkError] = useState(false);

  // Immediately clear all local state on component mount to fix UI
  useEffect(() => {
    // Immediately clear localStorage data to fix navbar
    localStorage.removeItem('authUser');
    localStorage.removeItem('userData');
    sessionStorage.clear();
    
    // Clear cookies directly
    document.cookie.split(';').forEach(cookie => {
      document.cookie = cookie.replace(/^ +/, '').replace(/=.*/, `=;expires=${new Date(0).toUTCString()};path=/`);
    });
  }, []);

  useEffect(() => {
    let redirectTimer: NodeJS.Timeout;
    let networkCheckTimer: NodeJS.Timeout;

    // Check if network is online
    const isOnline = navigator.onLine;
    
    async function performSignOut() {
      try {
        // If offline, show network error after a delay and redirect
        if (!isOnline) {
          networkCheckTimer = setTimeout(() => {
            toast.error('Network connection issue. Please check your internet connection and try again.', {
              id: 'network-error',
              duration: 5000
            });
            setIsNetworkError(true);
          }, 2000);
          
          // Force redirect even if offline
          redirectTimer = setTimeout(() => {
            window.location.href = '/sign-in?signout=true';
          }, 3000);
          return;
        }

        // First attempt Firebase signout - with a timeout to prevent freezing
        const firebaseSignoutPromise = Promise.race([
          firebaseSignOut(auth),
          new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Firebase signout timeout')), 3000)
          )
        ]);
        
        try {
          await firebaseSignoutPromise;
        } catch (firebaseError) {
          console.error('Firebase signout error:', firebaseError);
          // Continue with the rest of the cleanup even if Firebase fails
        }
        
        // Clear server-side session with timeout to prevent hanging
        try {
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 3000);
          
          const response = await fetch('/api/auth/signout', { 
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Cache-Control': 'no-cache, no-store',
            },
            cache: 'no-store',
            signal: controller.signal
          });
          
          clearTimeout(timeoutId);
          
          if (!response.ok) {
            console.error('Failed to sign out on server');
            // Still continue to redirect
          }
        } catch (apiError: any) {
          console.error('API error during sign out:', apiError);
          
          // Check if it's a network error
          if (apiError.name === 'AbortError' || !navigator.onLine) {
            networkCheckTimer = setTimeout(() => {
              toast.error('Network connection issue. Please check your internet connection and try again.', {
                id: 'network-error',
                duration: 5000
              });
              setIsNetworkError(true);
            }, 1000);
          }
        }
        
        // Regardless of API success, force session cookie deletion with direct cookie access
        document.cookie = "session=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
        
        // Show success message if no network error
        if (navigator.onLine && !isNetworkError) {
          toast.success('Signed out successfully', {
            id: 'sign-out-success',
            duration: 2000
          });
        }
        
        // Force reload before redirect to ensure clean state
        redirectTimer = setTimeout(() => {
          // Use hard navigation to sign-in to ensure a complete page refresh
          window.location.href = '/sign-in?signout=true';
        }, 2000);
      } catch (error) {
        console.error('Error during signout:', error);
        
        // Check for network errors
        if (!navigator.onLine) {
          toast.error('Network connection issue. Please check your internet connection and try again.', {
            id: 'network-error',
            duration: 5000
          });
          setIsNetworkError(true);
        } else {
          toast.error('An error occurred during sign out');
        }
        
        // Even on error, redirect to sign-in page with hard navigation
        redirectTimer = setTimeout(() => {
          window.location.href = '/sign-in?signout=true';
        }, 2000);
      }
    }

    // Add event listeners for network status changes
    const handleOnline = () => {
      if (isNetworkError) {
        toast.success('Connection restored', {
          id: 'network-restored',
          duration: 2000
        });
      }
    };
    
    const handleOffline = () => {
      toast.error('Network connection issue. Please check your internet connection and try again.', {
        id: 'network-error',
        duration: 5000
      });
      setIsNetworkError(true);
    };
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Start the sign-out process
    performSignOut();
    
    // Cleanup function to prevent memory leaks
    return () => {
      if (redirectTimer) clearTimeout(redirectTimer);
      if (networkCheckTimer) clearTimeout(networkCheckTimer);
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [router, isNetworkError]);

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <h1 className="text-2xl font-bold mb-4">Signing out...</h1>
        <p>{isNetworkError 
          ? "Network connection issue. Redirecting to sign-in page..." 
          : "Please wait while we securely sign you out."}
        </p>
      </div>
    </div>
  );
} 