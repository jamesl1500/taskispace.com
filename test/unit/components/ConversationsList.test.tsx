import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { ConversationsList } from '@/components/conversations/ConversationsList'
import type { Conversation } from '@/types/conversations'

// Mock Next.js Link
vi.mock('next/link', () => ({
  default: ({ children, href }: any) => <a href={href}>{children}</a>
}))

describe('components/conversations/ConversationsList', () => {
  const mockConversations: Conversation[] = [
    {
      id: '1',
      title: 'Project Discussion',
      description: 'Discussing the new project timeline',
      created_by: 'user1',
      created_at: new Date('2025-11-18T10:00:00Z').toISOString(),
      updated_at: new Date('2025-11-19T15:30:00Z').toISOString(),
      member_count: 5,
      last_message: {
        id: 'msg1',
        content: 'We need to review the requirements',
        sender_id: 'user2',
        created_at: new Date().toISOString()
      }
    },
    {
      id: '2',
      title: 'Team Standup',
      description: 'Daily standup notes',
      created_by: 'user1',
      created_at: new Date('2025-11-15T09:00:00Z').toISOString(),
      updated_at: new Date('2025-11-19T09:00:00Z').toISOString(),
      member_count: 3
    }
  ]

  describe('ConversationsList component', () => {
    it('should render list of conversations', () => {
      render(<ConversationsList conversations={mockConversations} />)
      
      expect(screen.getByText('Project Discussion')).toBeDefined()
      expect(screen.getByText('Team Standup')).toBeDefined()
    })

    it('should render conversation descriptions', () => {
      render(<ConversationsList conversations={mockConversations} />)
      
      expect(screen.getByText('Discussing the new project timeline')).toBeDefined()
      expect(screen.getByText('Daily standup notes')).toBeDefined()
    })

    it('should render member counts', () => {
      render(<ConversationsList conversations={mockConversations} />)
      
      const memberBadges = screen.getAllByText(/\d+/)
      expect(memberBadges.length).toBeGreaterThan(0)
    })

    it('should render last message when available', () => {
      render(<ConversationsList conversations={mockConversations} />)
      
      expect(screen.getByText(/We need to review the requirements/)).toBeDefined()
    })

    it('should render links to conversation pages', () => {
      const { container } = render(<ConversationsList conversations={mockConversations} />)
      
      const links = container.querySelectorAll('a[href^="/conversations/"]')
      expect(links.length).toBe(2)
      expect(links[0].getAttribute('href')).toBe('/conversations/1')
      expect(links[1].getAttribute('href')).toBe('/conversations/2')
    })

    it('should render "Untitled Conversation" for missing titles', () => {
      const conversationWithoutTitle: Conversation = {
        ...mockConversations[0],
        id: '3',
        title: ''
      }

      render(<ConversationsList conversations={[conversationWithoutTitle]} />)
      
      expect(screen.getByText('Untitled Conversation')).toBeDefined()
    })

    it('should format dates correctly', () => {
      render(<ConversationsList conversations={mockConversations} />)
      
      // Should render some date representation
      const { container } = render(<ConversationsList conversations={mockConversations} />)
      const dateElements = container.querySelectorAll('.flex.items-center.gap-1')
      expect(dateElements.length).toBeGreaterThan(0)
    })

    it('should return null for empty conversations array', () => {
      const { container } = render(<ConversationsList conversations={[]} />)
      expect(container.firstChild).toBeNull()
    })

    it('should return null for undefined conversations', () => {
      const { container } = render(<ConversationsList conversations={undefined as any} />)
      expect(container.firstChild).toBeNull()
    })

    it('should apply hover styles to cards', () => {
      const { container } = render(<ConversationsList conversations={mockConversations} />)
      
      const cards = container.querySelectorAll('.hover\\:bg-slate-50')
      expect(cards.length).toBe(2)
    })

    it('should render calendar icons', () => {
      const { container } = render(<ConversationsList conversations={mockConversations} />)
      
      // Calendar icons should be present
      const svgs = container.querySelectorAll('svg')
      expect(svgs.length).toBeGreaterThan(0)
    })
  })
})
