"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Eye, EyeOff } from "lucide-react";
import { cn } from "@/lib/utils";

interface PasswordInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: boolean;
  isSignIn?: boolean;
}

export function PasswordInput({
  className,
  error,
  isSignIn = true,
  ...props
}: PasswordInputProps) {
  const [showPassword, setShowPassword] = useState(false);

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  return (
    <div className="relative">
      <Input
        type={showPassword ? "text" : "password"}
        placeholder={isSignIn ? "••••••••" : "Create a strong password"}
        className={cn(
          "h-11 rounded-sm pl-3 pr-10 focus-visible:ring-neutral-400 focus-visible:border-neutral-500",
          error && "border-destructive focus-visible:ring-destructive/30",
          className
        )}
        autoComplete={isSignIn ? "current-password" : "new-password"}
        {...props}
      />
      <button
        type="button"
        onClick={togglePasswordVisibility}
        className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-500 hover:text-neutral-700 focus:text-neutral-700 transition-colors dark:text-neutral-400 dark:hover:text-neutral-200"
      >
        {showPassword ? (
          <EyeOff className="h-4 w-4" />
        ) : (
          <Eye className="h-4 w-4" />
        )}
      </button>
    </div>
  );
} 