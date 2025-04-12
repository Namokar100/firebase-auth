"use client";

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useState, useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { auth } from "@/firebase/client";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  GoogleAuthProvider,
  signInWithPopup,
} from "firebase/auth";
import { signIn, signUp, sendVerificationEmail } from "@/lib/actions/auth.action";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { SignInFormValues, SignUpFormValues, signInSchema, signUpSchema } from "@/lib/validations/auth";
import { AlertCircle, Check, Info } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { FieldErrors } from "react-hook-form";

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
  
  // States
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [verificationSent, setVerificationSent] = useState(false);
  const [verificationEmail, setVerificationEmail] = useState("");
  const [resendTimer, setResendTimer] = useState(0);
  
  // Ref to track if toast was shown
  const toastShownRef = useRef(false);

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
  }, [searchParams]);

  // Form validation with Zod
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    getValues,
    reset,
  } = useForm<SignUpFormValues | SignInFormValues>({
    resolver: zodResolver(isSignIn ? signInSchema : signUpSchema),
    defaultValues: isSignIn 
      ? {
          email: "",
          password: "",
        }
      : {
          name: "",
          email: "",
          password: "",
        }
  });
  
  // Handle resending verification email
  const handleResendVerification = async () => {
    const email = verificationEmail || getValues("email") as string;
    
    if (!email) {
      toast.error("Email address is required");
      return;
    }
    
    try {
      const result = await sendVerificationEmail(email);
      
      if (result.success) {
        toast.success(result.message);
        setVerificationSent(true);
        
        // Start resend timer (60 seconds)
        setResendTimer(60);
        const timerInterval = setInterval(() => {
          setResendTimer((prevTimer) => {
            if (prevTimer <= 1) {
              clearInterval(timerInterval);
              return 0;
            }
            return prevTimer - 1;
          });
        }, 1000);
      } else {
        // Check for too many attempts error
        if (result.message?.includes('TOO_MANY_ATTEMPTS_TRY_LATER')) {
          toast.error("Too many verification attempts. Please try again later.");
        } else {
          toast.error(result.message);
        }
      }
    } catch (error: any) {
      console.error("Error sending verification email:", error);
      if (error.message?.includes('TOO_MANY_ATTEMPTS_TRY_LATER')) {
        toast.error("Too many verification attempts. Please try again later.");
      } else {
        toast.error("Failed to send verification email. Please try again.");
      }
    }
  };

  const onSubmit = async (data: SignUpFormValues | SignInFormValues) => {
    try {
      if (type === "signup") {
        const signUpData = data as SignUpFormValues;
        
        // Create user with Firebase
        const userCredential = await createUserWithEmailAndPassword(
          auth,
          signUpData.email,
          signUpData.password
        );
        
        // Call backend API to create user in database and send verification email
        const result = await signUp({
          uid: userCredential.user.uid,
          name: signUpData.name,
          email: signUpData.email,
          password: signUpData.password,
          emailVerified: false,
        });

        if (!result || !result.success) {
          const errorMessage = result?.message || "Sign up failed. Please try again.";
          toast.error(errorMessage);
          return;
        }

        // Start resend timer (60 seconds)
        setResendTimer(60);
        const timerInterval = setInterval(() => {
          setResendTimer((prevTimer) => {
            if (prevTimer <= 1) {
              clearInterval(timerInterval);
              return 0;
            }
            return prevTimer - 1;
          });
        }, 1000);

        // Show success message and verification info
        toast.success("Account created successfully. Please verify your email before signing in.");
        setVerificationEmail(signUpData.email);
        setVerificationSent(true);
        reset();
      } else {
        // Sign in process
        const signInData = data as SignInFormValues;
        
        try {
          // Sign in with Firebase
          const userCredential = await signInWithEmailAndPassword(
            auth,
            signInData.email,
            signInData.password
          );

          // Get ID token for backend authentication
          const idToken = await userCredential.user.getIdToken();
          if (!idToken) {
            toast.error("Sign in Failed. Please try again.");
            return;
          }

          // Check if email is verified
          if (!userCredential.user.emailVerified) {
            toast.error("Please verify your email before signing in.");
            setVerificationEmail(signInData.email);
            setVerificationSent(false);
            return;
          }

          // Call backend API to sign in
          const result = await signIn({
            email: signInData.email,
            idToken,
          });

          if (!result.success) {
            // Check if verification is needed
            if (result.needsVerification) {
              toast.error(result.message);
              setVerificationEmail(result.email);
              setVerificationSent(false);
              return;
            }
            
            toast.error(result.message);
            return;
          }

          toast.success("Signed in successfully.");
          router.push("/home");
        } catch (error: any) {
          // Special handling for unverified users
          if (error.code === 'auth/invalid-login-credentials') {
            // Check if user exists but email not verified
            try {
              const emailToCheck = signInData.email;
              const result = await sendVerificationEmail(emailToCheck);
              
              if (result.success) {
                toast.error("Please verify your email before signing in.");
                setVerificationEmail(emailToCheck);
                setVerificationSent(true);
                
                return;
              }
            } catch (verifyError) {
              // Continue with normal error handling
            }
          }
          
          // Handle other Firebase auth errors
          if (error.code) {
            switch (error.code) {
              case 'auth/user-not-found':
              case 'auth/wrong-password':
              case 'auth/invalid-credential':
              case 'auth/invalid-login-credentials':
                toast.error('Invalid credentials. Please enter valid email and password.', {
                  id: 'auth-invalid-credentials',
                  duration: 5000
                });
                break;
              case 'auth/too-many-requests':
                toast.error('For security reasons, access has been temporarily disabled. Please try again later or reset your password.', {
                  id: 'auth-too-many-attempts',
                  duration: 5000
                });
                break;
              case 'auth/user-disabled':
                toast.error('This account has been disabled. Please contact support for assistance.', {
                  id: 'auth-user-disabled',
                  duration: 5000
                });
                break;
              case 'auth/network-request-failed':
                toast.error('Network connection issue. Please check your internet connection and try again.', {
                  id: 'auth-network-error',
                  duration: 5000
                });
                break;
              default:
                toast.error('Authentication failed. Please try again or contact support if the issue persists.', {
                  id: 'auth-general-error',
                  duration: 5000
                });
            }
          } else {
            toast.error("Authentication failed. Please check your email and password and try again.", {
              id: 'auth-unknown-error',
              duration: 5000
            });
          }
        }
      }
    } catch (error: any) {
      console.error(error);
      
      // Handle Firebase auth errors
      if (error.code) {
        switch (error.code) {
          case 'auth/email-already-in-use':
            toast.error('This email address is already registered. Please sign in instead.', {
              id: 'signup-email-in-use',
              duration: 5000
            });
            break;
          case 'auth/invalid-email':
            toast.error('Please enter a valid email address.', {
              id: 'signup-invalid-email',
              duration: 5000
            });
            break;
          case 'auth/weak-password':
            toast.error('Your password is too weak. Please use a stronger password with at least 6 characters.', {
              id: 'signup-weak-password',
              duration: 5000
            });
            break;
          case 'auth/too-many-requests':
            toast.error('For security reasons, new accounts creation is temporarily limited. Please try again later.', {
              id: 'signup-too-many-requests',
              duration: 5000
            });
            break;
          default:
            if (error.message?.includes('TOO_MANY_ATTEMPTS_TRY_LATER')) {
              toast.error('Too many attempts. Please wait a few minutes before trying again.', {
                id: 'signup-rate-limited',
                duration: 5000
              });
            } else {
              toast.error('Account creation failed. Please try again or contact support if the issue persists.', {
                id: 'signup-general-error',
                duration: 5000
              });
            }
        }
      } else {
        toast.error("Account creation failed. Please check your information and try again.", {
          id: 'signup-unknown-error',
          duration: 5000
        });
      }
    }
  };
  
  const handleGoogleSignIn = async () => {
    setIsGoogleLoading(true);
    
    try {
      // Create Google Auth Provider
      const provider = new GoogleAuthProvider();
      // Add scopes if needed
      provider.addScope('profile');
      provider.addScope('email');
      
      // Sign in with popup
      const userCredential = await signInWithPopup(auth, provider);
      
      // Extract info from the user credential
      const { displayName, email, uid } = userCredential.user;
      
      // Get ID token for backend authentication
      const idToken = await userCredential.user.getIdToken();
      
      if (!email) {
        throw new Error("Email is required from Google authentication");
      }
      
      if (type === "signup") {
        // Register the Google user in your backend
        const result = await signUp({
          uid: uid,
          name: displayName || "Google User",
          email: email,
          emailVerified: true, // Google accounts are considered verified
        });

        if (!result || !result.success) {
          const errorMessage = result?.message || "Google sign up failed. Please try again.";
          
          // If user already exists, try to sign them in directly
          if (errorMessage.includes("already exists")) {
            await signIn({
              email,
              idToken,
            });
            
            toast.success("Signed in with Google successfully.");
            router.push("/home");
            return;
          }
          
          toast.error(errorMessage);
          return;
        }
        
        toast.success("Account created with Google successfully.");
      }
      
      // Sign in the user (for both sign-up and sign-in flows)
      await signIn({
        email,
        idToken,
      });
      
      toast.success("Signed in with Google successfully.");
      router.push("/home");
    } catch (error: any) {
      console.error("Google sign in error:", error);
      
      if (error.code === 'auth/popup-closed-by-user') {
        toast.error("Google sign-in was cancelled. Please try again when you're ready.", {
          id: 'google-signin-cancelled',
          duration: 5000
        });
      } else if (error.code === 'auth/account-exists-with-different-credential') {
        toast.error("An account already exists with this email address but using a different sign-in method. Please use the method you originally used to create the account.", {
          id: 'google-signin-credential-conflict',
          duration: 5000
        });
      } else if (error.code === 'auth/cancelled-popup-request') {
        // No need to show error for cancelled popups
        return;
      } else if (error.code === 'auth/network-request-failed') {
        toast.error("Network connection issue. Please check your internet connection and try again.", {
          id: 'google-signin-network-error',
          duration: 5000
        });
      } else {
        toast.error("Google sign-in failed. Please try again or use email/password sign-in instead.", {
          id: 'google-signin-general-error',
          duration: 5000
        });
      }
    } finally {
      setIsGoogleLoading(false);
    }
  };
  
  // Render verification alert if verification process is in progress
  const renderVerificationAlert = () => {
    if (!verificationEmail) return null;
    
    return (
      <Alert variant={verificationSent ? "default" : "destructive"} className="mb-4">
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
              onClick={handleResendVerification}
              disabled={resendTimer > 0}
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
  };
  
  return (
    <div className={cn("flex justify-center items-center w-full", className)} {...props}>
      <Card className="w-full max-w-md mx-auto">
        <CardHeader>
          <CardTitle className="text-2xl">
            {isSignIn ? "Login" : "Sign Up"}
          </CardTitle>
          <CardDescription>
            {isSignIn 
              ? "Enter your email below to login to your account" 
              : "Create an account to get started"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Verification Alert */}
          {renderVerificationAlert()}
          
          <form onSubmit={handleSubmit(onSubmit)}>
            <div className="flex flex-col gap-4">
              {!isSignIn && (
                <div className="grid gap-2">
                  <Label htmlFor="name">Name</Label>
                  <Input
                    id="name"
                    type="text"
                    placeholder="John Doe"
                    {...register("name")}
                    aria-invalid={!isSignIn && 'name' in errors ? "true" : "false"}
                  />
                  {!isSignIn && 'name' in errors && (
                    <p className="text-sm text-red-500">
                      {(errors as any).name?.message}
                    </p>
                  )}
                </div>
              )}
              
              <div className="grid gap-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="m@example.com"
                  {...register("email")}
                  aria-invalid={errors.email ? "true" : "false"}
                />
                {errors.email && (
                  <p className="text-sm text-red-500">{errors.email.message}</p>
                )}
              </div>
              
              <div className="grid gap-2">
                <div className="flex items-center">
                  <Label htmlFor="password">Password</Label>
                  {isSignIn && (
                    <a
                      href="#"
                      className="ml-auto inline-block text-sm underline-offset-4 hover:underline"
                    >
                      Forgot your password?
                    </a>
                  )}
                </div>
                <Input 
                  id="password" 
                  type="password"
                  {...register("password")}
                  aria-invalid={errors.password ? "true" : "false"}
                />
                {errors.password && (
                  <p className="text-sm text-red-500">{errors.password.message}</p>
                )}
              </div>
              
              <Button 
                type="submit" 
                className="w-full mt-2" 
                disabled={isSubmitting || isGoogleLoading}
              >
                {isSubmitting 
                  ? "Processing..." 
                  : isSignIn ? "Login" : "Sign Up"
                }
              </Button>
              
              <div className="relative my-2">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-background px-2 text-muted-foreground">
                    Or continue with
                  </span>
                </div>
              </div>
              
              <Button 
                variant="outline" 
                className="w-full" 
                type="button"
                onClick={handleGoogleSignIn}
                disabled={isSubmitting || isGoogleLoading}
              >
                {isGoogleLoading ? (
                  "Connecting to Google..."
                ) : (
                  <>
                    <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
                      <path
                        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                        fill="#4285F4"
                      />
                      <path
                        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                        fill="#34A853"
                      />
                      <path
                        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                        fill="#FBBC05"
                      />
                      <path
                        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                        fill="#EA4335"
                      />
                      <path d="M1 1h22v22H1z" fill="none" />
                    </svg>
                    {isSignIn ? "Login with Google" : "Sign up with Google"}
                  </>
                )}
              </Button>
            </div>
            
            <div className="mt-6 text-center text-sm">
              {isSignIn ? (
                <>
                  Don&apos;t have an account?{" "}
                  <a href="/sign-up" className="font-medium text-primary hover:underline">
                    Sign up
                  </a>
                </>
              ) : (
                <>
                  Already have an account?{" "}
                  <a href="/sign-in" className="font-medium text-primary hover:underline">
                    Sign in
                  </a>
                </>
              )}
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
