import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';

import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../src/components/ui/tabs';

describe('Tabs', () => {
  it('renders tabs with default value', () => {
    render(
      <Tabs defaultValue="tab1">
        <TabsList>
          <TabsTrigger value="tab1">Tab 1</TabsTrigger>
          <TabsTrigger value="tab2">Tab 2</TabsTrigger>
        </TabsList>
        <TabsContent value="tab1">Content 1</TabsContent>
        <TabsContent value="tab2">Content 2</TabsContent>
      </Tabs>
    );

    expect(screen.getByText('Tab 1')).toBeInTheDocument();
    expect(screen.getByText('Tab 2')).toBeInTheDocument();
    expect(screen.getByText('Content 1')).toBeInTheDocument();
    expect(screen.queryByText('Content 2')).not.toBeInTheDocument();
  });

  it('switches tabs when tab trigger is clicked', async () => {
    const user = userEvent.setup();
    render(
      <Tabs defaultValue="tab1">
        <TabsList>
          <TabsTrigger value="tab1">Tab 1</TabsTrigger>
          <TabsTrigger value="tab2">Tab 2</TabsTrigger>
        </TabsList>
        <TabsContent value="tab1">Content 1</TabsContent>
        <TabsContent value="tab2">Content 2</TabsContent>
      </Tabs>
    );

    expect(screen.getByText('Content 1')).toBeInTheDocument();

    await user.click(screen.getByText('Tab 2'));

    await waitFor(() => {
      expect(screen.queryByText('Content 1')).not.toBeInTheDocument();
      expect(screen.getByText('Content 2')).toBeInTheDocument();
    });
  });

  it('shows correct active tab styling', async () => {
    const user = userEvent.setup();
    render(
      <Tabs defaultValue="tab1">
        <TabsList>
          <TabsTrigger value="tab1">Tab 1</TabsTrigger>
          <TabsTrigger value="tab2">Tab 2</TabsTrigger>
        </TabsList>
        <TabsContent value="tab1">Content 1</TabsContent>
        <TabsContent value="tab2">Content 2</TabsContent>
      </Tabs>
    );

    const tab1 = screen.getByText('Tab 1');
    const tab2 = screen.getByText('Tab 2');

    expect(tab1).toHaveAttribute('data-state', 'active');
    expect(tab2).toHaveAttribute('data-state', 'inactive');

    await user.click(tab2);

    await waitFor(() => {
      expect(tab1).toHaveAttribute('data-state', 'inactive');
      expect(tab2).toHaveAttribute('data-state', 'active');
    });
  });

  it('navigates tabs with arrow keys', async () => {
    const user = userEvent.setup();
    render(
      <Tabs defaultValue="tab1">
        <TabsList>
          <TabsTrigger value="tab1">Tab 1</TabsTrigger>
          <TabsTrigger value="tab2">Tab 2</TabsTrigger>
          <TabsTrigger value="tab3">Tab 3</TabsTrigger>
        </TabsList>
        <TabsContent value="tab1">Content 1</TabsContent>
        <TabsContent value="tab2">Content 2</TabsContent>
        <TabsContent value="tab3">Content 3</TabsContent>
      </Tabs>
    );

    // Focus first tab
    const tab1 = screen.getByText('Tab 1');
    tab1.focus();
    expect(tab1).toHaveFocus();

    // Navigate to Tab 2 with ArrowRight
    await user.keyboard('{ArrowRight}');
    await waitFor(() => {
      expect(screen.getByText('Tab 2')).toHaveFocus();
      expect(screen.getByText('Content 2')).toBeInTheDocument();
    });

    // Navigate to Tab 3 with ArrowRight
    await user.keyboard('{ArrowRight}');
    await waitFor(() => {
      expect(screen.getByText('Tab 3')).toHaveFocus();
      expect(screen.getByText('Content 3')).toBeInTheDocument();
    });

    // Navigate back to Tab 2 with ArrowLeft
    await user.keyboard('{ArrowLeft}');
    await waitFor(() => {
      expect(screen.getByText('Tab 2')).toHaveFocus();
      expect(screen.getByText('Content 2')).toBeInTheDocument();
    });
  });

  it('navigates to first tab with Home key', async () => {
    const user = userEvent.setup();
    render(
      <Tabs defaultValue="tab3">
        <TabsList>
          <TabsTrigger value="tab1">Tab 1</TabsTrigger>
          <TabsTrigger value="tab2">Tab 2</TabsTrigger>
          <TabsTrigger value="tab3">Tab 3</TabsTrigger>
        </TabsList>
        <TabsContent value="tab1">Content 1</TabsContent>
        <TabsContent value="tab2">Content 2</TabsContent>
        <TabsContent value="tab3">Content 3</TabsContent>
      </Tabs>
    );

    const tab3 = screen.getByText('Tab 3');
    tab3.focus();

    await user.keyboard('{Home}');

    await waitFor(() => {
      expect(screen.getByText('Tab 1')).toHaveFocus();
      expect(screen.getByText('Content 1')).toBeInTheDocument();
    });
  });

  it('navigates to last tab with End key', async () => {
    const user = userEvent.setup();
    render(
      <Tabs defaultValue="tab1">
        <TabsList>
          <TabsTrigger value="tab1">Tab 1</TabsTrigger>
          <TabsTrigger value="tab2">Tab 2</TabsTrigger>
          <TabsTrigger value="tab3">Tab 3</TabsTrigger>
        </TabsList>
        <TabsContent value="tab1">Content 1</TabsContent>
        <TabsContent value="tab2">Content 2</TabsContent>
        <TabsContent value="tab3">Content 3</TabsContent>
      </Tabs>
    );

    const tab1 = screen.getByText('Tab 1');
    tab1.focus();

    await user.keyboard('{End}');

    await waitFor(() => {
      expect(screen.getByText('Tab 3')).toHaveFocus();
      expect(screen.getByText('Content 3')).toBeInTheDocument();
    });
  });

  it('can be controlled via value prop', async () => {
    const onValueChange = vi.fn();
    const { rerender } = render(
      <Tabs value="tab1" onValueChange={onValueChange}>
        <TabsList>
          <TabsTrigger value="tab1">Tab 1</TabsTrigger>
          <TabsTrigger value="tab2">Tab 2</TabsTrigger>
        </TabsList>
        <TabsContent value="tab1">Content 1</TabsContent>
        <TabsContent value="tab2">Content 2</TabsContent>
      </Tabs>
    );

    expect(screen.getByText('Content 1')).toBeInTheDocument();
    expect(screen.queryByText('Content 2')).not.toBeInTheDocument();

    rerender(
      <Tabs value="tab2" onValueChange={onValueChange}>
        <TabsList>
          <TabsTrigger value="tab1">Tab 1</TabsTrigger>
          <TabsTrigger value="tab2">Tab 2</TabsTrigger>
        </TabsList>
        <TabsContent value="tab1">Content 1</TabsContent>
        <TabsContent value="tab2">Content 2</TabsContent>
      </Tabs>
    );

    await waitFor(() => {
      expect(screen.queryByText('Content 1')).not.toBeInTheDocument();
      expect(screen.getByText('Content 2')).toBeInTheDocument();
    });
  });

  it('calls onValueChange when tab is clicked', async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    render(
      <Tabs defaultValue="tab1" onValueChange={onValueChange}>
        <TabsList>
          <TabsTrigger value="tab1">Tab 1</TabsTrigger>
          <TabsTrigger value="tab2">Tab 2</TabsTrigger>
        </TabsList>
        <TabsContent value="tab1">Content 1</TabsContent>
        <TabsContent value="tab2">Content 2</TabsContent>
      </Tabs>
    );

    await user.click(screen.getByText('Tab 2'));

    expect(onValueChange).toHaveBeenCalledWith('tab2');
  });

  it('renders custom content in tabs', () => {
    render(
      <Tabs defaultValue="tab1">
        <TabsList>
          <TabsTrigger value="tab1">
            <span data-testid="custom-trigger">Custom Tab</span>
          </TabsTrigger>
        </TabsList>
        <TabsContent value="tab1">
          <div data-testid="custom-content">
            <h2>Custom Title</h2>
            <p>Custom paragraph</p>
          </div>
        </TabsContent>
      </Tabs>
    );

    expect(screen.getByTestId('custom-trigger')).toBeInTheDocument();
    expect(screen.getByTestId('custom-content')).toBeInTheDocument();
    expect(screen.getByText('Custom Title')).toBeInTheDocument();
    expect(screen.getByText('Custom paragraph')).toBeInTheDocument();
  });

  it('handles disabled tabs', async () => {
    const user = userEvent.setup();
    render(
      <Tabs defaultValue="tab1">
        <TabsList>
          <TabsTrigger value="tab1">Tab 1</TabsTrigger>
          <TabsTrigger value="tab2" disabled>
            Tab 2 (Disabled)
          </TabsTrigger>
        </TabsList>
        <TabsContent value="tab1">Content 1</TabsContent>
        <TabsContent value="tab2">Content 2</TabsContent>
      </Tabs>
    );

    const disabledTab = screen.getByText('Tab 2 (Disabled)');
    expect(disabledTab).toHaveAttribute('data-disabled');

    await user.click(disabledTab);

    // Should still show tab1 content
    expect(screen.getByText('Content 1')).toBeInTheDocument();
    expect(screen.queryByText('Content 2')).not.toBeInTheDocument();
  });

  it('accepts custom className on TabsList', () => {
    render(
      <Tabs defaultValue="tab1">
        <TabsList className="custom-tabs-list">
          <TabsTrigger value="tab1">Tab 1</TabsTrigger>
        </TabsList>
        <TabsContent value="tab1">Content</TabsContent>
      </Tabs>
    );

    const tabsList = screen.getByRole('tablist');
    expect(tabsList).toHaveClass('custom-tabs-list');
  });

  it('accepts custom className on TabsTrigger', () => {
    render(
      <Tabs defaultValue="tab1">
        <TabsList>
          <TabsTrigger value="tab1" className="custom-trigger">
            Tab 1
          </TabsTrigger>
        </TabsList>
        <TabsContent value="tab1">Content</TabsContent>
      </Tabs>
    );

    const trigger = screen.getByText('Tab 1');
    expect(trigger).toHaveClass('custom-trigger');
  });

  it('accepts custom className on TabsContent', () => {
    render(
      <Tabs defaultValue="tab1">
        <TabsList>
          <TabsTrigger value="tab1">Tab 1</TabsTrigger>
        </TabsList>
        <TabsContent value="tab1" className="custom-content">
          Content
        </TabsContent>
      </Tabs>
    );

    const content = screen.getByText('Content');
    expect(content).toHaveClass('custom-content');
  });

  it('has correct ARIA attributes', () => {
    render(
      <Tabs defaultValue="tab1">
        <TabsList>
          <TabsTrigger value="tab1">Tab 1</TabsTrigger>
          <TabsTrigger value="tab2">Tab 2</TabsTrigger>
        </TabsList>
        <TabsContent value="tab1">Content 1</TabsContent>
        <TabsContent value="tab2">Content 2</TabsContent>
      </Tabs>
    );

    const tabsList = screen.getByRole('tablist');
    expect(tabsList).toBeInTheDocument();

    const tabs = screen.getAllByRole('tab');
    expect(tabs).toHaveLength(2);

    const activeTab = tabs[0];
    expect(activeTab).toHaveAttribute('aria-selected', 'true');

    const inactiveTab = tabs[1];
    expect(inactiveTab).toHaveAttribute('aria-selected', 'false');
  });

  it('wraps focus with arrow keys when orientation is horizontal', async () => {
    const user = userEvent.setup();
    render(
      <Tabs defaultValue="tab1" orientation="horizontal">
        <TabsList>
          <TabsTrigger value="tab1">Tab 1</TabsTrigger>
          <TabsTrigger value="tab2">Tab 2</TabsTrigger>
        </TabsList>
        <TabsContent value="tab1">Content 1</TabsContent>
        <TabsContent value="tab2">Content 2</TabsContent>
      </Tabs>
    );

    const tab2 = screen.getByText('Tab 2');
    tab2.focus();

    // Navigate past last tab should wrap to first
    await user.keyboard('{ArrowRight}');

    await waitFor(() => {
      expect(screen.getByText('Tab 1')).toHaveFocus();
    });
  });
});
