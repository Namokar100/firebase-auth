import type { Metadata } from "next";
import "./globals.css";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Toaster } from "@/components/ui/sonner"
import { ThemeProvider } from "@/components/ThemeProvider";

export const metadata: Metadata = {
  title: "Firebase Auth - Secure Authentication",
  description: "A modern authentication system built with Next.js and Firebase",
};

export default async function RootLayout({children,}: Readonly<{children: React.ReactNode;}>) {

  return (
    <html lang="en" className="h-full">
      <body className="min-h-screen bg-background font-sans antialiased" suppressHydrationWarning>
        <ThemeProvider>
          <div className="relative flex min-h-screen flex-col">
            <Navbar />
            <div className="flex-1">
              <main className="flex-1 py-10">
                <div className="container max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                  {children}
                </div>
              </main>
            </div>
            <Footer />
          </div>
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  );
}
