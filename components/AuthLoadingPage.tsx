'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

type AuthType = 'signin' | 'signup';

interface AuthLoadingPageProps {
  type?: AuthType;
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
  const [progress, setProgress] = useState(0);

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
    const progressIncrement = 100 / (timeoutMs / 50); // Calculate how much to increment every 50ms
    
    const progressInterval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          clearInterval(progressInterval);
          return 100;
        }
        return Math.min(prev + progressIncrement, 100);
      });
    }, 50);
    
    const timer = setTimeout(() => {
      router.push(redirectTo);
    }, timeoutMs);

    return () => {
      clearTimeout(timer);
      clearInterval(progressInterval);
    };
  }, [router, redirectTo, timeoutMs]);

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] px-4">
      <div className="bg-white dark:bg-card rounded-2xl shadow-lg p-8 max-w-md w-full border border-border/40">
        {/* Animation */}
        <div className="flex justify-center mb-6">
          <div className="relative">
            <svg className="animate-spin h-16 w-16 text-primary" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          </div>
        </div>
        
        {/* Message */}
        <h2 className="text-2xl font-bold text-primary text-center">
          {messages[type].title}<span className="inline-block w-6">{dots}</span>
        </h2>
        
        <p className="text-muted-foreground mt-3 text-center">
          {messages[type].description}
        </p>
        
        {/* Progress Bar */}
        <div className="mt-6 w-full bg-gray-100 dark:bg-gray-700 rounded-full h-2.5 overflow-hidden">
          <div 
            className="bg-primary h-2.5 rounded-full transition-all duration-300 ease-out"
            style={{ width: `${progress}%` }}
          ></div>
        </div>
        
        <p className="text-xs text-muted-foreground mt-3 text-center">
          You will be redirected automatically...
        </p>
      </div>
    </div>
  );
} 