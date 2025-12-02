"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter } from "@/components/ui/card"
import { ArrowLeft, KeyRound } from "lucide-react"
import { PasswordResetForm } from "@/forms/auth/forms"

export default function ForgotPasswordPage() {

  return (
    <div className="w-full">
      {/* Decorative header */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-purple-500 via-pink-500 to-orange-500 rounded-2xl shadow-xl mb-4">
          <KeyRound className="w-8 h-8 text-white" />
        </div>
        <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-700 via-pink-700 to-orange-700 bg-clip-text text-transparent mb-2">
          Forgot your password?
        </h1>
        <p className="text-gray-600">
          No worries! We&apos;ll send you reset instructions
        </p>
      </div>

      <Card className="w-full shadow-xl border-purple-100 bg-white/80 backdrop-blur-sm">
          <CardContent>
            <PasswordResetForm />
          </CardContent>
          <CardFooter className="flex flex-col space-y-3 px-6">
            <Link href="/auth/login" className="w-full">
              <Button variant="ghost" className="w-full text-purple-600 hover:text-purple-700 hover:bg-purple-50">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to login
              </Button>
            </Link>
          </CardFooter>
      </Card>
    </div>
  )
}