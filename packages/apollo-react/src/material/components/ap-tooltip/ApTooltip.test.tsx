import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
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
});
