import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook } from '@testing-library/react'
import { useDebounce } from '@/hooks/useDebounce'

describe('hooks/useDebounce', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.clearAllTimers()
    vi.useRealTimers()
  })

  describe('useDebounce hook', () => {
    it('should return initial value immediately', () => {
      const { result } = renderHook(() => useDebounce('initial', 500))
      expect(result.current).toBe('initial')
    })

    it('should debounce value changes with real timers', async () => {
      vi.useRealTimers()
      
      const { result, rerender } = renderHook(
        ({ value, delay }) => useDebounce(value, delay),
        { initialProps: { value: 'initial', delay: 100 } }
      )

      expect(result.current).toBe('initial')

      // Change the value
      rerender({ value: 'updated', delay: 100 })

      // Value should not change immediately
      expect(result.current).toBe('initial')

      // Wait for debounce
      await new Promise(resolve => setTimeout(resolve, 150))

      // Value should be updated
      expect(result.current).toBe('updated')
    })

    it('should handle numeric values', () => {
      const { result } = renderHook(() => useDebounce(42, 500))
      expect(result.current).toBe(42)
      expect(typeof result.current).toBe('number')
    })

    it('should handle object values', () => {
      const obj = { name: 'John', age: 30 }
      const { result } = renderHook(() => useDebounce(obj, 500))
      expect(result.current).toEqual(obj)
    })

    it('should handle boolean values', () => {
      const { result } = renderHook(() => useDebounce(true, 500))
      expect(result.current).toBe(true)
    })

    it('should cleanup timeout on unmount', () => {
      const { unmount } = renderHook(() => useDebounce('value', 500))
      
      // Should not throw error on unmount
      expect(() => unmount()).not.toThrow()
    })
  })
})
