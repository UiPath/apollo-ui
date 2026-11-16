import { act, cleanup, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe } from 'jest-axe';
import { useState } from 'react';
import { vi } from 'vitest';
import { largeGraph, SHARED_DEPENDENCY, tableOf } from './__fixtures__/decisionGraph.fixtures';
import { tableColumns, wordedRules } from './__fixtures__/editableSentences.fixtures';
import { DecisionGraphMinimap, WINDOW_MINIMAP_FROM } from './DecisionGraphMinimap';
import { DecisionGraphText } from './DecisionGraphText';
import type { DecisionGraphNode } from './decisionGraphTypes';
import { DecisionText } from './DecisionText';
import { type MinimapItem, minimapRows } from './minimapRows';
import type { SentenceSelection } from './sentenceTypes';

vi.unmock('@uipath/apollo-wind/components/ui/tooltip');

const LABELS = {
  minimap: 'Browse rules',
  minimapSearch: 'Search rules and decisions',
  minimapClearSearch: 'Clear search',
  minimapNoMatch: (query: string) => `No match for ${query}`,
  minimapResults: (count: number) => `${count} results`,
};

const ITEMS: MinimapItem[] = [
  {
    id: 'd-eligibility',
    kind: 'decision',
    label: 'Eligibility',
    meta: '2',
    children: [
      { id: 'r-1', kind: 'rule', label: 'risk is high when age < 25' },
      { id: 'r-2', kind: 'rule', label: 'risk is low otherwise' },
      {
        id: 'd-risk',
        kind: 'decision',
        label: 'Risk',
        children: [{ id: 'r-3', kind: 'rule', label: 'score above 700' }],
      },
    ],
  },
  { id: 'ref-risk', kind: 'reference', label: 'Risk', targetId: 'd-risk' },
];

const minimap = (props: Partial<React.ComponentProps<typeof DecisionGraphMinimap>> = {}) => (
  <DecisionGraphMinimap
    items={() => ITEMS}
    triggerLabel="3 rules"
    onPick={vi.fn()}
    labels={LABELS}
    dataTestId="map"
    {...props}
  />
);

const search = () => screen.getByRole('combobox', { name: 'Search rules and decisions' });
const activeOption = () => {
  const id = search().getAttribute('aria-activedescendant');
  return id ? document.getElementById(id) : null;
};
const optionLabels = () =>
  within(screen.getByRole('listbox'))
    .getAllByRole('option')
    .map((option) => option.textContent);

let scrollToSpy: ReturnType<typeof vi.fn>;
beforeEach(() => {
  scrollToSpy = vi.fn();
  HTMLElement.prototype.scrollTo = scrollToSpy as unknown as HTMLElement['scrollTo'];
});
afterEach(cleanup);

describe('minimapRows', () => {
  it('lists every row in reading order with its depth', () => {
    expect(minimapRows(ITEMS, '').map(({ item, depth }) => `${item.id}@${depth}`)).toEqual([
      'd-eligibility@0',
      'r-1@1',
      'r-2@1',
      'd-risk@1',
      'r-3@2',
      'ref-risk@0',
    ]);
  });

  it('keeps the decisions above a matching rule, and every rule of a matching decision', () => {
    expect(minimapRows(ITEMS, 'score').map(({ item }) => item.id)).toEqual([
      'd-eligibility',
      'd-risk',
      'r-3',
    ]);
    expect(minimapRows(ITEMS, 'eligib').map(({ item }) => item.id)).toEqual([
      'd-eligibility',
      'r-1',
      'r-2',
    ]);
    expect(minimapRows(ITEMS, 'RISK').map(({ item, match }) => `${item.id}:${match}`)).toEqual([
      'd-eligibility:false',
      'r-1:true',
      'r-2:true',
      'd-risk:true',
      'r-3:false',
      'ref-risk:true',
    ]);
  });

  it('is empty when nothing matches', () => {
    expect(minimapRows(ITEMS, 'zzz')).toEqual([]);
  });
});

