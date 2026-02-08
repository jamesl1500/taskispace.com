"use client"

import Link from "next/link"
import { Card, CardContent, CardFooter } from "@/components/ui/card"
import { Sparkles } from "lucide-react"
import { SignupForm } from "@/forms/auth/forms"

export default function SignupPage() {

  return (
    <div className="w-full">
      {/* Decorative header */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-purple-500 via-pink-500 to-orange-500 rounded-2xl shadow-xl mb-4">
          <Sparkles className="w-8 h-8 text-white" />
        </div>
        <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-700 via-pink-700 to-orange-700 bg-clip-text text-transparent mb-2">
          Join TaskiSpace
        </h1>
        <p className="text-gray-600">
          Create your account and start your productivity journey
        </p>
      </div>

      <Card className="w-full shadow-xl border-purple-100 bg-white/80 backdrop-blur-sm">
        <CardContent>
          <SignupForm />
        </CardContent>

        <CardFooter className="flex flex-col space-y-4 px-6 pb-6">
          <div className="text-center text-sm text-gray-600">
            Already have an account?{" "}
            <Link
              href="/auth/login"
              className="text-purple-600 hover:text-purple-700 hover:underline font-semibold transition-colors"
            >
              Sign in
            </Link>
          </div>
        </CardFooter>
      </Card>
    </div>
  )
}