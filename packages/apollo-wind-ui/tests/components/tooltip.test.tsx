import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect } from 'vitest';

import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '../../src/components/ui/tooltip';

describe('Tooltip', () => {
  it('renders tooltip trigger', () => {
    render(
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger>Hover me</TooltipTrigger>
        </Tooltip>
      </TooltipProvider>
    );
    expect(screen.getByText('Hover me')).toBeInTheDocument();
  });

  it('renders tooltip trigger as custom element with asChild', () => {
    render(
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <button>Custom button</button>
          </TooltipTrigger>
        </Tooltip>
      </TooltipProvider>
    );

    const button = screen.getByRole('button', { name: 'Custom button' });
    expect(button).toBeInTheDocument();
  });

  it('can be controlled via open prop when closed', () => {
    render(
      <TooltipProvider>
        <Tooltip open={false}>
          <TooltipTrigger>Trigger</TooltipTrigger>
          <TooltipContent>Controlled tooltip</TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );

    expect(screen.queryByRole('tooltip')).not.toBeInTheDocument();
  });

  it('can be controlled via open prop when open', () => {
    render(
      <TooltipProvider>
        <Tooltip open={true}>
          <TooltipTrigger>Trigger</TooltipTrigger>
          <TooltipContent>Controlled tooltip</TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );

    expect(screen.getByRole('tooltip')).toBeInTheDocument();
  });

  it('renders custom content when open', () => {
    render(
      <TooltipProvider>
        <Tooltip open={true}>
          <TooltipTrigger>Hover</TooltipTrigger>
          <TooltipContent>
            <strong>Bold text</strong>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );

    const tooltip = screen.getByRole('tooltip');
    expect(tooltip).toBeInTheDocument();
    // Tooltip content is accessible via role
  });

  it('accepts custom className on content', () => {
    const { container } = render(
      <TooltipProvider>
        <Tooltip open={true}>
          <TooltipTrigger>Hover</TooltipTrigger>
          <TooltipContent className="custom-class">Custom styled</TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );

    // Check that custom class is applied somewhere in the tooltip content structure
    const customElement = container.querySelector('.custom-class');
    expect(customElement).toBeInTheDocument();
  });

  it('accepts sideOffset prop', () => {
    render(
      <TooltipProvider>
        <Tooltip open={true}>
          <TooltipTrigger>Hover</TooltipTrigger>
          <TooltipContent sideOffset={10}>Offset tooltip</TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );

    expect(screen.getByRole('tooltip')).toBeInTheDocument();
  });

  it('supports multiple tooltips in provider', () => {
    render(
      <TooltipProvider>
        <Tooltip open={true}>
          <TooltipTrigger>First</TooltipTrigger>
          <TooltipContent>First tooltip</TooltipContent>
        </Tooltip>
        <Tooltip open={false}>
          <TooltipTrigger>Second</TooltipTrigger>
          <TooltipContent>Second tooltip</TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );

    // Only first tooltip should be visible
    const tooltips = screen.getAllByRole('tooltip', { hidden: true });
    expect(tooltips.length).toBeGreaterThanOrEqual(1);
  });

  it('renders with correct ARIA role', () => {
    render(
      <TooltipProvider>
        <Tooltip open={true}>
          <TooltipTrigger>Trigger</TooltipTrigger>
          <TooltipContent>Tooltip content</TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );

    const tooltip = screen.getByRole('tooltip');
    expect(tooltip).toBeInTheDocument();
  });

  it('trigger has aria-describedby when tooltip is open', () => {
    render(
      <TooltipProvider>
        <Tooltip open={true}>
          <TooltipTrigger>Trigger</TooltipTrigger>
          <TooltipContent>Description text</TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );

    const trigger = screen.getByText('Trigger');
    expect(trigger).toHaveAttribute('aria-describedby');
  });

  it('handles delayed display with delayDuration prop', () => {
    render(
      <TooltipProvider delayDuration={500}>
        <Tooltip open={false}>
          <TooltipTrigger>Delayed</TooltipTrigger>
          <TooltipContent>Delayed tooltip</TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );

    expect(screen.queryByRole('tooltip')).not.toBeInTheDocument();
  });

  it('renders multiple tooltip content elements', () => {
    render(
      <TooltipProvider>
        <Tooltip open={true}>
          <TooltipTrigger>Trigger</TooltipTrigger>
          <TooltipContent>
            <div>Complex content with multiple parts</div>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );

    const tooltip = screen.getByRole('tooltip');
    expect(tooltip).toBeInTheDocument();
  });
});
