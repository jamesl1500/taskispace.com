import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Sparkles, Zap, Users, CheckCircle, Rocket } from "lucide-react"

export default function Home() {
  const authPages = [
    { title: "Login", href: "/auth/login", description: "Sign in to your account" },
    { title: "Sign Up", href: "/auth/signup", description: "Create a new account" },
    { title: "Forgot Password", href: "/auth/forgot-password", description: "Reset your password" },
    { title: "Reset Password", href: "/auth/reset-password?token=sample-token", description: "Set a new password" },
    { title: "Verify Email", href: "/auth/verify-email?token=sample-token&email=test@example.com", description: "Confirm your email address" },
  ]

  const appPages = [
    { title: "Timeline", href: "/timeline", description: "Your social feed and updates", color: "from-purple-400 to-pink-400" },
    { title: "Workspaces", href: "/workspaces", description: "Create and manage your workspaces", color: "from-pink-400 to-orange-400" },
    { title: "All Tasks", href: "/tasks", description: "View all tasks across workspaces", color: "from-orange-400 to-yellow-400" },
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-orange-50">
      {/* Ambient effects */}
      <div className="fixed top-0 left-1/4 w-96 h-96 bg-purple-300/20 rounded-full blur-3xl" />
      <div className="fixed bottom-0 right-1/4 w-96 h-96 bg-pink-300/20 rounded-full blur-3xl" />
      <div className="fixed top-1/2 left-1/2 w-96 h-96 bg-orange-300/20 rounded-full blur-3xl" />
      
      <div className="container mx-auto px-4 py-16 relative">
        {/* Hero Section */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-purple-500 via-pink-500 to-orange-500 rounded-3xl shadow-2xl mb-6 animate-pulse">
            <Sparkles className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-6xl font-bold bg-gradient-to-r from-purple-700 via-pink-700 to-orange-700 bg-clip-text text-transparent mb-4">
            TaskiSpace
          </h1>
          <p className="text-2xl text-gray-700 mb-6">
            Organize your work, amplify your productivity
          </p>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            A beautiful, powerful task management platform that helps teams collaborate and stay organized
          </p>
          <div className="flex gap-4 justify-center mt-8">
            <Link href="/auth/signup">
              <Button size="lg" className="bg-gradient-to-r from-purple-600 via-pink-600 to-orange-600 hover:from-purple-700 hover:via-pink-700 hover:to-orange-700 text-white shadow-xl text-lg px-8 py-6">
                <Rocket className="mr-2 h-5 w-5" />
                Get Started Free
              </Button>
            </Link>
            <Link href="/auth/login">
              <Button size="lg" variant="outline" className="border-purple-300 text-purple-700 hover:bg-purple-50 text-lg px-8 py-6">
                Sign In
              </Button>
            </Link>
          </div>
        </div>

        {/* Features Grid */}
        <div className="mb-20">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 max-w-6xl mx-auto">
            <Card className="border-purple-100 bg-white/80 backdrop-blur-sm shadow-lg hover:shadow-xl transition-all">
              <CardContent className="pt-6 text-center">
                <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center mx-auto mb-4">
                  <Zap className="w-6 h-6 text-white" />
                </div>
                <h3 className="font-bold text-gray-900 mb-2">Lightning Fast</h3>
                <p className="text-sm text-gray-600">Blazing fast performance with real-time updates</p>
              </CardContent>
            </Card>
            
            <Card className="border-pink-100 bg-white/80 backdrop-blur-sm shadow-lg hover:shadow-xl transition-all">
              <CardContent className="pt-6 text-center">
                <div className="w-12 h-12 bg-gradient-to-br from-pink-500 to-orange-500 rounded-xl flex items-center justify-center mx-auto mb-4">
                  <Users className="w-6 h-6 text-white" />
                </div>
                <h3 className="font-bold text-gray-900 mb-2">Team Collaboration</h3>
                <p className="text-sm text-gray-600">Work together seamlessly with your team</p>
              </CardContent>
            </Card>
            
            <Card className="border-orange-100 bg-white/80 backdrop-blur-sm shadow-lg hover:shadow-xl transition-all">
              <CardContent className="pt-6 text-center">
                <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-yellow-500 rounded-xl flex items-center justify-center mx-auto mb-4">
                  <CheckCircle className="w-6 h-6 text-white" />
                </div>
                <h3 className="font-bold text-gray-900 mb-2">Easy to Use</h3>
                <p className="text-sm text-gray-600">Intuitive interface that feels natural</p>
              </CardContent>
            </Card>
            
            <Card className="border-yellow-100 bg-white/80 backdrop-blur-sm shadow-lg hover:shadow-xl transition-all">
              <CardContent className="pt-6 text-center">
                <div className="w-12 h-12 bg-gradient-to-br from-yellow-500 to-amber-500 rounded-xl flex items-center justify-center mx-auto mb-4">
                  <Sparkles className="w-6 h-6 text-white" />
                </div>
                <h3 className="font-bold text-gray-900 mb-2">AI Powered</h3>
                <p className="text-sm text-gray-600">Smart suggestions with Jarvis AI assistant</p>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* App Pages Section */}
        <div className="mb-16">
          <h2 className="text-3xl font-bold text-center mb-4 bg-gradient-to-r from-purple-700 via-pink-700 to-orange-700 bg-clip-text text-transparent">
            Explore the Platform
          </h2>
          <p className="text-center text-gray-600 mb-8">Discover powerful features designed for productivity</p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
            {appPages.map((page) => (
              <Card key={page.href} className="hover:shadow-2xl transition-all duration-300 border-0 bg-white/80 backdrop-blur-sm group hover:scale-105">
                <CardHeader>
                  <div className={`w-12 h-12 bg-gradient-to-br ${page.color} rounded-xl flex items-center justify-center mb-3 group-hover:scale-110 transition-transform shadow-lg`}>
                    <span className="text-2xl text-white">✨</span>
                  </div>
                  <CardTitle className="text-xl font-bold text-gray-900">
                    {page.title}
                  </CardTitle>
                  <CardDescription className="text-gray-600">
                    {page.description}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Link href={page.href}>
                    <Button className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white shadow-lg">
                      Open {page.title}
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Auth Pages Section */}
        <div className="mb-16">
          <h2 className="text-3xl font-bold text-center mb-4 bg-gradient-to-r from-purple-700 via-pink-700 to-orange-700 bg-clip-text text-transparent">
            Authentication Flow
          </h2>
          <p className="text-center text-gray-600 mb-8">Secure and beautiful authentication pages</p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
            {authPages.map((page) => (
              <Card key={page.href} className="hover:shadow-xl transition-all duration-200 border-purple-100 bg-white/80 backdrop-blur-sm group">
                <CardHeader>
                  <CardTitle className="text-lg font-semibold text-gray-900 group-hover:text-purple-700 transition-colors">
                    {page.title}
                  </CardTitle>
                  <CardDescription className="text-gray-600">
                    {page.description}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Link href={page.href}>
                    <Button className="w-full" variant="outline" className="border-purple-200 text-purple-700 hover:bg-purple-50 hover:border-purple-300">
                      View {page.title}
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* About Section */}
        <div className="mt-20">
          <Card className="max-w-6xl mx-auto border-purple-100 bg-gradient-to-br from-white/90 to-purple-50/90 backdrop-blur-sm shadow-2xl">
            <CardHeader className="text-center">
              <CardTitle className="text-3xl font-bold bg-gradient-to-r from-purple-700 via-pink-700 to-orange-700 bg-clip-text text-transparent">
                Why TaskiSpace?
              </CardTitle>
              <CardDescription className="text-lg text-gray-600">
                Everything you need to stay organized and productive
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid md:grid-cols-2 gap-8">
                <div className="space-y-4">
                  <h3 className="font-bold text-xl text-gray-900 flex items-center">
                    <span className="w-8 h-8 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg flex items-center justify-center mr-3">
                      <CheckCircle className="w-5 h-5 text-white" />
                    </span>
                    Powerful Features
                  </h3>
                  <ul className="space-y-3 text-gray-700">
                    <li className="flex items-start">
                      <span className="text-purple-500 mr-2">•</span>
                      Complete workspace management with intuitive CRUD operations
                    </li>
                    <li className="flex items-start">
                      <span className="text-pink-500 mr-2">•</span>
                      Advanced task management with priorities and tags
                    </li>
                    <li className="flex items-start">
                      <span className="text-orange-500 mr-2">•</span>
                      Real-time collaboration and live updates
                    </li>
                    <li className="flex items-start">
                      <span className="text-purple-500 mr-2">•</span>
                      Smart search and filtering across all content
                    </li>
                    <li className="flex items-start">
                      <span className="text-pink-500 mr-2">•</span>
                      Beautiful, responsive design for all devices
                    </li>
                    <li className="flex items-start">
                      <span className="text-orange-500 mr-2">•</span>
                      Comprehensive analytics and task statistics
                    </li>
                  </ul>
                </div>
                <div className="space-y-4">
                  <h3 className="font-bold text-xl text-gray-900 flex items-center">
                    <span className="w-8 h-8 bg-gradient-to-br from-pink-500 to-orange-500 rounded-lg flex items-center justify-center mr-3">
                      <Sparkles className="w-5 h-5 text-white" />
                    </span>
                    Modern Experience
                  </h3>
                  <ul className="space-y-3 text-gray-700">
                    <li className="flex items-start">
                      <span className="text-purple-500 mr-2">•</span>
                      Beautiful, colorful UI with smooth animations
                    </li>
                    <li className="flex items-start">
                      <span className="text-pink-500 mr-2">•</span>
                      Secure authentication with email verification
                    </li>
                    <li className="flex items-start">
                      <span className="text-orange-500 mr-2">•</span>
                      Password reset and account recovery
                    </li>
                    <li className="flex items-start">
                      <span className="text-purple-500 mr-2">•</span>
                      AI-powered Jarvis assistant for smart suggestions
                    </li>
                    <li className="flex items-start">
                      <span className="text-pink-500 mr-2">•</span>
                      Built with Next.js 15, TypeScript, and Tailwind CSS
                    </li>
                    <li className="flex items-start">
                      <span className="text-orange-500 mr-2">•</span>
                      Fully type-safe with excellent developer experience
                    </li>
                  </ul>
                </div>
              </div>
              
              <div className="mt-8 pt-8 border-t border-purple-200">
                <div className="flex flex-wrap justify-center gap-4">
                  <div className="px-6 py-3 bg-gradient-to-r from-purple-100 to-pink-100 rounded-full">
                    <span className="font-semibold text-purple-700">Next.js 15</span>
                  </div>
                  <div className="px-6 py-3 bg-gradient-to-r from-pink-100 to-orange-100 rounded-full">
                    <span className="font-semibold text-pink-700">TypeScript</span>
                  </div>
                  <div className="px-6 py-3 bg-gradient-to-r from-orange-100 to-yellow-100 rounded-full">
                    <span className="font-semibold text-orange-700">Tailwind CSS</span>
                  </div>
                  <div className="px-6 py-3 bg-gradient-to-r from-yellow-100 to-purple-100 rounded-full">
                    <span className="font-semibold text-yellow-700">Shadcn/ui</span>
                  </div>
                  <div className="px-6 py-3 bg-gradient-to-r from-purple-100 to-pink-100 rounded-full">
                    <span className="font-semibold text-purple-700">Supabase</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
