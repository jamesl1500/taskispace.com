import { ReactNode } from "react"
import Link from "next/link"

interface AuthLayoutProps {
  children: ReactNode
}

export default function AuthLayout({ children }: AuthLayoutProps) {
  return (
    <div className="min-h-screen relative overflow-hidden auth-page">
      {/* Content */}
      <div className="relative z-10 min-h-screen flex flex-col auth-page-content">
        
        {/* Main content - Side by side layout */}
        <div className="flex-1 flex flex-col lg:flex-row auth-page-content-inner">
          {/* Left side - Image and text */}
          <div className="lg:w-1/2 hidden lg:flex bg-gradient-to-br from-purple-600 via-pink-600 to-orange-600 text-white auth-page-left">
            <div className="w-full h-full text-center auth-page-left-cover">
              <h2 className="text-4xl font-bold mb-4">
                Welcome to TaskiSpace
              </h2>
              <p className="mb-6">
                Your all-in-one productivity platform to manage tasks, collaborate with teams, and streamline your workflow.
              </p>
              <Link href="/" className="inline-block px-6 py-3 bg-white/20 hover:bg-white/30 rounded-full font-semibold transition">
                Back to Home
              </Link>
            </div>
          </div>
          
          {/* Right side - Form */}
          <div className="lg:w-1/2 flex items-center justify-center p-8 lg:p-12 bg-white/60 backdrop-blur-sm auth-page-right">
            <div className="w-full max-w-md auth-page-form">
              {children}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}