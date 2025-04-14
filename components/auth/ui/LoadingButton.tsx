"use client";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface LoadingButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  isLoading: boolean;
  loadingText: string;
  buttonText: string;
}

export function LoadingButton({
  className,
  isLoading,
  loadingText,
  buttonText,
  ...props
}: LoadingButtonProps) {
  return (
    <Button 
      type="submit"
      className={cn("w-full bg-neutral-800 hover:bg-neutral-700 text-white rounded-sm h-11 shadow-sm hover:shadow-md transition-all duration-200 dark:bg-neutral-700 dark:hover:bg-neutral-600", className)}
      disabled={isLoading}
      {...props}
    >
      {isLoading ? (
        <div className="flex items-center justify-center gap-2">
          <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <span>{loadingText}</span>
        </div>
      ) : (
        <span>{buttonText}</span>
      )}
    </Button>
  );
} 