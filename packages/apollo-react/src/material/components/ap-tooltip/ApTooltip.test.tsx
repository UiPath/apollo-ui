import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React, { memo, useMemo, useState } from 'react';
import { describe, expect, it, vi } from 'vitest';

import { ApTooltip } from './ApTooltip';

describe('ApTooltip', () => {
  it('renders with content prop', async () => {
    render(
      <ApTooltip content="Tooltip text">
        <button>Hover me</button>
      </ApTooltip>
    );

    const button = screen.getByRole('button');
    await userEvent.hover(button);

    await waitFor(() => {
      expect(screen.getByText('Tooltip text')).toBeInTheDocument();
    });
  });

  it('applies default placement bottom', async () => {
    render(
      <ApTooltip content="Tooltip text" isOpen={true}>
        <button>Hover me</button>
      </ApTooltip>
    );

    await waitFor(() => {
      const tooltip = document.querySelector('[role="tooltip"]');
      expect(tooltip).toBeInTheDocument();
      // MUI Tooltip applies data-popper-placement attribute
      expect(tooltip?.getAttribute('data-popper-placement')).toMatch(/bottom/);
    });
  });

  it('applies custom placement top', async () => {
    render(
      <ApTooltip content="Tooltip text" placement="top" isOpen={true}>
        <button>Hover me</button>
      </ApTooltip>
    );

    await waitFor(() => {
      const tooltip = document.querySelector('[role="tooltip"]');
      expect(tooltip).toBeInTheDocument();
      expect(tooltip?.getAttribute('data-popper-placement')).toMatch(/top/);
    });
  });

  it('hides tooltip when disabled', async () => {
    render(
      <ApTooltip content="Tooltip text" disabled>
        <button>Hover me</button>
      </ApTooltip>
    );

    const button = screen.getByRole('button');
    await userEvent.hover(button);

    await waitFor(
      () => {
        expect(screen.queryByText('Tooltip text')).not.toBeInTheDocument();
      },
      { timeout: 1000 }
    );
  });

  it('hides tooltip when hide prop is true', async () => {
    render(
      <ApTooltip content="Tooltip text" hide={true}>
        <button>Hover me</button>
      </ApTooltip>
    );

    const button = screen.getByRole('button');
    await userEvent.hover(button);

    await waitFor(
      () => {
        expect(screen.queryByText('Tooltip text')).not.toBeInTheDocument();
      },
      { timeout: 1000 }
    );
  });

  it('shows tooltip when isOpen is true', async () => {
    render(
      <ApTooltip content="Tooltip text" isOpen={true}>
        <button>Hover me</button>
      </ApTooltip>
    );

    await waitFor(() => {
      expect(screen.getByText('Tooltip text')).toBeInTheDocument();
    });
  });

  it('hides tooltip when isOpen is false', async () => {
    render(
      <ApTooltip content="Tooltip text" isOpen={false}>
        <button>Hover me</button>
      </ApTooltip>
    );

    await waitFor(
      () => {
        expect(screen.queryByText('Tooltip text')).not.toBeInTheDocument();
      },
      { timeout: 1000 }
    );
  });

  it('renders children element', () => {
    render(
      <ApTooltip content="Tooltip text">
        <button>Hover me</button>
      </ApTooltip>
    );

    expect(screen.getByRole('button')).toHaveTextContent('Hover me');
  });

  it('uses formattedContent when provided', async () => {
    render(
      <ApTooltip content="Original text" formattedContent={<div>Formatted content</div>}>
        <button>Hover me</button>
      </ApTooltip>
    );

    const button = screen.getByRole('button');
    await userEvent.hover(button);

    await waitFor(() => {
      expect(screen.getByText('Formatted content')).toBeInTheDocument();
      expect(screen.queryByText('Original text')).not.toBeInTheDocument();
    });
  });

  it('calls onTooltipOpen when tooltip opens', async () => {
    const onOpen = vi.fn();
    render(
      <ApTooltip content="Tooltip text" onTooltipOpen={onOpen}>
        <button>Hover me</button>
      </ApTooltip>
    );

    const button = screen.getByRole('button');
    await userEvent.hover(button);

    await waitFor(() => {
      expect(onOpen).toHaveBeenCalled();
    });
  });

  it('calls onTooltipClose when tooltip closes', async () => {
    const onClose = vi.fn();
    render(
      <ApTooltip content="Tooltip text" onTooltipClose={onClose}>
        <button>Hover me</button>
      </ApTooltip>
    );

    const button = screen.getByRole('button');
    await userEvent.hover(button);
    await userEvent.unhover(button);

    await waitFor(() => {
      expect(onClose).toHaveBeenCalled();
    });
  });

  it('renders with ReactNode content', async () => {
    render(
      <ApTooltip content={<span>React Node Content</span>}>
        <button>Hover me</button>
      </ApTooltip>
    );

    const button = screen.getByRole('button');
    await userEvent.hover(button);

    await waitFor(() => {
      expect(screen.getByText('React Node Content')).toBeInTheDocument();
    });
  });

  it('renders with smartTooltip disabled by default', () => {
    const { container } = render(
      <ApTooltip content="Tooltip text">
        <button>Hover me</button>
      </ApTooltip>
    );

    expect(container).toBeInTheDocument();
  });

  /**
   * Re-rendering behavior tests
   *
   * IMPORTANT NOTE ON RE-RENDERS:
   * MUI's Tooltip component internally clones children and adds props (like aria-label)
   * on each render. This means memoized children will re-render when Tooltip re-renders,
   * regardless of our memoization efforts. This is MUI's behavior, not a bug in ApTooltip.
   *
   * What we CAN control and test:
   * 1. Callback references passed to children are stable (useCallback)
   * 2. Ref callbacks are stable
   * 3. The memoization pattern itself works (tested in isolation without MUI Tooltip)
   */
  describe('Callback reference stability', () => {
    it('should maintain stable closeOnInteraction callback references across re-renders', async () => {
      const user = userEvent.setup();
      const capturedCallbacks: {
        onInputCapture: Array<React.FormEventHandler | undefined>;
      } = {
        onInputCapture: [],
      };

      // Component that captures callback references each time it renders
      // Note: We only test onInputCapture because MUI Tooltip wraps onMouseLeave/onMouseDown
      // with its own handlers, making those unstable at the child level
      const CallbackCapture = React.forwardRef<
        HTMLButtonElement,
        {
          onMouseLeave?: React.MouseEventHandler;
          onMouseDown?: React.MouseEventHandler;
          onInputCapture?: React.FormEventHandler;
        }
      >(function CallbackCapture({ onInputCapture }, ref) {
        capturedCallbacks.onInputCapture.push(onInputCapture);
        return (
          <button type="button" ref={ref}>
            Test
          </button>
        );
      });

      // Wrapper that triggers re-renders
      function Wrapper({ children }: { children: React.ReactNode }) {
        const [, forceUpdate] = useState(0);
        return (
          <div>
            <button
              type="button"
              data-testid="force-update"
              onClick={() => forceUpdate((n) => n + 1)}
            >
              Update
            </button>
            <ApTooltip content="Test" closeOnInteraction>
              {children}
            </ApTooltip>
          </div>
        );
      }

      // Create child once - this reference stays stable
      const child = <CallbackCapture />;

      render(<Wrapper>{child}</Wrapper>);

      // Force multiple re-renders
      const updateBtn = screen.getByTestId('force-update');
      await user.click(updateBtn);
      await user.click(updateBtn);

      // MUI Tooltip causes re-renders, so we'll have multiple captures
      // But onInputCapture is not touched by MUI, so it should be stable
      expect(capturedCallbacks.onInputCapture.length).toBeGreaterThanOrEqual(3);

      // Check all captured callbacks are the same reference
      const uniqueInputCapture = new Set(capturedCallbacks.onInputCapture);

      // All references should be the same (only 1 unique value in the set)
      expect(uniqueInputCapture.size).toBe(1);
    });

    it('should maintain stable ref callback for smartTooltip across re-renders', async () => {
      const user = userEvent.setup();
      const capturedRefs: Array<
        ((node: HTMLElement | null) => void) | React.RefObject<any> | null
      > = [];

      const RefCapture = React.forwardRef<HTMLButtonElement>(function RefCapture(_props, ref) {
        capturedRefs.push(typeof ref === 'function' ? ref : ref);
        return (
          <button type="button" ref={ref}>
            Test
          </button>
        );
      });

      function Wrapper({ children }: { children: React.ReactNode }) {
        const [, forceUpdate] = useState(0);
        return (
          <div>
            <button
              type="button"
              data-testid="force-update"
              onClick={() => forceUpdate((n) => n + 1)}
            >
              Update
            </button>
            <ApTooltip content="Test" smartTooltip>
              {children}
            </ApTooltip>
          </div>
        );
      }

      const child = <RefCapture />;
      render(<Wrapper>{child}</Wrapper>);

      const updateBtn = screen.getByTestId('force-update');
      await user.click(updateBtn);
      await user.click(updateBtn);

      expect(capturedRefs.length).toBeGreaterThanOrEqual(3);

      // All ref callbacks should be the same reference
      const uniqueRefs = new Set(capturedRefs);
      expect(uniqueRefs.size).toBe(1);
    });

    it('should maintain stable onMouseEnter callback for smartTooltip across re-renders', async () => {
      const user = userEvent.setup();
      const capturedCallbacks: Array<React.MouseEventHandler | undefined> = [];

      const CallbackCapture = React.forwardRef<
        HTMLButtonElement,
        { onMouseEnter?: React.MouseEventHandler }
      >(function CallbackCapture({ onMouseEnter }, ref) {
        capturedCallbacks.push(onMouseEnter);
        return (
          <button type="button" ref={ref}>
            Test
          </button>
        );
      });

      function Wrapper({ children }: { children: React.ReactNode }) {
        const [, forceUpdate] = useState(0);
        return (
          <div>
            <button
              type="button"
              data-testid="force-update"
              onClick={() => forceUpdate((n) => n + 1)}
            >
              Update
            </button>
            <ApTooltip content="Test" smartTooltip>
              {children}
            </ApTooltip>
          </div>
        );
      }

      const child = <CallbackCapture />;
      render(<Wrapper>{child}</Wrapper>);

      const updateBtn = screen.getByTestId('force-update');
      await user.click(updateBtn);
      await user.click(updateBtn);

      expect(capturedCallbacks.length).toBeGreaterThanOrEqual(3);

      // All onMouseEnter callbacks should be the same reference
      const uniqueCallbacks = new Set(capturedCallbacks);
      expect(uniqueCallbacks.size).toBe(1);
    });
  });

  describe('Memoization pattern verification', () => {
    /**
     * This test verifies that the memoization logic works correctly
     * by testing the cloneElement + useMemo pattern in isolation.
     * This proves the pattern is correct; MUI Tooltip's behavior is separate.
     */
    it('should not re-render memoized child when using our pattern in isolation', async () => {
      const user = userEvent.setup();
      let childRenderCount = 0;

      const MemoChild = memo(function MemoChild(_props: Record<string, unknown>) {
        childRenderCount++;
        return <button type="button">Child</button>;
      });

      // Simulate what ApTooltip does: memoize a cloned element
      function TestWrapper({ children }: { children: React.ReactNode }) {
        const [counter, setCounter] = useState(0);

        const childElement = useMemo(
          () => (React.isValidElement(children) ? children : <span>{children}</span>),
          [children]
        );

        // Memoize an empty handlers object (like closeOnInteractionHandlers when disabled)
        const handlers = useMemo(() => ({}), []);

        // Memoize the cloned element
        const clonedChild = useMemo(
          () => React.cloneElement(childElement, handlers),
          [childElement, handlers]
        );

        return (
          <div>
            <button
              type="button"
              data-testid="force-update"
              onClick={() => setCounter((n) => n + 1)}
            >
              Update ({counter})
            </button>
            {/* Render the cloned child directly, no MUI Tooltip */}
            {clonedChild}
          </div>
        );
      }

      const child = <MemoChild />;
      render(<TestWrapper>{child}</TestWrapper>);

      expect(childRenderCount).toBe(1);

      const updateBtn = screen.getByTestId('force-update');
      await user.click(updateBtn);
      await user.click(updateBtn);

      // Without MUI Tooltip, memoization works and child does NOT re-render
      expect(childRenderCount).toBe(1);
    });

    it('should demonstrate MUI Tooltip causes re-renders (expected behavior)', async () => {
      const user = userEvent.setup();
      let childRenderCount = 0;

      const MemoChild = memo(function MemoChild(_props: Record<string, unknown>) {
        childRenderCount++;
        return <button type="button">Child</button>;
      });

      function Wrapper({ children }: { children: React.ReactNode }) {
        const [, forceUpdate] = useState(0);
        return (
          <div>
            <button
              type="button"
              data-testid="force-update"
              onClick={() => forceUpdate((n) => n + 1)}
            >
              Update
            </button>
            <ApTooltip content="Test">{children}</ApTooltip>
          </div>
        );
      }

      const child = <MemoChild />;
      render(<Wrapper>{child}</Wrapper>);

      const initialCount = childRenderCount;

      const updateBtn = screen.getByTestId('force-update');
      await user.click(updateBtn);
      await user.click(updateBtn);

      // MUI Tooltip WILL cause re-renders - this is expected and documented behavior
      // We're just verifying this is the case so we understand the system
      expect(childRenderCount).toBeGreaterThan(initialCount);
    });
  });
});
