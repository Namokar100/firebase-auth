import React, { Suspense } from 'react'
import { AuthForm } from '@/components/auth'

// Loading fallback for Suspense
const AuthFormLoader = () => (
  <div className="flex flex-col items-center justify-center h-screen">
    <div className="animate-pulse h-32 w-64 bg-gray-200 rounded-md"></div>
  </div>
)

const SignUpPage = () => {
  return (
    <div>
      <Suspense fallback={<AuthFormLoader />}>
        <AuthForm type='signup' />
      </Suspense>
    </div>
  )
}

export default SignUpPage