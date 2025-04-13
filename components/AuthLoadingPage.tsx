'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

type AuthType = 'signin' | 'signup';

interface AuthLoadingPageProps {
  type: AuthType;
  redirectTo?: string;
  timeoutMs?: number;
}

export default function AuthLoadingPage({ 
  type = 'signin', 
  redirectTo = '/dashboard', 
  timeoutMs = 2000 
}: AuthLoadingPageProps) {
  const router = useRouter();
  const [dots, setDots] = useState('');

  // Messages based on auth type
  const messages = {
    signin: {
      title: 'Signing in',
      description: 'Please wait while we securely sign you in.',
      success: 'Sign in successful!',
    },
    signup: {
      title: 'Creating your account',
      description: 'Please wait while we securely set up your account.',
      success: 'Account created successfully!',
    }
  };

  useEffect(() => {
    // Animate the dots
    const interval = setInterval(() => {
      setDots(prev => prev.length >= 3 ? '' : prev + '.');
    }, 400);

    // Clean up interval
    return () => clearInterval(interval);
  }, []);

  // For demo purposes, simulate a redirect after the timeout
  // In a real app, this component would be shown by the auth component and unmounted when auth completes
  useEffect(() => {
    const timer = setTimeout(() => {
      router.push(redirectTo);
    }, timeoutMs);

    return () => clearTimeout(timer);
  }, [router, redirectTo, timeoutMs]);

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh]">
      {/* Spinner */}
      <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-primary mb-4"></div>
      
      {/* Message */}
      <h2 className="text-2xl font-semibold text-foreground">
        {messages[type].title}{dots}
      </h2>
      <p className="text-muted-foreground mt-2 text-center max-w-md">
        {messages[type].description}
      </p>
    </div>
  );
} 