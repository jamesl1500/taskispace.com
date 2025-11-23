'use client'

import Link from 'next/link'
import { useAuthWithProfile } from '@/hooks/useAuth'
import { useSignOut } from '@/hooks/queries/useAuthQueries'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { User, LogOut, Settings, Plus } from 'lucide-react'
import { useState, useEffect, useRef } from 'react'
import { SearchBar } from '@/components/search/SearchBar'
import { NotificationBell } from '@/components/notifications/NotificationBell'
import { Jarvis } from './Jarvis'
import { SidebarTrigger } from '@/components/ui/sidebar'

export default function Header() {
  const { user, profile, loading } = useAuthWithProfile()
  const { mutate: signOut } = useSignOut()
  const [createNewOpen, setCreateNewOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  const handleSignOut = () => {
    signOut()
  }

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setCreateNewOpen(false)
      }
    }

    if (createNewOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [createNewOpen])

  const getInitials = (name: string | undefined) => {
    if (!name) return 'U'
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
  }

  return (
    <header className="bg-white dark:bg-slate-800 shadow-sm border-b border-slate-200 dark:border-slate-700 sticky top-0 z-40">
      <div className="px-3 sm:px-4 lg:px-6">
        <div className="flex justify-between items-center h-14">
          {/* Left side - Sidebar trigger and Logo */}
          <div className="flex items-center gap-3 min-w-0">
            {loading ? (
              // Loading state - preserve layout
              <>
                <div className="w-9 h-9 bg-slate-200 dark:bg-slate-700 rounded-md animate-pulse"></div>
                <Link href="/" className="flex items-center gap-2">
                  <div className="w-7 h-7 bg-primary rounded-lg flex items-center justify-center">
                    <span className="text-white font-bold text-sm">T</span>
                  </div>
                  <h1 className="text-lg font-bold text-slate-900 dark:text-white hidden sm:block">
                    TaskiSpace
                  </h1>
                </Link>
              </>
            ) : user ? (
              <>
                <SidebarTrigger />
                <Link href="/" className="flex items-center gap-2">
                  <div className="w-7 h-7 bg-primary rounded-lg flex items-center justify-center">
                    <span className="text-white font-bold text-sm">T</span>
                  </div>
                  <h1 className="text-lg font-bold text-slate-900 dark:text-white hidden sm:block">
                    TaskiSpace
                  </h1>
                </Link>
              </>
            ) : (
              <Link href="/" className="flex items-center space-x-2">
                <div className="w-6 h-6 bg-primary rounded flex items-center justify-center">
                  <span className="text-white font-bold text-xs">T</span>
                </div>
                <h1 className="text-lg font-bold text-slate-900 dark:text-white hidden sm:block">
                  TaskiSpace
                </h1>
              </Link>
            )}
          </div>

          {/* Right side - Search, Notifications, Actions, Profile */}
          <div className="flex items-center gap-2">
            {loading ? (
              // Loading skeleton for right side
              <div className="flex items-center gap-2">
                <div className="hidden md:block w-48 h-9 bg-slate-200 dark:bg-slate-700 rounded-md animate-pulse"></div>
                <div className="w-9 h-9 bg-slate-200 dark:bg-slate-700 rounded-full animate-pulse"></div>
                <div className="hidden sm:block w-16 h-9 bg-slate-200 dark:bg-slate-700 rounded-md animate-pulse"></div>
                <div className="w-9 h-9 bg-slate-200 dark:bg-slate-700 rounded-full animate-pulse"></div>
                <div className="hidden lg:block w-9 h-9 bg-slate-200 dark:bg-slate-700 rounded-full animate-pulse"></div>
              </div>
            ) : user ? (
              // Authenticated User Actions
              <>
                {/* Search Bar - Desktop */}
                <div className="hidden md:block">
                  <SearchBar />
                </div>

                {/* Notifications */}
                <NotificationBell />

                {/* New button - Opens modal to create new task, workspace, etc. */}
                <div className="relative hidden sm:block" ref={dropdownRef}>
                  <Button variant="outline" size="sm" onClick={() => setCreateNewOpen(!createNewOpen)}>
                    <Plus className="h-4 w-4 mr-1" />
                    <span className="hidden lg:inline">New</span>
                  </Button>

                  {createNewOpen && (
                    <div className="absolute top-12 right-0 mt-2 w-48 bg-white dark:bg-slate-800 rounded-md shadow-lg py-1 z-50 border border-slate-200 dark:border-slate-700">
                      <Link href="/tasks/new" onClick={() => setCreateNewOpen(false)}>
                        <Button variant="ghost" className="w-full text-left justify-start text-sm px-3 py-2">
                          New Task
                        </Button>
                      </Link>
                      <Link href="/workspaces/new" onClick={() => setCreateNewOpen(false)}>
                        <Button variant="ghost" className="w-full text-left justify-start text-sm px-3 py-2">
                          New Workspace
                        </Button>
                      </Link>
                    </div>
                  )}
                </div>

                {/* Jarvis AI Bot */}
                <Jarvis />

                {/* User Menu - Desktop Only */}
                <div className="hidden lg:block">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" className="relative h-9 w-9 rounded-full p-0">
                        <Avatar className="h-9 w-9">
                          <AvatarImage
                            src={profile?.avatar_url || user?.user_metadata?.avatar_url}
                            alt={profile?.display_name || user?.user_metadata?.full_name}
                          />
                          <AvatarFallback className="bg-primary text-white text-xs">
                            {getInitials(
                              profile?.display_name ||
                              user?.user_metadata?.full_name ||
                              user?.email
                            )}
                          </AvatarFallback>
                        </Avatar>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="w-48" align="end" forceMount>
                      <div className="p-2">
                        <p className="text-sm font-medium truncate">
                          {profile?.display_name || user?.user_metadata?.full_name || 'User'}
                        </p>
                        <p className="text-xs text-muted-foreground truncate">
                          {profile ? `@${profile.user_name}` : user?.email}
                        </p>
                      </div>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem asChild>
                        <Link href={profile ? `/profiles/${profile.user_name}` : '/profile'}>
                          <User className="mr-2 h-4 w-4" />
                          Profile
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link href="/settings">
                          <Settings className="mr-2 h-4 w-4" />
                          Settings
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={handleSignOut}>
                        <LogOut className="mr-2 h-4 w-4" />
                        Sign out
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </>
            ) : (
              // Unauthenticated User Navigation
              <div className="flex items-center gap-2">
                <Link href="/auth/login">
                  <Button variant="ghost" size="sm">
                    Sign In
                  </Button>
                </Link>
                <Link href="/auth/signup">
                  <Button size="sm">
                    Sign Up
                  </Button>
                </Link>
              </div>
            )}
          </div>

        </div>
      </div>
    </header>
  )
}