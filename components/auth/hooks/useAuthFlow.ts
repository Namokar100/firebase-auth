"use client";

import { useState, useRef } from "react";
import { auth } from "@/firebase/client";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  GoogleAuthProvider,
  signInWithPopup,
  signOut
} from "firebase/auth";
import { signIn, signUp, sendVerificationEmail } from "@/lib/actions/auth.action";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { SignInFormValues, SignUpFormValues } from "@/lib/validations/auth";

export function useAuthFlow() {
  const router = useRouter();
  
  // States
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [verificationSent, setVerificationSent] = useState(false);
  const [verificationEmail, setVerificationEmail] = useState("");
  const [resendTimer, setResendTimer] = useState(0);
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  
  // Create a timer interval ref
  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Function to start the resend timer
  const startResendTimer = () => {
    // Clear any existing timers
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
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
    
    timerIntervalRef.current = timerInterval;
  };

  // Clean up the timer on unmount
  const clearResendTimer = () => {
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
    }
  };

  // Handle email/password sign up
  const handleSignUp = async (data: SignUpFormValues) => {
    try {
      // Show authentication loading page
      setIsAuthenticating(true);
      
      // Create user with Firebase
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        data.email,
        data.password
      );
      
      // Sign out immediately so user can't appear as logged in before verification
      await signOut(auth);
      
      // Call backend API to create user in database and send verification email
      const result = await signUp({
        uid: userCredential.user.uid,
        name: data.name,
        email: data.email,
        password: data.password,
        emailVerified: false,
      });

      // Hide loading page regardless of result
      setIsAuthenticating(false);

      if (!result || !result.success) {
        const errorMessage = result?.message || "Sign up failed. Please try again.";
        toast.error(errorMessage);
        return false;
      }

      // Start the resend timer
      startResendTimer();

      // Show success message and verification info
      toast.success("Account created successfully. Please verify your email before signing in.");
      setVerificationEmail(data.email);
      setVerificationSent(true);
      return true;
    } catch (error: any) {
      // Hide loading page on error
      setIsAuthenticating(false);
      
      // Make sure user is signed out if there was an error
      try {
        await signOut(auth);
      } catch (signOutError) {
        console.error("Error signing out after error:", signOutError);
      }
      
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
      return false;
    }
  };

  // Handle email/password sign in
  const handleSignIn = async (data: SignInFormValues) => {
    try {
      // Show authentication loading page
      setIsAuthenticating(true);
      
      try {
        // Sign in with Firebase
        const userCredential = await signInWithEmailAndPassword(
          auth,
          data.email,
          data.password
        );

        // Check if email is verified - sign out immediately if not
        if (!userCredential.user.emailVerified) {
          // Sign out the user since they shouldn't be logged in without verification
          await signOut(auth);
          
          // Hide loading page
          setIsAuthenticating(false);
          
          toast.error("Please verify your email before signing in.");
          setVerificationEmail(data.email);
          setVerificationSent(false);
          return false;
        }

        // If email is verified, continue with the sign-in process
        // Get ID token for backend authentication
        const idToken = await userCredential.user.getIdToken();
        if (!idToken) {
          toast.error("Sign in Failed. Please try again.");
          await signOut(auth); // Sign out in case of error
          return false;
        }

        // Call backend API to sign in
        const result = await signIn({
          email: data.email,
          idToken,
        });

        if (!result.success) {
          // Check if verification is needed
          if (result.needsVerification) {
            // Sign out the user since they shouldn't be logged in
            await signOut(auth);
            
            toast.error(result.message);
            setVerificationEmail(result.email);
            setVerificationSent(false);
            return false;
          }
          
          toast.error(result.message);
          await signOut(auth); // Sign out in case of error
          return false;
        }

        toast.success("Signed in successfully.");
        router.push("/");
        return true;
      } catch (error: any) {
        // Hide loading page on error
        setIsAuthenticating(false);
        
        // Make sure user is signed out if there was an error
        try {
          await signOut(auth);
        } catch (signOutError) {
          console.error("Error signing out after failed login:", signOutError);
        }
        
        // Special handling for unverified users
        if (error.code === 'auth/invalid-login-credentials') {
          // Check if user exists but email not verified
          try {
            const emailToCheck = data.email;
            const result = await sendVerificationEmail(emailToCheck);
            
            if (result.success) {
              toast.error("Please verify your email before signing in.");
              setVerificationEmail(emailToCheck);
              setVerificationSent(true);
              
              // Start the resend timer
              startResendTimer();
              
              return false;
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
        return false;
      }
    } catch (error) {
      setIsAuthenticating(false);
      toast.error("An unexpected error occurred. Please try again.");
      return false;
    }
  };

  // Handle Google sign in
  const handleGoogleSignIn = async (type: "signin" | "signup") => {
    // Show authentication loading page
    setIsAuthenticating(true);
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
            const signInResult = await signIn({
              email,
              idToken,
            });
            
            if (signInResult.success) {
              toast.success("Signed in with Google successfully.");
              router.push("/home");
              return true;
            } else {
              // Sign out if there's an error
              await signOut(auth);
              setIsAuthenticating(false);
              setIsGoogleLoading(false);
              toast.error(signInResult.message || "Google sign in failed. Please try again.");
              return false;
            }
          }
          
          // Sign out if there's an error
          await signOut(auth);
          setIsAuthenticating(false);
          setIsGoogleLoading(false);
          toast.error(errorMessage);
          return false;
        }
        
        toast.success("Account created with Google successfully.");
      }
      
      // Sign in the user (for both sign-up and sign-in flows)
      const signInResult = await signIn({
        email,
        idToken,
      });
      
      if (!signInResult.success) {
        // Sign out if there's an error
        await signOut(auth);
        setIsAuthenticating(false);
        setIsGoogleLoading(false);
        toast.error(signInResult.message || "Google sign in failed. Please try again.");
        return false;
      }
      
      toast.success("Signed in with Google successfully.");
      router.push("/");
      return true;
    } catch (error: any) {
      // Hide loading page
      setIsAuthenticating(false);
      setIsGoogleLoading(false);
      
      // Make sure to sign out if there was an error with Google sign-in
      try {
        await signOut(auth);
      } catch (signOutError) {
        console.error("Error signing out after Google sign-in error:", signOutError);
      }
      
      if (error.code === 'auth/popup-closed-by-user') {
        toast.error('Google sign in was cancelled');
      } else if (error.code === 'auth/account-exists-with-different-credential') {
        toast.error('An account already exists with the same email address but different sign-in credentials. Try signing in using the method you used previously.');
      } else {
        console.error("Google sign in error:", error);
        toast.error("Failed to sign in with Google. Please try again.");
      }
      return false;
    } finally {
      setIsGoogleLoading(false);
    }
  };

  // Handle sending verification email
  const handleResendVerification = async (email?: string) => {
    const emailToUse = email || verificationEmail;
    
    if (!emailToUse) {
      toast.error("Email address is required");
      return false;
    }
    
    try {
      const result = await sendVerificationEmail(emailToUse);
      
      if (result.success) {
        toast.success(result.message);
        setVerificationSent(true);
        
        // Start the resend timer
        startResendTimer();
        
        // Update email state if not already set
        if (!verificationEmail) {
          setVerificationEmail(emailToUse);
        }
        
        return true;
      } else {
        // Check for too many attempts error
        if (result.message?.includes('TOO_MANY_ATTEMPTS_TRY_LATER')) {
          toast.error("Too many verification attempts. Please try again later.");
        } else {
          toast.error(result.message);
        }
        return false;
      }
    } catch (error: any) {
      console.error("Error sending verification email:", error);
      if (error.message?.includes('TOO_MANY_ATTEMPTS_TRY_LATER')) {
        toast.error("Too many verification attempts. Please try again later.");
      } else {
        toast.error("Failed to send verification email. Please try again.");
      }
      return false;
    }
  };

  // Reset verification state
  const resetVerificationState = () => {
    setVerificationSent(false);
    setVerificationEmail("");
    clearResendTimer();
    setResendTimer(0);
  };

  return {
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
    setIsAuthenticating,
    clearResendTimer
  };
} 