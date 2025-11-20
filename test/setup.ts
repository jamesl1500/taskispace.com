/**
 * Vitest Test Setup Configuration
 * Configures global mocks and test environment for the entire test suite
 */

import '@testing-library/jest-dom'
import { beforeAll, vi } from 'vitest'

// ============================================================================
// Next.js Mocks
// ============================================================================

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    prefetch: vi.fn(),
    back: vi.fn(),
    forward: vi.fn(),
    refresh: vi.fn(),
    pathname: '/test',
  }),
  useSearchParams: () => new URLSearchParams(),
  usePathname: () => '/test',
  useParams: () => ({ id: 'test-id' }),
  redirect: vi.fn(),
  notFound: vi.fn(),
}))

// ============================================================================
// Supabase Mocks
// ============================================================================

const mockSupabaseAuth = {
  getUser: vi.fn().mockResolvedValue({ data: { user: null }, error: null }),
  getSession: vi.fn().mockResolvedValue({ data: { session: null }, error: null }),
  signIn: vi.fn().mockResolvedValue({ data: {}, error: null }),
  signOut: vi.fn().mockResolvedValue({ error: null }),
  signUp: vi.fn().mockResolvedValue({ data: {}, error: null }),
  onAuthStateChange: vi.fn(() => ({
    data: { subscription: { unsubscribe: vi.fn() } },
  })),
  resetPasswordForEmail: vi.fn().mockResolvedValue({ data: {}, error: null }),
  updateUser: vi.fn().mockResolvedValue({ data: {}, error: null }),
}

const mockSupabaseQuery = {
  select: vi.fn().mockReturnThis(),
  insert: vi.fn().mockReturnThis(),
  update: vi.fn().mockReturnThis(),
  delete: vi.fn().mockReturnThis(),
  upsert: vi.fn().mockReturnThis(),
  eq: vi.fn().mockReturnThis(),
  neq: vi.fn().mockReturnThis(),
  gt: vi.fn().mockReturnThis(),
  gte: vi.fn().mockReturnThis(),
  lt: vi.fn().mockReturnThis(),
  lte: vi.fn().mockReturnThis(),
  like: vi.fn().mockReturnThis(),
  ilike: vi.fn().mockReturnThis(),
  is: vi.fn().mockReturnThis(),
  in: vi.fn().mockReturnThis(),
  contains: vi.fn().mockReturnThis(),
  containedBy: vi.fn().mockReturnThis(),
  order: vi.fn().mockReturnThis(),
  limit: vi.fn().mockReturnThis(),
  range: vi.fn().mockReturnThis(),
  single: vi.fn().mockResolvedValue({ data: null, error: null }),
  maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
}

vi.mock('@/lib/supabase/client', () => ({
  createClient: () => ({
    auth: mockSupabaseAuth,
    from: () => mockSupabaseQuery,
    channel: vi.fn().mockReturnThis(),
    removeChannel: vi.fn(),
  }),
}))

vi.mock('@/lib/supabase/server', () => ({
  createClient: async () => ({
    auth: mockSupabaseAuth,
    from: () => mockSupabaseQuery,
  }),
}))

// ============================================================================
// React Query Mocks
// ============================================================================

vi.mock('@tanstack/react-query', () => ({
  useQuery: vi.fn(() => ({
    data: null,
    isLoading: false,
    error: null,
    refetch: vi.fn(),
  })),
  useMutation: vi.fn(() => ({
    mutate: vi.fn(),
    mutateAsync: vi.fn(),
    isPending: false,
    isSuccess: false,
    error: null,
  })),
  useQueryClient: vi.fn(() => ({
    invalidateQueries: vi.fn(),
    setQueryData: vi.fn(),
    getQueryData: vi.fn(),
    removeQueries: vi.fn(),
    clear: vi.fn(),
  })),
  QueryClient: vi.fn(() => ({
    invalidateQueries: vi.fn(),
    setQueryData: vi.fn(),
    getQueryData: vi.fn(),
    clear: vi.fn(),
  })),
  QueryClientProvider: ({ children }: { children: React.ReactNode }) => children,
}))

// ============================================================================
// Browser API Mocks
// ============================================================================

beforeAll(() => {
  // Mock ResizeObserver
  global.ResizeObserver = vi.fn().mockImplementation(() => ({
    observe: vi.fn(),
    unobserve: vi.fn(),
    disconnect: vi.fn(),
  }))
})