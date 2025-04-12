import { isAuthenticated } from '@/lib/actions/auth.action';
import { redirect } from 'next/navigation';
import React from 'react'

const AuthLayout = async ({children}: {children: React.ReactNode}) => {
    const isUserAuthenticated = await isAuthenticated();

    if(isUserAuthenticated){
      redirect("/home");
    }
  return (
    <div>
        {children}
    </div>
  )
}

export default AuthLayout