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
import { User, Settings, CreditCard, LogOut, Moon, Sun } from "lucide-react";
import { auth } from "@/firebase/client";
import { onAuthStateChanged, User as FirebaseUser } from "firebase/auth";
import { useRouter, usePathname } from 'next/navigation';
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";
import { useTheme } from "@/components/ThemeProvider";

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
  const pathname = usePathname(); // Get current pathname
  const isHomepage = pathname === '/'; // Check if we're on the homepage
  const { theme, toggleTheme } = useTheme(); // Get theme and toggle function
  
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
  
  // Apply the appropriate classNames based on whether it's the homepage or not
  const navbarClassName = isHomepage 
    ? "fixed top-0 left-0 right-0 z-50 border-b shadow-sm bg-white dark:bg-[#1e2329] dark:border-[#4285F4]/10"
    : "border-b shadow-sm bg-white dark:bg-[#1e2329] dark:border-[#4285F4]/10";
  
  return (
    <div className={navbarClassName}>
      <div className="container max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between w-full">
          {/* Logo */}
          <div className="flex items-center">
            <Link href="/" className="font-bold text-xl text-[#4285F4]">
              FireAuth
            </Link>
          </div>
          
          {/* Navigation Menu */}
          <NavigationMenu className="hidden md:flex">
            <NavigationMenuList>
              <NavigationMenuItem>
                <NavigationMenuTrigger className="!text-primary hover:!text-[#4285F4] hover:!bg-[#4285F4]/10 data-[state=open]:!bg-[#4285F4]/10 data-[state=open]:!text-[#4285F4] rounded-lg font-medium dark:!text-white dark:hover:!text-[#4285F4] dark:hover:!bg-[#2a3138] dark:data-[state=open]:!bg-[#2a3138] dark:data-[state=open]:!text-[#4285F4]">Features</NavigationMenuTrigger>
                <NavigationMenuContent>
                  <div className="grid gap-3 p-6 w-[400px] md:w-[500px] lg:w-[600px] rounded-xl dark:bg-card dark:border dark:border-[#4285F4]/10">
                    <div className="grid grid-cols-2 gap-4">
                      <Link href="/features/feature-1" legacyBehavior passHref>
                        <NavigationMenuLink className="flex flex-col gap-1 p-4 hover:bg-accent rounded-xl transition-all duration-200 shadow-sm hover:shadow-md dark:hover:bg-[#2a3138] dark:hover:shadow-[0_4px_12px_rgba(66,133,244,0.1)]">
                          <div className="font-medium text-primary dark:text-[#4285F4]">Secure Authentication</div>
                          <div className="text-sm text-muted-foreground dark:text-white/70">Multi-factor authentication for better security</div>
                        </NavigationMenuLink>
                      </Link>
                      <Link href="/features/feature-2" legacyBehavior passHref>
                        <NavigationMenuLink className="flex flex-col gap-1 p-4 hover:bg-accent rounded-xl transition-all duration-200 shadow-sm hover:shadow-md dark:hover:bg-[#2a3138] dark:hover:shadow-[0_4px_12px_rgba(66,133,244,0.1)]">
                          <div className="font-medium text-primary dark:text-[#0F9D58]">Easy Integration</div>
                          <div className="text-sm text-muted-foreground dark:text-white/70">Simple API for all your authentication needs</div>
                        </NavigationMenuLink>
                      </Link>
                    </div>
                  </div>
                </NavigationMenuContent>
              </NavigationMenuItem>
              <NavigationMenuItem>
                <Link href="/pricing" legacyBehavior passHref>
                  <NavigationMenuLink className={navigationMenuTriggerStyle() + " !text-primary hover:!text-[#4285F4] hover:!bg-[#4285F4]/10 rounded-lg font-medium dark:!text-white dark:hover:!text-[#4285F4] dark:hover:!bg-[#2a3138]"}>
                    Pricing
                  </NavigationMenuLink>
                </Link>
              </NavigationMenuItem>
              <NavigationMenuItem>
                <Link href="/documentation" legacyBehavior passHref>
                  <NavigationMenuLink className={navigationMenuTriggerStyle() + " !text-primary hover:!text-[#4285F4] hover:!bg-[#4285F4]/10 rounded-lg font-medium dark:!text-white dark:hover:!text-[#4285F4] dark:hover:!bg-[#2a3138]"}>
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
                  <Avatar className="h-10 w-10 cursor-pointer border-2 border-[#4285F4]/30 shadow-sm hover:shadow-md transition-all duration-200">
                    <AvatarImage src={user.photoURL || ""} alt={user.displayName || user.email || ""} />
                    <AvatarFallback className="bg-[#4285F4]/10 text-[#4285F4] font-medium">
                      {user.displayName 
                        ? `${user.displayName.split(' ')[0][0]}${user.displayName.split(' ')[1]?.[0] || ''}`
                        : user.email?.[0]?.toUpperCase() || 'U'}
                    </AvatarFallback>
                  </Avatar>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56 rounded-xl shadow-md dark:border dark:border-[#4285F4]/10 dark:shadow-[0_4px_12px_rgba(66,133,244,0.1)]">
                  <DropdownMenuLabel className="font-semibold text-primary dark:text-[#4285F4]">My Account</DropdownMenuLabel>
                  <DropdownMenuSeparator className="dark:border-[#4285F4]/10" />
                  <Link href="/profile">
                    <DropdownMenuItem className="cursor-pointer flex items-center hover:bg-accent/100 focus:bg-accent/80 rounded-lg transition duration-200 py-2 dark:hover:bg-[#4285F4]/10 dark:focus:bg-[#4285F4]/10">
                      <User className="mr-2 h-4 w-4 text-primary/70 dark:text-[#4285F4]" />
                      <span className="dark:text-white">Profile</span>
                    </DropdownMenuItem>
                  </Link>
                  <Link href="/settings">
                    <DropdownMenuItem className="cursor-pointer flex items-center hover:bg-accent/80 focus:bg-accent/80 rounded-lg transition duration-200 py-2 dark:hover:bg-[#4285F4]/10 dark:focus:bg-[#4285F4]/10">
                      <Settings className="mr-2 h-4 w-4 text-primary/70 dark:text-[#4285F4]" />
                      <span className="dark:text-white">Settings</span>
                    </DropdownMenuItem>
                  </Link>
                  <Link href="/billing">
                    <DropdownMenuItem className="cursor-pointer flex items-center hover:bg-accent/80 focus:bg-accent/80 rounded-lg transition duration-200 py-2 dark:hover:bg-[#4285F4]/10 dark:focus:bg-[#4285F4]/10">
                      <CreditCard className="mr-2 h-4 w-4 text-primary/70 dark:text-[#4285F4]" />
                      <span className="dark:text-white">Billing</span>
                    </DropdownMenuItem>
                  </Link>
                  <DropdownMenuSeparator className="dark:border-[#4285F4]/10" />
                  <DropdownMenuItem
                    className="cursor-pointer flex items-center hover:bg-accent/80 focus:bg-accent/80 rounded-lg transition duration-200 py-2 dark:hover:bg-[#4285F4]/10 dark:focus:bg-[#4285F4]/10"
                    onClick={toggleTheme}
                  >
                    {theme === 'dark' ? (
                      <>
                        <Sun className="mr-2 h-4 w-4 text-primary/70 dark:text-[#F4B400]" />
                        <span className="dark:text-white">Disable Dark Mode</span>
                      </>
                    ) : (
                      <>
                        <Moon className="mr-2 h-4 w-4 text-primary/70" />
                        <span>Enable Dark Mode</span>
                      </>
                    )}
                  </DropdownMenuItem>
                  <DropdownMenuSeparator className="dark:border-[#4285F4]/10" />
                  <DropdownMenuItem 
                    className="cursor-pointer flex items-center text-destructive hover:bg-destructive/10 hover:text-destructive focus:bg-destructive/10 focus:text-destructive rounded-lg transition duration-200 py-2 dark:text-[#DB4437] dark:hover:bg-[#DB4437]/10"
                    onClick={() => {
                      // Navigate to the logout page that handles the logout process
                      router.push('/logout');
                    }}
                  >
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Logout</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <div className="flex items-center gap-4">
                <Link href="/sign-in">
                  <Button variant="outline" className="border-primary/20 hover:border-primary/30 hover:bg-primary/5 text-primary font-medium dark:border-[#4285F4]/30 dark:text-[#4285F4] dark:hover:bg-[#4285F4]/5">
                    Sign In
                  </Button>
                </Link>
                <Link href="/sign-up">
                  <Button className="bg-primary hover:bg-primary/90 text-white font-medium shadow-sm hover:shadow-md transition-all duration-200 dark:bg-[#4285F4] dark:hover:bg-[#4285F4]/90 dark:shadow-[0_2px_5px_rgba(66,133,244,0.2)] dark:hover:shadow-[0_4px_12px_rgba(66,133,244,0.3)]">
                    Join for free
                  </Button>
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Navbar; 