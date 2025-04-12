import { isAuthenticated } from '@/lib/actions/auth.action';
import { redirect } from 'next/navigation';
import React from 'react'

const RootLayout = async ({children}: {children: React.ReactNode}) => {
    // const isUserAuthenticated = await isAuthenticated();

    // if(!isUserAuthenticated){
    //   redirect("/sign-in");
    // }
  return (
    <div>
       {children}
    </div>
  )
}

export default RootLayout