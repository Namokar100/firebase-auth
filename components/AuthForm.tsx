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
import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { auth } from "@/firebase/client";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  GoogleAuthProvider,
  signInWithPopup,
} from "firebase/auth";
import { signIn, signUp } from "@/lib/actions/auth.action";

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
  
  // Form state
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      if (type === "signup") {
        // Create user with Firebase
        const userCredential = await createUserWithEmailAndPassword(
          auth,
          email,
          password
        );

        // Call backend API to create user in database
        const result = await signUp({
          uid: userCredential.user.uid,
          name: name!,
          email,
          password,
        });

        if (!result?.success) {
          toast.error(result?.message);
          // setError(result.message);
          return;
        }

        toast.success("Account created successfully. Please sign in.");
        router.push("/sign-in");
      } else {
        // Sign in with Firebase
        const userCredential = await signInWithEmailAndPassword(
          auth,
          email,
          password
        );

        // Get ID token for backend authentication
        const idToken = await userCredential.user.getIdToken();
        if (!idToken) {
          toast.error("Sign in Failed. Please try again.");
          return;
        }

        // Call backend API to sign in
        await signIn({
          email,
          idToken,
        });

        toast.success("Signed in successfully.");
        router.push("/");
      }
    } catch (error: any) {
      console.error(error);
      
      // Handle Firebase auth errors
      if (error.code) {
        switch (error.code) {
          case 'auth/email-already-in-use':
            setError('This email is already registered.');
            break;
          case 'auth/invalid-email':
            setError('Invalid email address.');
            break;
          case 'auth/user-not-found':
          case 'auth/wrong-password':
            setError('Invalid email or password.');
            break;
          case 'auth/weak-password':
            setError('Password is too weak.');
            break;
          default:
            setError(`Authentication failed: ${error.message}`);
        }
      } else {
        setError("Authentication failed. Please check your credentials.");
      }
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    try {
      const provider = new GoogleAuthProvider();
      const userCredential = await signInWithPopup(auth, provider);
      
      // Get ID token for backend authentication
      const idToken = await userCredential.user.getIdToken();
      
      if (type === "signup") {
        // Register the Google user in your backend
        const result = await signUp({
          uid: userCredential.user.uid,
          name: userCredential.user.displayName || "Google User",
          email: userCredential.user.email!,
          password: "",  // No password for Google auth
        });

        if (!result?.success) {
          toast.error(result?.message);
          return;
        }
      }
      
      // Sign in the user
      await signIn({
        email: userCredential.user.email!,
        idToken,
      });
      
      toast.success("Signed in successfully with Google.");
      router.push("/");
    } catch (error: any) {
      console.error(error);
      setError(`Google sign in failed: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
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
          <form onSubmit={onSubmit}>
            <div className="flex flex-col gap-4">
              {!isSignIn && (
                <div className="grid gap-2">
                  <Label htmlFor="name">Name</Label>
                  <Input
                    id="name"
                    type="text"
                    placeholder="John Doe"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                  />
                </div>
              )}
              
              <div className="grid gap-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="m@example.com"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
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
                  required 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
              
              {error && (
                <div className="text-sm text-red-500 mt-1">{error}</div>
              )}
              
              <Button 
                type="submit" 
                className="w-full mt-2" 
                disabled={isLoading}
              >
                {isLoading 
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
                disabled={isLoading}
              >
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
