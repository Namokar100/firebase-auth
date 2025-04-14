"use client";

import { cn } from "@/lib/utils";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useState, useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { SignInFormValues, SignUpFormValues } from "@/lib/validations/auth";
import AuthLoadingPage from "@/components/AuthLoadingPage";
import Link from "next/link";
import { SignInForm } from "./SignInForm";
import { SignUpForm } from "./SignUpForm";
import { GoogleAuthButton } from "../ui/GoogleAuthButton";
import { VerificationSentView } from "../ui/VerificationSentView";
import { useAuthFlow } from "../hooks/useAuthFlow";

interface AuthFormProps extends React.ComponentPropsWithoutRef<"div"> {
  type: "signin" | "signup";
}

export function AuthForm({
  className,
  type = "signin",
  ...props
}: AuthFormProps) {
  const isSignIn = type === "signin";
  const router = useRouter();
  const searchParams = useSearchParams();
  
  // Form submission state
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Ref to track if toast was shown
  const toastShownRef = useRef(false);
  
  // Auth flow hook
  const {
    isGoogleLoading,
    verificationSent,
    verificationEmail,
    resendTimer,
    isAuthenticating,
    handleSignUp,
    handleSignIn,
    handleGoogleSignIn,
    handleResendVerification,
    resetVerificationState,
    clearResendTimer
  } = useAuthFlow();

  // Check for email verification from URL params
  useEffect(() => {
    // Prevent showing toast multiple times in development mode due to StrictMode
    if (toastShownRef.current) return;
    
    // Check if the user has been redirected after email verification
    const verified = searchParams.get('verified');
    if (verified === 'true') {
      // Ensure toast is displayed
      setTimeout(() => {
        toast.success('Email verified successfully. Please login to continue.', {
          id: 'verified-success',
          duration: 5000
        });
        toastShownRef.current = true;
      }, 100);
    }
    
    // Check for any error messages
    const error = searchParams.get('error');
    if (error) {
      // Ensure toast is displayed
      setTimeout(() => {
        switch(error) {
          case 'invalid_token':
            toast.error('Invalid verification link. Please request a new one.', {
              id: 'invalid-token-error',
              duration: 5000
            });
            break;
          case 'expired_token':
            toast.error('Verification link has expired. Please request a new one.', {
              id: 'expired-token-error',
              duration: 5000
            });
            break;
          case 'user_update_failed':
            toast.error('Failed to verify email. Please try again.', {
              id: 'update-failed-error',
              duration: 5000
            });
            break;
          case 'verification_failed':
            toast.error('Email verification failed. Please try again.', {
              id: 'verification-failed-error',
              duration: 5000
            });
            break;
          default:
            toast.error('An error occurred during verification. Please try again.', {
              id: 'general-error',
              duration: 5000
            });
        }
        toastShownRef.current = true;
      }, 100);
    }
    
    // Clean up on unmount
    return () => {
      clearResendTimer();
    };
  }, [searchParams, clearResendTimer]);

  // Handle form submission
  const onSubmit = async (data: SignUpFormValues | SignInFormValues) => {
    try {
      setIsSubmitting(true);
      
      if (isSignIn) {
        // Sign in flow
        await handleSignIn(data as SignInFormValues);
      } else {
        // Sign up flow
        await handleSignUp(data as SignUpFormValues);
      }
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // Handle Google sign in/up
  const onGoogleAuth = async () => {
    await handleGoogleSignIn(type);
  };
  
  // Handle resending verification email
  const onResendVerification = async () => {
    await handleResendVerification();
  };
  
  // Handle returning to the form from verification view
  const onReturnToForm = () => {
    resetVerificationState();
  };
  
  // If authentication is in progress, show the loading page
  if (isAuthenticating) {
    return <AuthLoadingPage type={type} redirectTo={isSignIn ? "/" : "/"} />;
  }
  
  // Show verification sent UI if a verification email has been sent
  if (verificationSent) {
    return (
      <VerificationSentView 
        email={verificationEmail}
        resendTimer={resendTimer}
        onResendVerification={onResendVerification}
        onReturn={onReturnToForm}
        isSignIn={isSignIn}
      />
    );
  }

  return (
    <Card className={cn("mx-auto max-w-md shadow-md rounded-sm border border-border bg-white dark:bg-card", className)} {...props}>
      <CardHeader className="space-y-1 px-6 pt-4 pb-2">
        <CardTitle className="text-2xl font-bold text-center text-primary">
          {isSignIn ? "Welcome Back" : "Create an Account"}
        </CardTitle>
        <CardDescription className="text-center">
          {isSignIn
            ? "Enter your credentials to sign in to your account"
            : "Fill in the information below to create your account"}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-2 px-6 py-2">
        <div className="grid gap-6">
          {isSignIn ? (
            <SignInForm
              verificationEmail={verificationEmail}
              verificationSent={verificationSent}
              resendTimer={resendTimer}
              isSubmitting={isSubmitting}
              onSubmit={onSubmit}
              onResendVerification={onResendVerification}
            />
          ) : (
            <SignUpForm
              isSubmitting={isSubmitting}
              onSubmit={onSubmit}
            />
          )}
          
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-border" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-card px-2 text-muted-foreground">Or continue with</span>
            </div>
          </div>
          
          <GoogleAuthButton
            isLoading={isGoogleLoading}
            onClick={onGoogleAuth}
            disabled={isSubmitting}
          />
        </div>
      </CardContent>
      <CardFooter className="flex flex-col items-center justify-center p-4 pt-2">
        <p className="mt-2 text-sm text-center text-muted-foreground">
          {isSignIn ? "Don't have an account? " : "Already have an account? "}
          <Link 
            href={isSignIn ? "/sign-up" : "/sign-in"}
            className="text-neutral-700 hover:text-neutral-900 font-medium dark:text-neutral-300 dark:hover:text-neutral-100"
          >
            {isSignIn ? "Sign up" : "Sign in"}
          </Link>
        </p>
      </CardFooter>
    </Card>
  );
} 