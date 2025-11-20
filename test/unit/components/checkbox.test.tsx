import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { Checkbox } from '@/components/ui/checkbox'

describe('components/ui/checkbox', () => {
  describe('Checkbox component', () => {
    it('should render checkbox', () => {
      const { container } = render(<Checkbox />)
      const checkbox = container.querySelector('button[role="checkbox"]')
      expect(checkbox).toBeDefined()
    })

    it('should handle checked state', () => {
      const { container } = render(<Checkbox checked={true} />)
      const checkbox = container.querySelector('button[role="checkbox"]')
      expect(checkbox?.getAttribute('data-state')).toBe('checked')
    })

    it('should handle unchecked state', () => {
      const { container } = render(<Checkbox checked={false} />)
      const checkbox = container.querySelector('button[role="checkbox"]')
      expect(checkbox?.getAttribute('data-state')).toBe('unchecked')
    })

    it('should handle disabled state', () => {
      const { container } = render(<Checkbox disabled />)
      const checkbox = container.querySelector('button[role="checkbox"]')
      expect(checkbox?.hasAttribute('disabled')).toBe(true)
    })

    it('should apply custom className', () => {
      const { container } = render(<Checkbox className="custom-checkbox" />)
      const checkbox = container.querySelector('button[role="checkbox"]')
      expect(checkbox?.className).toContain('custom-checkbox')
    })

    it('should handle onCheckedChange callback', () => {
      let checked = false
      const { container } = render(
        <Checkbox onCheckedChange={(value) => { checked = value as boolean }} />
      )
      const checkbox = container.querySelector('button[role="checkbox"]')
      checkbox?.click()
      expect(checked).toBe(true)
    })
  })
})
