# Test Suite Documentation

## Overview

Comprehensive test suite for Taskispace.com covering all major features and functionalities.

## Test Structure

```
test/
├── setup.ts                        # Global test configuration and mocks
├── features/                       # Feature-specific tests
│   ├── auth.test.ts               # Authentication system tests
│   ├── tasks.test.ts              # Task management tests
│   ├── workspaces.test.ts         # Workspace functionality tests
│   ├── conversations.test.ts      # Conversation system tests
│   ├── notifications.test.ts      # Notification system tests
│   ├── search.test.ts             # Search functionality tests
│   ├── jarvis.test.ts             # Jarvis AI assistant tests
│   └── profiles-timeline.test.ts  # Profile and timeline tests
├── integration/                    # Integration tests
│   └── workflows.test.ts          # End-to-end workflow tests
└── components/                     # Component tests
    └── ui.test.ts                 # UI component tests
```

## Running Tests

### All Tests
```bash
npm test
```

### Watch Mode
```bash
npm run test:watch
```

### With UI
```bash
npm run test:ui
```

### Coverage Report
```bash
npm run test:coverage
```

### Specific Test File
```bash
npx vitest test/features/tasks.test.ts
```

### Specific Test Suite
```bash
npx vitest -t "Tasks Management"
```

## Test Coverage

### Feature Tests

#### 1. **Authentication** (`auth.test.ts`)
- ✅ User authentication state management
- ✅ Sign in functionality
- ✅ Sign up with validation
- ✅ Sign out operations
- ✅ Session management
- ✅ Password reset
- ✅ Email verification
- ✅ Auth state change listeners

#### 2. **Tasks** (`tasks.test.ts`)
- ✅ Task CRUD operations (Create, Read, Update, Delete)
- ✅ Task filtering by status, priority, due date
- ✅ Task assignments
- ✅ Task status transitions
- ✅ Task validation
- ✅ Subtasks management
- ✅ Task comments
- ✅ Task collaborators
- ✅ Task tags

#### 3. **Workspaces** (`workspaces.test.ts`)
- ✅ Workspace CRUD operations
- ✅ Workspace members management
- ✅ Workspace lists
- ✅ Workspace permissions

#### 4. **Conversations** (`conversations.test.ts`)
- ✅ Conversation CRUD operations
- ✅ Message sending and retrieval
- ✅ Message editing and deletion
- ✅ Conversation members
- ✅ Real-time updates

#### 5. **Notifications** (`notifications.test.ts`)
- ✅ Notification retrieval with filters
- ✅ Mark as read/unread
- ✅ Delete notifications
- ✅ Notification statistics
- ✅ Notification preferences
- ✅ Different notification types (task_assigned, task_comment, mention)

#### 6. **Search** (`search.test.ts`)
- ✅ Global search across resources
- ✅ Task search with filters
- ✅ User search
- ✅ Workspace search
- ✅ Search pagination
- ✅ Multiple filters
- ✅ Recent searches

#### 7. **Jarvis AI** (`jarvis.test.ts`)
- ✅ Jarvis conversation management
- ✅ AI message interactions
- ✅ Conversation history
- ✅ Usage statistics
- ✅ Context awareness

#### 8. **Profiles & Timeline** (`profiles-timeline.test.ts`)
- ✅ Profile management
- ✅ Profile validation
- ✅ User activity
- ✅ Timeline feed (posts, likes, comments)
- ✅ Dashboard statistics
- ✅ Explore page (new users, community posts)

### Integration Tests (`workflows.test.ts`)

- ✅ Complete task workflow (create → comment → complete)
- ✅ Workspace creation with tasks and lists
- ✅ Conversation workflow (create → add members → send messages)
- ✅ Notification workflow (receive → read → delete)
- ✅ Search and navigation integration
- ✅ Jarvis AI integration
- ✅ Error handling (401, 404, 500, network errors)
- ✅ Performance tests (bulk operations, concurrent requests)

### Component Tests (`ui.test.ts`)

- ✅ Button component with variants and sizes
- ✅ Card components
- ✅ Dialog state management
- ✅ Form validation
- ✅ Badge variants
- ✅ Avatar with fallback
- ✅ Progress calculations
- ✅ Skeleton loaders
- ✅ Dropdown menus
- ✅ Tabs switching
- ✅ Toast notifications
- ✅ Date formatting
- ✅ Icon components
- ✅ Command palette
- ✅ Drag and drop
- ✅ Local storage operations

