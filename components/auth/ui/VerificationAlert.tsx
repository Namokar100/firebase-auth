"use client";

import { AlertCircle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";

interface VerificationAlertProps {
  verificationEmail: string;
  verificationSent: boolean;
  resendTimer: number;
  onResendVerification: () => Promise<void>;
}

export function VerificationAlert({
  verificationEmail,
  verificationSent,
  resendTimer,
  onResendVerification
}: VerificationAlertProps) {
  if (!verificationEmail) return null;
  
  return (
    <Alert 
      variant={verificationSent ? "default" : "destructive"} 
      className={verificationSent 
        ? "mb-4 bg-neutral-100 text-neutral-800 border-neutral-200 dark:bg-neutral-800/50 dark:text-neutral-200 dark:border-neutral-700" 
        : "mb-4"
      }
    >
      <AlertCircle className="h-4 w-4" />
      <AlertTitle>
        {verificationSent 
          ? "Verification email sent!" 
          : "Email verification required"}
      </AlertTitle>
      <AlertDescription className="mt-2">
        {verificationSent 
          ? `We've sent a verification link to ${verificationEmail}. Please check your inbox and spam folder.` 
          : `Your email (${verificationEmail}) needs to be verified before you can sign in.`}
        
        <div className="flex space-x-2 mt-2">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={onResendVerification}
            disabled={resendTimer > 0}
            className="border-neutral-300 hover:border-neutral-400 hover:bg-neutral-100 text-neutral-700 dark:border-neutral-700 dark:hover:border-neutral-600 dark:hover:bg-neutral-800 dark:text-neutral-300"
          >
            {resendTimer > 0 
              ? `Resend in ${resendTimer}s` 
              : verificationSent 
                ? "Resend verification email" 
                : "Send verification email"}
          </Button>
        </div>
      </AlertDescription>
    </Alert>
  );
} 