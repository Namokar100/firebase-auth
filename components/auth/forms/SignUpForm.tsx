"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { SignUpFormValues, signUpSchema } from "@/lib/validations/auth";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AlertCircle } from "lucide-react";
import { PasswordInput } from "../ui/PasswordInput";
import { LoadingButton } from "../ui/LoadingButton";

interface SignUpFormProps {
  isSubmitting: boolean;
  onSubmit: (data: SignUpFormValues) => Promise<void>;
}

export function SignUpForm({
  isSubmitting,
  onSubmit
}: SignUpFormProps) {
  // Form validation with Zod
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<SignUpFormValues>({
    resolver: zodResolver(signUpSchema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
    }
  });

  return (
    <div className="grid gap-4">
      <div className="space-y-2">
        <Label htmlFor="name" className="text-neutral-700 font-medium dark:text-neutral-300">Full Name</Label>
        <div className="relative">
          <Input
            id="name"
            placeholder="John Doe"
            {...register("name")}
            className={`h-11 rounded-sm pl-3 focus-visible:ring-neutral-400 focus-visible:border-neutral-500 ${
              errors.name ? "border-destructive focus-visible:ring-destructive/30" : ""
            }`}
            disabled={isSubmitting}
            autoComplete="name"
          />
          {errors.name && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2 text-destructive">
              <AlertCircle className="h-4 w-4" />
            </div>
          )}
        </div>
        {errors.name && (
          <p className="text-sm font-medium text-destructive mt-1">{errors.name.message}</p>
        )}
      </div>
      
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
        <Label htmlFor="password" className="text-neutral-700 font-medium dark:text-neutral-300">Password</Label>
        <PasswordInput
          id="password"
          {...register("password")}
          error={!!errors.password}
          disabled={isSubmitting}
          isSignIn={false}
        />
        {errors.password && (
          <p className="text-sm font-medium text-destructive mt-1">{errors.password.message}</p>
        )}
      </div>
      
      <LoadingButton
        type="submit"
        isLoading={isSubmitting}
        loadingText="Creating account..."
        buttonText="Create Account"
        onClick={handleSubmit(onSubmit)}
      />
    </div>
  );
} 