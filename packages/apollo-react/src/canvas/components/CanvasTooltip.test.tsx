import type { PropsWithChildren } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '../utils/testing';
import { CanvasTooltip, CanvasTooltipProviderMarker } from './CanvasTooltip';

vi.mock('@uipath/apollo-wind/components/ui/tooltip', () => ({
  Tooltip: ({ children }: PropsWithChildren) => <div data-testid="tooltip">{children}</div>,
  TooltipContent: ({ children }: PropsWithChildren) => (
    <div data-testid="tooltip-content">{children}</div>
  ),
  TooltipPortal: ({ children }: PropsWithChildren) => <>{children}</>,
  TooltipProvider: ({ children }: PropsWithChildren) => (
    <div data-testid="tooltip-provider">{children}</div>
  ),
  TooltipTrigger: ({ children }: PropsWithChildren) => (
    <div data-testid="tooltip-trigger">{children}</div>
  ),
}));

describe('CanvasTooltip', () => {
  it('returns children directly when content is empty', () => {
    render(
      <CanvasTooltip content=" ">
        <button type="button">Click me</button>
      </CanvasTooltip>
    );

    expect(screen.getByRole('button', { name: 'Click me' })).toBeInTheDocument();
    expect(screen.queryByTestId('tooltip')).not.toBeInTheDocument();
  });

  it('returns children directly when content is false', () => {
    render(
      <CanvasTooltip content={false}>
        <button type="button">Click me</button>
      </CanvasTooltip>
    );

    expect(screen.getByRole('button', { name: 'Click me' })).toBeInTheDocument();
    expect(screen.queryByTestId('tooltip')).not.toBeInTheDocument();
  });

  it('returns children directly when content is null', () => {
    render(
      <CanvasTooltip content={null}>
        <button type="button">Click me</button>
      </CanvasTooltip>
    );

    expect(screen.getByRole('button', { name: 'Click me' })).toBeInTheDocument();
    expect(screen.queryByTestId('tooltip')).not.toBeInTheDocument();
  });

  it('renders tooltip without its own TooltipProvider when inside CanvasTooltipProviderMarker', () => {
    render(
      <CanvasTooltipProviderMarker>
        <CanvasTooltip content="Tooltip text">
          <button type="button">Hover me</button>
        </CanvasTooltip>
      </CanvasTooltipProviderMarker>
    );

    expect(screen.getByRole('button', { name: 'Hover me' })).toBeInTheDocument();
    expect(screen.getByTestId('tooltip')).toBeInTheDocument();
    expect(screen.getByTestId('tooltip-content')).toHaveTextContent('Tooltip text');
    expect(screen.queryByTestId('tooltip-provider')).not.toBeInTheDocument();
  });

  it('renders tooltip with its own TooltipProvider when no provider marker exists', () => {
    render(
      <CanvasTooltip content="Tooltip text">
        <button type="button">Hover me</button>
      </CanvasTooltip>
    );

    expect(screen.getByRole('button', { name: 'Hover me' })).toBeInTheDocument();
    expect(screen.getByTestId('tooltip')).toBeInTheDocument();
    expect(screen.getByTestId('tooltip-content')).toHaveTextContent('Tooltip text');
    expect(screen.getByTestId('tooltip-provider')).toBeInTheDocument();
  });
});
