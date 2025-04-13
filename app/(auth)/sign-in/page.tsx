import React, { Suspense } from 'react'
import { AuthForm } from '@/components/AuthForm'

// Loading fallback for Suspense
const AuthFormLoader = () => (
  <div className="flex flex-col items-center justify-center h-screen">
    <div className="animate-pulse h-32 w-64 bg-gray-200 rounded-md"></div>
  </div>
)

const LoginPage = () => {
  return (
    <div className="mt-0">
      <Suspense fallback={<AuthFormLoader />}>
        <AuthForm type='signin' />
      </Suspense>
    </div>
  )
}

export default LoginPage