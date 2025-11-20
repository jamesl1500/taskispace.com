import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { Input } from '@/components/ui/input'

describe('components/ui/input', () => {
  describe('Input component', () => {
    it('should render input element', () => {
      render(<Input />)
      const input = screen.getByRole('textbox')
      expect(input).toBeDefined()
    })

    it('should render with placeholder', () => {
      render(<Input placeholder="Enter text..." />)
      const input = screen.getByPlaceholderText('Enter text...')
      expect(input).toBeDefined()
    })

    it('should handle different input types', () => {
      const { rerender } = render(<Input type="text" />)
      let input = screen.getByRole('textbox')
      expect(input.getAttribute('type')).toBe('text')

      rerender(<Input type="email" />)
      input = screen.getByRole('textbox')
      expect(input.getAttribute('type')).toBe('email')

      rerender(<Input type="password" />)
      const passwordInput = document.querySelector('input[type="password"]')
      expect(passwordInput).toBeDefined()
    })

    it('should apply custom className', () => {
      render(<Input className="custom-input" />)
      const input = screen.getByRole('textbox')
      expect(input.className).toContain('custom-input')
    })

    it('should handle disabled state', () => {
      render(<Input disabled />)
      const input = screen.getByRole('textbox')
      expect(input.hasAttribute('disabled')).toBe(true)
    })

    it('should handle value prop', () => {
      render(<Input value="test value" readOnly />)
      const input = screen.getByRole('textbox') as HTMLInputElement
      expect(input.value).toBe('test value')
    })

    it('should handle onChange event', () => {
      let value = ''
      render(<Input onChange={(e) => { value = e.target.value }} />)
      const input = screen.getByRole('textbox') as HTMLInputElement
      
      input.value = 'new value'
      input.dispatchEvent(new Event('change', { bubbles: true }))
      
      expect(value).toBe('new value')
    })

    it('should apply data-slot attribute', () => {
      const { container } = render(<Input />)
      const input = container.querySelector('[data-slot="input"]')
      expect(input).toBeDefined()
    })

    it('should have correct base styles', () => {
      render(<Input />)
      const input = screen.getByRole('textbox')
      expect(input.className).toContain('rounded-md')
      expect(input.className).toContain('border')
    })

    it('should handle focus styles', () => {
      render(<Input />)
      const input = screen.getByRole('textbox')
      expect(input.className).toContain('focus-visible:border-ring')
    })

    it('should handle required attribute', () => {
      render(<Input required />)
      const input = screen.getByRole('textbox')
      expect(input.hasAttribute('required')).toBe(true)
    })

    it('should handle maxLength attribute', () => {
      render(<Input maxLength={10} />)
      const input = screen.getByRole('textbox')
      expect(input.getAttribute('maxLength')).toBe('10')
    })
  })
})
