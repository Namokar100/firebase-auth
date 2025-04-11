"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { signOut } from "@/lib/actions/auth.action";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { auth } from "@/firebase/client";

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
      // Sign out from Firebase client
      await auth.signOut();
      
      // Clear server-side session
      const result = await signOut();
      
      if (result.success) {
        toast.success("Signed out successfully");
        router.push("/sign-in");
      } else {
        toast.error("Failed to sign out");
      }
    } catch (error) {
      console.error("Error signing out:", error);
      toast.error("An error occurred while signing out");
    } finally {
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