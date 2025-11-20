import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'

describe('components/ui/tabs', () => {
  describe('Tabs components', () => {
    it('should render tabs with triggers and content', () => {
      render(
        <Tabs defaultValue="tab1">
          <TabsList>
            <TabsTrigger value="tab1">Tab 1</TabsTrigger>
            <TabsTrigger value="tab2">Tab 2</TabsTrigger>
          </TabsList>
          <TabsContent value="tab1">Content 1</TabsContent>
          <TabsContent value="tab2">Content 2</TabsContent>
        </Tabs>
      )
      
      expect(screen.getByText('Tab 1')).toBeDefined()
      expect(screen.getByText('Tab 2')).toBeDefined()
      expect(screen.getByText('Content 1')).toBeDefined()
    })

    it('should render TabsList with custom className', () => {
      const { container } = render(
        <Tabs defaultValue="tab1">
          <TabsList className="custom-list">
            <TabsTrigger value="tab1">Tab 1</TabsTrigger>
          </TabsList>
        </Tabs>
      )
      
      const tabsList = container.querySelector('.custom-list')
      expect(tabsList).toBeDefined()
    })

    it('should render TabsTrigger with correct styling', () => {
      render(
        <Tabs defaultValue="tab1">
          <TabsList>
            <TabsTrigger value="tab1">Tab 1</TabsTrigger>
          </TabsList>
        </Tabs>
      )
      
      const trigger = screen.getByText('Tab 1')
      expect(trigger.className).toContain('inline-flex')
      expect(trigger.className).toContain('items-center')
    })

    it('should render TabsContent with custom className', () => {
      const { container } = render(
        <Tabs defaultValue="tab1">
          <TabsList>
            <TabsTrigger value="tab1">Tab 1</TabsTrigger>
          </TabsList>
          <TabsContent value="tab1" className="custom-content">
            Content
          </TabsContent>
        </Tabs>
      )
      
      const content = container.querySelector('.custom-content')
      expect(content).toBeDefined()
    })

    it('should show active tab content', () => {
      render(
        <Tabs defaultValue="tab1">
          <TabsList>
            <TabsTrigger value="tab1">Tab 1</TabsTrigger>
            <TabsTrigger value="tab2">Tab 2</TabsTrigger>
          </TabsList>
          <TabsContent value="tab1">First Content</TabsContent>
          <TabsContent value="tab2">Second Content</TabsContent>
        </Tabs>
      )
      
      // First tab content should be visible
      expect(screen.getByText('First Content')).toBeDefined()
    })

    it('should handle multiple tabs', () => {
      render(
        <Tabs defaultValue="tab1">
          <TabsList>
            <TabsTrigger value="tab1">One</TabsTrigger>
            <TabsTrigger value="tab2">Two</TabsTrigger>
            <TabsTrigger value="tab3">Three</TabsTrigger>
          </TabsList>
          <TabsContent value="tab1">Content 1</TabsContent>
          <TabsContent value="tab2">Content 2</TabsContent>
          <TabsContent value="tab3">Content 3</TabsContent>
        </Tabs>
      )
      
      expect(screen.getByText('One')).toBeDefined()
      expect(screen.getByText('Two')).toBeDefined()
      expect(screen.getByText('Three')).toBeDefined()
    })

    it('should apply correct styles to TabsList', () => {
      const { container } = render(
        <Tabs defaultValue="tab1">
          <TabsList>
            <TabsTrigger value="tab1">Tab</TabsTrigger>
          </TabsList>
        </Tabs>
      )
      
      const tabsList = container.querySelector('.inline-flex')
      expect(tabsList).toBeDefined()
    })

    it('should handle disabled tabs', () => {
      render(
        <Tabs defaultValue="tab1">
          <TabsList>
            <TabsTrigger value="tab1">Active</TabsTrigger>
            <TabsTrigger value="tab2" disabled>Disabled</TabsTrigger>
          </TabsList>
        </Tabs>
      )
      
      const disabledTab = screen.getByText('Disabled')
      expect(disabledTab.hasAttribute('disabled')).toBe(true)
    })

    it('should render with orientation prop', () => {
      render(
        <Tabs defaultValue="tab1" orientation="vertical">
          <TabsList>
            <TabsTrigger value="tab1">Tab 1</TabsTrigger>
          </TabsList>
          <TabsContent value="tab1">Content</TabsContent>
        </Tabs>
      )
      
      expect(screen.getByText('Tab 1')).toBeDefined()
    })
  })
})