describe('DecisionGraphMinimap', () => {
  it('is a trigger until opened, then a searchable listbox on the current row', async () => {
    render(minimap({ currentId: 'd-risk' }));
    expect(screen.queryByRole('listbox')).toBeNull();
    await userEvent.click(screen.getByTestId('map-trigger'));
    expect(document.activeElement).toBe(search());
    expect(search()).toHaveAttribute('aria-controls', screen.getByRole('listbox').id);
    expect(activeOption()).toHaveTextContent('Risk');
    expect(activeOption()).toHaveAttribute('aria-selected', 'true');
  });

  it('walks the rows with arrows and Ctrl+Home/End, and picks with Enter', async () => {
    const onPick = vi.fn();
    const user = userEvent.setup();
    render(minimap({ onPick }));
    await user.click(screen.getByTestId('map-trigger'));
    expect(activeOption()).toHaveTextContent('Eligibility');
    await user.keyboard('{ArrowDown}{ArrowDown}');
    expect(activeOption()).toHaveTextContent('risk is low otherwise');
    await user.keyboard('{ArrowUp}');
    expect(activeOption()).toHaveTextContent('risk is high');
    await user.keyboard('{Control>}{End}{/Control}');
    expect(activeOption()?.textContent).toBe('Risk');
    await user.keyboard('{Control>}{Home}{/Control}');
    expect(activeOption()).toHaveTextContent('Eligibility');
    await user.keyboard('{ArrowUp}');
    expect(activeOption()).toHaveTextContent('Eligibility');
    await user.keyboard('{ArrowDown}{Enter}');
    expect(onPick).toHaveBeenCalledWith(ITEMS[0]?.children?.[0]);
    expect(screen.queryByRole('listbox')).toBeNull();
  });

  it('narrows to the query, lands on the first match, and says when nothing matches', async () => {
    const user = userEvent.setup();
    render(minimap());
    await user.click(screen.getByTestId('map-trigger'));
    await user.keyboard('score');
    expect(optionLabels()).toEqual(['Eligibility2', 'Risk', 'score above 700']);
    expect(activeOption()).toHaveTextContent('score above 700');
    expect(within(activeOption() ?? document.body).getByText('score').tagName).toBe('MARK');
    await user.keyboard('zzz');
    expect(screen.getByTestId('map-no-match')).toHaveTextContent('No match for scorezzz');
    expect(search()).not.toHaveAttribute('aria-activedescendant');
  });

  it('clears the query on the first Escape and closes on the second', async () => {
    const user = userEvent.setup();
    render(minimap());
    await user.click(screen.getByTestId('map-trigger'));
    await user.keyboard('risk{Escape}');
    expect(search()).toHaveValue('');
    expect(screen.getByRole('listbox')).toBeInTheDocument();
    await user.keyboard('{Escape}');
    expect(screen.queryByRole('listbox')).toBeNull();
  });

  it('picks a row by click, keeping the caret in the search', async () => {
    const onPick = vi.fn();
    render(minimap({ onPick }));
    await userEvent.click(screen.getByTestId('map-trigger'));
    await userEvent.click(screen.getByTestId('map-row-ref-risk'));
    expect(onPick).toHaveBeenCalledWith(ITEMS[1]);
  });

  it('windows a long outline, each option saying where it sits', async () => {
    const many: MinimapItem[] = Array.from({ length: WINDOW_MINIMAP_FROM + 50 }, (_, index) => ({
      id: `rule-${index}`,
      kind: 'rule',
      label: `Rule ${index}`,
    }));
    const user = userEvent.setup();
    render(minimap({ items: () => many }));
    await user.click(screen.getByTestId('map-trigger'));
    const shown = within(screen.getByRole('listbox')).getAllByRole('option');
    expect(shown.length).toBeLessThan(many.length);
    expect(shown[0]).toHaveAttribute('aria-setsize', String(many.length));
    await user.keyboard('{Control>}{End}{/Control}');
    expect(activeOption()).toHaveAttribute('aria-posinset', String(many.length));
  });

  it('has no axe violations while open', async () => {
    const { baseElement } = render(minimap());
    await userEvent.click(screen.getByTestId('map-trigger'));
    expect(await axe(baseElement)).toHaveNoViolations();
  });
});

