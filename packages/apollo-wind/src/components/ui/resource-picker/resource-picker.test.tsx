import { act, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe } from 'jest-axe';
import { useState } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { Popover, PopoverAnchor, PopoverContent } from '@/components/ui/popover';
import { PortalContainerProvider } from '@/components/ui/portal-container';
import {
  keepResourceSearchOnEscape,
  ResourcePicker,
  ResourcePickerContent,
} from './resource-picker';
import type { ResourceGroup } from './types';

const GROUPS: ResourceGroup[] = [
  {
    id: 'HLConditionalPublished',
    label: 'HLConditionalPublished',
    items: [{ id: 'HLConditionalPublished/CaseComments', label: 'CaseComments' }],
  },
  {
    id: 'Shared',
    label: 'Shared',
    items: [
      { id: 'Shared/Aavi', label: 'Aavi' },
      { id: 'Shared/AvichalFolderEntity', label: 'AvichalFolderEntity' },
      { id: 'Shared/Candidate', label: 'Candidate' },
    ],
  },
];

/** A group's heading, which is a label rather than a control. */
const headingOf = (label: string) => {
  const heading = screen.getByText(label).closest('[data-slot="resource-group-header"]');
  if (!(heading instanceof HTMLElement)) throw new Error(`No open heading for ${label}`);
  return heading;
};

/**
 * Keeps a popover whose content has the `rp-exit` class mounted once it
 * closes, until an `animationend` is dispatched on it. jsdom neither runs
 * animations nor resolves them into computed styles, and reporting an
 * animation name is enough for Radix to wait for the exit to end.
 */
const holdExitAnimation = () => {
  const computed = window.getComputedStyle.bind(window);
  vi.spyOn(window, 'getComputedStyle').mockImplementation((element, pseudo) => {
    const style = computed(element, pseudo);
    if (!(element as Element).classList?.contains('rp-exit')) return style;
    // Read when Radix asks, as a live style would be: an enter animation
    // while open, a different, exit one once closed.
    return new Proxy(style, {
      get: (target, key) =>
        key === 'animationName'
          ? (element as Element).getAttribute('data-state') === 'closed'
            ? 'rp-exit'
            : 'rp-enter'
          : Reflect.get(target, key, target),
    });
  });
};

