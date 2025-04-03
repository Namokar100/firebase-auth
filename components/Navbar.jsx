import React from 'react'
import Link from 'next/link'
import { Button } from "@/components/ui/button"
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
  navigationMenuTriggerStyle
} from "@/components/ui/navigation-menu"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { LogOut, User, Settings } from "lucide-react"

const Navbar = () => {
  // Mock user state - replace this with actual auth logic
  const isLoggedIn = false;
  
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
            {isLoggedIn ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Avatar className="h-8 w-8 cursor-pointer">
                    <AvatarImage src="https://github.com/shadcn.png" alt="@shadcn" />
                    <AvatarFallback>SC</AvatarFallback>
                  </Avatar>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
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
                  <DropdownMenuSeparator />
                  <DropdownMenuItem>
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
  )
}

export default Navbar