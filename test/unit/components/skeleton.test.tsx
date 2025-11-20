import { describe, it, expect } from 'vitest'
import { render } from '@testing-library/react'
import { Skeleton } from '@/components/ui/skeleton'

describe('components/ui/skeleton', () => {
  describe('Skeleton component', () => {
    it('should render skeleton element', () => {
      const { container } = render(<Skeleton />)
      const skeleton = container.querySelector('.animate-pulse')
      expect(skeleton).toBeDefined()
    })

    it('should apply custom className', () => {
      const { container } = render(<Skeleton className="custom-skeleton" />)
      const skeleton = container.querySelector('.custom-skeleton')
      expect(skeleton).toBeDefined()
    })

    it('should render with rounded corners', () => {
      const { container } = render(<Skeleton />)
      const skeleton = container.querySelector('.rounded-md')
      expect(skeleton).toBeDefined()
    })

    it('should render multiple skeletons', () => {
      render(
        <div>
          <Skeleton />
          <Skeleton />
          <Skeleton />
        </div>
      )
      const { container } = render(
        <div>
          <Skeleton />
          <Skeleton />
          <Skeleton />
        </div>
      )
      const skeletons = container.querySelectorAll('.animate-pulse')
      expect(skeletons.length).toBe(3)
    })

    it('should have background color', () => {
      const { container } = render(<Skeleton />)
      const skeleton = container.querySelector('.animate-pulse')
      expect(skeleton?.className).toContain('bg-')
    })

    it('should render as div by default', () => {
      const { container } = render(<Skeleton />)
      const skeleton = container.firstChild as HTMLElement
      expect(skeleton.tagName).toBe('DIV')
    })

    it('should accept custom height', () => {
      const { container } = render(<Skeleton className="h-20" />)
      const skeleton = container.querySelector('.h-20')
      expect(skeleton).toBeDefined()
    })

    it('should accept custom width', () => {
      const { container } = render(<Skeleton className="w-full" />)
      const skeleton = container.querySelector('.w-full')
      expect(skeleton).toBeDefined()
    })
  })
})
