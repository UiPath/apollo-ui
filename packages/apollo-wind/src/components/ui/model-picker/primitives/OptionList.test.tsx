import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type React from 'react';
import { describe, expect, it, vi } from 'vitest';

import { defaultRowActions } from './ModelOptionRow';
import type { AnnotatedModel } from './OptionList';
import { GroupedOptionList, optionDomId, VirtualOptionList } from './OptionList';

// jsdom reports 0×0 elements, so the real virtualizer would compute an
// empty window and render nothing. Virtualize "everything" instead —
// these tests cover VirtualOptionList's own rendering, not the library.
const { measureElement } = vi.hoisted(() => ({ measureElement: vi.fn() }));
vi.mock('@tanstack/react-virtual', () => ({
  useVirtualizer: (opts: { count: number; estimateSize: (i: number) => number }) => {
    const items = Array.from({ length: opts.count }, (_, index) => ({
      index,
      key: index,
      start: index * 56,
      size: opts.estimateSize(index),
    }));
    return {
      getVirtualItems: () => items,
      getTotalSize: () => items.reduce((sum, it) => sum + it.size, 0),
      scrollToIndex: () => {},
      measureElement,
    };
  },
}));

function opt(overrides: Partial<AnnotatedModel>): AnnotatedModel {
  return {
    modelId: 'm-1',
    modelName: 'm-1',
    vendor: 'OpenAi',
    modelSubscriptionType: 'UiPathOwned',
    groupKey: 'more',
    groupLabel: 'More models',
    ...overrides,
  };
}

const OPTIONS: AnnotatedModel[] = [
  opt({
    modelId: 'byo-1',
    modelName: 'byo-model',
    modelSubscriptionType: 'BYOMAdded',
    byoConnectionLabel: 'Conn',
    groupKey: 'byo',
    groupLabel: 'Custom Models (BYO)',
  }),
  opt({
    modelId: 'rec-1',
    modelName: 'model-rec',
    groupKey: 'recommended',
    groupLabel: 'Recommended',
    modelDetails: { contextWindowTokens: 1_000_000 },
  }),
  opt({
    modelId: 'more-1',
    modelName: 'model-more-1',
    modelDetails: { contextWindowTokens: 400_000 },
  }),
  opt({
    modelId: 'more-2',
    modelName: 'model-more-2',
    modelDetails: { contextWindowTokens: 500 },
  }),
];

function renderList(ui: React.ReactElement) {
  // No I18nProvider: useSafeLingui falls back to English defaults.
  return render(ui);
}

const noopProps = {
  id: 'listbox',
  activeIndex: -1,
  setActiveIndex: () => {},
  selectedId: null,
};

describe('<VirtualOptionList>', () => {
  it('renders group headers and option rows', () => {
    renderList(<VirtualOptionList {...noopProps} options={OPTIONS} onSelect={() => {}} />);
    expect(screen.getByRole('listbox', { name: 'Models' })).toBeInTheDocument();
    expect(screen.getByText('More models')).toBeInTheDocument();
    expect(screen.getByText('model-rec')).toBeInTheDocument();
    expect(screen.getByText('model-more-2')).toBeInTheDocument();
  });

  it('renders the header of a collapsed group but not its rows', () => {
    renderList(
      <VirtualOptionList
        {...noopProps}
        options={OPTIONS}
        onSelect={() => {}}
        collapsedGroups={new Set(['byo'])}
      />
    );
    expect(screen.getByText('Custom Models (BYO)')).toBeInTheDocument();
    expect(screen.queryByText('byo-model')).not.toBeInTheDocument();
  });

  it('toggles the BYO group when its header is clicked', async () => {
    const user = userEvent.setup();
    const onGroupToggle = vi.fn();
    renderList(
      <VirtualOptionList
        {...noopProps}
        options={OPTIONS}
        onSelect={() => {}}
        onGroupToggle={onGroupToggle}
      />
    );
    await user.click(screen.getByText('Custom Models (BYO)'));
    expect(onGroupToggle).toHaveBeenCalledWith('byo');
  });

  it('selects the clicked row', async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();
    renderList(<VirtualOptionList {...noopProps} options={OPTIONS} onSelect={onSelect} />);
    await user.click(screen.getByText('model-more-1'));
    expect(onSelect).toHaveBeenCalledWith(expect.objectContaining({ modelId: 'more-1' }));
  });
});

describe('<GroupedOptionList>', () => {
  it('derives per-group counts when groupCounts is not supplied', () => {
    renderList(<GroupedOptionList {...noopProps} options={OPTIONS} onSelect={() => {}} />);
    // 'More models' holds two options; the other groups hold one each.
    expect(screen.getByText('2 models')).toBeInTheDocument();
    expect(screen.getAllByText('1 model')).toHaveLength(2);
  });

  it('toggles the BYO group when its header is clicked', async () => {
    const user = userEvent.setup();
    const onGroupToggle = vi.fn();
    renderList(
      <GroupedOptionList
        {...noopProps}
        options={OPTIONS}
        onSelect={() => {}}
        onGroupToggle={onGroupToggle}
      />
    );
    await user.click(screen.getByText('Custom Models (BYO)'));
    expect(onGroupToggle).toHaveBeenCalledWith('byo');
  });
});

