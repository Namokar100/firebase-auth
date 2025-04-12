import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// This function can be marked `async` if using `await` inside
export function middleware(request: NextRequest) {
  const sessionCookie = request.cookies.get('session');
  
  // Path the user is trying to access
  const { pathname } = request.nextUrl;
  
  // Define protected routes (require authentication)
  const protectedRoutes = ['/home'];
  
  // Define auth routes (require NO authentication)
  const authRoutes = ['/sign-in', '/sign-up', '/forgot-password'];
  
  // Check if the path is a protected route
  const isProtectedRoute = protectedRoutes.some(route => 
    pathname.startsWith(route) || pathname === route
  );
  
  // Check if the path is an auth route
  const isAuthRoute = authRoutes.some(route => 
    pathname.startsWith(route) || pathname === route
  );

  // If there's no session cookie and user is trying to access a protected route
  if (!sessionCookie && isProtectedRoute) {
    return NextResponse.redirect(new URL('/sign-in', request.url));
  }

  // If there is a session cookie and user is trying to access an auth route
  if (sessionCookie && isAuthRoute) {
    return NextResponse.redirect(new URL('/home', request.url));
  }

  return NextResponse.next();
}

// Configure the middleware to run only on specific paths
export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     * - api routes
     */
    '/((?!_next/static|_next/image|favicon.ico|public|api).*)',
  ],
}; 