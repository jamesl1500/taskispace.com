import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export default function Home() {
  const authPages = [
    { title: "Login", href: "/auth/login", description: "Sign in to your account" },
    { title: "Sign Up", href: "/auth/signup", description: "Create a new account" },
    { title: "Forgot Password", href: "/auth/forgot-password", description: "Reset your password" },
    { title: "Reset Password", href: "/auth/reset-password?token=sample-token", description: "Set a new password" },
    { title: "Verify Email", href: "/auth/verify-email?token=sample-token&email=test@example.com", description: "Confirm your email address" },
  ]

  const appPages = [
    { title: "Dashboard", href: "/dashboard", description: "Overview of your tasks and workspaces" },
    { title: "Workspaces", href: "/workspaces", description: "Create and manage your workspaces" },
    { title: "All Tasks", href: "/tasks", description: "View all tasks across workspaces" },
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
      <div className="container mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-slate-900 dark:text-white mb-4">
            TaskiSpace
          </h1>
          <p className="text-xl text-slate-600 dark:text-slate-400 mb-8">
            Organize your tasks, manage your workspaces
          </p>
          <p className="text-slate-500 dark:text-slate-500">
            Comprehensive task management with full CRUD operations
          </p>
        </div>

        {/* App Pages Section */}
        <div className="mb-16">
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white text-center mb-8">
            Application Features
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
            {appPages.map((page) => (
              <Card key={page.href} className="hover:shadow-lg transition-shadow duration-200 border-0 bg-blue-50/80 dark:bg-blue-900/20 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="text-lg font-semibold text-slate-900 dark:text-white">
                    {page.title}
                  </CardTitle>
                  <CardDescription className="text-slate-600 dark:text-slate-400">
                    {page.description}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Link href={page.href}>
                    <Button className="w-full" variant="default">
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
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white text-center mb-8">
            Authentication Pages
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
            {authPages.map((page) => (
              <Card key={page.href} className="hover:shadow-lg transition-shadow duration-200 border-0 bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="text-lg font-semibold text-slate-900 dark:text-white">
                    {page.title}
                  </CardTitle>
                  <CardDescription className="text-slate-600 dark:text-slate-400">
                    {page.description}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Link href={page.href}>
                    <Button className="w-full" variant="outline">
                      View {page.title} Page
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        <div className="mt-16 text-center">
          <Card className="max-w-4xl mx-auto border-0 bg-white/60 dark:bg-slate-800/60 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-2xl font-bold text-slate-900 dark:text-white">
                About TaskiSpace
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6 text-left">
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <h3 className="font-semibold text-slate-900 dark:text-white mb-2">App Features:</h3>
                  <ul className="list-disc list-inside text-slate-600 dark:text-slate-400 space-y-1">
                    <li>Complete workspace management (CRUD)</li>
                    <li>Advanced task management with priorities</li>
                    <li>Search and filter across tasks and workspaces</li>
                    <li>Task status tracking and completion</li>
                    <li>Due date management and overdue tracking</li>
                    <li>Tag system for task organization</li>
                    <li>Responsive design for all devices</li>
                    <li>Real-time task statistics</li>
                  </ul>
                </div>
                <div>
                  <h3 className="font-semibold text-slate-900 dark:text-white mb-2">Auth Features:</h3>
                  <ul className="list-disc list-inside text-slate-600 dark:text-slate-400 space-y-1">
                    <li>Clean, centered form layouts with Shadcn components</li>
                    <li>Password visibility toggle with eye icons</li>
                    <li>Form validation and loading states</li>
                    <li>Google OAuth integration ready</li>
                    <li>Email verification flow</li>
                    <li>Password reset functionality</li>
                    <li>Consistent gray theme design</li>
                    <li>Dark mode support</li>
                  </ul>
                </div>
              </div>
              <div>
                <h3 className="font-semibold text-slate-900 dark:text-white mb-2">Tech Stack:</h3>
                <ul className="list-disc list-inside text-slate-600 dark:text-slate-400 space-y-1">
                  <li>Next.js 15 with App Router</li>
                  <li>Shadcn/ui components</li>
                  <li>Tailwind CSS for styling</li>
                  <li>Lucide React for icons</li>
                  <li>TypeScript for type safety</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
