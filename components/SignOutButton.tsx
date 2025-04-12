"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";

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

  const handleSignOut = async () => {
    setIsLoading(true);
    try {
      // Navigate to the dedicated signout page
      router.push("/signout");
    } catch (error) {
      console.error("Error navigating to signout page:", error);
      setIsLoading(false);
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