describe('DecisionGraphText minimap', () => {
  const TABLE = tableOf(30);
  const RULES = wordedRules(TABLE);
  const Host = ({ nodes }: { nodes: readonly DecisionGraphNode[] }) => {
    const [selected, setSelected] = useState<{ id: string; rule: SentenceSelection } | null>(null);
    return (
      <DecisionGraphText
        nodes={nodes}
        rules={() => RULES.map((rule) => ({ rowId: rule.rowId, label: `Rule ${rule.rowId}` }))}
        renderBody={(id, scroll) => (
          <DecisionText
            rules={RULES}
            {...tableColumns(TABLE)}
            header={{ label: 'Unique', hint: '' }}
            ariaLabel={`Rules of ${id}`}
            dataTestId={`text-${id}`}
            scroll={scroll}
            selected={selected?.id === id ? selected.rule : null}
            onSelect={(rule) => setSelected(rule ? { id, rule } : null)}
            edit={{ onCommit: vi.fn(), onClearCell: vi.fn(), onDeleteRule: vi.fn() }}
          />
        )}
        selected={selected?.id ?? null}
        onReveal={({ decisionId, rowId }) => {
          if (rowId) setSelected({ id: decisionId, rule: { rowId } });
        }}
        dataTestId="graph"
      />
    );
  };

  it('counts the rules of the decisions drawn in full', () => {
    render(<Host nodes={SHARED_DEPENDENCY.nodes} />);
    expect(screen.getByTestId('graph-minimap-trigger')).toHaveTextContent('12 rules');
  });

  it('is absent from an empty graph', () => {
    render(<Host nodes={[]} />);
    expect(screen.queryByTestId('graph-minimap-trigger')).toBeNull();
  });

  it('opens a picked decision at the top, focusing its heading', async () => {
    const user = userEvent.setup();
    render(<Host nodes={SHARED_DEPENDENCY.nodes} />);
    await user.click(screen.getByTestId('graph-minimap-trigger'));
    await user.click(screen.getByTestId('graph-minimap-row-decision:net-income'));
    expect(screen.getByTestId('graph-toggle-net-income')).toHaveAttribute('aria-expanded', 'true');
    expect(document.activeElement).toBe(screen.getByTestId('graph-toggle-net-income'));
    expect(scrollToSpy).toHaveBeenCalled();
  });

  it('selects and focuses a picked rule in an editable body', async () => {
    const user = userEvent.setup();
    render(<Host nodes={SHARED_DEPENDENCY.nodes} />);
    await user.click(screen.getByTestId('graph-minimap-trigger'));
    await user.keyboard('Rule r25');
    await user.keyboard('{Enter}');
    const rule = screen.getByTestId('text-eligibility-row-r25');
    expect(document.activeElement).toBe(rule);
    expect(rule).toHaveAttribute('tabindex', '0');
    await user.keyboard('{ArrowDown}');
    expect(document.activeElement).toBe(screen.getByTestId('text-eligibility-row-r26'));
  });

  it('takes a reference row to the decision it repeats', async () => {
    const user = userEvent.setup();
    render(<Host nodes={SHARED_DEPENDENCY.nodes} />);
    await user.click(screen.getByTestId('graph-minimap-trigger'));
    await user.click(screen.getByTestId('graph-minimap-row-reference:pricing-risk'));
    expect(document.activeElement).toBe(screen.getByTestId('graph-toggle-risk'));
  });

  it('lists a large graph windowed', async () => {
    const user = userEvent.setup();
    render(<Host nodes={largeGraph(50, 10).nodes} />);
    expect(screen.getByTestId('graph-minimap-trigger')).toHaveTextContent('500 rules');
    await act(() => user.click(screen.getByTestId('graph-minimap-trigger')));
    const options = within(screen.getByRole('listbox')).getAllByRole('option');
    expect(options.length).toBeLessThan(200);
  });
});
