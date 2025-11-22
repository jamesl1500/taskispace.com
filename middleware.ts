import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value
        },
        set(name: string, value: string, options: CookieOptions) {
          request.cookies.set({
            name,
            value,
            ...options,
          })
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          })
          response.cookies.set({
            name,
            value,
            ...options,
          })
        },
        remove(name: string, options: CookieOptions) {
          request.cookies.set({
            name,
            value: '',
            ...options,
          })
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          })
          response.cookies.set({
            name,
            value: '',
            ...options,
          })
        },
      },
    }
  )

  // This will refresh session if expired - required for Server Components
  // https://supabase.com/docs/guides/auth/server-side/nextjs
  const {
    data: { user },
  } = await supabase.auth.getUser()

  // Protect auth routes - redirect to login if not authenticated
  const protectedRoutes = ['/settings', '/timeline', '/workspaces', '/tasks', '/conversations', '/jarvis']
  const isProtectedRoute = protectedRoutes.some(route => 
    request.nextUrl.pathname.startsWith(route)
  )

  if (isProtectedRoute && !user) {
    const redirectUrl = new URL('/auth/login', request.url)
    redirectUrl.searchParams.set('redirectTo', request.nextUrl.pathname)
    return NextResponse.redirect(redirectUrl)
  }

  // Check email verification for protected routes
  if (isProtectedRoute && user && !user.email_confirmed_at) {
    const redirectUrl = new URL('/auth/verify-required', request.url)
    return NextResponse.redirect(redirectUrl)
  }

  // Check onboarding status for authenticated and verified users
  if (user && user.email_confirmed_at) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('user_name, display_name')
      .eq('id', user.id)
      .single()

    // Check if user needs onboarding (auto-generated username or missing profile)
    const needsOnboarding = !profile?.user_name || profile.user_name.startsWith('user_')
    const isOnOnboardingPage = request.nextUrl.pathname.startsWith('/onboarding')
    const isAuthPage = request.nextUrl.pathname.startsWith('/auth')

    // Redirect to onboarding if needed
    if (needsOnboarding && !isOnOnboardingPage && !isAuthPage) {
      return NextResponse.redirect(new URL('/onboarding', request.url))
    }

    // Redirect away from onboarding if already completed
    if (!needsOnboarding && isOnOnboardingPage) {
      return NextResponse.redirect(new URL('/dashboard', request.url))
    }
  }

  // Redirect authenticated users away from auth pages (except verify-email)
  const authRoutes = ['/auth/login', '/auth/signup', '/auth/forgot-password']
  const isAuthRoute = authRoutes.some(route => 
    request.nextUrl.pathname.startsWith(route)
  )

  if (isAuthRoute && user && user.email_confirmed_at) {
    const redirectTo = request.nextUrl.searchParams.get('redirectTo') || '/timeline'
    return NextResponse.redirect(new URL(redirectTo, request.url))
  }

  return response
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     * - api routes (they handle auth separately)
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$|api/).*)',
  ],
}