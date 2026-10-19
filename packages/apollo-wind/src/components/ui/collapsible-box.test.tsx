import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe } from 'jest-axe';
import { describe, expect, it, vi } from 'vitest';
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

  describe('keepMounted', () => {
    const KeptMountedExample = (props: React.ComponentProps<typeof CollapsibleBox>) => (
      <CollapsibleBox {...props}>
        <CollapsibleBoxHeader>
          <CollapsibleBoxTrigger>Filters</CollapsibleBoxTrigger>
        </CollapsibleBoxHeader>
        <CollapsibleBoxContent keepMounted>
          <label>
            Name
            <input name="name" />
          </label>
        </CollapsibleBoxContent>
      </CollapsibleBox>
    );
    const getContent = (container: HTMLElement) =>
      container.querySelector<HTMLElement>('[data-slot="collapsible-box-content"]');

    it('keeps the body mounted, hidden and inert when it starts collapsed', () => {
      const { container } = render(<KeptMountedExample defaultOpen={false} />);
      const content = getContent(container);
      expect(content).toHaveAttribute('data-state', 'closed');
      expect(content).toHaveAttribute('hidden');
      expect(content).toHaveAttribute('inert');
      expect(screen.getByRole('textbox', { hidden: true })).not.toBeVisible();
    });

    it('keeps field state across collapse and expand', async () => {
      const user = userEvent.setup();
      const { container } = render(<KeptMountedExample />);
      await user.type(screen.getByRole('textbox', { name: 'Name' }), 'Ada');

      await user.click(screen.getByRole('button', { name: 'Filters' }));
      const content = getContent(container);
      expect(content).toHaveAttribute('inert');
      expect(screen.getByRole('textbox', { hidden: true })).toHaveValue('Ada');
      expect(content).toHaveClass('data-[state=closed]:[animation-fill-mode:forwards]');

      fireEvent.animationEnd(content as HTMLElement);
      expect(content).toHaveAttribute('hidden');

      await user.click(screen.getByRole('button', { name: 'Filters' }));
      expect(content).not.toHaveAttribute('hidden');
      expect(content).not.toHaveAttribute('inert');
      expect(screen.getByRole('textbox', { name: 'Name' })).toHaveValue('Ada');
    });

    it('keeps collapsed fields in native form submission', () => {
      const { container } = render(
        <form>
          <KeptMountedExample defaultOpen={false} />
        </form>
      );
      const form = container.querySelector('form') as HTMLFormElement;
      expect(new FormData(form).has('name')).toBe(true);
    });

    it('ignores animation ends bubbling from nested content', async () => {
      const user = userEvent.setup();
      const { container } = render(<KeptMountedExample />);
      await user.click(screen.getByRole('button', { name: 'Filters' }));
      fireEvent.animationEnd(screen.getByRole('textbox', { hidden: true }));
      expect(getContent(container)).not.toHaveAttribute('hidden');
    });

    it('follows the controlled open prop', () => {
      const { container, rerender } = render(<KeptMountedExample open={false} />);
      expect(getContent(container)).toHaveAttribute('hidden');

      rerender(<KeptMountedExample open />);
      expect(getContent(container)).not.toHaveAttribute('hidden');
      expect(getContent(container)).not.toHaveAttribute('inert');
      expect(screen.getByRole('textbox', { name: 'Name' })).toBeVisible();
    });

    it('has no accessibility violations while collapsed', async () => {
      const { container } = render(<KeptMountedExample defaultOpen={false} />);
      expect(await axe(container)).toHaveNoViolations();
    });
  });

  it('merges custom class names', () => {
    const { container } = render(<CollapsibleBoxExample className="custom-class" />);
    expect(container.querySelector('[data-slot="collapsible-box"]')).toHaveClass(
      'custom-class',
      'rounded-2xl'
    );
  });
});
