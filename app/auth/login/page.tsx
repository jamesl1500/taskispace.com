/**
 * Login Page Component
 * 
 * This component renders the login page where users can sign in
 * to their accounts. It includes fields for email and password,
 * along with validation and submission handling.
 * 
 * @component 
 */

"use client"

import { Card, CardContent, CardFooter } from "@/components/ui/card"
import { Sparkles } from "lucide-react"
import { LoginForm } from "@/forms/auth/forms"
import Link from "next/link"

export default function LoginPage() {

  return (
    <div className="w-full">
      {/* Decorative header */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-purple-500 via-pink-500 to-orange-500 rounded-2xl shadow-xl mb-4">
          <Sparkles className="w-8 h-8 text-white" />
        </div>
        <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-700 via-pink-700 to-orange-700 bg-clip-text text-transparent mb-2">
          Welcome back!
        </h1>
        <p className="text-gray-600">
          Sign in to continue your productivity journey
        </p>
      </div>

      {/* Login Form Card */}
      <Card className="w-full shadow-xl border-purple-100 bg-white/80 backdrop-blur-sm">
        <CardContent>
          <LoginForm />
        </CardContent>
        <CardFooter className="flex flex-col space-y-4 px-6">
          <div className="text-center text-sm text-gray-600">
            Forgot your password? {" "}
            <Link
              href="/auth/forgot-password" 
              className="text-purple-600 hover:text-purple-700 hover:underline font-semibold transition-colors"
            >
              Reset it here
            </Link>
          </div>
        </CardFooter>
      </Card>
    </div>
  )
}