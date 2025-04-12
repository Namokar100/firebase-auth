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
      // Use a more reliable navigation approach
      // First try the router
      try {
        router.push("/signout");
        
        // Add a fallback redirect to handle cases where the navigation gets stuck
        timeoutRef.current = setTimeout(() => {
          // If we're still on the page after 3 seconds, force redirect to sign-in
          if (document.visibilityState !== 'hidden') {
            window.location.href = "/signout";
          }
        }, 2000);
      } catch (routerError) {
        console.error("Error with Next.js router:", routerError);
        
        // If router navigation fails, try direct location change
        window.location.href = "/signout";
      }
    } catch (error) {
      console.error("Error navigating to signout page:", error);
      setIsLoading(false);
      
      // Show a toast error
      toast.error("Error signing out. Please try again.", {
        id: 'signout-error',
        duration: 3000
      });
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