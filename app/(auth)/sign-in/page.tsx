import React from 'react'
import { AuthForm } from '@/components/AuthForm'
const LoginPage = () => {
  return (
    <div className='flex flex-col items-center justify-center'>
      <AuthForm type='signin' />
    </div>
  )
}

export default LoginPage