describe('ResourcePickerContent', () => {
  it('passes a full accessibility check with groups present, open and collapsed', async () => {
    const user = userEvent.setup();
    const { container } = render(
      <ResourcePickerContent
        groups={[GROUPS[0], { ...GROUPS[1], defaultCollapsed: true }]}
        onSelect={vi.fn()}
        value="HLConditionalPublished/CaseComments"
      />
    );

    expect(await axe(container)).toHaveNoViolations();
    await user.click(screen.getByRole('option', { name: 'Shared, collapsed' }));
    expect(screen.getByRole('option', { name: 'Aavi' })).toBeInTheDocument();
    expect(await axe(container)).toHaveNoViolations();
  });

  it('keeps one listbox, named by the search, holding only groups and options', async () => {
    const user = userEvent.setup();
    render(<ResourcePickerContent groups={GROUPS} onSelect={vi.fn()} />);

    const listbox = screen.getByRole('listbox', { name: 'Resources' });
    expect(screen.getByRole('combobox')).toHaveAttribute('aria-controls', listbox.id);
    // Groups are named by their label, and their headings are not controls.
    const shared = within(listbox).getByRole('group', { name: 'Shared' });
    expect(
      within(shared)
        .getAllByRole('option')
        .map((row) => row.textContent)
    ).toEqual(['Aavi', 'AvichalFolderEntity', 'Candidate']);
    expect(within(listbox).queryByRole('button')).not.toBeInTheDocument();

    // Collapsed, the group keeps its heading as one option that says so.
    await user.click(headingOf('Shared'));
    expect(within(shared).getAllByRole('option')).toHaveLength(1);
    expect(within(shared).getByRole('option')).toHaveAccessibleName('Shared, collapsed');
    expect(within(shared).getByRole('option')).not.toHaveAttribute('aria-current');
  });

  it('keeps the keyboard cursor running across groups', async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();
    render(<ResourcePickerContent groups={GROUPS} onSelect={onSelect} />);

    const search = screen.getByRole('combobox');
    await user.click(search);
    // The first row is active on open; one step down crosses into the next
    // group's listbox.
    await user.keyboard('{ArrowDown}');
    expect(search).toHaveAttribute(
      'aria-activedescendant',
      screen.getByRole('option', { name: 'Aavi' }).id
    );
    await user.keyboard('{Enter}');
    expect(onSelect).toHaveBeenCalledWith(expect.objectContaining({ id: 'Shared/Aavi' }));
  });

  it('keeps a group glyph out of the group and heading names', () => {
    render(
      <ResourcePickerContent
        groups={[
          { ...GROUPS[1], icon: <span>Database icon</span> },
          { ...GROUPS[0], icon: <span>Table icon</span>, defaultCollapsed: true },
        ]}
        onSelect={vi.fn()}
      />
    );

    expect(screen.getByRole('group', { name: 'Shared' })).toBeInTheDocument();
    expect(
      screen.getByRole('option', { name: 'HLConditionalPublished, collapsed' })
    ).toBeInTheDocument();
    expect(screen.queryByRole('group', { name: /icon/ })).not.toBeInTheDocument();
  });

  it('lists every group with its rows and count', () => {
    render(<ResourcePickerContent groups={GROUPS} onSelect={vi.fn()} />);

    expect(screen.getByRole('group', { name: 'HLConditionalPublished' })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'CaseComments' })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'Aavi' })).toBeInTheDocument();
    expect(headingOf('Shared')).toHaveTextContent('3');
  });

  it('commits a row on click, with no confirm step', async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();
    render(<ResourcePickerContent groups={GROUPS} onSelect={onSelect} />);

    await user.click(screen.getByRole('option', { name: 'Aavi' }));

    expect(onSelect).toHaveBeenCalledTimes(1);
    expect(onSelect).toHaveBeenCalledWith(expect.objectContaining({ id: 'Shared/Aavi' }));
  });

  it('filters rows and drops a group that has no match left', async () => {
    const user = userEvent.setup();
    render(<ResourcePickerContent groups={GROUPS} onSelect={vi.fn()} />);

    await user.type(screen.getByRole('combobox'), 'Candidate');

    expect(screen.getByRole('option', { name: 'Candidate' })).toBeInTheDocument();
    expect(screen.queryByRole('option', { name: 'Aavi' })).not.toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: /HLConditionalPublished/ })
    ).not.toBeInTheDocument();
  });

  it('lists a whole group when the search matches its name', async () => {
    const user = userEvent.setup();
    render(<ResourcePickerContent groups={GROUPS} onSelect={vi.fn()} />);

    await user.type(screen.getByRole('combobox'), 'shared');

    // None of these rows contains "shared"; the group name does.
    expect(screen.getByRole('option', { name: 'Aavi' })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'Candidate' })).toBeInTheDocument();
    expect(screen.queryByRole('option', { name: 'CaseComments' })).not.toBeInTheDocument();
  });

  it('names the query when a search matches nothing', async () => {
    const user = userEvent.setup();
    render(
      <ResourcePickerContent groups={GROUPS} onSelect={vi.fn()} emptyText="No entities yet." />
    );

    await user.type(screen.getByRole('combobox'), 'zzzz');

    // A search that matched nothing is not an empty picker, so it does not
    // borrow the empty wording.
    expect(screen.getByText('No results match “zzzz”.')).toBeInTheDocument();
    expect(screen.queryByText('No entities yet.')).not.toBeInTheDocument();
  });

  it('takes consumer wording for a search that matches nothing', async () => {
    const user = userEvent.setup();
    render(
      <ResourcePickerContent
        groups={GROUPS}
        onSelect={vi.fn()}
        emptyText="Noch keine Entitäten."
        noMatchText={(query) => `Nichts für ${query}`}
      />
    );

    await user.type(screen.getByRole('combobox'), '  zzz ');
    expect(screen.getByRole('status')).toHaveTextContent('Nichts für zzz');
    expect(screen.queryByText(/No results match/)).not.toBeInTheDocument();
  });

  it('shows the empty text when there is nothing to pick', () => {
    render(<ResourcePickerContent groups={[]} onSelect={vi.fn()} emptyText="No entities yet." />);

    expect(screen.getByText('No entities yet.')).toBeInTheDocument();
  });

  it('shows the empty text, not a search miss, when there is no data to search', () => {
    render(
      <ResourcePickerContent
        groups={[{ id: 'g', label: 'Group', items: [] }]}
        onSelect={vi.fn()}
        initialSearch="Aavi"
        emptyText="No entities yet."
      />
    );

    expect(screen.getByText('No entities yet.')).toBeInTheDocument();
    expect(screen.queryByText(/Aavi/)).not.toBeInTheDocument();
  });

  it('passes a full accessibility check with nothing to pick', async () => {
    const { container } = render(
      <ResourcePickerContent groups={[]} onSelect={vi.fn()} emptyText="No entities yet." />
    );

    // The message sits beside the listbox, which stays mounted and empty, so
    // the search keeps pointing at a listbox that holds nothing else.
    const listbox = screen.getByRole('listbox');
    expect(listbox).not.toHaveTextContent('No entities yet.');
    expect(screen.getByRole('combobox')).toHaveAttribute('aria-controls', listbox.id);
    expect(await axe(container)).toHaveNoViolations();
  });

  it('passes a full accessibility check when a search matches nothing', async () => {
    const user = userEvent.setup();
    const { container } = render(<ResourcePickerContent groups={GROUPS} onSelect={vi.fn()} />);

    await user.type(screen.getByRole('combobox'), 'zzzz');

    const controls = screen.getByRole('combobox').getAttribute('aria-controls') ?? '';
    const rows = document.getElementById(controls);
    expect(rows).toBeInTheDocument();
    expect(rows).not.toHaveTextContent('No results match');
    expect(screen.getByText('No results match “zzzz”.')).toBeInTheDocument();
    expect(await axe(container)).toHaveNoViolations();
  });

  it('announces the miss through a status region that stays mounted', async () => {
    const user = userEvent.setup();
    const { container } = render(<ResourcePickerContent groups={GROUPS} onSelect={vi.fn()} />);

    // Mounted and empty while rows match, so the region exists before the
    // message arrives and the change into it is announced.
    const status = screen.getByRole('status');
    expect(status).toBeEmptyDOMElement();

    const search = screen.getByRole('combobox');
    await user.type(search, 'Aav');
    expect(screen.getByRole('option', { name: 'Aavi' })).toBeInTheDocument();
    expect(screen.getByRole('status')).toBe(status);
    expect(status).toBeEmptyDOMElement();

    await user.type(search, 'z');
    expect(screen.queryByRole('option')).not.toBeInTheDocument();
    expect(screen.getByRole('status')).toBe(status);
    expect(status).toHaveTextContent('No results match “Aavz”.');
    expect(await axe(container)).toHaveNoViolations();

    await user.clear(search);
    expect(screen.getByRole('status')).toBe(status);
    expect(status).toBeEmptyDOMElement();
  });

  it('shows the empty text when every group has no rows', () => {
    render(
      <ResourcePickerContent
        groups={[{ id: 'g', label: 'Group', items: [] }]}
        onSelect={vi.fn()}
        emptyText="No entities yet."
      />
    );

    expect(screen.getByText('No entities yet.')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Group/ })).not.toBeInTheDocument();
  });

  it('does not call itself empty when every group is collapsed', async () => {
    const user = userEvent.setup();
    const { container } = render(
      <ResourcePickerContent groups={GROUPS} onSelect={vi.fn()} emptyText="No entities yet." />
    );

    await user.click(headingOf('HLConditionalPublished'));
    await user.click(headingOf('Shared'));

    expect(
      screen.getAllByRole('option').map((option) => option.getAttribute('aria-label'))
    ).toEqual(['HLConditionalPublished, collapsed', 'Shared, collapsed']);
    expect(screen.queryByText('No entities yet.')).not.toBeInTheDocument();
    expect(await axe(container)).toHaveNoViolations();
  });

  it('collapses a group from its heading and expands it from its collapsed row', async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();
    render(<ResourcePickerContent groups={GROUPS} onSelect={onSelect} />);

    await user.click(headingOf('Shared'));
    expect(screen.queryByRole('option', { name: 'Aavi' })).not.toBeInTheDocument();

    await user.click(screen.getByRole('option', { name: 'Shared, collapsed' }));
    expect(screen.getByRole('option', { name: 'Aavi' })).toBeInTheDocument();
    // Opening a group commits nothing.
    expect(onSelect).not.toHaveBeenCalled();
  });

  it('takes consumer wording for a collapsed group', () => {
    render(
      <ResourcePickerContent
        groups={[{ ...GROUPS[1], defaultCollapsed: true }]}
        onSelect={vi.fn()}
        collapsedGroupLabel={(label) => `${label}, zugeklappt`}
      />
    );
    expect(screen.getByRole('option', { name: 'Shared, zugeklappt' })).toBeInTheDocument();
  });

  it('honours defaultCollapsed', () => {
    render(
      <ResourcePickerContent
        groups={[{ ...GROUPS[1], defaultCollapsed: true }]}
        onSelect={vi.fn()}
      />
    );

    expect(screen.queryByRole('option', { name: 'Aavi' })).not.toBeInTheDocument();
  });

  it('honours defaultCollapsed on groups that arrive after mount', async () => {
    const user = userEvent.setup();
    const { rerender } = render(<ResourcePickerContent groups={[]} onSelect={vi.fn()} />);

    rerender(
      <ResourcePickerContent
        groups={[GROUPS[0], { ...GROUPS[1], defaultCollapsed: true }]}
        onSelect={vi.fn()}
      />
    );
    expect(screen.getByRole('option', { name: 'CaseComments' })).toBeInTheDocument();
    expect(screen.queryByRole('option', { name: 'Aavi' })).not.toBeInTheDocument();

    // A group the user has opened keeps that state as more groups arrive.
    await user.click(screen.getByRole('option', { name: 'Shared, collapsed' }));
    expect(screen.getByRole('option', { name: 'Aavi' })).toBeInTheDocument();
    rerender(
      <ResourcePickerContent
        groups={[
          GROUPS[0],
          { ...GROUPS[1], defaultCollapsed: true },
          {
            id: 'People',
            label: 'People',
            defaultCollapsed: true,
            items: [{ id: 'People/Alex', label: 'Alex' }],
          },
        ]}
        onSelect={vi.fn()}
      />
    );
    expect(screen.getByRole('option', { name: 'Aavi' })).toBeInTheDocument();
    expect(screen.queryByRole('option', { name: 'Alex' })).not.toBeInTheDocument();
  });

  it("keeps each group's collapse state through a search", async () => {
    const user = userEvent.setup();
    render(<ResourcePickerContent groups={GROUPS} onSelect={vi.fn()} />);

    const search = screen.getByRole('combobox');
    await user.type(search, 'a');
    // A search keeps every group open, so its heading does not toggle.
    await user.click(headingOf('Shared'));
    expect(screen.getByRole('option', { name: 'Aavi' })).toBeInTheDocument();

    await user.clear(search);
    expect(screen.getByRole('option', { name: 'Aavi' })).toBeInTheDocument();
    expect(screen.queryByRole('option', { name: 'Shared, collapsed' })).not.toBeInTheDocument();
  });

  it('reveals a match inside a collapsed group while searching', async () => {
    const user = userEvent.setup();
    render(
      <ResourcePickerContent
        groups={[{ ...GROUPS[1], defaultCollapsed: true }]}
        onSelect={vi.fn()}
      />
    );

    expect(screen.queryByRole('option', { name: 'Aavi' })).not.toBeInTheDocument();
    await user.type(screen.getByRole('combobox'), 'Aavi');
    expect(screen.getByRole('option', { name: 'Aavi' })).toBeInTheDocument();
  });

  it('tells apart same-named rows in different groups', async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();
    const duplicated: ResourceGroup[] = [
      GROUPS[0],
      { id: 'Other', label: 'Other', items: [{ id: 'Other/CaseComments', label: 'CaseComments' }] },
    ];
    render(<ResourcePickerContent groups={duplicated} onSelect={onSelect} />);

    const rows = screen.getAllByRole('option', { name: 'CaseComments' });
    expect(rows).toHaveLength(2);

    await user.click(rows[1]);
    expect(onSelect).toHaveBeenCalledWith(expect.objectContaining({ id: 'Other/CaseComments' }));
  });

  it('marks the chosen row with a tick and the brand tint, not the hover fill', () => {
    render(<ResourcePickerContent groups={GROUPS} onSelect={vi.fn()} value="Shared/Aavi" />);

    const chosen = screen.getByRole('option', { name: 'Aavi' });
    const other = screen.getByRole('option', { name: 'Candidate' });

    expect(chosen.querySelector('svg')).not.toBeNull();
    expect(other.querySelector('svg')).toBeNull();

    // Selection has a tint of its own, so it never reads as the cursor fill,
    // which resolves to the same value as `surface-selected` in every theme.
    expect(chosen).toHaveClass('bg-brand-subtle');
    expect(chosen).not.toHaveClass('data-[selected=true]:bg-surface-overlay');
    expect(other).not.toHaveClass('bg-brand-subtle');
  });

  it('marks the chosen row as current, with one selection state for the cursor', async () => {
    const user = userEvent.setup();
    const { container } = render(
      <ResourcePickerContent groups={GROUPS} onSelect={vi.fn()} value="Shared/Aavi" />
    );

    const chosen = screen.getByRole('option', { name: 'Aavi' });
    const other = screen.getByRole('option', { name: 'Candidate' });
    expect(chosen).toHaveAttribute('aria-current', 'true');
    expect(other).not.toHaveAttribute('aria-current');
    // No second selection state to contradict cmdk's.
    for (const option of screen.getAllByRole('option')) {
      expect(option).not.toHaveAttribute('aria-checked');
    }

    // aria-selected stays cmdk's: it follows the cursor, not the value.
    await user.hover(other);
    expect(other).toHaveAttribute('aria-selected', 'true');
    expect(chosen).toHaveAttribute('aria-selected', 'false');
    expect(chosen).toHaveAttribute('aria-current', 'true');
    expect(await axe(container)).toHaveNoViolations();
  });

  it('keeps the description in the row name', () => {
    render(
      <ResourcePickerContent
        groups={[
          {
            id: 'people',
            label: 'People',
            items: [
              { id: 'a', label: 'Alex', description: 'alex@north.example' },
              { id: 'b', label: 'Alex', description: 'alex@south.example' },
            ],
          },
        ]}
        onSelect={vi.fn()}
      />
    );

    expect(screen.getByRole('option', { name: 'Alex, alex@north.example' })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'Alex, alex@south.example' })).toBeInTheDocument();
  });

  it('does not commit a disabled row', async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();
    render(
      <ResourcePickerContent
        groups={[
          { id: 'g', label: 'Group', items: [{ id: 'g/a', label: 'Locked', disabled: true }] },
        ]}
        onSelect={onSelect}
      />
    );

    await user.click(screen.getByRole('option', { name: 'Locked' }));
    expect(onSelect).not.toHaveBeenCalled();
  });

  it('drops a row with an empty id, which would read as no selection', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    try {
      render(
        <ResourcePickerContent
          groups={[
            {
              id: 'g',
              label: 'Group',
              items: [
                { id: '', label: 'Blank' },
                { id: 'g/a', label: 'Kept' },
              ],
            },
          ]}
          onSelect={vi.fn()}
        />
      );
      expect(screen.queryByRole('option', { name: 'Blank' })).not.toBeInTheDocument();
      expect(screen.getByRole('option', { name: 'Kept' })).toBeInTheDocument();
      expect(warn).toHaveBeenCalledWith(expect.stringContaining('empty id'));
    } finally {
      vi.restoreAllMocks();
    }
  });

  it('clears the query on Escape rather than letting it dismiss', async () => {
    const user = userEvent.setup();
    render(<ResourcePickerContent groups={GROUPS} onSelect={vi.fn()} />);

    const search = screen.getByRole('combobox');
    await user.type(search, 'Aavi');
    expect(search).toHaveValue('Aavi');

    await user.type(search, '{Escape}');
    expect(search).toHaveValue('');
  });

  it('lets a hosting Dialog clear the search on Escape before it dismisses', async () => {
    const user = userEvent.setup();
    function Host() {
      const [open, setOpen] = useState(true);
      return (
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogContent onEscapeKeyDown={keepResourceSearchOnEscape}>
            <DialogTitle>Choose entity</DialogTitle>
            <ResourcePickerContent groups={GROUPS} onSelect={vi.fn()} />
          </DialogContent>
        </Dialog>
      );
    }
    render(<Host />);

    const search = screen.getByRole('combobox');
    await user.type(search, 'Aavi');
    await user.keyboard('{Escape}');
    expect(search).toHaveValue('');
    expect(screen.getByRole('dialog')).toBeInTheDocument();

    await user.keyboard('{Escape}');
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
  });

  it('lets a hosting Popover clear the search on Escape before it dismisses', async () => {
    const user = userEvent.setup();
    function Host() {
      const [open, setOpen] = useState(true);
      return (
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverAnchor />
          <PopoverContent aria-label="Entities" onEscapeKeyDown={keepResourceSearchOnEscape}>
            <ResourcePickerContent groups={GROUPS} onSelect={vi.fn()} />
          </PopoverContent>
        </Popover>
      );
    }
    render(<Host />);

    const search = screen.getByRole('combobox');
    await user.type(search, 'Aavi');
    await user.keyboard('{Escape}');
    expect(search).toHaveValue('');
    expect(screen.getByRole('dialog', { name: 'Entities' })).toBeInTheDocument();

    await user.keyboard('{Escape}');
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
  });

  it('clears the search on Escape from a footer action before the host dismisses', async () => {
    const user = userEvent.setup();
    function Host() {
      const [open, setOpen] = useState(true);
      return (
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverAnchor />
          <PopoverContent aria-label="Entities" onEscapeKeyDown={keepResourceSearchOnEscape}>
            <ResourcePickerContent
              groups={GROUPS}
              onSelect={vi.fn()}
              footerLeading={<button type="button">Add new entity</button>}
            />
          </PopoverContent>
        </Popover>
      );
    }
    render(<Host />);

    const search = screen.getByRole('combobox');
    await user.type(search, 'Aavi');
    screen.getByRole('button', { name: 'Add new entity' }).focus();
    await user.keyboard('{Escape}');
    expect(search).toHaveValue('');
    expect(screen.getByRole('dialog', { name: 'Entities' })).toBeInTheDocument();

    await user.keyboard('{Escape}');
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
  });

  it('clears the search on Escape inside an open shadow root before the host dismisses', async () => {
    const user = userEvent.setup();
    const shadowHost = document.body.appendChild(document.createElement('div'));
    const shadowRoot = shadowHost.attachShadow({ mode: 'open' });
    const mount = shadowRoot.appendChild(document.createElement('div'));
    function Host() {
      const [open, setOpen] = useState(true);
      return (
        <PortalContainerProvider>
          <Popover open={open} onOpenChange={setOpen}>
            <PopoverAnchor />
            <PopoverContent aria-label="Entities" onEscapeKeyDown={keepResourceSearchOnEscape}>
              <ResourcePickerContent groups={GROUPS} onSelect={vi.fn()} initialSearch="Aavi" />
            </PopoverContent>
          </Popover>
        </PortalContainerProvider>
      );
    }
    try {
      render(<Host />, { container: mount });
      const inShadow = within(mount);

      // Seeded rather than typed: user-event's typing does not reach React's
      // change tracking inside a jsdom shadow root.
      const search = await inShadow.findByRole('combobox');
      expect(search).toHaveValue('Aavi');
      search.focus();
      // The document sees this Escape retargeted to the shadow host.
      await user.keyboard('{Escape}');
      expect(search).toHaveValue('');
      expect(inShadow.getByRole('dialog', { name: 'Entities' })).toBeInTheDocument();

      await user.keyboard('{Escape}');
      await waitFor(() => expect(inShadow.queryByRole('dialog')).not.toBeInTheDocument());
    } finally {
      shadowHost.remove();
    }
  });

  it('lets a read-only controlled query be dismissed on Escape', async () => {
    const user = userEvent.setup();
    function Host() {
      const [open, setOpen] = useState(true);
      return (
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverAnchor />
          <PopoverContent aria-label="Entities" onEscapeKeyDown={keepResourceSearchOnEscape}>
            <ResourcePickerContent groups={GROUPS} onSelect={vi.fn()} query="zzz" />
          </PopoverContent>
        </Popover>
      );
    }
    render(<Host />);

    // Nothing can clear a query with no handler, so the search is read-only
    // and the first Escape closes.
    const search = screen.getByRole('combobox');
    expect(search).toHaveAttribute('readonly');
    search.focus();
    await user.keyboard('zz');
    expect(search).toHaveValue('zzz');
    await user.keyboard('{Escape}');
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
  });

  it('still clears a controlled query that has a handler before dismissing', async () => {
    const user = userEvent.setup();
    const onQueryChange = vi.fn();
    function Host() {
      const [open, setOpen] = useState(true);
      const [query, setQuery] = useState('Aavi');
      return (
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverAnchor />
          <PopoverContent aria-label="Entities" onEscapeKeyDown={keepResourceSearchOnEscape}>
            <ResourcePickerContent
              groups={GROUPS}
              onSelect={vi.fn()}
              query={query}
              onQueryChange={(next) => {
                onQueryChange(next);
                setQuery(next);
              }}
            />
          </PopoverContent>
        </Popover>
      );
    }
    render(<Host />);

    const search = screen.getByRole('combobox');
    search.focus();
    await user.keyboard('{Escape}');
    expect(onQueryChange).toHaveBeenLastCalledWith('');
    expect(search).toHaveValue('');
    expect(screen.getByRole('dialog', { name: 'Entities' })).toBeInTheDocument();

    await user.keyboard('{Escape}');
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
  });

  it('leaves Escape from an input outside the picker to dismiss the host', async () => {
    const user = userEvent.setup();
    function Host() {
      const [open, setOpen] = useState(true);
      return (
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogContent onEscapeKeyDown={keepResourceSearchOnEscape}>
            <DialogTitle>Choose entity</DialogTitle>
            <input aria-label="Name" defaultValue="draft" />
            <ResourcePickerContent groups={GROUPS} onSelect={vi.fn()} initialSearch="Aavi" />
          </DialogContent>
        </Dialog>
      );
    }
    render(<Host />);

    // The picker's own search has text, but Escape did not come from it.
    screen.getByRole('textbox', { name: 'Name' }).focus();
    await user.keyboard('{Escape}');
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
  });

  it('leaves Escape from another input in the host to dismiss it', () => {
    const preventDefault = vi.fn();
    const input = document.createElement('input');
    input.value = 'draft';
    keepResourceSearchOnEscape({ target: input, preventDefault });
    expect(preventDefault).not.toHaveBeenCalled();
  });

  it('collapses with ArrowLeft and expands with ArrowRight, committing nothing', async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();
    render(<ResourcePickerContent groups={GROUPS} onSelect={onSelect} />);
    const search = screen.getByRole('combobox');
    const active = () =>
      document.getElementById(search.getAttribute('aria-activedescendant') ?? '');

    await user.click(search);
    await user.keyboard('{ArrowDown}');
    expect(active()).toHaveAccessibleName('Aavi');

    // ArrowLeft folds the row's group and leaves the cursor on its heading.
    await user.keyboard('{ArrowLeft}');
    expect(screen.queryByRole('option', { name: 'Aavi' })).not.toBeInTheDocument();
    expect(active()).toHaveAccessibleName('Shared, collapsed');

    // ArrowRight opens it again, onto its first row.
    await user.keyboard('{ArrowRight}');
    expect(active()).toHaveAccessibleName('Aavi');

    // Enter on a collapsed heading opens it too, rather than committing.
    await user.keyboard('{ArrowLeft}');
    expect(active()).toHaveAccessibleName('Shared, collapsed');
    await user.keyboard('{Enter}');
    expect(active()).toHaveAccessibleName('Aavi');
    expect(onSelect).not.toHaveBeenCalled();
  });

  it("keeps a focused footer control's keys from the list", async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();
    render(
      <ResourcePickerContent
        groups={GROUPS}
        onSelect={onSelect}
        footerLeading={<button type="button">Add entity</button>}
      />
    );
    const search = screen.getByRole('combobox');
    await user.click(search);
    await user.keyboard('{ArrowDown}');
    const active = search.getAttribute('aria-activedescendant');

    screen.getByRole('button', { name: 'Add entity' }).focus();
    await user.keyboard('{ArrowLeft}{ArrowRight}{ArrowDown}{ArrowUp}{Home}{End}');

    // No group folded, the cursor did not move, and nothing was committed.
    expect(screen.getByRole('option', { name: 'Aavi' })).toBeInTheDocument();
    expect(screen.queryByRole('option', { name: /collapsed/ })).not.toBeInTheDocument();
    expect(search).toHaveAttribute('aria-activedescendant', active ?? '');
    expect(onSelect).not.toHaveBeenCalled();
  });

  it('lets the keyboard fold an open group whose rows are all disabled', async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();
    const { container } = render(
      <ResourcePickerContent
        groups={[
          {
            id: 'Locked',
            label: 'Locked',
            items: [{ id: 'Locked/A', label: 'Archived', disabled: true }],
          },
          GROUPS[1],
        ]}
        onSelect={onSelect}
      />
    );
    const search = screen.getByRole('combobox');
    const active = () =>
      document.getElementById(search.getAttribute('aria-activedescendant') ?? '');

    // No row in the group can take the cursor, so its heading does, saying
    // the group is open. A group with a usable row keeps a plain heading.
    expect(screen.getByRole('option', { name: 'Locked, expanded' })).toBeInTheDocument();
    expect(screen.queryByRole('option', { name: /Shared,/ })).not.toBeInTheDocument();
    expect(await axe(container)).toHaveNoViolations();

    await user.click(search);
    expect(screen.getByRole('option', { name: 'Locked, expanded' })).toHaveAttribute(
      'aria-selected',
      'true'
    );
    await user.keyboard('{ArrowLeft}');
    expect(active()).toHaveAccessibleName('Locked, collapsed');
    await user.keyboard('{ArrowRight}');
    expect(active()).toHaveAccessibleName('Locked, expanded');
    expect(screen.getByRole('option', { name: 'Archived' })).toHaveAttribute(
      'aria-disabled',
      'true'
    );

    // Enter folds it too, and commits nothing.
    await user.keyboard('{Enter}');
    expect(active()).toHaveAccessibleName('Locked, collapsed');
    expect(onSelect).not.toHaveBeenCalled();
  });

  it('keeps focus in the search when a heading is clicked', async () => {
    const user = userEvent.setup();
    render(<ResourcePickerContent groups={GROUPS} onSelect={vi.fn()} />);
    const search = screen.getByRole('combobox');
    await user.click(search);

    await user.click(headingOf('Shared'));
    expect(screen.queryByRole('option', { name: 'Aavi' })).not.toBeInTheDocument();
    expect(search).toHaveFocus();

    await user.click(screen.getByRole('option', { name: 'Shared, collapsed' }));
    expect(screen.getByRole('option', { name: 'Aavi' })).toBeInTheDocument();
    expect(search).toHaveFocus();

    // The keyboard still drives the list.
    await user.keyboard('{ArrowLeft}');
    expect(screen.getByRole('option', { name: /, collapsed$/ })).toBeInTheDocument();
  });

  it('gives its own heading options values that survive HTML serialisation', () => {
    const { container } = render(
      <ResourcePickerContent
        groups={[{ ...GROUPS[1], defaultCollapsed: true }]}
        onSelect={vi.fn()}
      />
    );
    const live = screen
      .getByRole('option', { name: 'Shared, collapsed' })
      .getAttribute('data-value');
    expect(live).toBeTruthy();

    // As a server render would hand it over: serialised, then parsed again.
    const parsed = document.createElement('div');
    parsed.innerHTML = container.innerHTML;
    const roundTripped = parsed
      .querySelector('[data-slot="resource-group-collapsed"]')
      ?.getAttribute('data-value');
    expect(roundTripped).toBe(live);
    expect(roundTripped).not.toContain('\uFFFD');
  });

  it('leaves ArrowLeft and ArrowRight to the caret while searching', async () => {
    const user = userEvent.setup();
    render(<ResourcePickerContent groups={GROUPS} onSelect={vi.fn()} />);

    const search = screen.getByRole('combobox');
    await user.type(search, 'Aav');
    await user.keyboard('{ArrowLeft}');
    expect(screen.getByRole('option', { name: 'Aavi' })).toBeInTheDocument();
    expect((search as HTMLInputElement).selectionStart).toBe(2);
  });

  it('runs a footer action from the keyboard without committing a row', async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();
    const onAdd = vi.fn();
    render(
      <ResourcePickerContent
        groups={GROUPS}
        onSelect={onSelect}
        footerLeading={
          <button type="button" onClick={onAdd}>
            Add new entity
          </button>
        }
      />
    );

    screen.getByRole('button', { name: 'Add new entity' }).focus();
    await user.keyboard('{Enter}');

    expect(onAdd).toHaveBeenCalledTimes(1);
    expect(onSelect).not.toHaveBeenCalled();
  });

  it('renders both footer slots, and no footer without them', () => {
    const { rerender } = render(
      <ResourcePickerContent
        groups={GROUPS}
        onSelect={vi.fn()}
        footerLeading={<button type="button">Add new entity</button>}
        footerTrailing={<button type="button">Open entities</button>}
      />
    );
    expect(screen.getByRole('button', { name: 'Add new entity' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Open entities' })).toBeInTheDocument();

    rerender(<ResourcePickerContent groups={GROUPS} onSelect={vi.fn()} />);
    expect(screen.queryByRole('button', { name: 'Open entities' })).not.toBeInTheDocument();
  });

  it('reports the query to a controlling consumer', async () => {
    const user = userEvent.setup();
    const onQueryChange = vi.fn();
    render(
      <ResourcePickerContent
        groups={GROUPS}
        onSelect={vi.fn()}
        query=""
        onQueryChange={onQueryChange}
      />
    );

    await user.type(screen.getByRole('combobox'), 'A');
    expect(onQueryChange).toHaveBeenCalledWith('A');
  });
});

describe('ResourcePicker', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('shows the placeholder until a value is chosen', () => {
    const { rerender } = render(
      <ResourcePicker groups={GROUPS} onSelect={vi.fn()} placeholder="Select entity..." />
    );
    expect(screen.getByRole('button', { name: /Select entity/ })).toBeInTheDocument();

    rerender(
      <ResourcePicker
        groups={GROUPS}
        onSelect={vi.fn()}
        value="Shared/Aavi"
        placeholder="Select entity..."
      />
    );
    expect(screen.getByRole('button', { name: /Aavi/ })).toBeInTheDocument();
  });

  it('opens on the trigger and closes once a row commits', async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();
    render(<ResourcePicker groups={GROUPS} onSelect={onSelect} placeholder="Select entity..." />);

    await user.click(screen.getByRole('button', { name: /Select entity/ }));
    await user.click(await screen.findByRole('option', { name: 'Aavi' }));

    expect(onSelect).toHaveBeenCalledWith(expect.objectContaining({ id: 'Shared/Aavi' }));
    expect(screen.queryByRole('option', { name: 'Aavi' })).not.toBeInTheDocument();
  });

  it('wraps Tab from the last footer action back to the search, keeping the picker open', async () => {
    const user = userEvent.setup();
    const onOpenChange = vi.fn();
    render(
      <ResourcePicker
        groups={GROUPS}
        onSelect={vi.fn()}
        onOpenChange={onOpenChange}
        placeholder="Select entity..."
        footerTrailing={<button type="button">Open entities</button>}
      />
    );

    await user.click(screen.getByRole('button', { name: /Select entity/ }));
    const search = await screen.findByRole('combobox');
    screen.getByRole('button', { name: 'Open entities' }).focus();
    await user.tab();

    // The popover's focus scope hears the Tab and loops it, as it would from
    // any other control inside.
    expect(search).toHaveFocus();
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(onOpenChange).not.toHaveBeenCalledWith(false);
  });

  it('puts focus in the search when it opens', async () => {
    const user = userEvent.setup();
    render(<ResourcePicker groups={GROUPS} onSelect={vi.fn()} placeholder="Select entity..." />);

    await user.click(screen.getByRole('button', { name: /Select entity/ }));

    const search = await screen.findByRole('combobox');
    expect(search).toHaveFocus();
    await user.keyboard('Cand');
    expect(screen.getByRole('option', { name: 'Candidate' })).toBeInTheDocument();
    expect(screen.queryByRole('option', { name: 'Aavi' })).not.toBeInTheDocument();
  });

  it('keeps the search editable for an uncontrolled or handled query', () => {
    const { rerender } = render(<ResourcePickerContent groups={GROUPS} onSelect={vi.fn()} />);
    expect(screen.getByRole('combobox')).not.toHaveAttribute('readonly');

    rerender(
      <ResourcePickerContent groups={GROUPS} onSelect={vi.fn()} query="a" onQueryChange={vi.fn()} />
    );
    expect(screen.getByRole('combobox')).not.toHaveAttribute('readonly');
  });

  it('offers a clear for a value not in the groups, such as while they load', async () => {
    const user = userEvent.setup();
    const onClear = vi.fn();
    render(
      <ResourcePicker
        groups={[]}
        onSelect={vi.fn()}
        value="Shared/Aavi"
        onClear={onClear}
        placeholder="Select entity..."
      />
    );

    // The label falls back to the placeholder, but the value is still there
    // to clear.
    expect(screen.getByRole('button', { name: 'Select entity...' })).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Clear selection' }));
    expect(onClear).toHaveBeenCalledTimes(1);
  });

  it('offers a clear only with both a value and a handler', async () => {
    const user = userEvent.setup();
    const onClear = vi.fn();
    const { rerender } = render(
      <ResourcePicker groups={GROUPS} onSelect={vi.fn()} value="Shared/Aavi" onClear={onClear} />
    );

    await user.click(screen.getByRole('button', { name: 'Clear selection' }));
    expect(onClear).toHaveBeenCalledTimes(1);

    rerender(<ResourcePicker groups={GROUPS} onSelect={vi.fn()} value="Shared/Aavi" />);
    expect(screen.queryByRole('button', { name: 'Clear selection' })).not.toBeInTheDocument();
  });

  it('returns focus to the field after clearing from the keyboard', async () => {
    const user = userEvent.setup();
    const Controlled = () => {
      const [value, setValue] = useState('Shared/Aavi');
      return (
        <ResourcePicker
          groups={GROUPS}
          onSelect={(item) => setValue(item.id)}
          value={value}
          onClear={() => setValue('')}
        />
      );
    };
    render(<Controlled />);

    screen.getByRole('button', { name: 'Clear selection' }).focus();
    await user.keyboard('{Enter}');

    expect(screen.queryByRole('button', { name: 'Clear selection' })).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Select...' })).toHaveFocus();
  });

  it('does not open while disabled', async () => {
    const user = userEvent.setup();
    render(
      <ResourcePicker groups={GROUPS} onSelect={vi.fn()} disabled placeholder="Select entity..." />
    );

    await user.click(screen.getByRole('button', { name: /Select entity/ }));
    expect(screen.queryByRole('option', { name: 'Aavi' })).not.toBeInTheDocument();
  });

  it('stays closed when disabled while told to be open', () => {
    render(<ResourcePicker groups={GROUPS} onSelect={vi.fn()} open disabled />);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(screen.queryByRole('option', { name: 'Aavi' })).not.toBeInTheDocument();
  });

  it('closes an open picker once it becomes disabled', async () => {
    const user = userEvent.setup();
    const props = { groups: GROUPS, onSelect: vi.fn(), placeholder: 'Select entity...' };
    const { rerender } = render(<ResourcePicker {...props} />);

    await user.click(screen.getByRole('button', { name: /Select entity/ }));
    expect(await screen.findByRole('option', { name: 'Aavi' })).toBeInTheDocument();

    rerender(<ResourcePicker {...props} disabled />);
    expect(screen.queryByRole('option', { name: 'Aavi' })).not.toBeInTheDocument();

    // Re-enabling does not bring back a popover nobody reopened.
    rerender(<ResourcePicker {...props} />);
    expect(screen.queryByRole('option', { name: 'Aavi' })).not.toBeInTheDocument();
  });

  it('tells a controlling owner when disabling closes it, so re-enabling stays closed', async () => {
    const user = userEvent.setup();
    const onOpenChange = vi.fn();
    function Host({ disabled }: { disabled?: boolean }) {
      const [open, setOpen] = useState(false);
      return (
        <ResourcePicker
          groups={GROUPS}
          onSelect={vi.fn()}
          placeholder="Select entity..."
          disabled={disabled}
          open={open}
          onOpenChange={(next) => {
            onOpenChange(next);
            setOpen(next);
          }}
        />
      );
    }
    const { rerender } = render(<Host />);

    await user.click(screen.getByRole('button', { name: /Select entity/ }));
    expect(await screen.findByRole('option', { name: 'Aavi' })).toBeInTheDocument();

    rerender(<Host disabled />);
    expect(screen.queryByRole('option', { name: 'Aavi' })).not.toBeInTheDocument();
    expect(onOpenChange).toHaveBeenLastCalledWith(false);

    rerender(<Host />);
    expect(screen.queryByRole('option', { name: 'Aavi' })).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Select entity/ })).toHaveAttribute(
      'aria-expanded',
      'false'
    );
  });

  it('names the open popover and keeps row ARIA valid', async () => {
    const user = userEvent.setup();
    const { baseElement } = render(
      <>
        <label htmlFor="entity">Entity</label>
        <ResourcePicker
          id="entity"
          groups={[
            ...GROUPS,
            {
              id: 'People',
              label: 'People',
              items: [{ id: 'People/Alex', label: 'Alex', description: 'alex@example.com' }],
            },
          ]}
          onSelect={vi.fn()}
          value="Shared/Aavi"
        />
      </>
    );

    await user.click(screen.getByRole('button', { name: 'Entity' }));
    await screen.findAllByRole('listbox');

    expect(screen.getByRole('dialog', { name: 'Resources' })).toBeInTheDocument();
    // The popover portals out of the render container, so the whole body is
    // checked. Every rule runs except `region`, a page-level check that a
    // bare test body, with no landmarks at all, cannot pass.
    expect(await axe(baseElement, { rules: { region: { enabled: false } } })).toHaveNoViolations();
  });

  it('does not open a disabled custom trigger that is not a button', async () => {
    const user = userEvent.setup();
    const onOpenChange = vi.fn();
    render(
      <ResourcePicker groups={GROUPS} onSelect={vi.fn()} disabled onOpenChange={onOpenChange}>
        {/* An element that ignores the forwarded `disabled` attribute. */}
        <div>Choose entity</div>
      </ResourcePicker>
    );

    await user.click(screen.getByText('Choose entity'));

    expect(onOpenChange).not.toHaveBeenCalled();
    expect(screen.queryByRole('option', { name: 'Aavi' })).not.toBeInTheDocument();
  });

  it('cancels the click and navigation of a disabled custom anchor trigger', () => {
    const onClick = vi.fn();
    const onOpenChange = vi.fn();
    render(
      <ResourcePicker groups={GROUPS} onSelect={vi.fn()} disabled onOpenChange={onOpenChange}>
        <a href="/entities" onClick={onClick}>
          Choose entity
        </a>
      </ResourcePicker>
    );

    // `fireEvent` reports false once the default action, here navigation,
    // has been cancelled.
    const notCancelled = fireEvent.click(screen.getByText('Choose entity'));
    expect(notCancelled).toBe(false);
    expect(onClick).not.toHaveBeenCalled();
    expect(onOpenChange).not.toHaveBeenCalled();
    expect(screen.queryByRole('option', { name: 'Aavi' })).not.toBeInTheDocument();
  });

  it('marks a disabled custom trigger aria-disabled, and an enabled one not', () => {
    const anchor = (
      <a href="/entities" onClick={vi.fn()}>
        Choose entity
      </a>
    );
    const { rerender } = render(
      <ResourcePicker groups={GROUPS} onSelect={vi.fn()} disabled>
        {anchor}
      </ResourcePicker>
    );
    expect(screen.getByRole('link', { name: 'Choose entity' })).toHaveAttribute(
      'aria-disabled',
      'true'
    );

    rerender(
      <ResourcePicker groups={GROUPS} onSelect={vi.fn()}>
        {anchor}
      </ResourcePicker>
    );
    expect(screen.getByRole('link', { name: 'Choose entity' })).not.toHaveAttribute(
      'aria-disabled'
    );
  });

  it('leaves aria-disabled off the default field, whose disabled already says so', () => {
    render(<ResourcePicker groups={GROUPS} onSelect={vi.fn()} disabled placeholder="Pick" />);
    const field = screen.getByRole('button', { name: 'Pick' });
    expect(field).toBeDisabled();
    expect(field).not.toHaveAttribute('aria-disabled');
  });

  it('lets an enabled custom anchor trigger run its own click', async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();
    render(
      <ResourcePicker groups={GROUPS} onSelect={vi.fn()}>
        <a href="/entities" onClick={onClick}>
          Choose entity
        </a>
      </ResourcePicker>
    );

    // Stops jsdom's unimplemented navigation once every handler has run.
    const stopNavigation = (event: Event) => event.preventDefault();
    window.addEventListener('click', stopNavigation);
    try {
      await user.click(screen.getByText('Choose entity'));
    } finally {
      window.removeEventListener('click', stopNavigation);
    }
    expect(onClick).toHaveBeenCalledTimes(1);
    expect(await screen.findByRole('option', { name: 'Aavi' })).toBeInTheDocument();
  });

  it('describes a held value no row matches once a consumer label names the field', () => {
    const { rerender } = render(
      <>
        <span id="entity-label">Entity</span>
        <ResourcePicker
          groups={[]}
          onSelect={vi.fn()}
          value="Shared/Aavi"
          aria-labelledby="entity-label"
          placeholder="Select entity..."
        />
      </>
    );

    // While groups load, the field shows its placeholder but still holds the
    // value, and says so.
    const trigger = screen.getByRole('button', { name: 'Entity' });
    expect(trigger).toHaveAccessibleDescription('Shared/Aavi');

    // Found, the row's label is what is described.
    rerender(
      <>
        <span id="entity-label">Entity</span>
        <ResourcePicker
          groups={GROUPS}
          onSelect={vi.fn()}
          value="Shared/Aavi"
          aria-labelledby="entity-label"
          placeholder="Select entity..."
        />
      </>
    );
    expect(trigger).toHaveAccessibleDescription('Aavi');

    // With no value at all, nothing is described.
    rerender(
      <>
        <span id="entity-label">Entity</span>
        <ResourcePicker
          groups={GROUPS}
          onSelect={vi.fn()}
          aria-labelledby="entity-label"
          placeholder="Select entity..."
        />
      </>
    );
    expect(trigger).not.toHaveAttribute('aria-describedby');
  });

  it('describes a held value no row matches on a field named by its own text', () => {
    const { rerender } = render(
      <ResourcePicker
        groups={[]}
        onSelect={vi.fn()}
        value="Shared/Aavi"
        placeholder="Select entity..."
      />
    );

    // The field reads its placeholder, so the value it holds is described.
    const trigger = screen.getByRole('button', { name: 'Select entity...' });
    expect(trigger).toHaveAccessibleDescription('Shared/Aavi');

    // Shown as the placeholder already, it is not read a second time.
    rerender(
      <ResourcePicker
        groups={[]}
        onSelect={vi.fn()}
        value="Shared/Aavi"
        placeholder="Shared/Aavi"
      />
    );
    expect(screen.getByRole('button', { name: 'Shared/Aavi' })).not.toHaveAttribute(
      'aria-describedby'
    );

    // Matched, the row's label is the name, and nothing is described.
    rerender(
      <ResourcePicker
        groups={GROUPS}
        onSelect={vi.fn()}
        value="Shared/Aavi"
        placeholder="Select entity..."
      />
    );
    expect(screen.getByRole('button', { name: 'Aavi' })).not.toHaveAttribute('aria-describedby');
  });

  it('forwards id and ARIA props to the default trigger', () => {
    render(
      <>
        <label htmlFor="entity">Entity</label>
        <span id="entity-hint">Pick the table to read from.</span>
        <span id="entity-error">Choose an entity.</span>
        <ResourcePicker
          id="entity"
          groups={GROUPS}
          onSelect={vi.fn()}
          value="Shared/Aavi"
          aria-describedby="entity-hint"
          aria-invalid
          aria-errormessage="entity-error"
        />
      </>
    );

    // No aria-label is set, so the consumer's label names the field.
    const trigger = screen.getByLabelText('Entity');
    expect(trigger).toBe(screen.getByRole('button', { name: 'Entity' }));
    expect(trigger).toHaveAttribute('id', 'entity');
    expect(trigger).not.toHaveAttribute('aria-label');
    // The chosen value follows the consumer's hint, since the label now
    // holds the name.
    expect(trigger).toHaveAccessibleDescription('Pick the table to read from. Aavi');
    expect(trigger).toHaveAttribute('aria-invalid', 'true');
    expect(trigger).toHaveAttribute('aria-errormessage', 'entity-error');
  });

  it('takes its name from aria-labelledby', () => {
    render(
      <>
        <span id="entity-label">Source entity</span>
        <ResourcePicker groups={GROUPS} onSelect={vi.fn()} aria-labelledby="entity-label" />
      </>
    );

    expect(screen.getByRole('button', { name: 'Source entity' })).toHaveAttribute(
      'aria-labelledby',
      'entity-label'
    );
  });

  it('announces the chosen value under aria-labelledby', () => {
    render(
      <>
        <span id="entity-label">Source entity</span>
        <ResourcePicker
          groups={GROUPS}
          onSelect={vi.fn()}
          value="Shared/Aavi"
          aria-labelledby="entity-label"
        />
      </>
    );

    expect(screen.getByRole('button', { name: 'Source entity' })).toHaveAccessibleDescription(
      'Aavi'
    );
  });

  it('is named by its own text without a consumer label', () => {
    render(<ResourcePicker groups={GROUPS} onSelect={vi.fn()} value="Shared/Aavi" />);
    const trigger = screen.getByRole('button', { name: 'Aavi' });
    expect(trigger).not.toHaveAttribute('aria-label');
    // The value is already the name, so it is not described a second time.
    expect(trigger).not.toHaveAttribute('aria-describedby');
  });

  it('clears the search on the first Escape and closes on the second', async () => {
    const user = userEvent.setup();
    render(<ResourcePicker groups={GROUPS} onSelect={vi.fn()} placeholder="Select entity..." />);

    await user.click(screen.getByRole('button', { name: /Select entity/ }));
    const search = await screen.findByRole('combobox');
    await user.type(search, 'Aavi');

    await user.keyboard('{Escape}');
    expect(search).toHaveValue('');
    expect(screen.getByRole('dialog')).toBeInTheDocument();

    await user.keyboard('{Escape}');
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('closes on Escape when told a query it cannot clear', async () => {
    const user = userEvent.setup();
    const onOpenChange = vi.fn();
    render(
      <ResourcePicker
        groups={GROUPS}
        onSelect={vi.fn()}
        placeholder="Select entity..."
        query="zzz"
        onOpenChange={onOpenChange}
      />
    );

    await user.click(screen.getByRole('button', { name: /Select entity/ }));
    expect(await screen.findByRole('combobox')).toHaveValue('zzz');
    await user.keyboard('{Escape}');
    expect(onOpenChange).toHaveBeenLastCalledWith(false);
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
  });

  it('keeps the search and the open groups as they were while the popover animates out', async () => {
    const user = userEvent.setup();
    holdExitAnimation();
    try {
      const props = {
        groups: GROUPS,
        onSelect: vi.fn(),
        placeholder: 'Select entity...',
        contentClassName: 'rp-exit',
      };
      const { rerender } = render(<ResourcePicker {...props} open />);
      const search = screen.getByRole('combobox');
      await user.type(search, 'Aav');
      expect(screen.queryByRole('option', { name: 'CaseComments' })).not.toBeInTheDocument();

      rerender(<ResourcePicker {...props} open={false} />);
      const closing = screen.getByRole('dialog');
      // Still the same search, holding the same query, over the same rows.
      expect(screen.getByRole('combobox')).toBe(search);
      expect(search).toHaveValue('Aav');
      expect(screen.queryByRole('option', { name: 'CaseComments' })).not.toBeInTheDocument();

      // jsdom's events carry no animation name, so the end is built by hand.
      const ended = new Event('animationend', { bubbles: true });
      Object.defineProperty(ended, 'animationName', { value: 'rp-exit' });
      act(() => {
        closing.dispatchEvent(ended);
      });
      await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());

      // The next opening starts afresh.
      rerender(<ResourcePicker {...props} open />);
      expect(screen.getByRole('combobox')).toHaveValue('');
    } finally {
      vi.restoreAllMocks();
    }
  });

  it.each([
    ['closed by its owner', { open: false }],
    ['disabled', { open: true, disabled: true }],
  ])('commits no row while the popover animates out once %s', async (_, closing) => {
    holdExitAnimation();
    try {
      const onSelect = vi.fn();
      const onOpenChange = vi.fn();
      const props = {
        groups: GROUPS,
        onSelect,
        onOpenChange,
        placeholder: 'Select entity...',
        contentClassName: 'rp-exit',
      };
      const { rerender } = render(<ResourcePicker {...props} open />);
      rerender(<ResourcePicker {...props} {...closing} />);
      onOpenChange.mockClear();

      // Still on screen, but no longer the picker's to commit.
      expect(screen.getByRole('dialog')).toHaveAttribute('data-state', 'closed');
      fireEvent.click(screen.getByRole('option', { name: 'Aavi' }));
      expect(onSelect).not.toHaveBeenCalled();
      expect(onOpenChange).not.toHaveBeenCalled();
    } finally {
      vi.restoreAllMocks();
    }
  });

  it('shows no row as chosen for an empty value', () => {
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    try {
      render(
        <ResourcePicker
          groups={[{ id: 'g', label: 'Group', items: [{ id: '', label: 'Blank' }] }]}
          onSelect={vi.fn()}
          placeholder="Select entity..."
        />
      );
      expect(screen.getByRole('button', { name: 'Select entity...' })).toBeInTheDocument();
    } finally {
      vi.restoreAllMocks();
    }
  });

  it('keeps the search when the value changes while open', async () => {
    const user = userEvent.setup();
    const props = { groups: GROUPS, onSelect: vi.fn(), open: true };
    const { rerender } = render(<ResourcePicker {...props} value="Shared/Aavi" />);

    const search = screen.getByRole('combobox');
    await user.type(search, 'Cand');
    rerender(<ResourcePicker {...props} value="Shared/Candidate" />);

    expect(screen.getByRole('combobox')).toBe(search);
    expect(search).toHaveValue('Cand');
  });

  it('reserves the trailing slot by its measured width', () => {
    // jsdom does no layout, so the slot reports the width a wide adornment
    // would have in a browser.
    vi.spyOn(HTMLElement.prototype, 'offsetWidth', 'get').mockReturnValue(80);
    const { container } = render(
      <ResourcePicker
        groups={GROUPS}
        onSelect={vi.fn()}
        trailingAdornment={<button type="button">Field mode</button>}
        placeholder="Select entity..."
      />
    );

    const wrapper = container.firstElementChild as HTMLElement;
    expect(wrapper.style.getPropertyValue('--resource-picker-trailing-inset')).toBe('100px');
    expect(screen.getByRole('button', { name: /Select entity/ })).toHaveClass(
      'pr-(--resource-picker-trailing-inset)'
    );
  });

  it('keeps the default inset when nothing trails the field', () => {
    const { container } = render(
      <ResourcePicker groups={GROUPS} onSelect={vi.fn()} placeholder="Select entity..." />
    );

    const wrapper = container.firstElementChild as HTMLElement;
    expect(wrapper.style.getPropertyValue('--resource-picker-trailing-inset')).toBe('');
    const trigger = screen.getByRole('button', { name: /Select entity/ });
    expect(trigger).toHaveClass('pr-9');
    expect(trigger).not.toHaveClass('pr-(--resource-picker-trailing-inset)');
  });

  it('measures the trailing slot without ResizeObserver', () => {
    vi.stubGlobal('ResizeObserver', undefined);
    vi.spyOn(HTMLElement.prototype, 'offsetWidth', 'get').mockReturnValue(80);
    try {
      const { container } = render(
        <ResourcePicker
          groups={GROUPS}
          onSelect={vi.fn()}
          value="Shared/Aavi"
          onClear={vi.fn()}
          trailingAdornment={<button type="button">Field mode</button>}
        />
      );

      const wrapper = container.firstElementChild as HTMLElement;
      expect(wrapper.style.getPropertyValue('--resource-picker-trailing-inset')).toBe('100px');
    } finally {
      vi.unstubAllGlobals();
    }
  });

  it('leaves the adornment to a custom trigger, which owns its layout', () => {
    render(
      <ResourcePicker
        groups={GROUPS}
        onSelect={vi.fn()}
        trailingAdornment={<button type="button">Mode</button>}
      >
        <button type="button">Pick entity</button>
      </ResourcePicker>
    );
    expect(screen.getByRole('button', { name: 'Pick entity' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Mode' })).not.toBeInTheDocument();
  });

  it('keeps the field icon out of the trigger name', () => {
    render(
      <ResourcePicker
        groups={GROUPS}
        onSelect={vi.fn()}
        value="Shared/Aavi"
        icon={<span>Entity icon</span>}
      />
    );

    expect(screen.getByRole('button', { name: 'Aavi' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Entity icon/ })).not.toBeInTheDocument();
  });

  it('styles the field as invalid from aria-invalid, as SelectTrigger does', () => {
    render(<ResourcePicker groups={GROUPS} onSelect={vi.fn()} placeholder="Pick" aria-invalid />);

    const field = screen.getByRole('button', { name: 'Pick' });
    expect(field).toHaveAttribute('aria-invalid', 'true');
    expect(field).toHaveClass(
      'aria-invalid:border-error',
      'aria-invalid:focus:ring-error',
      'aria-invalid:focus-visible:ring-error',
      'future:aria-invalid:ring-1',
      'future:aria-invalid:ring-error/40',
      'future:aria-invalid:focus:ring-error',
      'future:aria-invalid:focus-visible:ring-error'
    );
  });

  it('renders a trailing adornment beside the field', () => {
    render(
      <ResourcePicker
        groups={GROUPS}
        onSelect={vi.fn()}
        trailingAdornment={<button type="button">Mode</button>}
      />
    );
    expect(screen.getByRole('button', { name: 'Mode' })).toBeInTheDocument();
  });

  it('reports open state to a controlling consumer', async () => {
    const user = userEvent.setup();
    const onOpenChange = vi.fn();
    render(
      <ResourcePicker
        groups={GROUPS}
        onSelect={vi.fn()}
        onOpenChange={onOpenChange}
        placeholder="Select entity..."
      />
    );

    await user.click(screen.getByRole('button', { name: /Select entity/ }));
    expect(onOpenChange).toHaveBeenCalledWith(true);
  });
});
