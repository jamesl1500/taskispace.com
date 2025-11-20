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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-slate-950 dark:via-blue-950 dark:to-indigo-950 p-6">
      {/* Timeline hero */}
      <div className="relative mb-8 overflow-hidden rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white">
        <div className="absolute inset-0 opacity-80" style={{background: "url('/timeline_cover.jpg') center/cover"}}></div>
        <div className="relative px-8 py-12 text-center bg-black bg-opacity-25">
          <h1 className="text-4xl font-bold mb-4">Timeline</h1>
          <p className="text-xl text-blue-100 max-w-2xl mx-auto">
            Stay connected with your community. Share updates, track progress, and discover what others are achieving.
          </p>
        </div>
      </div>

      {/* Timeline navigation */}
      <nav className="mb-8 border-b border-gray-300 dark:border-gray-700">
        <ul className="flex justify-center space-x-8">
          {tabs.map((tab) => (
            <li key={tab.href} className={cn(
              "pb-4 transition-colors",
              pathname === tab.href 
                ? "border-b-2 border-blue-600" 
                : ""
            )}>
              <Link 
                href={tab.href}
                className={cn(
                  "font-semibold transition-colors",
                  pathname === tab.href 
                    ? "text-blue-600" 
                    : "text-gray-600 hover:text-blue-600"
                )}
              >
                {tab.name}
              </Link>
            </li>
          ))}
        </ul>
      </nav>

      <div className="max-w-7xl mx-auto">
        {children}
      </div>
    </div>
  )
}
