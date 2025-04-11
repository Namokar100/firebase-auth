import { isAuthenticated } from '@/lib/actions/auth.action';
import { redirect } from 'next/navigation';
import React from 'react'

const HomePage = async () => {
    const isUserAuthenticated = await isAuthenticated();

    if(!isUserAuthenticated){
      redirect("/sign-in");
    }
  return (
    <div className='flex flex-col items-center justify-center h-screen'>
        <h1 className='text-4xl font-bold'>Page for authenticated users</h1>
    </div>
  )
}

export default HomePage