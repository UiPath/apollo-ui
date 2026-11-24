import { fireEvent, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';
import { BAND_VISIBLE_COLUMNS, BandList, type BandListProps } from './BandList';
import type { Mark } from './marks';

vi.unmock('@uipath/apollo-wind/components/ui/tooltip');

const labels: BandListProps['labels'] = {
  markStatus: (tone, message) => (message ? `${tone}: ${message}` : tone),
  changeStatus: (change) => change,
  moreValues: (count) => `+${count} more`,
  searchInputs: (count) => `Search ${count} inputs`,
  searchOutputs: (count) => `Search ${count} outputs`,
  clearBandSearch: 'Clear search',
  moreWithErrors: (count) => `+${count} more, with errors`,
  noMatchingInputs: 'No matching inputs',
  noMatchingOutputs: 'No matching outputs',
  bandAddInput: 'Add input',
  bandAddOutput: 'Add output',
};

const columnsOf = (count: number) =>
  Array.from({ length: count }, (_, index) => ({
    id: `c${index}`,
    name: `Column ${index}`,
    icon: null,
  }));

const renderBand = (
  count: number,
  marks: ReadonlyMap<string, Mark> = new Map(),
  id = 'inputs',
  onAddColumn: BandListProps['onAddColumn'] = null
) =>
  render(
    <BandList
      band={{ id, label: 'Inputs', columns: columnsOf(count) }}
      marks={marks}
      badgeIdPrefix="band"
      labels={labels}
      mode={{ kind: 'read' }}
      onAddColumn={onAddColumn}
    />
  );

describe('BandList', () => {
  it('describes a hidden column with a spaced id by its mark in the +N more list', async () => {
    const user = userEvent.setup();
    const columns = [...columnsOf(3), { id: 'Customer Age', name: 'Customer Age', icon: null }];
    render(
      <BandList
        band={{ id: 'inputs', label: 'Inputs', columns }}
        marks={new Map([['Customer Age', { tone: 'error', glyph: true, title: 'No type' }]])}
        badgeIdPrefix="band"
        labels={labels}
        mode={{ kind: 'read' }}
        onAddColumn={null}
      />
    );
    await user.click(screen.getByRole('button', { name: /\+1 more/ }));
    const pill = within(screen.getByRole('dialog', { name: 'Inputs' })).getByText('Customer Age');
    const described = pill.closest('[aria-describedby]');
    expect(described?.getAttribute('aria-describedby')).not.toMatch(/Customer Age/);
    expect(described).toHaveAccessibleDescription(/No type/);
  });

  it("shows a hidden column's mark message on hover in the +N more list", async () => {
    const user = userEvent.setup();
    renderBand(4, new Map([['c3', { tone: 'error', glyph: true, title: 'No type' }]]));
    await user.click(screen.getByRole('button', { name: /\+1 more/ }));
    const dialog = within(screen.getByRole('dialog', { name: 'Inputs' }));
    const pill = dialog.getByText('Column 3').closest<HTMLElement>('[data-mark-title]');
    if (!pill) throw new Error('no marked pill');
    fireEvent.pointerOver(pill);
    expect(screen.getByTestId('band-more-mark-tooltip')).toHaveTextContent('No type');
  });

  it("anchors a hidden column's mark tooltip on its pill, outside the transformed list", async () => {
    const user = userEvent.setup();
    renderBand(4, new Map([['c3', { tone: 'error', glyph: true, title: 'No type' }]]));
    await user.click(screen.getByRole('button', { name: /\+1 more/ }));
    const dialog = screen.getByRole('dialog', { name: 'Inputs' });
    const pill = within(dialog).getByText('Column 3').closest<HTMLElement>('[data-mark-title]');
    if (!pill) throw new Error('no marked pill');
    vi.spyOn(pill, 'getBoundingClientRect').mockReturnValue(new DOMRect(120, 300, 80, 24));
    fireEvent.pointerOver(pill);
    const anchor = document.querySelector<HTMLElement>(
      '[data-state] > span[aria-hidden].fixed, span[aria-hidden].fixed'
    );
    expect(anchor).not.toBeNull();
    expect(dialog.contains(anchor)).toBe(false);
    expect(anchor?.style.top).toBe('300px');
    expect(anchor?.style.left).toBe('120px');
  });

  it('fits the +N more list to the height the viewport leaves, scrolling its columns', async () => {
    const user = userEvent.setup();
    renderBand(30);
    await user.click(screen.getByRole('button', { name: /\+27 more/ }));
    const dialog = screen.getByRole('dialog', { name: 'Inputs' });
    expect(dialog).toHaveClass(
      'flex',
      'flex-col',
      'max-h-[var(--radix-popover-content-available-height)]'
    );
    expect(within(dialog).getByRole('list', { name: 'Inputs' })).toHaveClass(
      'min-h-0',
      'overflow-y-auto'
    );
  });

  it('shows every column and no overflow link when they fit', () => {
    renderBand(BAND_VISIBLE_COLUMNS);

    expect(screen.getAllByRole('listitem')).toHaveLength(BAND_VISIBLE_COLUMNS);
    expect(screen.queryByRole('button')).toBeNull();
  });

  it('folds the rest into "+N more", dotted only when a hidden column has an error', () => {
    const { unmount } = renderBand(16, new Map([['c0', { tone: 'error' }]]));
    const more = screen.getByRole('button', { name: '+13 more' });
    expect(more).toHaveAttribute('data-error', 'false');
    unmount();

    renderBand(16, new Map([['c15', { tone: 'error' }]]));
    expect(screen.getByRole('button', { name: '+13 more, with errors' })).toHaveAttribute(
      'data-error',
      'true'
    );
  });

  it.each([
    ['inputs', 'Search 16 inputs'],
    ['outputs', 'Search 16 outputs'],
  ])('opens a searchable list of every %s column', async (id, placeholder) => {
    const user = userEvent.setup();
    renderBand(16, new Map(), id);

    await user.click(screen.getByRole('button', { name: '+13 more' }));
    expect(screen.getByRole('dialog', { name: 'Inputs' })).toBeInTheDocument();
    const search = screen.getByRole('searchbox', { name: placeholder });
    const list = screen.getAllByRole('list', { name: 'Inputs' })[1];
    if (!list) throw new Error('search list');
    expect(within(list).getAllByRole('listitem')).toHaveLength(16);

    await user.type(search, 'column 1');
    expect(
      within(list)
        .getAllByRole('listitem')
        .map((item) => item.textContent)
    ).toEqual([
      'Column 1',
      'Column 10',
      'Column 11',
      'Column 12',
      'Column 13',
      'Column 14',
      'Column 15',
    ]);
  });

  it.each([
    ['inputs', 'No matching inputs'],
    ['outputs', 'No matching outputs'],
  ])('says when no %s column matches the search', async (id, message) => {
    const user = userEvent.setup();
    renderBand(16, new Map(), id);

    await user.click(screen.getByRole('button', { name: '+13 more' }));
    await user.type(screen.getByRole('searchbox'), 'zzz');
    expect(screen.getByRole('status')).toHaveTextContent(message);
    expect(screen.getAllByRole('list', { name: 'Inputs' })).toHaveLength(1);
  });

  it.each([
    ['inputs', 'Add input', 'input'],
    ['outputs', 'Add output', 'output'],
  ] as const)('ends the %s band with a + that adds a column of its kind', async (id, name, kind) => {
    const onAddColumn = vi.fn();
    renderBand(2, new Map(), id, onAddColumn);

    const items = screen.getAllByRole('listitem');
    await userEvent.click(
      within(items[items.length - 1] as HTMLElement).getByRole('button', { name })
    );
    expect(onAddColumn).toHaveBeenCalledWith(kind);
  });
});
