'use client'

import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'

import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { resetPassword } from '@/lib/actions/auth.action'
import Link from 'next/link'

// Schema for password validation
const formSchema = z.object({
  password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number'),
  confirmPassword: z.string(),
}).refine(data => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword'],
})

export default function ResetPasswordForm() {
  const [isLoading, setIsLoading] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  const [token, setToken] = useState<string | null>(null)
  const [isInvalidToken, setIsInvalidToken] = useState(false)
  const router = useRouter()
  const searchParams = useSearchParams()

  useEffect(() => {
    // Get token from URL
    const urlToken = searchParams.get('token')
    
    if (!urlToken) {
      setIsInvalidToken(true)
      toast.error('Invalid or missing reset token')
      return
    }
    
    setToken(urlToken)
  }, [searchParams])

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      password: '',
      confirmPassword: '',
    },
  })

  async function onSubmit(values: z.infer<typeof formSchema>) {
    if (!token) {
      toast.error('Invalid reset token')
      return
    }
    
    try {
      setIsLoading(true)
      
      // Call the server action to reset password
      const result = await resetPassword(token, values.password)
      
      setIsLoading(false)
      
      if (result.success) {
        setIsSuccess(true)
        toast.success(result.message)
        // Redirect to login after 3 seconds
        setTimeout(() => {
          router.push('/sign-in')
        }, 3000)
      } else {
        toast.error(result.message)
        if (result.message.includes('Invalid or expired token')) {
          setIsInvalidToken(true)
        }
      }
    } catch (error) {
      setIsLoading(false)
      console.error('Error resetting password', error)
      toast.error('Failed to reset password. Please try again.')
    }
  }

  if (isInvalidToken) {
    return (
      <div className="flex justify-center items-center w-full">
        <Card className="w-full max-w-md mx-auto">
          <CardHeader>
            <CardTitle className="text-2xl">Invalid Token</CardTitle>
            <CardDescription>
              The password reset link is invalid or has expired.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Please request a new password reset link.
            </p>
            <Link href="/forgot-password">
              <Button className="w-full rounded-sm">Request New Link</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (isSuccess) {
    return (
      <div className="flex justify-center items-center w-full">
        <Card className="w-full max-w-md mx-auto">
          <CardHeader>
            <CardTitle className="text-2xl">Password Reset Successful</CardTitle>
            <CardDescription>
              Your password has been successfully reset.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              You will be redirected to the login page in a moment, or you can click the button below.
            </p>
            <Link href="/sign-in">
              <Button className="w-full rounded-sm">Go to Login</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="flex justify-center items-center w-full">
      <Card className="w-full max-w-md mx-auto">
        <CardHeader>
          <CardTitle className="text-2xl">Reset Your Password</CardTitle>
          <CardDescription>
            Please enter a new password for your account.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>New Password</FormLabel>
                    <FormControl>
                      <Input
                        type="password"
                        placeholder="Enter your new password"
                        className="rounded-sm"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="confirmPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Confirm Password</FormLabel>
                    <FormControl>
                      <Input
                        type="password"
                        placeholder="Confirm your new password"
                        className="rounded-sm"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <Button 
                type="submit" 
                className="w-full mt-4 cursor-pointer rounded-sm"
                disabled={isLoading}
              >
                {isLoading ? 'Resetting...' : 'Reset Password'}
              </Button>
            </form>
          </Form>
        </CardContent>
        <CardFooter className="flex justify-center border-t pt-4">
          <p className="text-sm text-muted-foreground">
            Remembered your password?{' '}
            <Link href="/sign-in" className="text-primary hover:underline inline-flex items-center gap-1">
              <ArrowLeft className="h-4 w-4" />
              Sign in
            </Link>
          </p>
        </CardFooter>
      </Card>
    </div>
  )
} 