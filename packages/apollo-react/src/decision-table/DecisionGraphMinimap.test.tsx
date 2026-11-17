import { act, cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe } from 'jest-axe';
import { useState } from 'react';
import { vi } from 'vitest';
import {
  largeGraph,
  SHARED_DEPENDENCY,
  SINGLE_DECISION,
  tableOf,
} from './__fixtures__/decisionGraph.fixtures';
import {
  EDITABLE_TABLE,
  tableColumns,
  wordedRules,
} from './__fixtures__/editableSentences.fixtures';
import { DecisionGraphMinimap } from './DecisionGraphMinimap';
import { DecisionGraphText } from './DecisionGraphText';
import { DecisionText } from './DecisionText';
import type { DecisionGraphNode } from './decisionGraphTypes';
import { WINDOW_MINIMAP_FROM } from './MinimapList';
import { type MinimapItem, minimapRows } from './minimapRows';
import type { SentenceRule, SentenceSelection } from './sentenceTypes';

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
    decisionId: 'd-eligibility',
    kind: 'decision',
    label: 'Eligibility',
    count: { meta: '2', ariaLabel: 'Eligibility, 2 rules' },
    children: [
      {
        decisionId: 'd-eligibility',
        rowId: 'r-1',
        kind: 'rule',
        label: 'risk is high when age < 25',
      },
      { decisionId: 'd-eligibility', rowId: 'r-2', kind: 'rule', label: 'risk is low otherwise' },
      {
        decisionId: 'd-risk',
        kind: 'decision',
        label: 'Risk',
        count: null,
        children: [{ decisionId: 'd-risk', rowId: 'r-3', kind: 'rule', label: 'score above 700' }],
      },
    ],
  },
  {
    referenceId: 'ref-risk',
    kind: 'reference',
    label: 'Risk',
    ariaLabel: 'Risk, listed above',
    targetId: 'd-risk',
  },
];

const minimap = (props: Partial<React.ComponentProps<typeof DecisionGraphMinimap>> = {}) => (
  <DecisionGraphMinimap
    items={() => ITEMS}
    triggerLabel="3 rules"
    currentDecisionId={null}
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
    expect(minimapRows(ITEMS, '').map(({ item, key, depth }) => [item.label, key, depth])).toEqual([
      ['Eligibility', 0, 0],
      ['risk is high when age < 25', 1, 1],
      ['risk is low otherwise', 2, 1],
      ['Risk', 3, 1],
      ['score above 700', 4, 2],
      ['Risk', 5, 0],
    ]);
  });

  it('keeps the decisions above a matching rule, and every rule of a matching decision', () => {
    expect(minimapRows(ITEMS, 'score').map(({ key }) => key)).toEqual([0, 3, 4]);
    expect(minimapRows(ITEMS, 'eligib').map(({ key }) => key)).toEqual([0, 1, 2]);
    expect(minimapRows(ITEMS, 'RISK').map(({ key, match }) => [key, match])).toEqual([
      [0, false],
      [1, true],
      [2, true],
      [3, true],
      [4, false],
      [5, true],
    ]);
  });

  it('is empty when nothing matches', () => {
    expect(minimapRows(ITEMS, 'zzz')).toEqual([]);
  });
});

