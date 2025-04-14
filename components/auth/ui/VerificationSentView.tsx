"use client";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Info } from "lucide-react";

interface VerificationSentViewProps {
  email: string;
  resendTimer: number;
  onResendVerification: () => Promise<void>;
  onReturn: () => void;
  isSignIn: boolean;
}

export function VerificationSentView({
  email,
  resendTimer,
  onResendVerification,
  onReturn,
  isSignIn
}: VerificationSentViewProps) {
  return (
    <Card className="mx-auto max-w-md shadow-md rounded-sm border border-border bg-white dark:bg-card">
      <CardHeader className="space-y-1 px-6 pt-4 pb-2">
        <CardTitle className="text-2xl font-bold text-center text-neutral-800 dark:text-neutral-200">Verify Your Email</CardTitle>
        <CardDescription className="text-center">
          We've sent a verification email to <span className="font-medium">{email}</span>
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3 px-6 py-2">
        <Alert variant="default" className="bg-neutral-100 text-neutral-800 border-neutral-200 rounded-sm dark:bg-neutral-800/50 dark:text-neutral-200 dark:border-neutral-700">
          <Info className="h-4 w-4" />
          <AlertTitle>Check your inbox</AlertTitle>
          <AlertDescription>
            Please check your email inbox and click the verification link to complete your registration.
          </AlertDescription>
        </Alert>
        
        <div className="text-center space-y-2">
          <p className="text-sm text-muted-foreground">
            Didn't receive the email? Check your spam folder or
          </p>
          <Button
            variant="outline"
            onClick={onResendVerification}
            disabled={resendTimer > 0}
            className="w-full rounded-sm border-neutral-300 hover:border-neutral-400 hover:bg-neutral-100 text-neutral-700 dark:border-neutral-700 dark:hover:border-neutral-600 dark:hover:bg-neutral-800 dark:text-neutral-300 transition-all duration-200"
          >
            {resendTimer > 0 ? `Resend in ${resendTimer}s` : "Resend Verification Email"}
          </Button>
        </div>
      </CardContent>
      <CardFooter className="p-4 pt-2">
        <Button
          variant="ghost"
          onClick={onReturn}
          className="w-full text-neutral-600 hover:text-neutral-800 dark:text-neutral-400 dark:hover:text-neutral-200"
        >
          Return to {isSignIn ? "Sign In" : "Sign Up"}
        </Button>
      </CardFooter>
    </Card>
  );
} 