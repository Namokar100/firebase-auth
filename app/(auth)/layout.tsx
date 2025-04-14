import React from 'react';
import Link from 'next/link';

const AuthLayout = async ({children}: {children: React.ReactNode}) => {
  return (
    <div className="relative min-h-screen flex flex-col items-center justify-center py-6 px-4 sm:px-6 lg:px-8 bg-background dark:bg-[#121417]">
      
      
      <div className="w-full max-w-md mt-[-17vh]">
        {/* <div className="text-center">
          <Link href="/" className="inline-block">
            <h2 className="text-3xl font-bold text-primary dark:text-[#4285F4]">FireAuth</h2>
          </Link>
        </div> */}
        
        {children}
      </div>
    </div>
  );
};

export default AuthLayout;