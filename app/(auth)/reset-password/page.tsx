import React, { Suspense } from 'react'
import ResetPasswordForm from '@/components/ResetPasswordForm'

// Loading fallback for Suspense
const FormLoader = () => (
  <div className="flex flex-col items-center justify-center h-screen">
    <div className="animate-pulse h-32 w-64 bg-gray-200 rounded-md"></div>
      </div>
    )

const ResetPasswordPage = () => {
  return (
    <div className='flex flex-col items-center justify-center'>
      <Suspense fallback={<FormLoader />}>
        <ResetPasswordForm />
      </Suspense>
    </div>
  )
} 

export default ResetPasswordPage 