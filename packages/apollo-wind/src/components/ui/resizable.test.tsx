import { render, screen } from '@testing-library/react';
import { axe } from 'jest-axe';
import { describe, expect, it } from 'vitest';

import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from './resizable';

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

      const separator = container.querySelector('[data-separator]');
      expect(separator).toBeInTheDocument();
      expect(separator).toHaveAttribute('aria-orientation', 'horizontal');
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

  describe('Theme contrast (classic themes)', () => {
    it('marks hover/active state as authoritative over the classic-theme background overrides', () => {
      const { container } = render(<BasicResizable />);
      const separator = container.querySelector('[data-separator]');
      expect(separator).toHaveClass('data-[separator=hover]:bg-primary!');
      expect(separator).toHaveClass('data-[separator=active]:bg-primary!');
    });

    it('marks the grip box hover/active state as authoritative over its classic-theme background overrides', () => {
      const { container } = render(<BasicResizable withHandle />);
      const grip = container.querySelector('[data-separator] > div');
      expect(grip).toHaveClass('group-data-[separator=hover]:bg-primary!');
      expect(grip).toHaveClass('group-data-[separator=active]:bg-primary!');
    });

    it('scopes the grip/icon light/dark overrides away from React Flow color-mode wrappers', () => {
      const { container } = render(<BasicResizable withHandle />);
      const grip = container.querySelector('[data-separator] > div');
      const icon = container.querySelector('svg');

      for (const el of [grip, icon]) {
        const cls = el?.getAttribute('class') ?? '';
        expect(cls).not.toMatch(/\[\.light_&\]/);
        expect(cls).not.toMatch(/\[\.dark_&\]/);
      }

      expect(grip).toHaveClass('[.light:not(.react-flow)_&]:bg-border-subtle');
      expect(grip).toHaveClass('[.dark:not(.react-flow)_&]:bg-foreground-subtle');
      expect(icon).toHaveClass('[.light:not(.react-flow)_&]:text-foreground-emp');
      expect(icon).toHaveClass('[.dark:not(.react-flow)_&]:text-foreground-inverse');
    });

    it('keeps the divider background on a single unvaried utility so a consumer className can still override it', () => {
      const { container } = render(
        <ResizablePanelGroup orientation="horizontal">
          <ResizablePanel defaultSize="50%">
            <div>Panel 1</div>
          </ResizablePanel>
          <ResizableHandle className="bg-transparent" />
          <ResizablePanel defaultSize="50%">
            <div>Panel 2</div>
          </ResizablePanel>
        </ResizablePanelGroup>
      );
      const separator = container.querySelector('[data-separator]');
      const cls = separator?.getAttribute('class') ?? '';

      // The theme-specific divider color must live behind a CSS variable on a
      // plain bg-[var(...)] utility, not an arbitrary theme variant, so
      // tailwind-merge can dedupe it against a consumer's own bg-* override
      // (regression: overlay handles in Flow.stories.tsx pass bg-transparent
      // to hide the divider).
      expect(cls).toContain('bg-transparent');
      expect(cls).not.toMatch(/bg-\[var\(--resizable-handle-divider-bg/);
    });

    it('gives the light-hc and dark-hc icon overrides their own class (not react-flow-scoped, since ReactFlow never emits these classes)', () => {
      const { container } = render(<BasicResizable withHandle />);
      const icon = container.querySelector('svg');
      expect(icon).toHaveClass('[.light-hc_&]:text-foreground-inverse');
      expect(icon).toHaveClass('[.dark-hc_&]:text-foreground-inverse');
    });

    it.each([
      'light',
      'dark',
      'light-hc',
      'dark-hc',
    ])('renders a grip icon with a theme-specific color class inside a "%s" wrapper', (theme) => {
      const { container } = render(
        <div className={theme}>
          <BasicResizable withHandle />
        </div>
      );
      const icon = container.querySelector('svg');
      expect(icon?.getAttribute('class')).toContain(theme);
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
