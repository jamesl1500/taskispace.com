import { ReactNode } from "react"
import Link from "next/link"

interface AuthLayoutProps {
  children: ReactNode
}

export default function AuthLayout({ children }: AuthLayoutProps) {
  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Vibrant gradient background */}
      <div className="absolute inset-0 bg-gradient-to-br from-purple-50 via-pink-50 to-orange-50" />
      
      {/* Ambient light effects */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-purple-300/20 rounded-full blur-3xl" />
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-pink-300/20 rounded-full blur-3xl" />
      <div className="absolute top-1/2 left-1/2 w-96 h-96 bg-orange-300/20 rounded-full blur-3xl" />
      
      {/* Content */}
      <div className="relative z-10 min-h-screen flex flex-col">
        
        {/* Main content - Side by side layout */}
        <div className="flex-1 flex flex-col lg:flex-row">
          {/* Left side - Image and text */}
          <div className="lg:w-1/2 hidden lg:flex flex-col items-end justify-center p-8 lg:p-12 bg-gradient-to-br from-purple-600 via-pink-600 to-orange-600 text-white">
            <div className="max-w-lg text-center">
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
          <div className="lg:w-1/2 flex items-center justify-center p-8 lg:p-12 bg-white/60 backdrop-blur-sm">
            <div className="w-full max-w-md">
              {children}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}