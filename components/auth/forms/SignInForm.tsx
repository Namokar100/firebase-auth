"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { SignInFormValues, signInSchema } from "@/lib/validations/auth";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AlertCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { PasswordInput } from "../ui/PasswordInput";
import { LoadingButton } from "../ui/LoadingButton";
import { VerificationAlert } from "../ui/VerificationAlert";
import { Button } from "@/components/ui/button";

interface SignInFormProps {
  verificationEmail: string;
  verificationSent: boolean;
  resendTimer: number;
  isSubmitting: boolean;
  onSubmit: (data: SignInFormValues) => Promise<void>;
  onResendVerification: () => Promise<void>;
}

export function SignInForm({
  verificationEmail,
  verificationSent,
  resendTimer,
  isSubmitting,
  onSubmit,
  onResendVerification
}: SignInFormProps) {
  const router = useRouter();
  
  // Form validation with Zod
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<SignInFormValues>({
    resolver: zodResolver(signInSchema),
    defaultValues: {
      email: "",
      password: "",
    }
  });

  return (
    <div className="grid gap-4">
      {verificationEmail && (
        <VerificationAlert
          verificationEmail={verificationEmail}
          verificationSent={verificationSent}
          resendTimer={resendTimer}
          onResendVerification={onResendVerification}
        />
      )}
      
      <div className="space-y-2">
        <Label htmlFor="email" className="text-neutral-700 font-medium dark:text-neutral-300">Email</Label>
        <div className="relative">
          <Input
            id="email"
            placeholder="m@example.com"
            {...register("email")}
            className={`h-11 rounded-sm pl-3 focus-visible:ring-neutral-400 focus-visible:border-neutral-500 ${
              errors.email ? "border-destructive focus-visible:ring-destructive/30" : ""
            }`}
            disabled={isSubmitting}
            autoComplete="email"
          />
          {errors.email && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2 text-destructive">
              <AlertCircle className="h-4 w-4" />
            </div>
          )}
        </div>
        {errors.email && (
          <p className="text-sm font-medium text-destructive mt-1">{errors.email.message}</p>
        )}
      </div>
      
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label htmlFor="password" className="text-neutral-700 font-medium dark:text-neutral-300">Password</Label>
          <Button
            variant="link"
            className="px-0 font-normal text-xs text-neutral-700 hover:text-neutral-900 focus:text-neutral-900 dark:text-neutral-400 dark:hover:text-neutral-200 cursor-pointer"
            onClick={() => router.push('/forgot-password')}
            type="button"
          >
            Forgot password?
          </Button>
        </div>
        <PasswordInput
          id="password"
          {...register("password")}
          error={!!errors.password}
          disabled={isSubmitting}
          isSignIn={true}
        />
        {errors.password && (
          <p className="text-sm font-medium text-destructive mt-1">{errors.password.message}</p>
        )}
      </div>
      
      <LoadingButton
        type="submit"
        isLoading={isSubmitting}
        loadingText="Signing in..."
        buttonText="Sign In"
        onClick={handleSubmit(onSubmit)}
      />
    </div>
  );
} 