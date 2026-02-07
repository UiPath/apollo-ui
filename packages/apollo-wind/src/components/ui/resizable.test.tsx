import { render, screen } from '@testing-library/react';
import { axe } from 'jest-axe';
import { describe, expect, it } from 'vitest';

import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from './resizable';

const BasicResizable = ({ withHandle = false }: { withHandle?: boolean }) => (
  <ResizablePanelGroup orientation="horizontal">
    <ResizablePanel defaultSize="50%">
      <div>Panel 1</div>
    </ResizablePanel>
    <ResizableHandle withHandle={withHandle} />
    <ResizablePanel defaultSize="50%">
      <div>Panel 2</div>
    </ResizablePanel>
  </ResizablePanelGroup>
);

describe('Resizable', () => {
  describe('Rendering', () => {
    it('renders panel group with panels', () => {
      render(<BasicResizable />);
      expect(screen.getByText('Panel 1')).toBeInTheDocument();
      expect(screen.getByText('Panel 2')).toBeInTheDocument();
    });

    it('renders handle without grip icon by default', () => {
      const { container } = render(<BasicResizable />);
      expect(container.querySelector('[data-separator]')).toBeInTheDocument();
      expect(container.querySelector('svg')).not.toBeInTheDocument();
    });

    it('renders handle with grip icon when withHandle is true', () => {
      const { container } = render(<BasicResizable withHandle />);
      expect(container.querySelector('svg')).toBeInTheDocument();
    });

    it('renders vertical panel group', () => {
      const { container } = render(
        <ResizablePanelGroup orientation="vertical">
          <ResizablePanel defaultSize="50%">
            <div>Top</div>
          </ResizablePanel>
          <ResizableHandle />
          <ResizablePanel defaultSize="50%">
            <div>Bottom</div>
          </ResizablePanel>
        </ResizablePanelGroup>
      );

      expect(container.querySelector('[data-group]')).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('has no accessibility violations', async () => {
      const { container } = render(<BasicResizable />);
      const results = await axe(container);
      expect(results.violations).toHaveLength(0);
    });

    it('handle is keyboard focusable', () => {
      const { container } = render(<BasicResizable />);
      const handle = container.querySelector('[data-separator]');
      expect(handle).toHaveAttribute('tabindex', '0');
    });
  });

  describe('Props', () => {
    it('applies custom className to panel group', () => {
      const { container } = render(
        <ResizablePanelGroup orientation="horizontal" className="custom-group">
          <ResizablePanel defaultSize="100%">
            <div>Content</div>
          </ResizablePanel>
        </ResizablePanelGroup>
      );

      expect(container.firstChild).toHaveClass('custom-group');
    });

    it('applies custom className to handle', () => {
      const { container } = render(
        <ResizablePanelGroup orientation="horizontal">
          <ResizablePanel defaultSize="50%">
            <div>Panel 1</div>
          </ResizablePanel>
          <ResizableHandle className="custom-handle" />
          <ResizablePanel defaultSize="50%">
            <div>Panel 2</div>
          </ResizablePanel>
        </ResizablePanelGroup>
      );

      expect(container.querySelector('[data-separator]')).toHaveClass('custom-handle');
    });

    it('renders panel with minSize', () => {
      render(
        <ResizablePanelGroup orientation="horizontal">
          <ResizablePanel defaultSize="50%" minSize="25%">
            <div>Panel 1</div>
          </ResizablePanel>
          <ResizableHandle />
          <ResizablePanel defaultSize="50%">
            <div>Panel 2</div>
          </ResizablePanel>
        </ResizablePanelGroup>
      );

      expect(screen.getByText('Panel 1')).toBeInTheDocument();
    });

    it('renders panel with maxSize', () => {
      render(
        <ResizablePanelGroup orientation="horizontal">
          <ResizablePanel defaultSize="50%" maxSize="75%">
            <div>Panel 1</div>
          </ResizablePanel>
          <ResizableHandle />
          <ResizablePanel defaultSize="50%">
            <div>Panel 2</div>
          </ResizablePanel>
        </ResizablePanelGroup>
      );

      expect(screen.getByText('Panel 1')).toBeInTheDocument();
    });

    it('renders collapsible panel', () => {
      render(
        <ResizablePanelGroup orientation="horizontal">
          <ResizablePanel defaultSize="50%" collapsible collapsedSize="0%">
            <div>Collapsible</div>
          </ResizablePanel>
          <ResizableHandle />
          <ResizablePanel defaultSize="50%">
            <div>Panel 2</div>
          </ResizablePanel>
        </ResizablePanelGroup>
      );

      expect(screen.getByText('Collapsible')).toBeInTheDocument();
    });
  });

  describe('Multiple Panels', () => {
    it('renders three panels with two handles', () => {
      const { container } = render(
        <ResizablePanelGroup orientation="horizontal">
          <ResizablePanel defaultSize="33%">
            <div>Panel 1</div>
          </ResizablePanel>
          <ResizableHandle />
          <ResizablePanel defaultSize="34%">
            <div>Panel 2</div>
          </ResizablePanel>
          <ResizableHandle />
          <ResizablePanel defaultSize="33%">
            <div>Panel 3</div>
          </ResizablePanel>
        </ResizablePanelGroup>
      );

      expect(screen.getByText('Panel 1')).toBeInTheDocument();
      expect(screen.getByText('Panel 2')).toBeInTheDocument();
      expect(screen.getByText('Panel 3')).toBeInTheDocument();
      expect(container.querySelectorAll('[data-separator]')).toHaveLength(2);
    });
  });
});
