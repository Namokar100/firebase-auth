'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { Button } from "@/components/ui/button";
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
  navigationMenuTriggerStyle
} from "@/components/ui/navigation-menu";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { LogOut, User, Settings, CreditCard } from "lucide-react";
import { auth } from "@/firebase/client";
import { onAuthStateChanged, signOut, User as FirebaseUser } from "firebase/auth";
import { useRouter } from 'next/navigation';
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";

// Define interface for cached user data
interface CachedUser {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  emailVerified: boolean;
}

const Navbar = () => {
  // State to track user authentication status
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const router = useRouter();
  
  // Listen for auth state changes
  useEffect(() => {
    // Get initial auth state from session cookie to prevent flickering
    const checkSession = async () => {
      try {
        // Try to get auth state from localStorage first for immediate UI consistency
        const cachedUserStr = localStorage.getItem('authUser');
        if (cachedUserStr) {
          const cachedUser = JSON.parse(cachedUserStr) as CachedUser;
          // We can't fully reconstruct a Firebase User object, but we can use it for display
          // The real Firebase User object will be set when onAuthStateChanged fires
          setUser(cachedUser as unknown as FirebaseUser);
        }
      } catch (error) {
        console.error('Error checking cached auth state:', error);
      }
    };

    // Run this immediately
    checkSession();
    
    // Then setup the Firebase auth listener
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      // Only set the user if they have verified their email or are using OAuth (Google)
      if (currentUser) {
        // If email/password auth requires verification, but Google auth users are considered verified
        const isEmailProvider = currentUser.providerData[0]?.providerId === 'password';
        if (isEmailProvider && !currentUser.emailVerified) {
          setUser(null); // Don't set the user if email isn't verified
          localStorage.removeItem('authUser');
        } else {
          // Store minimal user data for caching
          const userData: CachedUser = {
            uid: currentUser.uid,
            email: currentUser.email,
            displayName: currentUser.displayName,
            photoURL: currentUser.photoURL,
            emailVerified: currentUser.emailVerified
          };
          setUser(currentUser);
          // Cache the user data in localStorage
          localStorage.setItem('authUser', JSON.stringify(userData));
        }
      } else {
        setUser(null);
        localStorage.removeItem('authUser');
      }
      setLoading(false);
    });
    
    // Cleanup subscription on unmount
    return () => unsubscribe();
  }, []);
  
  // Handle user logout
  const handleLogout = async () => {
    try {
      setLoading(true); // Show loading state during logout
      await signOut(auth);
      
      // Clear cached user data
      localStorage.removeItem('authUser');
      
      // Call the server action to clear the session cookie
      await fetch('/api/auth/signout', { method: 'POST' });
      
      // Show success message and redirect
      toast.success('Logged out successfully');
      router.push('/sign-in');
    } catch (error) {
      console.error('Logout error:', error);
      toast.error('Failed to log out. Please try again.');
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div className="border-b">
      <div className='mx-12'>
        <div className="flex h-16 items-center justify-between w-full ">
          {/* Logo */}
          <div className="flex items-center">
            <Link href="/" className="font-bold text-xl">
              YourLogo
            </Link>
          </div>
          
          {/* Navigation Menu */}
          <NavigationMenu className="hidden md:flex">
            <NavigationMenuList>
              <NavigationMenuItem>
                <NavigationMenuTrigger>Features</NavigationMenuTrigger>
                <NavigationMenuContent>
                  <div className="grid gap-3 p-6 w-[400px] md:w-[500px] lg:w-[600px]">
                    <div className="grid grid-cols-2 gap-3">
                      <Link href="/features/feature-1" legacyBehavior passHref>
                        <NavigationMenuLink className="flex flex-col gap-1 p-3 hover:bg-accent rounded-md">
                          <div className="font-medium">Feature 1</div>
                          <div className="text-sm text-muted-foreground">Description of feature 1</div>
                        </NavigationMenuLink>
                      </Link>
                      <Link href="/features/feature-2" legacyBehavior passHref>
                        <NavigationMenuLink className="flex flex-col gap-1 p-3 hover:bg-accent rounded-md">
                          <div className="font-medium">Feature 2</div>
                          <div className="text-sm text-muted-foreground">Description of feature 2</div>
                        </NavigationMenuLink>
                      </Link>
                    </div>
                  </div>
                </NavigationMenuContent>
              </NavigationMenuItem>
              <NavigationMenuItem>
                <Link href="/pricing" legacyBehavior passHref>
                  <NavigationMenuLink className={navigationMenuTriggerStyle()}>
                    Pricing
                  </NavigationMenuLink>
                </Link>
              </NavigationMenuItem>
              <NavigationMenuItem>
                <Link href="/documentation" legacyBehavior passHref>
                  <NavigationMenuLink className={navigationMenuTriggerStyle()}>
                    Documentation
                  </NavigationMenuLink>
                </Link>
              </NavigationMenuItem>
            </NavigationMenuList>
          </NavigationMenu>
          
          {/* Right side - Auth buttons or Avatar */}
          <div className="flex items-center gap-4">
            {loading ? (
              <Skeleton className="h-9 w-20 rounded-full" /> // Show skeleton while loading
            ) : user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Avatar className="h-9 w-9 cursor-pointer">
                    <AvatarImage src={user.photoURL || ""} alt={user.displayName || user.email || ""} />
                    <AvatarFallback>
                      {user.displayName 
                        ? `${user.displayName.split(' ')[0][0]}${user.displayName.split(' ')[1]?.[0] || ''}`
                        : user.email?.[0]?.toUpperCase() || 'U'}
                    </AvatarFallback>
                  </Avatar>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel>My Account</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem>
                    <User className="mr-2 h-4 w-4" />
                    <span>Profile</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    <Settings className="mr-2 h-4 w-4" />
                    <span>Settings</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    <CreditCard className="mr-2 h-4 w-4" />
                    <span>Billing</span>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem 
                    className="text-red-600 focus:text-red-600 focus:bg-red-100"
                    onClick={handleLogout}
                  >
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Logout</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <>
                <Link href="/sign-in">
                  <Button variant="ghost">Login</Button>
                </Link>
                <Link href="/sign-up">
                  <Button>Get Started</Button>
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Navbar; 