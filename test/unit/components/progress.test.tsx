import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { Progress } from '@/components/ui/progress'

describe('components/ui/progress', () => {
  describe('Progress component', () => {
    it('should render progress bar', () => {
      const { container } = render(<Progress value={50} />)
      const progress = container.querySelector('[role="progressbar"]')
      expect(progress).toBeDefined()
    })

    it('should display correct value', () => {
      const { container } = render(<Progress value={75} />)
      const progress = container.querySelector('[role="progressbar"]')
      expect(progress?.getAttribute('aria-valuenow')).toBe('75')
    })

    it('should handle 0% value', () => {
      const { container } = render(<Progress value={0} />)
      const progress = container.querySelector('[role="progressbar"]')
      expect(progress?.getAttribute('aria-valuenow')).toBe('0')
    })

    it('should handle 100% value', () => {
      const { container } = render(<Progress value={100} />)
      const progress = container.querySelector('[role="progressbar"]')
      expect(progress?.getAttribute('aria-valuenow')).toBe('100')
    })

    it('should apply custom className', () => {
      const { container } = render(<Progress value={50} className="custom-progress" />)
      const progress = container.querySelector('.custom-progress')
      expect(progress).toBeDefined()
    })

    it('should have correct ARIA attributes', () => {
      const { container } = render(<Progress value={60} />)
      const progress = container.querySelector('[role="progressbar"]')
      expect(progress?.getAttribute('aria-valuemin')).toBe('0')
      expect(progress?.getAttribute('aria-valuemax')).toBe('100')
    })

    it('should handle undefined value', () => {
      const { container } = render(<Progress />)
      const progress = container.querySelector('[role="progressbar"]')
      expect(progress).toBeDefined()
    })

    it('should render with correct base styles', () => {
      const { container } = render(<Progress value={50} />)
      const progress = container.querySelector('[role="progressbar"]')
      expect(progress?.className).toContain('relative')
    })
  })
})
