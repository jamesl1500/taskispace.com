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
import { User, LogOut, Settings, Plus, Menu, Bell, Bot } from 'lucide-react'
import { useState } from 'react'
import { SearchBar } from '@/components/search/SearchBar'
import { NotificationBell } from '@/components/notifications/NotificationBell'
import { Jarvis } from './Jarvis'

export default function Header() {
  const { user, profile, loading } = useAuthWithProfile()
  const { mutate: signOut } = useSignOut()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const handleSignOut = () => {
    signOut()
  }

  const getInitials = (name: string | undefined) => {
    if (!name) return 'U'
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
  }

  return (
    <header className="bg-white dark:bg-slate-800 shadow-sm border-b border-slate-200 dark:border-slate-700">
      <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-6">
        <div className="flex justify-between items-center h-12">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-2">
            <div className="w-6 h-6 bg-primary rounded flex items-center justify-center">
              <span className="text-white font-bold text-xs">T</span>
            </div>
            <h1 className="text-lg font-bold text-slate-900 dark:text-white hidden sm:block">
              TaskiSpace
            </h1>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden lg:flex items-center space-x-2">
            {loading ? (
              <div className="w-6 h-6 bg-slate-200 dark:bg-slate-700 rounded-full animate-pulse"></div>
            ) : user ? (
              // Authenticated User Navigation
              <>
                <nav className="flex space-x-0.5">
                  <Link href="/timeline">
                    <Button variant="ghost" size="sm" className="text-xs px-2">
                      Timeline
                    </Button>
                  </Link>
                  <Link href="/tasks">
                    <Button variant="ghost" size="sm" className="text-xs px-2">
                      Tasks
                    </Button>
                  </Link>
                  <Link href="/conversations">
                    <Button variant="ghost" size="sm" className="text-xs px-2">
                      Conversations
                    </Button>
                  </Link>
                </nav>

                {/* Search Bar */}
                <SearchBar />

                {/* Notifications */}
                <NotificationBell />

                <Button variant="outline" size="sm" className="text-xs px-2">
                  <Plus className="h-3 w-3 mr-1" />
                  New
                </Button>

                {/* Jarvis AI Bot */}
                <Jarvis />

                {/* User Menu */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="relative h-8 w-8 rounded-full p-0">
                      <Avatar className="h-8 w-8">
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
                      <Link href="/notifications">
                        <Bell className="mr-2 h-4 w-4" />
                        Notifications
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
              </>
            ) : (
              // Unauthenticated User Navigation
              <div className="flex items-center space-x-1">
                <Link href="/auth/login">
                  <Button variant="ghost" size="sm" className="text-xs">
                    Sign In
                  </Button>
                </Link>
                <Link href="/auth/signup">
                  <Button size="sm" className="text-xs">
                    Sign Up
                  </Button>
                </Link>
              </div>
            )}
          </div>

          {/* Mobile Menu Button */}
          <div className="lg:hidden flex items-center space-x-2">
            {user && <NotificationBell />}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-1"
            >
              <Menu className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {mobileMenuOpen && (
          <div className="lg:hidden border-t border-slate-200 dark:border-slate-700 py-2">
            {loading ? (
              <div className="flex justify-center py-2">
                <div className="w-4 h-4 bg-slate-200 dark:bg-slate-700 rounded-full animate-pulse"></div>
              </div>
            ) : user ? (
              // Authenticated Mobile Menu
              <div className="space-y-1">
                <div className="flex items-center space-x-2 px-3 py-1">
                  <Avatar className="h-6 w-6">
                    <AvatarImage src={profile?.avatar_url || user.user_metadata?.avatar_url} alt={profile?.display_name || user.user_metadata?.full_name} />
                    <AvatarFallback className="bg-primary text-white text-xs">
                      {getInitials(profile?.display_name || user.user_metadata?.full_name || user.email)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-900 dark:text-white truncate">
                      {profile?.display_name || user.user_metadata?.full_name || 'User'}
                    </p>
                  </div>
                </div>
                <nav className="space-y-0.5">
                  <Link
                    href="/timeline"
                    className="block px-3 py-1.5 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 text-sm"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Timeline
                  </Link>
                  <Link
                    href="/workspaces"
                    className="block px-3 py-1.5 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 text-sm"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Workspaces
                  </Link>
                  <Link
                    href="/tasks"
                    className="block px-3 py-1.5 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 text-sm"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Tasks
                  </Link>
                  <Link
                    href="/conversations"
                    className="block px-3 py-1.5 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 text-sm"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Conversations
                  </Link>
                  <Link
                    href="/notifications"
                    className="block px-3 py-1.5 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 text-sm"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Notifications
                  </Link>
                  <Link
                    href="/settings/profile"
                    className="block px-3 py-1.5 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 text-sm"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Settings
                  </Link>
                  <button
                    onClick={() => {
                      handleSignOut()
                      setMobileMenuOpen(false)
                    }}
                    className="block w-full text-left px-3 py-1.5 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 text-sm"
                  >
                    Sign out
                  </button>
                </nav>
              </div>
            ) : (
              // Unauthenticated Mobile Menu
              <div className="space-y-0.5">
                <Link
                  href="/auth/login"
                  className="block px-3 py-1.5 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 text-sm"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Sign In
                </Link>
                <Link
                  href="/auth/signup"
                  className="block px-3 py-1.5 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 text-sm"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Sign Up
                </Link>
              </div>
            )}
          </div>
        )}
      </div>
    </header>
  )
}