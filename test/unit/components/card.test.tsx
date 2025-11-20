import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card'

describe('components/ui/card', () => {
  describe('Card components', () => {
    it('should render card with content', () => {
      render(
        <Card>
          <CardContent>Card content</CardContent>
        </Card>
      )
      expect(screen.getByText('Card content')).toBeDefined()
    })

    it('should render card with header', () => {
      render(
        <Card>
          <CardHeader>
            <CardTitle>Card Title</CardTitle>
          </CardHeader>
        </Card>
      )
      expect(screen.getByText('Card Title')).toBeDefined()
    })

    it('should render card with description', () => {
      render(
        <Card>
          <CardHeader>
            <CardDescription>Card description text</CardDescription>
          </CardHeader>
        </Card>
      )
      expect(screen.getByText('Card description text')).toBeDefined()
    })

    it('should render card with footer', () => {
      render(
        <Card>
          <CardFooter>Footer content</CardFooter>
        </Card>
      )
      expect(screen.getByText('Footer content')).toBeDefined()
    })

    it('should render complete card structure', () => {
      render(
        <Card>
          <CardHeader>
            <CardTitle>Title</CardTitle>
            <CardDescription>Description</CardDescription>
          </CardHeader>
          <CardContent>Content</CardContent>
          <CardFooter>Footer</CardFooter>
        </Card>
      )
      expect(screen.getByText('Title')).toBeDefined()
      expect(screen.getByText('Description')).toBeDefined()
      expect(screen.getByText('Content')).toBeDefined()
      expect(screen.getByText('Footer')).toBeDefined()
    })

    it('should apply custom className to Card', () => {
      render(<Card className="custom-card">Content</Card>)
      const card = screen.getByText('Content').parentElement
      expect(card?.className).toContain('custom-card')
    })

    it('should apply border and background styles', () => {
      render(<Card>Test</Card>)
      const card = screen.getByText('Test').parentElement
      expect(card?.className).toContain('rounded-xl')
      expect(card?.className).toContain('border')
    })
  })
})
