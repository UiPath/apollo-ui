import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe } from 'jest-axe';
import { describe, expect, expectTypeOf, it, vi } from 'vitest';
import {
  CollapsibleBox,
  CollapsibleBoxActions,
  CollapsibleBoxContent,
  CollapsibleBoxHeader,
  CollapsibleBoxTrigger,
} from './collapsible-box';

describe('CollapsibleBox', () => {
  const CollapsibleBoxExample = (props: React.ComponentProps<typeof CollapsibleBox>) => (
    <CollapsibleBox {...props}>
      <CollapsibleBoxHeader>
        <CollapsibleBoxTrigger>Filters</CollapsibleBoxTrigger>
        <CollapsibleBoxActions>
          <button type="button" aria-label="More actions">
            ...
          </button>
        </CollapsibleBoxActions>
      </CollapsibleBoxHeader>
      <CollapsibleBoxContent>Filter conditions</CollapsibleBoxContent>
    </CollapsibleBox>
  );

  it('has no accessibility violations', async () => {
    const { container } = render(<CollapsibleBoxExample />);
    expect(await axe(container)).toHaveNoViolations();
  });

  it('is open by default', () => {
    render(<CollapsibleBoxExample />);
    expect(screen.getByRole('button', { name: 'Filters' })).toHaveAttribute(
      'aria-expanded',
      'true'
    );
    expect(screen.getByText('Filter conditions')).toBeVisible();
  });

  it('starts collapsed with defaultOpen={false}', () => {
    render(<CollapsibleBoxExample defaultOpen={false} />);
    expect(screen.getByRole('button', { name: 'Filters' })).toHaveAttribute(
      'aria-expanded',
      'false'
    );
    expect(screen.queryByText('Filter conditions')).not.toBeInTheDocument();
  });

  it('toggles when the trigger is clicked', async () => {
    const user = userEvent.setup();
    const onOpenChange = vi.fn();
    render(<CollapsibleBoxExample onOpenChange={onOpenChange} />);

    await user.click(screen.getByRole('button', { name: 'Filters' }));
    expect(onOpenChange).toHaveBeenCalledWith(false);
    expect(screen.queryByText('Filter conditions')).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Filters' }));
    expect(onOpenChange).toHaveBeenCalledWith(true);
    expect(screen.getByText('Filter conditions')).toBeVisible();
  });

  it('does not toggle when an action is clicked', async () => {
    const user = userEvent.setup();
    const onOpenChange = vi.fn();
    render(<CollapsibleBoxExample onOpenChange={onOpenChange} />);

    await user.click(screen.getByRole('button', { name: 'More actions' }));
    expect(onOpenChange).not.toHaveBeenCalled();
  });

  it('follows the controlled open prop', () => {
    const { rerender } = render(<CollapsibleBoxExample open={false} />);
    expect(screen.queryByText('Filter conditions')).not.toBeInTheDocument();

    rerender(<CollapsibleBoxExample open />);
    expect(screen.getByText('Filter conditions')).toBeVisible();
  });

  it('exposes open state and slots for styling', () => {
    const { container } = render(<CollapsibleBoxExample defaultOpen={false} />);
    const root = container.querySelector('[data-slot="collapsible-box"]');
    expect(root).toHaveAttribute('data-state', 'closed');
    expect(container.querySelector('[data-slot="collapsible-box-header"]')).toBeInTheDocument();
    expect(container.querySelector('[data-slot="collapsible-box-actions"]')).toBeInTheDocument();
  });

  it('draws the header divider from its own trigger, not an open ancestor', () => {
    const { container } = render(
      <CollapsibleBox>
        <CollapsibleBoxHeader>
          <CollapsibleBoxTrigger>Outer</CollapsibleBoxTrigger>
        </CollapsibleBoxHeader>
        <CollapsibleBoxContent>
          <CollapsibleBox defaultOpen={false}>
            <CollapsibleBoxHeader>
              <CollapsibleBoxTrigger>Inner</CollapsibleBoxTrigger>
            </CollapsibleBoxHeader>
            <CollapsibleBoxContent>Inner content</CollapsibleBoxContent>
          </CollapsibleBox>
        </CollapsibleBoxContent>
      </CollapsibleBox>
    );
    const [outerHeader, innerHeader] = Array.from(
      container.querySelectorAll<HTMLElement>('[data-slot="collapsible-box-header"]')
    );
    const DIVIDER = 'has-[>[data-slot=collapsible-box-trigger][data-state=open]]:border-b';
    const OWN_TRIGGER_OPEN = ':has(> [data-slot="collapsible-box-trigger"][data-state="open"])';

    for (const header of [outerHeader, innerHeader]) {
      expect(header).toHaveClass(DIVIDER);
      expect(header.className).not.toMatch(/group-data-/);
    }
    expect(outerHeader.matches(OWN_TRIGGER_OPEN)).toBe(true);
    expect(innerHeader.matches(OWN_TRIGGER_OPEN)).toBe(false);
  });

  it('does not accept asChild on the trigger or the content', () => {
    // Both parts render their own inner markup, so Radix's asChild cannot apply.
    expectTypeOf<React.ComponentProps<typeof CollapsibleBoxTrigger>>().not.toHaveProperty(
      'asChild'
    );
    expectTypeOf<React.ComponentProps<typeof CollapsibleBoxContent>>().not.toHaveProperty(
      'asChild'
    );
  });

  it('merges custom class names', () => {
    const { container } = render(<CollapsibleBoxExample className="custom-class" />);
    expect(container.querySelector('[data-slot="collapsible-box"]')).toHaveClass(
      'custom-class',
      'rounded-2xl'
    );
  });
});