describe('DecisionGraphMinimap', () => {
  it('is a trigger until opened, then a searchable listbox on the current row', async () => {
    render(minimap({ currentDecisionId: 'd-risk' }));
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
    expect(onPick).toHaveBeenCalledWith({
      decisionId: 'd-eligibility',
      rowId: 'r-1',
      kind: 'rule',
      label: 'risk is high when age < 25',
    });
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
    await userEvent.click(screen.getByTestId('map-row-reference-ref-risk'));
    expect(onPick).toHaveBeenCalledWith(ITEMS[1]);
  });

  it('windows a long outline, each option saying where it sits', async () => {
    const many: MinimapItem[] = Array.from({ length: WINDOW_MINIMAP_FROM + 50 }, (_, index) => ({
      decisionId: 'd',
      rowId: `r${index}`,
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

  it('leaves a long outline where the reader scrolls it, however fast, until the keys move', async () => {
    const many: MinimapItem[] = Array.from({ length: WINDOW_MINIMAP_FROM + 300 }, (_, index) => ({
      decisionId: 'd',
      rowId: `r${index}`,
      kind: 'rule',
      label: `Rule ${index}`,
    }));
    const height = vi.spyOn(HTMLElement.prototype, 'offsetHeight', 'get').mockReturnValue(440);
    const user = userEvent.setup();
    render(minimap({ items: () => many }));
    await user.click(screen.getByTestId('map-trigger'));
    const list = screen.getByRole('listbox');
    let top = 0;
    Object.defineProperty(list, 'scrollTop', { configurable: true, get: () => top });
    scrollToSpy.mockClear();
    for (const next of [2000, 4000, 6000, 8000]) {
      top = next;
      act(() => {
        list.dispatchEvent(new Event('scroll'));
      });
    }
    expect(scrollToSpy).not.toHaveBeenCalled();
    expect(within(list).getByText('Rule 370')).toBeInTheDocument();
    await user.keyboard('{ArrowDown}');
    expect(scrollToSpy).toHaveBeenCalledTimes(1);
    expect(activeOption()).toHaveTextContent('Rule 1');
    height.mockRestore();
  });

  it('places each row by its own kind when the rows change under the same count', async () => {
    const rules = (prefix: string, count: number): MinimapItem[] =>
      Array.from({ length: count }, (_, index) => ({
        decisionId: prefix,
        rowId: String(index),
        kind: 'rule',
        label: `${prefix} ${index}`,
      }));
    const flat = rules('flat', WINDOW_MINIMAP_FROM + 10);
    const nested: MinimapItem[] = [
      {
        decisionId: 'd-top',
        kind: 'decision',
        label: 'Top',
        count: null,
        children: rules('nested', WINDOW_MINIMAP_FROM + 9),
      },
    ];
    const height = vi.spyOn(HTMLElement.prototype, 'offsetHeight', 'get').mockReturnValue(440);
    const user = userEvent.setup();
    const { rerender } = render(minimap({ items: () => flat }));
    await user.click(screen.getByTestId('map-trigger'));
    expect(screen.getByTestId('map-row-rule-flat-1')).toHaveStyle({ top: '22px' });
    rerender(minimap({ items: () => nested }));
    expect(screen.getByTestId('map-row-rule-nested-0')).toHaveStyle({ top: '24px' });
    height.mockRestore();
  });

  it('leaves the keys to an IME while it composes', async () => {
    const onPick = vi.fn();
    const user = userEvent.setup();
    render(minimap({ onPick }));
    await user.click(screen.getByTestId('map-trigger'));
    await user.keyboard('risk');
    const landed = activeOption();
    fireEvent.keyDown(search(), { key: 'ArrowDown', isComposing: true });
    fireEvent.keyDown(search(), { key: 'Enter', keyCode: 229 });
    expect(activeOption()).toBe(landed);
    expect(onPick).not.toHaveBeenCalled();
    fireEvent.keyDown(search(), { key: 'Escape', isComposing: true });
    fireEvent.keyDown(search(), { key: 'Escape', keyCode: 229 });
    expect(search()).toHaveValue('risk');
    expect(screen.getByRole('listbox')).toBeInTheDocument();
  });

  it('has no axe violations while open', async () => {
    const { baseElement } = render(minimap());
    await userEvent.click(screen.getByTestId('map-trigger'));
    expect(await axe(baseElement)).toHaveNoViolations();
  });
});

interface RuleAt {
  decisionId: string;
  rowId: string;
}

describe('DecisionGraphText minimap', () => {
  const TABLE = tableOf(30);
  const RULES = wordedRules(TABLE);
  const Host = ({
    nodes,
    rules = RULES,
  }: {
    nodes: readonly DecisionGraphNode[];
    rules?: readonly SentenceRule[];
  }) => {
    const [selected, setSelected] = useState<{ id: string; rule: SentenceSelection } | null>(null);
    return (
      <DecisionGraphText
        nodes={nodes}
        rules={() => rules}
        renderBody={(id, scroll) => (
          <DecisionText
            rules={rules}
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
    await user.click(screen.getByTestId('graph-minimap-row-decision-net-income'));
    expect(screen.getByTestId('graph-toggle-net-income')).toHaveAttribute('aria-expanded', 'true');
    expect(document.activeElement).toBe(screen.getByTestId('graph-toggle-net-income'));
    expect(scrollToSpy).toHaveBeenCalled();
  });

  it('selects and focuses a picked rule in an editable body', async () => {
    const user = userEvent.setup();
    render(<Host nodes={SHARED_DEPENDENCY.nodes} />);
    await user.click(screen.getByTestId('graph-minimap-trigger'));
    await user.click(screen.getByTestId('graph-minimap-row-rule-eligibility-r25'));
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
    await user.click(screen.getByTestId('graph-minimap-row-reference-pricing-risk'));
    expect(document.activeElement).toBe(screen.getByTestId('graph-toggle-risk'));
  });

  const SHARED_RULE_IDS: [string, RuleAt, RuleAt][] = [
    [
      'the same rule id',
      { decisionId: 'first', rowId: 'r1' },
      { decisionId: 'second', rowId: 'r1' },
    ],
    ['ids that join alike', { decisionId: 'a', rowId: 'b:r1' }, { decisionId: 'a:b', rowId: 'r1' }],
  ];
  it.each(
    SHARED_RULE_IDS
  )('takes a rule to its own decision when decisions share %s', async (_, first, second) => {
    const onReveal = vi.fn();
    const user = userEvent.setup();
    const ruleOf = ({ decisionId, rowId }: RuleAt): SentenceRule => ({
      rowId,
      heading: [`${decisionId} rule`],
      lead: [],
      lines: [],
    });
    render(
      <DecisionGraphText
        nodes={[first, second].map(({ decisionId }) => ({
          kind: 'decision',
          id: decisionId,
          label: decisionId,
          ruleCount: 1,
          children: [],
        }))}
        rules={(decisionId) => [ruleOf(decisionId === first.decisionId ? first : second)]}
        renderBody={() => null}
        onReveal={onReveal}
        dataTestId="graph"
      />
    );
    for (const { decisionId, rowId } of [second, first]) {
      await user.click(screen.getByTestId('graph-minimap-trigger'));
      await user.keyboard(`${decisionId} rule{Enter}`);
      expect(onReveal).toHaveBeenLastCalledWith({ decisionId, rowId });
    }
  });

  it('finds a rule by any of its conditions', async () => {
    const user = userEvent.setup();
    render(<Host nodes={SINGLE_DECISION.nodes} rules={wordedRules(EDITABLE_TABLE)} />);
    await user.click(screen.getByTestId('graph-minimap-trigger'));
    await user.keyboard('web');
    expect(activeOption()).toBe(screen.getByTestId('graph-minimap-row-rule-risk-r2'));
    await user.keyboard('{Enter}');
    expect(document.activeElement).toBe(screen.getByTestId('text-risk-row-r2'));
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
