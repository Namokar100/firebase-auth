"use client";

import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

export function SignOutButton({ 
  className, 
  variant = "destructive", 
  size = "default" 
}: { 
  className?: string;
  variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link";
  size?: "default" | "sm" | "lg" | "icon";
}) {
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Clean up any timeouts when component unmounts
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  const handleSignOut = async () => {
    if (isLoading) return; // Prevent multiple clicks
    
    setIsLoading(true);
    
    // Immediately clear localStorage to fix UI issues
    localStorage.removeItem('authUser');
    localStorage.removeItem('userData');
    
    // Check if online before attempting signout
    if (!navigator.onLine) {
      toast.error('Network connection issue. Please check your internet connection and try again.', {
        id: 'network-error',
        duration: 5000
      });
      setIsLoading(false);
      return;
    }
    
    try {
      // Use a direct hard navigation to the signout page
      // This ensures a complete page refresh and proper cleanup
      window.location.href = "/signout";
      
      // Fallback in case the redirect doesn't happen immediately
      timeoutRef.current = setTimeout(() => {
        if (document.visibilityState !== 'hidden') {
          // Force reload the page to clear any stuck state
          window.location.reload();
        }
      }, 3000);
    } catch (error) {
      console.error("Error navigating to signout page:", error);
      setIsLoading(false);
      
      // Show a toast error
      toast.error("Error signing out. Please try again.", {
        id: 'signout-error',
        duration: 3000
      });
      
      // Try to restore the UI state
      try {
        const cachedUserStr = localStorage.getItem('authUser');
        if (cachedUserStr) {
          // Re-apply stored user data if available
          toast.info("Please try signing out again", {
            id: 'retry-signout',
            duration: 3000
          });
        }
      } catch (e) {
        // Ignore errors in the recovery process
      }
    }
  };

  return (
    <Button 
      className={className}
      variant={variant}
      size={size}
      onClick={handleSignOut}
      disabled={isLoading}
    >
      {isLoading ? "Signing out..." : "Sign out"}
    </Button>
  );
} 