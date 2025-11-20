import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { Button } from '@/components/ui/button'

describe('components/ui/button', () => {
  describe('Button component', () => {
    it('should render button with text', () => {
      render(<Button>Click me</Button>)
      expect(screen.getByText('Click me')).toBeDefined()
    })

    it('should render with default variant', () => {
      render(<Button>Default</Button>)
      const button = screen.getByText('Default')
      expect(button.className).toContain('bg-primary')
    })

    it('should render destructive variant', () => {
      render(<Button variant="destructive">Delete</Button>)
      const button = screen.getByText('Delete')
      expect(button.className).toContain('bg-destructive')
    })

    it('should render outline variant', () => {
      render(<Button variant="outline">Outline</Button>)
      const button = screen.getByText('Outline')
      expect(button.className).toContain('border')
    })

    it('should render secondary variant', () => {
      render(<Button variant="secondary">Secondary</Button>)
      const button = screen.getByText('Secondary')
      expect(button.className).toContain('bg-secondary')
    })

    it('should render ghost variant', () => {
      render(<Button variant="ghost">Ghost</Button>)
      const button = screen.getByText('Ghost')
      expect(button.className).toContain('hover:bg-accent')
    })

    it('should render link variant', () => {
      render(<Button variant="link">Link</Button>)
      const button = screen.getByText('Link')
      expect(button.className).toContain('underline')
    })

    it('should handle different sizes', () => {
      const { rerender } = render(<Button size="sm">Small</Button>)
      expect(screen.getByText('Small').className).toContain('h-8')

      rerender(<Button size="lg">Large</Button>)
      expect(screen.getByText('Large').className).toContain('h-10')

      rerender(<Button size="icon">Icon</Button>)
      expect(screen.getByText('Icon').className).toContain('size-9')
    })

    it('should handle disabled state', () => {
      render(<Button disabled>Disabled</Button>)
      const button = screen.getByText('Disabled')
      expect(button).toHaveProperty('disabled', true)
      expect(button.className).toContain('disabled:opacity-50')
    })

    it('should apply custom className', () => {
      render(<Button className="custom-class">Custom</Button>)
      const button = screen.getByText('Custom')
      expect(button.className).toContain('custom-class')
    })

    it('should handle onClick events', () => {
      let clicked = false
      render(<Button onClick={() => { clicked = true }}>Click</Button>)
      const button = screen.getByText('Click')
      button.click()
      expect(clicked).toBe(true)
    })

    it('should render as child when asChild is true', () => {
      render(
        <Button asChild>
          <a href="/test">Link Button</a>
        </Button>
      )
      const link = screen.getByText('Link Button')
      expect(link.tagName).toBe('A')
    })
  })
})
