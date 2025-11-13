/**
 * QueryProvider component to provide React Query client to the application.
 * 
 * This component wraps the application with QueryClientProvider to enable
 * React Query functionality throughout the app.
 * 
 * @module components/providers/QueryProvider
 */
'use client'

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { useState } from 'react'

interface QueryProviderProps {
  children: React.ReactNode
}

export default function QueryProvider({ children }: QueryProviderProps) {
  // Create a new QueryClient instance for each provider instance
  // This ensures that each client-side navigation creates a fresh client
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: {
      queries: {
        // With SSR, we usually want to set some default stale time
        // above 0 to avoid refetching immediately on the client
        staleTime: 60 * 1000, // 1 minute
        retry: (failureCount) => {
          // Retry up to 3 times for any errors
          return failureCount < 3
        }
      }
    }
  }))

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  )
}