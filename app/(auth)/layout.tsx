import React from 'react';
import Link from 'next/link';

const AuthLayout = async ({children}: {children: React.ReactNode}) => {
  return (
    <div className="relative min-h-screen flex flex-col items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-background">
      <div className="absolute left-6">
        <Link href="/" className="flex items-center text-primary hover:text-primary/80 transition-colors">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2">
            <path d="m12 19-7-7 7-7"/>
            <path d="M19 12H5"/>
          </svg>
          <span className="font-medium">Back to Home</span>
        </Link>
      </div>
      
      <div className="w-full max-w-md space-y-8">
        {/* <div className="text-center">
          <Link href="/" className="inline-block">
            <h2 className="text-3xl font-bold text-primary">FireAuth</h2>
          </Link>
        </div> */}
        
        {children}
      </div>
    </div>
  );
};

export default AuthLayout;