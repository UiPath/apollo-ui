import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe } from 'jest-axe';
import { describe, expect, it, vi } from 'vitest';
import { ScrollableTabsList, Tabs, TabsContent, TabsList, TabsTrigger } from './tabs';

describe('Tabs', () => {
  const TabsExample = ({
    onValueChange = vi.fn(),
  }: {
    onValueChange?: (value: string) => void;
  }) => (
    <Tabs defaultValue="tab1" onValueChange={onValueChange}>
      <TabsList aria-label="Example tabs">
        <TabsTrigger value="tab1">Tab 1</TabsTrigger>
        <TabsTrigger value="tab2">Tab 2</TabsTrigger>
        <TabsTrigger value="tab3">Tab 3</TabsTrigger>
      </TabsList>
      <TabsContent value="tab1">Content for Tab 1</TabsContent>
      <TabsContent value="tab2">Content for Tab 2</TabsContent>
      <TabsContent value="tab3">Content for Tab 3</TabsContent>
    </Tabs>
  );

  it('renders without crashing', () => {
    render(<TabsExample />);
    expect(screen.getByRole('tablist')).toBeInTheDocument();
  });

  it('has no accessibility violations', async () => {
    const { container } = render(<TabsExample />);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('renders all tab triggers', () => {
    render(<TabsExample />);
    expect(screen.getByRole('tab', { name: 'Tab 1' })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: 'Tab 2' })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: 'Tab 3' })).toBeInTheDocument();
  });

  it('displays default active tab content', () => {
    render(<TabsExample />);
    expect(screen.getByText('Content for Tab 1')).toBeInTheDocument();
  });

  it('does not display inactive tab content', () => {
    render(<TabsExample />);
    expect(screen.queryByText('Content for Tab 2')).not.toBeInTheDocument();
    expect(screen.queryByText('Content for Tab 3')).not.toBeInTheDocument();
  });

  it('switches tabs when clicked', async () => {
    const user = userEvent.setup();
    const handleValueChange = vi.fn();
    render(<TabsExample onValueChange={handleValueChange} />);

    const tab2 = screen.getByRole('tab', { name: 'Tab 2' });
    await user.click(tab2);

    expect(handleValueChange).toHaveBeenCalledWith('tab2');
    expect(screen.getByText('Content for Tab 2')).toBeInTheDocument();
    expect(screen.queryByText('Content for Tab 1')).not.toBeInTheDocument();
  });

  it('supports keyboard navigation with Arrow Right', async () => {
    const user = userEvent.setup();
    render(<TabsExample />);

    const tab1 = screen.getByRole('tab', { name: 'Tab 1' });
    await user.click(tab1);
    await user.keyboard('{ArrowRight}');

    await waitFor(() => {
      const tab2 = screen.getByRole('tab', { name: 'Tab 2' });
      expect(tab2).toHaveFocus();
    });
  });

  it('supports keyboard navigation with Arrow Left', async () => {
    const user = userEvent.setup();
    render(<TabsExample />);

    const tab2 = screen.getByRole('tab', { name: 'Tab 2' });
    await user.click(tab2);
    await user.keyboard('{ArrowLeft}');

    await waitFor(() => {
      const tab1 = screen.getByRole('tab', { name: 'Tab 1' });
      expect(tab1).toHaveFocus();
    });
  });

  it('supports keyboard navigation with Home key', async () => {
    const user = userEvent.setup();
    render(<TabsExample />);

    const tab3 = screen.getByRole('tab', { name: 'Tab 3' });
    await user.click(tab3);
    await user.keyboard('{Home}');

    await waitFor(() => {
      const tab1 = screen.getByRole('tab', { name: 'Tab 1' });
      expect(tab1).toHaveFocus();
    });
  });

  it('supports keyboard navigation with End key', async () => {
    const user = userEvent.setup();
    render(<TabsExample />);

    const tab1 = screen.getByRole('tab', { name: 'Tab 1' });
    await user.click(tab1);
    await user.keyboard('{End}');

    await waitFor(() => {
      const tab3 = screen.getByRole('tab', { name: 'Tab 3' });
      expect(tab3).toHaveFocus();
    });
  });

  it('indicates active tab with aria-selected', () => {
    render(<TabsExample />);
    const tab1 = screen.getByRole('tab', { name: 'Tab 1' });
    const tab2 = screen.getByRole('tab', { name: 'Tab 2' });

    expect(tab1).toHaveAttribute('aria-selected', 'true');
    expect(tab2).toHaveAttribute('aria-selected', 'false');
  });

  it('supports disabled tabs', async () => {
    const user = userEvent.setup();
    render(
      <Tabs defaultValue="tab1">
        <TabsList aria-label="Tabs">
          <TabsTrigger value="tab1">Tab 1</TabsTrigger>
          <TabsTrigger value="tab2" disabled>
            Tab 2
          </TabsTrigger>
        </TabsList>
        <TabsContent value="tab1">Content 1</TabsContent>
        <TabsContent value="tab2">Content 2</TabsContent>
      </Tabs>
    );

    const tab2 = screen.getByRole('tab', { name: 'Tab 2' });
    expect(tab2).toBeDisabled();

    await user.click(tab2);
    expect(screen.queryByText('Content 2')).not.toBeInTheDocument();
  });

  it('supports controlled mode', () => {
    const handleValueChange = vi.fn();
    const { rerender } = render(
      <Tabs value="tab1" onValueChange={handleValueChange}>
        <TabsList aria-label="Tabs">
          <TabsTrigger value="tab1">Tab 1</TabsTrigger>
          <TabsTrigger value="tab2">Tab 2</TabsTrigger>
        </TabsList>
        <TabsContent value="tab1">Content 1</TabsContent>
        <TabsContent value="tab2">Content 2</TabsContent>
      </Tabs>
    );

    expect(screen.getByText('Content 1')).toBeInTheDocument();

    rerender(
      <Tabs value="tab2" onValueChange={handleValueChange}>
        <TabsList aria-label="Tabs">
          <TabsTrigger value="tab1">Tab 1</TabsTrigger>
          <TabsTrigger value="tab2">Tab 2</TabsTrigger>
        </TabsList>
        <TabsContent value="tab1">Content 1</TabsContent>
        <TabsContent value="tab2">Content 2</TabsContent>
      </Tabs>
    );

    expect(screen.getByText('Content 2')).toBeInTheDocument();
  });

  it('shows stable scroll controls for overflowing tabs', async () => {
    const user = userEvent.setup();
    const scrollBy = vi.fn();
    const scrollWidth = Object.getOwnPropertyDescriptor(HTMLElement.prototype, 'scrollWidth');
    const clientWidth = Object.getOwnPropertyDescriptor(HTMLElement.prototype, 'clientWidth');
    const originalScrollBy = HTMLElement.prototype.scrollBy;

    Object.defineProperty(HTMLElement.prototype, 'scrollWidth', {
      configurable: true,
      get: () => 480,
    });
    Object.defineProperty(HTMLElement.prototype, 'clientWidth', {
      configurable: true,
      get: () => 240,
    });
    HTMLElement.prototype.scrollBy = scrollBy;

    try {
      render(
        <Tabs defaultValue="tab1">
          <ScrollableTabsList aria-label="Scrollable tabs">
            <TabsTrigger value="tab1">Tab 1</TabsTrigger>
            <TabsTrigger value="tab2">Tab 2</TabsTrigger>
            <TabsTrigger value="tab3">Tab 3</TabsTrigger>
          </ScrollableTabsList>
          <TabsContent value="tab1">Content 1</TabsContent>
          <TabsContent value="tab2">Content 2</TabsContent>
          <TabsContent value="tab3">Content 3</TabsContent>
        </Tabs>
      );

      const previousButton = await screen.findByRole('button', { name: 'Scroll tabs left' });
      const nextButton = screen.getByRole('button', { name: 'Scroll tabs right' });

      expect(previousButton).toBeDisabled();
      expect(nextButton).toBeEnabled();

      await user.click(nextButton);
      expect(scrollBy).toHaveBeenCalledWith({ left: 240, behavior: 'smooth' });
      expect(screen.getByRole('tab', { name: 'Tab 1' })).toHaveAttribute('aria-selected', 'true');
    } finally {
      if (scrollWidth) Object.defineProperty(HTMLElement.prototype, 'scrollWidth', scrollWidth);
      else delete (HTMLElement.prototype as Partial<HTMLElement>).scrollWidth;
      if (clientWidth) Object.defineProperty(HTMLElement.prototype, 'clientWidth', clientWidth);
      else delete (HTMLElement.prototype as Partial<HTMLElement>).clientWidth;
      HTMLElement.prototype.scrollBy = originalScrollBy;
    }
  });

  it('reveals an initially active tab when it starts outside the viewport', async () => {
    const scrollBy = vi.fn();
    const scrollWidth = Object.getOwnPropertyDescriptor(HTMLElement.prototype, 'scrollWidth');
    const clientWidth = Object.getOwnPropertyDescriptor(HTMLElement.prototype, 'clientWidth');
    const originalScrollBy = HTMLElement.prototype.scrollBy;
    const originalGetBoundingClientRect = HTMLElement.prototype.getBoundingClientRect;

    Object.defineProperty(HTMLElement.prototype, 'scrollWidth', {
      configurable: true,
      get: () => 480,
    });
    Object.defineProperty(HTMLElement.prototype, 'clientWidth', {
      configurable: true,
      get: () => 240,
    });
    HTMLElement.prototype.scrollBy = scrollBy;
    HTMLElement.prototype.getBoundingClientRect = function () {
      if (this.getAttribute('role') === 'tablist') {
        return { left: 0, right: 240 } as DOMRect;
      }
      if (this.getAttribute('role') === 'tab' && this.dataset.state === 'active') {
        return { left: 320, right: 400 } as DOMRect;
      }
      return originalGetBoundingClientRect.call(this);
    };

    try {
      render(
        <Tabs defaultValue="tab3">
          <ScrollableTabsList aria-label="Scrollable tabs">
            <TabsTrigger value="tab1">Tab 1</TabsTrigger>
            <TabsTrigger value="tab2">Tab 2</TabsTrigger>
            <TabsTrigger value="tab3">Tab 3</TabsTrigger>
          </ScrollableTabsList>
        </Tabs>
      );

      await waitFor(() => {
        expect(scrollBy).toHaveBeenCalledWith({ left: 160, behavior: 'smooth' });
      });
    } finally {
      if (scrollWidth) Object.defineProperty(HTMLElement.prototype, 'scrollWidth', scrollWidth);
      else delete (HTMLElement.prototype as Partial<HTMLElement>).scrollWidth;
      if (clientWidth) Object.defineProperty(HTMLElement.prototype, 'clientWidth', clientWidth);
      else delete (HTMLElement.prototype as Partial<HTMLElement>).clientWidth;
      HTMLElement.prototype.scrollBy = originalScrollBy;
      HTMLElement.prototype.getBoundingClientRect = originalGetBoundingClientRect;
    }
  });

  it('updates overflow controls when tabs are added', async () => {
    let measuredScrollWidth = 240;
    const scrollWidth = Object.getOwnPropertyDescriptor(HTMLElement.prototype, 'scrollWidth');
    const clientWidth = Object.getOwnPropertyDescriptor(HTMLElement.prototype, 'clientWidth');

    Object.defineProperty(HTMLElement.prototype, 'scrollWidth', {
      configurable: true,
      get: () => measuredScrollWidth,
    });
    Object.defineProperty(HTMLElement.prototype, 'clientWidth', {
      configurable: true,
      get: () => 240,
    });

    try {
      const { rerender } = render(
        <Tabs defaultValue="tab1">
          <ScrollableTabsList aria-label="Scrollable tabs">
            <TabsTrigger value="tab1">Tab 1</TabsTrigger>
            <TabsTrigger value="tab2">Tab 2</TabsTrigger>
          </ScrollableTabsList>
        </Tabs>
      );

      expect(screen.queryByRole('button', { name: 'Scroll tabs right' })).not.toBeInTheDocument();

      measuredScrollWidth = 480;
      rerender(
        <Tabs defaultValue="tab1">
          <ScrollableTabsList aria-label="Scrollable tabs">
            <TabsTrigger value="tab1">Tab 1</TabsTrigger>
            <TabsTrigger value="tab2">Tab 2</TabsTrigger>
            <TabsTrigger value="tab3">Tab 3</TabsTrigger>
          </ScrollableTabsList>
        </Tabs>
      );

      expect(await screen.findByRole('button', { name: 'Scroll tabs right' })).toBeEnabled();
    } finally {
      if (scrollWidth) Object.defineProperty(HTMLElement.prototype, 'scrollWidth', scrollWidth);
      else delete (HTMLElement.prototype as Partial<HTMLElement>).scrollWidth;
      if (clientWidth) Object.defineProperty(HTMLElement.prototype, 'clientWidth', clientWidth);
      else delete (HTMLElement.prototype as Partial<HTMLElement>).clientWidth;
    }
  });

  it('applies custom className to TabsList', () => {
    render(
      <Tabs defaultValue="tab1">
        <TabsList className="custom-list" aria-label="Tabs">
          <TabsTrigger value="tab1">Tab 1</TabsTrigger>
        </TabsList>
        <TabsContent value="tab1">Content 1</TabsContent>
      </Tabs>
    );

    const tablist = screen.getByRole('tablist');
    expect(tablist).toHaveClass('custom-list');
  });

  it('applies custom className to TabsTrigger', () => {
    render(
      <Tabs defaultValue="tab1">
        <TabsList aria-label="Tabs">
          <TabsTrigger value="tab1" className="custom-trigger">
            Tab 1
          </TabsTrigger>
        </TabsList>
        <TabsContent value="tab1">Content 1</TabsContent>
      </Tabs>
    );

    const tab = screen.getByRole('tab', { name: 'Tab 1' });
    expect(tab).toHaveClass('custom-trigger');
  });

  it('applies custom className to TabsContent', () => {
    const { container } = render(
      <Tabs defaultValue="tab1">
        <TabsList aria-label="Tabs">
          <TabsTrigger value="tab1">Tab 1</TabsTrigger>
        </TabsList>
        <TabsContent value="tab1" className="custom-content">
          Content 1
        </TabsContent>
      </Tabs>
    );

    const content = container.querySelector('.custom-content');
    expect(content).toBeInTheDocument();
  });

  it('has proper ARIA attributes on tablist', () => {
    render(<TabsExample />);
    const tablist = screen.getByRole('tablist');
    expect(tablist).toHaveAttribute('aria-label', 'Example tabs');
  });

  it('has proper ARIA controls attributes', () => {
    render(<TabsExample />);
    const tab1 = screen.getByRole('tab', { name: 'Tab 1' });
    expect(tab1).toHaveAttribute('aria-controls');
  });
});
