import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'

describe('components/ui/avatar', () => {
  describe('Avatar component', () => {
    it('should render avatar container', () => {
      render(
        <Avatar>
          <AvatarFallback>JD</AvatarFallback>
        </Avatar>
      )
      expect(screen.getByText('JD')).toBeDefined()
    })

    it('should render avatar with image', () => {
      render(
        <Avatar>
          <AvatarImage src="/avatar.jpg" alt="User avatar" />
          <AvatarFallback>JD</AvatarFallback>
        </Avatar>
      )
      const image = screen.getByAltText('User avatar')
      expect(image).toBeDefined()
      expect(image.getAttribute('src')).toBe('/avatar.jpg')
    })

    it('should show fallback when image fails to load', () => {
      render(
        <Avatar>
          <AvatarImage src="/invalid.jpg" alt="User avatar" />
          <AvatarFallback>JD</AvatarFallback>
        </Avatar>
      )
      // Fallback should be in the DOM
      expect(screen.getByText('JD')).toBeDefined()
    })

    it('should apply custom className to Avatar', () => {
      const { container } = render(
        <Avatar className="custom-avatar">
          <AvatarFallback>JD</AvatarFallback>
        </Avatar>
      )
      const avatar = container.querySelector('[data-slot="avatar"]')
      expect(avatar?.className).toContain('custom-avatar')
    })

    it('should apply rounded-full class', () => {
      const { container } = render(
        <Avatar>
          <AvatarFallback>JD</AvatarFallback>
        </Avatar>
      )
      const avatar = container.querySelector('[data-slot="avatar"]')
      expect(avatar?.className).toContain('rounded-full')
    })

    it('should apply size-8 class by default', () => {
      const { container } = render(
        <Avatar>
          <AvatarFallback>JD</AvatarFallback>
        </Avatar>
      )
      const avatar = container.querySelector('[data-slot="avatar"]')
      expect(avatar?.className).toContain('size-8')
    })

    it('should render fallback with initials', () => {
      render(
        <Avatar>
          <AvatarFallback>AB</AvatarFallback>
        </Avatar>
      )
      expect(screen.getByText('AB')).toBeDefined()
    })

    it('should apply custom className to AvatarFallback', () => {
      const { container } = render(
        <Avatar>
          <AvatarFallback className="custom-fallback">JD</AvatarFallback>
        </Avatar>
      )
      const fallback = container.querySelector('[data-slot="avatar-fallback"]')
      expect(fallback?.className).toContain('custom-fallback')
    })
  })
})
