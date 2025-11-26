'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'

export default function TimelineLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()

  const tabs = [
    { name: 'Feed', href: '/timeline/feed' },
    { name: 'Dashboard', href: '/timeline/dashboard' },
    { name: 'Explore', href: '/timeline/explore' },
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-orange-50 dark:from-gray-950 dark:via-gray-950 dark:to-gray-950 p-6">
      {/* Timeline hero */}
      <div className="relative mb-8 overflow-hidden rounded-2xl bg-gradient-to-r from-purple-600 via-pink-600 to-orange-600 text-white shadow-xl">
        <div className="absolute inset-0 bg-black bg-opacity-10"></div>
        <div className="relative px-8 py-12 text-center">
          <h1 className="text-5xl font-bold mb-4 drop-shadow-lg">Timeline</h1>
          <p className="text-xl text-purple-100 max-w-2xl mx-auto">
            Stay connected with your community. Share updates, track progress, and discover what others are achieving.
          </p>
        </div>
      </div>

      {/* Timeline navigation */}
      <nav className="mb-8">
        <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-xl shadow-lg border border-purple-100 dark:border-gray-700 p-2">
          <ul className="flex justify-center space-x-2">
            {tabs.map((tab) => (
              <li key={tab.href}>
                <Link 
                  href={tab.href}
                  className={cn(
                    "block px-6 py-3 rounded-lg font-semibold transition-all duration-200",
                    pathname === tab.href 
                      ? "bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-md" 
                      : "text-gray-600 dark:text-gray-300 hover:bg-purple-50 dark:hover:bg-gray-700 hover:text-purple-600"
                  )}
                >
                  {tab.name}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto">
        {children}
      </div>
    </div>
  )
}