## Test Utilities

### Global Mocks

#### Next.js Navigation
```typescript
useRouter()      // Mocked router with push, replace, etc.
usePathname()    // Returns '/test'
useSearchParams() // Returns empty URLSearchParams
useParams()      // Returns { id: 'test-id' }
```

#### Supabase Client
```typescript
createClient().auth        // Mocked auth methods
createClient().from()      // Mocked query builder
```

#### React Query
```typescript
useQuery()       // Mocked with default return values
useMutation()    // Mocked mutation hook
useQueryClient() // Mocked client with cache methods
```

### Mock Fetch

All tests use mocked `fetch` for API calls:

```typescript
mockFetch.mockResolvedValueOnce({
  ok: true,
  json: async () => ({ data: 'mock data' }),
} as Response)
```

## Writing New Tests

### Feature Test Template

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest'

global.fetch = vi.fn()
const mockFetch = global.fetch as ReturnType<typeof vi.fn>

describe('Feature Name', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockFetch.mockReset()
  })

  describe('Specific Functionality', () => {
    it('should do something', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ result: 'success' }),
      } as Response)

      const response = await fetch('/api/endpoint')
      const data = await response.json()

      expect(data.result).toBe('success')
    })
  })
})
```

### Integration Test Template

```typescript
describe('Integration Tests - Feature Flow', () => {
  it('should complete multi-step workflow', async () => {
    // Step 1: Initial setup
    mockFetch.mockResolvedValueOnce({ /* ... */ })
    const step1Response = await fetch('/api/step1', { /* ... */ })
    
    // Step 2: Follow-up action
    mockFetch.mockResolvedValueOnce({ /* ... */ })
    const step2Response = await fetch('/api/step2', { /* ... */ })
    
    // Assertions
    expect(step1Response.ok).toBe(true)
    expect(step2Response.ok).toBe(true)
  })
})
```

## Best Practices

1. **Isolation**: Each test should be independent
2. **Clear Names**: Use descriptive test names
3. **Arrange-Act-Assert**: Follow AAA pattern
4. **Mock Reset**: Always reset mocks in `beforeEach`
5. **Async Handling**: Use `async/await` for asynchronous operations
6. **Type Safety**: Leverage TypeScript for type-safe tests
7. **Coverage**: Aim for >80% code coverage
8. **Fast Tests**: Keep tests fast by using mocks

## Common Patterns

### Testing API Endpoints
```typescript
mockFetch.mockResolvedValueOnce({
  ok: true,
  json: async () => ({ data: mockData }),
} as Response)

const response = await fetch('/api/endpoint')
const result = await response.json()

expect(result.data).toBeDefined()
```

### Testing Error Handling
```typescript
mockFetch.mockResolvedValueOnce({
  ok: false,
  status: 404,
  json: async () => ({ error: 'Not found' }),
} as Response)

const response = await fetch('/api/endpoint')
expect(response.status).toBe(404)
```

### Testing Mutations
```typescript
mockFetch.mockResolvedValueOnce({
  ok: true,
  json: async () => ({ success: true }),
} as Response)

const response = await fetch('/api/endpoint', {
  method: 'POST',
  body: JSON.stringify(data),
})

expect(response.ok).toBe(true)
```

## Continuous Integration

Tests run automatically on:
- ✅ Pull requests
- ✅ Push to main branch
- ✅ Pre-deployment checks

## Coverage Goals

- **Statements**: >80%
- **Branches**: >75%
- **Functions**: >80%
- **Lines**: >80%

## Troubleshooting

### Tests Failing?
1. Check mock setup in `test/setup.ts`
2. Verify fetch is properly mocked
3. Ensure async operations use `await`
4. Clear mock calls in `beforeEach`

### Timeout Errors?
```typescript
it('should handle long operation', async () => {
  // Increase timeout for specific test
  vi.setConfig({ testTimeout: 10000 })
  // ... test code
}, 10000)
```

### Mock Not Working?
```typescript
// Reset and reconfigure mock
beforeEach(() => {
  vi.clearAllMocks()
  mockFetch.mockReset()
})
```

## Contributing

When adding new features:
1. Write tests first (TDD approach)
2. Ensure tests pass locally
3. Add integration tests for complex flows
4. Update this documentation
5. Run coverage report

## Resources

- [Vitest Documentation](https://vitest.dev/)
- [Testing Library](https://testing-library.com/)
- [Jest DOM](https://github.com/testing-library/jest-dom)
