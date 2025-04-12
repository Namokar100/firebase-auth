import React from 'react'

const RootLayout = async ({children}: {children: React.ReactNode}) => {
  return (
    <div>
       {children}
    </div>
  )
}

export default RootLayout