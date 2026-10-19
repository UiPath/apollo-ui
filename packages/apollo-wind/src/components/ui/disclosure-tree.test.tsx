import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe } from 'jest-axe';
import { createRef } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { DisclosureTree, type DisclosureTreeItem } from './disclosure-tree';

const ITEMS: DisclosureTreeItem[] = [
  {
    id: 'agent',
    label: 'Invoice agent',
    defaultExpanded: true,
    trailing: '4.2 s',
    children: [
      { id: 'lookup', label: 'Look up vendor', icon: <svg data-testid="icon" /> },
      {
        id: 'approve',
        label: 'Approve invoice',
        children: [{ id: 'notify', label: 'Notify finance' }],
      },
    ],
  },
  { id: 'summary', label: 'Summary' },
];

const row = (name: string | RegExp) => screen.getByRole('treeitem', { name });
// Clicks land on a row's own line (its label), not on the item that also holds its children.
const line = (label: string) => screen.getByText(label);

describe('DisclosureTree', () => {
  it('tightens its rows in a compact ancestor', () => {
    const { container } = render(
      <div data-density="compact">
        <DisclosureTree aria-label="Trace" items={ITEMS} />
      </div>
    );
    for (const row of container.querySelectorAll('[data-slot="disclosure-tree-row"]')) {
      expect(row).toHaveClass('p-1', 'in-data-[density=compact]:py-0.5');
    }
  });

  it('renders an ARIA tree with levels, positions and open state', () => {
    render(<DisclosureTree aria-label="Trace" items={ITEMS} />);
    expect(screen.getByRole('tree', { name: 'Trace' })).toBeInTheDocument();
    expect(row(/Invoice agent/)).toHaveAttribute('aria-expanded', 'true');
    expect(row(/Invoice agent/)).toHaveAttribute('aria-level', '1');
    expect(row('Look up vendor')).toHaveAttribute('aria-level', '2');
    expect(row('Look up vendor')).toHaveAttribute('aria-posinset', '1');
    expect(row('Look up vendor')).toHaveAttribute('aria-setsize', '2');
    expect(row('Look up vendor')).not.toHaveAttribute('aria-expanded');
    expect(row('Approve invoice')).toHaveAttribute('aria-expanded', 'false');
    expect(screen.queryByRole('treeitem', { name: 'Notify finance' })).toBeNull();
  });

  it('nests each group inside its treeitem and names an item by its label alone', async () => {
    const user = userEvent.setup();
    render(<DisclosureTree aria-label="Trace" items={ITEMS} />);
    const agent = row('Invoice agent');
    const group = screen.getByRole('group');
    expect(group.parentElement).toBe(agent);
    expect(agent).toHaveAccessibleName('Invoice agent');
    // A click on a child's line toggles the child, never its parent.
    await user.click(line('Approve invoice'));
    expect(agent).toHaveAttribute('aria-expanded', 'true');
    expect(row('Approve invoice')).toHaveAttribute('aria-expanded', 'true');
    expect(row('Approve invoice')).toHaveFocus();
  });

  it('renders the leading icon and trailing info slots', () => {
    render(<DisclosureTree aria-label="Trace" items={ITEMS} />);
    expect(screen.getByTestId('icon').closest('[data-slot="disclosure-tree-icon"]')).not.toBeNull();
    expect(screen.getByText('4.2 s')).toHaveAttribute('data-slot', 'disclosure-tree-trailing');
  });

  it('toggles a row on click and reports the change', async () => {
    const user = userEvent.setup();
    const onExpandedChange = vi.fn();
    render(<DisclosureTree aria-label="Trace" items={ITEMS} onExpandedChange={onExpandedChange} />);
    await user.click(line('Approve invoice'));
    expect(row('Approve invoice')).toHaveAttribute('aria-expanded', 'true');
    expect(row('Notify finance')).toBeInTheDocument();
    expect(onExpandedChange).toHaveBeenCalledWith('approve', true);
  });

  it('follows a controlled expanded list', async () => {
    const user = userEvent.setup();
    const onExpandedChange = vi.fn();
    const { rerender } = render(
      <DisclosureTree
        aria-label="Trace"
        items={ITEMS}
        expanded={[]}
        onExpandedChange={onExpandedChange}
      />
    );
    // Controlled: defaultExpanded is ignored and a click only reports.
    expect(row(/Invoice agent/)).toHaveAttribute('aria-expanded', 'false');
    await user.click(line('Invoice agent'));
    expect(onExpandedChange).toHaveBeenCalledWith('agent', true);
    expect(row(/Invoice agent/)).toHaveAttribute('aria-expanded', 'false');

    rerender(<DisclosureTree aria-label="Trace" items={ITEMS} expanded={['agent', 'approve']} />);
    expect(row('Notify finance')).toBeInTheDocument();
  });

  it('builds lazy children once, when the row first opens', async () => {
    const user = userEvent.setup();
    const build = vi.fn(() => [{ id: 'child', label: 'Child span' }]);
    render(
      <DisclosureTree
        aria-label="Trace"
        items={[{ id: 'root', label: 'Root span', expandable: true, children: build }]}
      />
    );
    expect(build).not.toHaveBeenCalled();
    await user.click(line('Root span'));
    expect(row('Child span')).toBeInTheDocument();
    await user.click(line('Root span'));
    await user.click(line('Root span'));
    expect(build).toHaveBeenCalledTimes(1);
  });

  it('keeps one row in the tab order and moves it with the arrow keys, Home and End', async () => {
    const user = userEvent.setup();
    render(<DisclosureTree aria-label="Trace" items={ITEMS} />);
    const tabbable = () =>
      screen.getAllByRole('treeitem').filter((item) => item.getAttribute('tabindex') === '0');
    expect(tabbable()).toEqual([row(/Invoice agent/)]);

    await user.tab();
    expect(row(/Invoice agent/)).toHaveFocus();
    await user.keyboard('{ArrowDown}');
    expect(row('Look up vendor')).toHaveFocus();
    expect(tabbable()).toEqual([row('Look up vendor')]);
    await user.keyboard('{End}');
    expect(row('Summary')).toHaveFocus();
    await user.keyboard('{ArrowUp}');
    expect(row('Approve invoice')).toHaveFocus();
    await user.keyboard('{Home}');
    expect(row(/Invoice agent/)).toHaveFocus();
  });

  it('opens and enters with Right, closes and leaves with Left, toggles with Enter and Space', async () => {
    const user = userEvent.setup();
    render(<DisclosureTree aria-label="Trace" items={ITEMS} />);
    row('Approve invoice').focus();

    await user.keyboard('{ArrowRight}');
    expect(row('Approve invoice')).toHaveAttribute('aria-expanded', 'true');
    expect(row('Approve invoice')).toHaveFocus();
    await user.keyboard('{ArrowRight}');
    expect(row('Notify finance')).toHaveFocus();
    await user.keyboard('{ArrowLeft}');
    expect(row('Approve invoice')).toHaveFocus();
    await user.keyboard('{ArrowLeft}');
    expect(row('Approve invoice')).toHaveAttribute('aria-expanded', 'false');
    await user.keyboard('{ArrowLeft}');
    expect(row(/Invoice agent/)).toHaveFocus();

    await user.keyboard('{Enter}');
    expect(row(/Invoice agent/)).toHaveAttribute('aria-expanded', 'false');
    await user.keyboard(' ');
    expect(row(/Invoice agent/)).toHaveAttribute('aria-expanded', 'true');
  });

  it('stays on an open row with no children when Right is pressed', async () => {
    const user = userEvent.setup();
    render(
      <DisclosureTree
        aria-label="Trace"
        items={[
          { id: 'empty', label: 'Empty span', expandable: true, children: () => [] },
          { id: 'next', label: 'Next span' },
        ]}
      />
    );
    row('Empty span').focus();
    await user.keyboard('{ArrowRight}');
    expect(row('Empty span')).toHaveAttribute('aria-expanded', 'true');
    await user.keyboard('{ArrowRight}');
    expect(row('Empty span')).toHaveFocus();
  });

  it('renders an icon or trailing value of 0', () => {
    render(
      <DisclosureTree
        aria-label="Trace"
        items={[{ id: 'z', label: 'Zero', trailing: 0, icon: 0 }]}
      />
    );
    expect(document.querySelector('[data-slot="disclosure-tree-trailing"]')).toHaveTextContent('0');
    expect(document.querySelector('[data-slot="disclosure-tree-icon"]')).toHaveTextContent('0');
  });

  it('moves the tab stop back to the first row when the focused row is hidden', () => {
    render(<DisclosureTree aria-label="Trace" items={ITEMS} />);
    fireEvent.focus(row('Look up vendor'));
    fireEvent.click(line('Invoice agent'));
    expect(row(/Invoice agent/)).toHaveAttribute('tabindex', '0');
  });

  it('shows a row description as its accessible description and in a tooltip on focus', async () => {
    render(
      <DisclosureTree
        aria-label="Trace"
        items={[{ id: 'a', label: 'Fetch', description: 'Called the vendor API' }]}
      />
    );
    expect(row('Fetch')).toHaveAccessibleDescription('Called the vendor API');
    fireEvent.focus(row('Fetch'));
    expect(await screen.findByRole('tooltip')).toHaveTextContent('Called the vendor API');
    fireEvent.blur(row('Fetch'));
    expect(screen.queryByRole('tooltip')).toBeNull();
  });

  it('forwards the ref and the className', () => {
    const ref = createRef<HTMLDivElement>();
    render(<DisclosureTree ref={ref} aria-label="Trace" items={ITEMS} className="custom" />);
    expect(ref.current).toHaveAttribute('data-slot', 'disclosure-tree');
    expect(ref.current).toHaveClass('custom');
  });

  it('has no axe violations', async () => {
    const { container } = render(
      <DisclosureTree
        aria-label="Trace"
        items={[...ITEMS, { id: 'd', label: 'Described', description: 'More detail' }]}
      />
    );
    expect(await axe(container)).toHaveNoViolations();
  });
});
