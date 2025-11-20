import { describe, it, expect } from 'vitest'
import { cn } from '@/lib/utils'

describe('lib/utils', () => {
  describe('cn() utility', () => {
    it('should merge class names', () => {
      const result = cn('class1', 'class2')
      expect(result).toContain('class1')
      expect(result).toContain('class2')
    })

    it('should handle conditional classes', () => {
      const result = cn('base', false && 'hidden', true && 'visible')
      expect(result).toContain('base')
      expect(result).toContain('visible')
      expect(result).not.toContain('hidden')
    })

    it('should merge tailwind classes correctly', () => {
      const result = cn('px-2', 'px-4')
      // Should only keep px-4 due to tailwind-merge
      expect(result).toBe('px-4')
    })

    it('should handle arrays of classes', () => {
      const result = cn(['class1', 'class2'], 'class3')
      expect(result).toContain('class1')
      expect(result).toContain('class2')
      expect(result).toContain('class3')
    })

    it('should handle empty or undefined values', () => {
      const result = cn('base', undefined, null, '', 'end')
      expect(result).toContain('base')
      expect(result).toContain('end')
    })

    it('should handle object syntax', () => {
      const result = cn('base', {
        active: true,
        disabled: false,
      })
      expect(result).toContain('base')
      expect(result).toContain('active')
      expect(result).not.toContain('disabled')
    })
  })
})
