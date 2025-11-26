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
          <div className="lg:w-1/2 flex items-center justify-center p-8 lg:p-12 xl:p-16">
            <div className="max-w-lg space-y-8">
              <div className="space-y-4">
                <h1 className="text-4xl lg:text-5xl xl:text-6xl font-bold bg-gradient-to-r from-purple-700 via-pink-700 to-orange-700 bg-clip-text text-transparent leading-tight">
                  Organize your work,
                  <br />
                  amplify your productivity
                </h1>
                <p className="text-lg lg:text-xl text-gray-600">
                  TaskiSpace brings teams together with intuitive task management, 
                  real-time collaboration, and powerful features that keep everyone in sync.
                </p>
              </div>
              
              <div className="space-y-4">
                <div className="flex items-start space-x-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center flex-shrink-0 shadow-lg">
                    <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-1">Smart Task Management</h3>
                    <p className="text-gray-600 text-sm">Organize tasks with lists, tags, and priorities that work for you</p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-pink-500 to-orange-500 rounded-xl flex items-center justify-center flex-shrink-0 shadow-lg">
                    <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-1">Real-time Collaboration</h3>
                    <p className="text-gray-600 text-sm">Work together seamlessly with live updates and team workspaces</p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-yellow-500 rounded-xl flex items-center justify-center flex-shrink-0 shadow-lg">
                    <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-1">Powered by AI</h3>
                    <p className="text-gray-600 text-sm">Get intelligent suggestions and automate workflows with Jarvis AI</p>
                  </div>
                </div>
              </div>
              
              {/* Decorative illustration */}
              <div className="hidden lg:block relative mt-8">
                <div className="w-full h-64 bg-gradient-to-br from-purple-200 via-pink-200 to-orange-200 rounded-2xl opacity-50" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <svg className="w-32 h-32 text-purple-600 opacity-20" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z" />
                    <path fillRule="evenodd" d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 4a1 1 0 000 2h.01a1 1 0 100-2H7zm3 0a1 1 0 000 2h3a1 1 0 100-2h-3zm-3 4a1 1 0 100 2h.01a1 1 0 100-2H7zm3 0a1 1 0 100 2h3a1 1 0 100-2h-3z" clipRule="evenodd" />
                  </svg>
                </div>
              </div>
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