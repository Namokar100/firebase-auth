import React from 'react';
import Link from 'next/link';

const Footer = () => {
  const currentYear = new Date().getFullYear();
  
  return (
    <footer className="border-t bg-white dark:bg-card py-8">
      <div className="container max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Company Info */}
          <div className="flex flex-col gap-3">
            <h3 className="font-bold text-xl text-primary">FireAuth</h3>
            <p className="text-sm text-muted-foreground">
              Secure, modern authentication solution for your applications.
            </p>
            <div className="flex space-x-4 mt-4">
              <a href="https://twitter.com" className="text-primary hover:text-primary/80 transition-colors">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M22 4s-.7 2.1-2 3.4c1.6 10-9.4 17.3-18 11.6 2.2.1 4.4-.6 6-2C3 15.5.5 9.6 3 5c2.2 2.6 5.6 4.1 9 4-.9-4.2 4-6.6 7-3.8 1.1 0 3-1.2 3-1.2z"></path>
                </svg>
              </a>
              <a href="https://github.com" className="text-primary hover:text-primary/80 transition-colors">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4"></path>
                  <path d="M9 18c-4.51 2-5-2-7-2"></path>
                </svg>
              </a>
              <a href="https://linkedin.com" className="text-primary hover:text-primary/80 transition-colors">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"></path>
                  <rect width="4" height="12" x="2" y="9"></rect>
                  <circle cx="4" cy="4" r="2"></circle>
                </svg>
              </a>
            </div>
          </div>
          
          {/* Product */}
          <div className="flex flex-col gap-3">
            <h4 className="font-semibold text-primary">Product</h4>
            <div className="flex flex-col gap-2 text-sm">
              <Link href="/features" className="text-muted-foreground hover:text-primary transition-colors">Features</Link>
              <Link href="/pricing" className="text-muted-foreground hover:text-primary transition-colors">Pricing</Link>
              <Link href="/documentation" className="text-muted-foreground hover:text-primary transition-colors">Documentation</Link>
              <Link href="/changelog" className="text-muted-foreground hover:text-primary transition-colors">Changelog</Link>
            </div>
          </div>
          
          {/* Resources */}
          <div className="flex flex-col gap-3">
            <h4 className="font-semibold text-primary">Resources</h4>
            <div className="flex flex-col gap-2 text-sm">
              <Link href="/blog" className="text-muted-foreground hover:text-primary transition-colors">Blog</Link>
              <Link href="/community" className="text-muted-foreground hover:text-primary transition-colors">Community</Link>
              <Link href="/support" className="text-muted-foreground hover:text-primary transition-colors">Support</Link>
              <Link href="/status" className="text-muted-foreground hover:text-primary transition-colors">Status</Link>
            </div>
          </div>
          
          {/* Company */}
          <div className="flex flex-col gap-3">
            <h4 className="font-semibold text-primary">Company</h4>
            <div className="flex flex-col gap-2 text-sm">
              <Link href="/about" className="text-muted-foreground hover:text-primary transition-colors">About</Link>
              <Link href="/careers" className="text-muted-foreground hover:text-primary transition-colors">Careers</Link>
              <Link href="/privacy" className="text-muted-foreground hover:text-primary transition-colors">Privacy Policy</Link>
              <Link href="/terms" className="text-muted-foreground hover:text-primary transition-colors">Terms of Service</Link>
            </div>
          </div>
        </div>
        
        <div className="border-t mt-8 pt-6 flex flex-col md:flex-row justify-between items-center">
          <p className="text-sm text-muted-foreground">
            &copy; {currentYear} FireAuth. All rights reserved.
          </p>
          <div className="flex gap-6 mt-4 md:mt-0">
            <Link href="/privacy" className="text-sm text-muted-foreground hover:text-primary transition-colors">
              Privacy
            </Link>
            <Link href="/terms" className="text-sm text-muted-foreground hover:text-primary transition-colors">
              Terms
            </Link>
            <Link href="/cookies" className="text-sm text-muted-foreground hover:text-primary transition-colors">
              Cookies
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;