describe('<VirtualOptionList> row measurement', () => {
  it('hands every rendered row to the virtualizer to measure', () => {
    measureElement.mockClear();
    render(<VirtualOptionList activeIndex={0} id="lb" onSelect={() => {}} options={OPTIONS} />);
    // Rows are min-height, not fixed: a friendly-name line, a BYO connection
    // caption or host meta grows them. Without measurement, absolutely
    // positioned neighbours overlap once virtualization kicks in.
    const rows = document.querySelectorAll('[data-slot="model-picker-listbox"] [data-index]');
    expect(rows.length).toBeGreaterThan(0);
    const measured = new Set(measureElement.mock.calls.map((c) => c[0]));
    for (const el of rows) expect(measured.has(el)).toBe(true);
  });
});

describe('<GroupedOptionList> scrolling', () => {
  it('scrolls the highlighted row into view when the highlight moves', () => {
    const scrollIntoView = vi.fn();
    const original = Element.prototype.scrollIntoView;
    Element.prototype.scrollIntoView = scrollIntoView;
    try {
      const { rerender } = render(
        <GroupedOptionList activeIndex={0} id="lb" onSelect={() => {}} options={OPTIONS} />
      );
      scrollIntoView.mockClear();
      rerender(<GroupedOptionList activeIndex={2} id="lb" onSelect={() => {}} options={OPTIONS} />);
      // Past a handful of models the highlight would otherwise walk off-screen.
      expect(scrollIntoView).toHaveBeenCalledWith({ block: 'nearest' });
    } finally {
      Element.prototype.scrollIntoView = original;
    }
  });
});

describe('collapsible sections', () => {
  it('ignores collapsedGroups keys for sections that cannot collapse, in the virtualized renderer', () => {
    render(
      <VirtualOptionList
        activeIndex={0}
        collapsedGroups={new Set(['recommended'])}
        id="lb"
        onSelect={() => {}}
        options={OPTIONS}
      />
    );
    // Same rule as the grouped renderer: only BYO collapses, so a stray key
    // must not make a section vanish in one renderer and not the other.
    expect(screen.getByRole('option', { name: /model-rec/ })).toBeInTheDocument();
  });
});

describe('defaultRowActions', () => {
  it('renders actions for a BYO row identified by metadata alone', () => {
    // No subscription type; `byomDetails` is what files it under Custom
    // Models, and the actions must agree with the grouping.
    const node = defaultRowActions(
      opt({
        modelSubscriptionType: undefined,
        byomDetails: { integrationServiceConnectionId: 'c1' },
      }),
      { onEdit: () => {} }
    );
    render(<div>{node}</div>);
    expect(screen.getByRole('button', { name: 'Edit configuration' })).toBeInTheDocument();
  });

  it('returns null for hosted (non-BYO) models', () => {
    expect(defaultRowActions(opt({}), { onEdit: () => {} })).toBeNull();
  });

  it('returns null without an onEdit handler (no dead buttons)', () => {
    expect(
      defaultRowActions(opt({ modelSubscriptionType: 'BYOMAdded', groupKey: 'byo' }))
    ).toBeNull();
  });

  it('renders the edit action for BYO models and fires onEdit with the model', async () => {
    const user = userEvent.setup();
    const onEdit = vi.fn();
    const model = opt({ modelSubscriptionType: 'BYOMAdded', groupKey: 'byo' });
    // biome-ignore lint/complexity/noUselessFragments: defaultRowActions returns a ReactNode; render() needs an element.
    render(<>{defaultRowActions(model, { onEdit })}</>);

    const edit = screen.getByRole('button', { name: 'Edit configuration' });
    await user.click(edit);
    expect(onEdit).toHaveBeenCalledWith(model);
    expect(screen.queryByRole('button', { name: /remove/i })).not.toBeInTheDocument();
  });
});

describe('optionDomId', () => {
  it('sanitizes non-word characters so querySelector stays safe', () => {
    expect(optionDomId('list', 'anthropic.claude:v1/0')).toBe(
      'list-opt-anthropic_2e_claude_3a_v1_2f_0'
    );
    expect(() =>
      document.querySelector(`#${optionDomId('list', 'anthropic.claude:v1/0')}`)
    ).not.toThrow();
  });

  it('gives distinct model ids distinct dom ids', () => {
    // `a.b` / `a-b` / `a_b` collided under a lossy "replace with -" scheme,
    // so activedescendant could point at the wrong row.
    const ids = ['a.b', 'a-b', 'a_b', 'a_2e_b', 'a.-b', 'a-.b'].map((m) => optionDomId('l', m));
    expect(new Set(ids).size).toBe(ids.length);
  });
});
