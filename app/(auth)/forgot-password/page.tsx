import React, { Suspense } from 'react'
import ForgotPasswordForm from '@/components/ForgotPasswordForm'

// Loading fallback for Suspense
const FormLoader = () => (
  <div className="flex flex-col items-center justify-center h-screen">
    <div className="animate-pulse h-32 w-64 bg-gray-200 rounded-md"></div>
  </div>
)

const ForgotPasswordPage = () => {
  return (
    <div className='flex flex-col items-center justify-center'>
      <Suspense fallback={<FormLoader />}>
        <ForgotPasswordForm />
      </Suspense>
    </div>
  )
}

export default ForgotPasswordPage 