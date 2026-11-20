import { act, cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe } from 'jest-axe';
import { useState } from 'react';
import { createRoot } from 'react-dom/client';
import { type Mock, vi } from 'vitest';
import {
  CYCLE,
  MARKED,
  NOT_A_TABLE,
  SHARED_DEPENDENCY,
  tableOf,
} from './__fixtures__/decisionGraph.fixtures';
import { tableColumns, wordedRules } from './__fixtures__/editableSentences.fixtures';
import {
  COLUMN_TYPES,
  GRID_SENTENCE_POLICY,
  HIT_POLICIES,
  wordRefusal,
} from './__fixtures__/sentences.fixtures';
import {
  type FixtureEdit,
  type FixtureGraphBody,
  type FixtureGraphProps,
  modeOf,
  outcomeField,
} from './__fixtures__/textMode';
import { DecisionGraphText } from './DecisionGraphText';
import type { DecisionGraphNode, DecisionGraphTarget } from './decisionGraphTypes';
import type { SentenceSelection, SentenceValueId } from './sentenceTypes';

vi.unmock('@uipath/apollo-wind/components/ui/tooltip');

const TABLE = tableOf(30);
const RULES = wordedRules(TABLE);

const textBody = (
  decisionId: string,
  selected: SentenceSelection | null = null,
  onSelect?: (selection: SentenceSelection | null) => void,
  edit?: FixtureEdit
): FixtureGraphBody => ({
  kind: 'table',
  text: {
    table: { rules: RULES, ...tableColumns(TABLE), hitPolicy: GRID_SENTENCE_POLICY },
    hitPolicies: HIT_POLICIES,
    columnTypes: COLUMN_TYPES,
    ariaLabel: `Rules of ${decisionId}`,
    dataTestId: `text-${decisionId}`,
    mode: modeOf({ selected, onSelect, edit }),
  },
});

const held = (expanded: ReadonlySet<string>): FixtureGraphProps['expansion'] => ({
  expanded,
  onChange: () => {},
});

const graph = (props: Partial<FixtureGraphProps> = {}) => (
  <DecisionGraphText
    nodes={SHARED_DEPENDENCY.nodes}
    renderBody={(id) => textBody(id)}
    mode={{ kind: 'read', selected: null }}
    dataTestId="graph"
    {...props}
  />
);

const toggle = (id: string) => screen.getByTestId(`graph-toggle-${id}`);
const press = async (element: HTMLElement) => {
  element.focus();
  await userEvent.keyboard('{Enter}');
};
const body = (id: string) => screen.queryByTestId(`graph-body-${id}`);

/** A host that selects the rule the view reveals, as Studio Web does. */
const SelectingHost = ({
  nodes = MARKED.nodes,
  onReveal,
}: {
  nodes?: readonly DecisionGraphNode[];
  onReveal?: (target: DecisionGraphTarget) => void;
}) => {
  const [selected, setSelected] = useState<{ id: string; rowId: string } | null>(null);
  return (
    <DecisionGraphText
      nodes={nodes}
      renderBody={(id) =>
        textBody(id, selected?.id === id ? { kind: 'rule', rowId: selected.rowId } : null, () => {})
      }
      mode={{
        kind: 'select',
        selected: selected?.id ?? null,
        onReveal: (target) => {
          onReveal?.(target);
          if (target.kind === 'rule') setSelected({ id: target.decisionId, rowId: target.rowId });
        },
      }}
      dataTestId="graph"
    />
  );
};

let nearCard: (decisionId: string) => boolean = () => true;
let cardObservers: CardObserver[] = [];

/** Reports each card it observes as the browser does: near the scrollport when `nearCard` says so. */
class CardObserver {
  readonly root = null;
  readonly rootMargin = '0px';
  readonly scrollMargin = '0px';
  readonly thresholds = [0];
  readonly #callback: IntersectionObserverCallback;
  constructor(callback: IntersectionObserverCallback) {
    this.#callback = callback;
    cardObservers.push(this);
  }
  report(crossings: readonly { target: Element; isIntersecting: boolean }[]) {
    this.#callback(
      crossings.map(({ target, isIntersecting }) => {
        const rect = target.getBoundingClientRect();
        return {
          target,
          isIntersecting,
          intersectionRatio: isIntersecting ? 1 : 0,
          boundingClientRect: rect,
          intersectionRect: rect,
          rootBounds: null,
          time: 0,
        };
      }),
      this
    );
  }
  observe(target: Element) {
    const decisionId = target instanceof HTMLElement ? target.dataset.decisionId : undefined;
    if (decisionId === undefined) return;
    this.report([{ target, isIntersecting: nearCard(decisionId) }]);
  }
  unobserve() {}
  disconnect() {}
  takeRecords() {
    return [];
  }
}

let scrollToSpy: ReturnType<typeof vi.fn>;
let scrollIntoViewSpy: Mock<Element['scrollIntoView']>;
beforeEach(() => {
  scrollToSpy = vi.fn();
  HTMLElement.prototype.scrollTo = scrollToSpy as unknown as HTMLElement['scrollTo'];
  scrollIntoViewSpy = vi.fn<Element['scrollIntoView']>();
  Element.prototype.scrollIntoView = scrollIntoViewSpy;
  nearCard = () => true;
  cardObservers = [];
  vi.stubGlobal('IntersectionObserver', CardObserver);
});
afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

describe('DecisionGraphText', () => {
  it('shows the empty state for a graph with no decisions', () => {
    render(graph({ nodes: [] }));
    expect(screen.getByTestId('graph-empty')).toHaveTextContent('No decisions yet');
    expect(screen.queryByRole('heading')).toBeNull();
  });

  it('starts every decision folded, its required decisions nested under it', () => {
    render(graph());
    for (const id of ['eligibility', 'risk', 'net-income', 'pricing']) {
      expect(toggle(id)).toHaveAttribute('aria-expanded', 'false');
      expect(body(id)).toBeNull();
    }
    const levels = screen.getAllByRole('heading').map((heading) => heading.tagName);
    expect(levels).toEqual(['H3', 'H4', 'H4', 'H3']);
  });

  it('opens and folds a decision by click, Enter and Space', async () => {
    const user = userEvent.setup();
    render(graph());
    await user.click(toggle('eligibility'));
    expect(toggle('eligibility')).toHaveAttribute('aria-expanded', 'true');
    expect(toggle('eligibility')).toHaveAttribute('aria-controls', body('eligibility')?.id);
    expect(screen.getByTestId('text-eligibility')).toBeInTheDocument();
    await user.keyboard('{Enter}');
    expect(body('eligibility')).toBeNull();
    await user.keyboard(' ');
    expect(body('eligibility')).not.toBeNull();
  });

  it('names a nested decision with the decisions that use it', () => {
    render(graph());
    const heading = within(screen.getByTestId('graph-decision-risk')).getByRole('heading');
    expect(heading).toHaveTextContent('Used by Eligibility, Pricing');
  });

  it('lets the host control which decisions are open', async () => {
    const onChange = vi.fn();
    render(graph({ expansion: { expanded: new Set(['pricing']), onChange } }));
    expect(body('pricing')).not.toBeNull();
    await userEvent.click(toggle('risk'));
    expect(onChange).toHaveBeenCalledWith(new Set(['pricing', 'risk']));
    expect(body('risk')).toBeNull();
  });

  it.each([
    'click',
    'keyboard',
  ] as const)('links a decision drawn elsewhere, opening it by %s and bringing it to the top without moving focus', async (how) => {
    const onReveal = vi.fn();
    render(graph({ mode: { kind: 'select', selected: null, onReveal } }));
    const link = screen.getByTestId('graph-reference-link-pricing-risk');
    expect(screen.getByTestId('graph-reference-pricing-risk')).toHaveTextContent('See Risk above');
    if (how === 'click') await userEvent.click(link);
    else await press(link);
    expect(body('risk')).not.toBeNull();
    expect(onReveal).toHaveBeenCalledWith({ kind: 'decision', decisionId: 'risk' });
    expect(scrollToSpy.mock.calls).toEqual([[{ top: 0, left: -12 }]]);
    expect(scrollToSpy.mock.contexts).toEqual([screen.getByTestId('graph-scroller')]);
    expect(scrollIntoViewSpy).not.toHaveBeenCalled();
    expect(document.activeElement).toBe(link);
  });

  it('lands a far reveal at once, so rule windows mounting on the way cannot stop it short', async () => {
    render(graph());
    await userEvent.click(screen.getByTestId('graph-reference-link-pricing-risk'));
    expect(scrollToSpy).toHaveBeenCalledTimes(1);
    expect(scrollToSpy.mock.calls[0]?.[0]).not.toHaveProperty('behavior', 'smooth');
  });

  it('brings an open decision to the top again from its link', async () => {
    render(graph({ expansion: held(new Set(['risk'])) }));
    await userEvent.click(screen.getByTestId('graph-reference-link-pricing-risk'));
    expect(scrollToSpy).toHaveBeenCalledTimes(1);
  });

  it('brings the card top, not its sticky heading, to the top of an open decision the reader is partway through', async () => {
    render(graph({ expansion: held(new Set(['risk'])) }));
    vi.spyOn(screen.getByTestId('graph-decision-risk'), 'getBoundingClientRect').mockReturnValue(
      DOMRect.fromRect({ x: 0, y: -400, width: 900, height: 1500 })
    );
    await userEvent.click(screen.getByTestId('graph-reference-link-pricing-risk'));
    expect(scrollToSpy.mock.calls).toEqual([[{ top: -400, left: -12 }]]);
  });

  it('ends a cycle in a link back to its start', () => {
    render(graph({ nodes: CYCLE.nodes }));
    expect(screen.getByTestId('graph-reference-limit-approval')).toHaveTextContent(
      'See Approval above'
    );
  });

  it("clips an open body to its card's rounded bottom", () => {
    render(graph({ expansion: held(new Set(['risk'])) }));
    expect(body('risk')).toHaveClass('overflow-clip', 'rounded-b-[9px]');
  });

  it.each([
    ['reading', false],
    ['editing', true],
  ])("falls back to the node's hit policy label when the catalog has no matching option, %s", (_, editing) => {
    render(
      graph({
        renderBody: (id) => {
          const body = textBody(id);
          return body.kind === 'table'
            ? {
                ...body,
                text: {
                  ...body.text,
                  hitPolicies: [],
                  ...(editing ? { mode: modeOf({ selected: null, onPolicyChange: vi.fn() }) } : {}),
                },
              }
            : body;
        },
      })
    );
    if (editing) {
      expect(screen.getByTestId('graph-risk-policy')).toHaveAccessibleName(/Unique/);
    }
    expect(screen.getByTestId('graph-hit-policy-risk')).toHaveTextContent('Unique');
  });

  it("describes a read-only card's policy chip by the policy's hint", () => {
    render(graph());
    expect(
      screen.getByTestId('graph-hit-policy-risk').querySelector('[aria-describedby]')
    ).toHaveAccessibleDescription('Exactly one rule may match. Overlaps are errors.');
  });

  it('shows a policy-only diff on the card heading, before and after', () => {
    render(
      graph({
        renderBody: (id) => {
          const body = textBody(id);
          return body.kind === 'table'
            ? {
                ...body,
                text: {
                  ...body.text,
                  mode: {
                    kind: 'diff',
                    diff: {
                      mode: 'full',
                      hitPolicy: {
                        before: { kind: 'policy', policy: 'first' },
                        after: GRID_SENTENCE_POLICY,
                      },
                    },
                  },
                },
              }
            : body;
        },
      })
    );
    const heading = screen.getByTestId('graph-hit-policy-risk');
    expect(heading.querySelector('del')).toHaveTextContent('FFirst');
    expect(heading).toHaveTextContent(/now UUnique/);
  });

  it('builds each table body once per render, an open one included', async () => {
    const renderBody = vi.fn((id: string) => textBody(id));
    render(graph({ renderBody, expansion: held(new Set(['risk'])) }));
    const counts = new Map<string, number>();
    for (const [id] of renderBody.mock.calls) counts.set(id, (counts.get(id) ?? 0) + 1);
    expect(counts.has('risk')).toBe(true);
    expect(new Set(counts.values()).size).toBe(1);
  });

  it('shows what the host gives for a decision that is not a table', async () => {
    render(
      graph({
        nodes: NOT_A_TABLE.nodes,
        renderBody: (id) => ({ kind: 'other', content: <p>{String(NOT_A_TABLE.bodies[id])}</p> }),
      })
    );
    expect(screen.getByTestId('graph-hit-policy-offer')).toHaveTextContent('Unique');
    expect(screen.getByTestId('graph-rule-count-offer')).toHaveTextContent('3 rules');
    expect(screen.queryByTestId('graph-hit-policy-discount')).toBeNull();
    expect(screen.queryByTestId('graph-rule-count-discount')).toBeEmptyDOMElement();
    await userEvent.click(toggle('discount'));
    expect(body('discount')).toHaveTextContent("isn't a decision table");
  });

  it('opens a marked decision from the keyboard on the rule its mark names, focused and centred', async () => {
    const onReveal = vi.fn();
    render(<SelectingHost onReveal={onReveal} />);
    const mark = screen.getByTestId('graph-mark-eligibility');
    expect(mark).toHaveAccessibleName('Error: Rules 1 and 3 overlap. Show it');
    await press(mark);
    expect(onReveal).toHaveBeenCalledWith({
      kind: 'rule',
      decisionId: 'eligibility',
      rowId: 'r3',
    });
    expect(document.activeElement).toBe(screen.getByTestId('text-eligibility-row-r3'));
    expect(scrollToSpy.mock.contexts).toEqual([screen.getByTestId('graph-scroller')]);
    expect(scrollIntoViewSpy).not.toHaveBeenCalled();
  });

  it('opens a decision its mark names from the keyboard, focusing its heading', async () => {
    const onReveal = vi.fn();
    render(
      graph({
        nodes: [
          {
            kind: 'decision',
            id: 'offer',
            label: 'Offer',
            logic: { kind: 'other' },
            mark: { kind: 'decision', mark: { tone: 'warning', title: 'No logic', glyph: true } },
            children: [],
          },
        ],
        renderBody: () => ({ kind: 'other', content: null }),
        mode: { kind: 'select', selected: null, onReveal },
      })
    );
    await press(screen.getByTestId('graph-mark-offer'));
    expect(onReveal).toHaveBeenCalledWith({ kind: 'decision', decisionId: 'offer' });
    expect(document.activeElement).toBe(toggle('offer'));
  });

  it('reveals a rule outside the mounted window once the host selects it', async () => {
    render(<SelectingHost />);
    await press(screen.getByTestId('graph-mark-risk'));
    expect(document.activeElement).toBe(screen.getByTestId('text-risk-row-r20'));
  });

  it("focuses a revealed rule in a read-only body that shows the host's selection", async () => {
    const ReadOnlyHost = () => {
      const [shown, setShown] = useState<{ id: string; rowId: string } | null>(null);
      return (
        <DecisionGraphText
          nodes={MARKED.nodes}
          renderBody={(id) =>
            textBody(id, shown?.id === id ? { kind: 'rule', rowId: shown.rowId } : null)
          }
          mode={{
            kind: 'select',
            selected: null,
            onReveal: (target) => {
              if (target.kind === 'rule') setShown({ id: target.decisionId, rowId: target.rowId });
            },
          }}
          dataTestId="graph"
        />
      );
    };
    const { container } = render(<ReadOnlyHost />);
    await press(screen.getByTestId('graph-mark-risk'));
    const rule = screen.getByTestId('text-risk-row-r20');
    expect(document.activeElement).toBe(rule);
    expect(rule).toHaveAttribute('tabindex', '-1');
    expect(container.querySelectorAll('li[tabindex="0"]')).toHaveLength(0);
    expect(await axe(container)).toHaveNoViolations();
  });

  it('keeps the roving tab stop of a selectable body it reveals a rule in', async () => {
    render(<SelectingHost />);
    await press(screen.getByTestId('graph-mark-risk'));
    expect(screen.getByTestId('text-risk-row-r20')).toHaveAttribute('tabindex', '0');
  });

  it('leaves keys typed in a body to the body', async () => {
    const user = userEvent.setup();
    render(
      graph({
        renderBody: () => ({ kind: 'other', content: <input aria-label="Inside" /> }),
      })
    );
    await user.click(toggle('eligibility'));
    const input = screen.getByRole('textbox', { name: 'Inside' });
    await user.click(input);
    await user.keyboard('a b{Enter}{ArrowUp}{Home}');
    expect(input).toHaveValue('a b');
    expect(body('eligibility')).not.toBeNull();
  });

  it('tabs from a heading into its body and on to the next heading', async () => {
    const user = userEvent.setup();
    render(
      graph({
        nodes: [SHARED_DEPENDENCY.nodes[1] ?? SHARED_DEPENDENCY.nodes[0]].flatMap((n) =>
          n ? [n] : []
        ),
        expansion: held(new Set(['pricing'])),
        renderBody: () => ({ kind: 'other', content: <button type="button">Inside</button> }),
      })
    );
    toggle('pricing').focus();
    await user.tab();
    expect(document.activeElement).toBe(screen.getByRole('button', { name: 'Inside' }));
    await user.tab();
    expect(document.activeElement).toBe(screen.getByTestId('graph-reference-link-pricing-risk'));
  });

  it('tells the host which decision it folds, and not the ones the host folds', async () => {
    const onCancel = vi.fn();
    const editing: SentenceValueId = { rowId: 'r1', columnId: 'age', index: 0 };
    const edit: FixtureEdit = {
      editing,
      onCommit: vi.fn(),
      onCancel,
      onClearCell: vi.fn(),
      onDeleteRule: vi.fn(),
      valueField: outcomeField,
      wordRefusal,
    };
    const onFold = vi.fn();
    const Host = () => {
      const [expanded, setExpanded] = useState<ReadonlySet<string>>(new Set(['risk']));
      return (
        <>
          <button type="button" onClick={() => setExpanded(new Set())}>
            Fold
          </button>
          <DecisionGraphText
            nodes={SHARED_DEPENDENCY.nodes}
            mode={{ kind: 'read', selected: null }}
            expansion={{ expanded, onChange: setExpanded }}
            onFold={(decisionId) => {
              onFold(decisionId);
              edit.onCancel?.();
            }}
            renderBody={(id) =>
              textBody(id, { kind: 'cell', rowId: 'r1', columnId: 'age' }, () => {}, edit)
            }
            dataTestId="graph"
          />
        </>
      );
    };
    const { unmount } = render(<Host />);
    onCancel.mockClear();
    fireEvent.click(toggle('risk'));
    await act(() => Promise.resolve());
    expect(body('risk')).toBeNull();
    expect(document.querySelector('dialog')).toBeNull();
    expect(onFold.mock.calls).toEqual([['risk']]);
    expect(onCancel).toHaveBeenCalledTimes(1);
    unmount();
    render(<Host />);
    onFold.mockClear();
    fireEvent.click(screen.getByRole('button', { name: 'Fold' }));
    expect(body('risk')).toBeNull();
    expect(onFold).not.toHaveBeenCalled();
  });

  it('gives each body the graph as its scroll container, inside a shadow root too', async () => {
    const host = document.createElement('div');
    document.body.append(host);
    const shadow = host.attachShadow({ mode: 'open' });
    const mount = document.createElement('div');
    shadow.append(mount);
    const root = createRoot(mount);
    await act(async () =>
      root.render(
        graph({
          expansion: held(new Set(['risk'])),
          renderBody: (id) => textBody(id),
        })
      )
    );
    const scroller = shadow.querySelector('[data-testid="graph-scroller"]');
    expect(scroller).not.toBeNull();
    expect(shadow.querySelector('[data-testid="text-risk"]')).toHaveClass('relative');
    expect(shadow.querySelector('[data-testid="text-risk"]')).not.toHaveClass('overflow-auto');
    const link = shadow.querySelector<HTMLElement>(
      '[data-testid="graph-reference-link-pricing-risk"]'
    );
    await act(async () => link?.click());
    expect(scrollToSpy.mock.contexts).toEqual([scroller]);
    act(() => root.unmount());
    host.remove();
  });

  it('floats the minimap launcher over the scroller and keeps the cards clear of it', () => {
    vi.spyOn(HTMLElement.prototype, 'offsetLeft', 'get').mockReturnValue(15);
    vi.spyOn(HTMLElement.prototype, 'offsetWidth', 'get').mockReturnValue(140);
    render(graph());
    const slot = screen.getByTestId('graph-minimap-trigger').parentElement?.parentElement;
    const scroller = screen.getByTestId('graph-scroller');
    expect(slot?.className).toContain('absolute');
    expect(slot?.parentElement).toBe(scroller.parentElement);
    expect(scroller.firstElementChild).toHaveClass('mx-auto', 'w-full', 'max-w-3xl');
    expect(scroller.firstElementChild).toHaveStyle({
      paddingLeft: 'max(2rem, calc(167px - max(0px, (100% - 48rem) / 2)))',
    });
    vi.restoreAllMocks();
  });

  it('has no axe violations, folded and open', async () => {
    const { container, rerender } = render(graph());
    expect(await axe(container)).toHaveNoViolations();
    rerender(graph({ expansion: held(new Set(['eligibility', 'risk'])) }));
    expect(await axe(container)).toHaveNoViolations();
  });

  it('mounts the bodies near the scrollport only, and mounts a far rule it reveals', async () => {
    nearCard = (decisionId) => ['d1', 'd2', 'd3'].includes(decisionId);
    const table = tableOf(10);
    const rules = wordedRules(table);
    const ids = Array.from({ length: 50 }, (_, index) => `d${index + 1}`);
    const nodes: DecisionGraphNode[] = ids.map((id) => ({
      kind: 'decision',
      id,
      label: id,
      logic: { kind: 'table', hitPolicy: 'Unique', ruleCount: 10 },
      mark: {
        kind: 'rule',
        mark: { tone: 'error', title: 'Rules 1 and 10 overlap', glyph: true },
        rowId: 'r10',
      },
      children: [],
    }));
    const Host = () => {
      const [selected, setSelected] = useState<{ id: string; rowId: string } | null>(null);
      return (
        <DecisionGraphText
          nodes={nodes}
          expansion={held(new Set(ids))}
          renderBody={(id) => ({
            kind: 'table',
            text: {
              table: { rules: rules, ...tableColumns(table), hitPolicy: GRID_SENTENCE_POLICY },
              hitPolicies: HIT_POLICIES,
              columnTypes: COLUMN_TYPES,
              ariaLabel: `Rules of ${id}`,
              dataTestId: `text-${id}`,
              mode: {
                kind: 'select',
                selected: selected?.id === id ? { kind: 'rule', rowId: selected.rowId } : null,
                onSelect: () => {},
              },
            },
          })}
          mode={{
            kind: 'select',
            selected: selected?.id ?? null,
            onReveal: (target) => {
              if (target.kind === 'rule')
                setSelected({ id: target.decisionId, rowId: target.rowId });
            },
          }}
          dataTestId="graph"
        />
      );
    };
    const { container } = render(<Host />);
    expect(container.querySelectorAll('li[data-row-id]')).toHaveLength(30);
    expect(body('d50')?.querySelector('[data-graph-placeholder]')).not.toBeNull();
    await press(screen.getByTestId('graph-mark-d50'));
    const rule = screen.getByTestId('text-d50-row-r10');
    expect(document.activeElement).toBe(rule);
    expect(rule).toHaveAttribute('aria-current', 'true');
    expect(container.querySelectorAll('li[data-row-id]').length).toBeLessThan(100);
  });

  it('takes the last crossing of a card in one observer batch', () => {
    nearCard = (decisionId) => decisionId === 'risk';
    render(graph({ expansion: held(new Set(['eligibility', 'risk'])) }));
    const placeholder = (id: string) => body(id)?.querySelector('[data-graph-placeholder]');
    expect(placeholder('risk')).toBeNull();
    expect(placeholder('eligibility')).not.toBeNull();
    const card = (id: string) => screen.getByTestId(`graph-decision-${id}`);
    act(() => {
      for (const observer of cardObservers) {
        observer.report([
          { target: card('risk'), isIntersecting: false },
          { target: card('risk'), isIntersecting: true },
          { target: card('eligibility'), isIntersecting: true },
          { target: card('eligibility'), isIntersecting: false },
        ]);
      }
    });
    expect(placeholder('risk')).toBeNull();
    expect(placeholder('eligibility')).not.toBeNull();
  });
});

const OPENED = { nodes: MARKED.nodes };

describe('DecisionGraphText open', () => {
  it('opens a decision once on a double-click of its heading, the way the canvas drills in', async () => {
    const onOpenDecision = vi.fn();
    render(graph({ onOpenDecision }));
    await userEvent.dblClick(within(toggle('risk')).getByText('Risk'));
    expect(onOpenDecision).toHaveBeenCalledTimes(1);
    expect(onOpenDecision).toHaveBeenCalledWith('risk');
    onOpenDecision.mockClear();
    await userEvent.dblClick(screen.getByTestId('graph-rule-count-pricing'));
    expect(onOpenDecision).toHaveBeenCalledWith('pricing');
  });

  it('opens nothing on a double-click inside the policy picker menu or its totals submenu', async () => {
    const onOpenDecision = vi.fn();
    render(
      graph({
        onOpenDecision,
        renderBody: (id) => {
          const body = textBody(id);
          return body.kind === 'table'
            ? {
                ...body,
                text: { ...body.text, mode: modeOf({ selected: null, onPolicyChange: vi.fn() }) },
              }
            : body;
        },
      })
    );
    await userEvent.click(screen.getByTestId('graph-risk-policy'));
    const menu = await screen.findByTestId('graph-risk-policy-menu');
    await userEvent.dblClick(menu);
    const totals = within(menu).getByRole('menuitem', { name: /Collect and total/ });
    await userEvent.dblClick(totals);
    expect(onOpenDecision).not.toHaveBeenCalled();
  });

  it('opens nothing on a double-click inside a body, and leaves the double-click to the body', async () => {
    const onOpenDecision = vi.fn();
    const onStartEdit = vi.fn();
    render(
      graph({
        expansion: held(new Set(['risk'])),
        onOpenDecision,
        renderBody: (id) =>
          textBody(id, null, () => {}, {
            onCommit: () => undefined,
            onClearCell: () => {},
            onDeleteRule: () => {},
            onStartEdit,
            valueField: outcomeField,
            wordRefusal,
          }),
      })
    );
    const value = screen
      .getByTestId('text-risk-row-r1')
      .querySelector<HTMLElement>('[data-kind="value"]');
    expect(value).not.toBeNull();
    if (value) await userEvent.dblClick(value);
    expect(onOpenDecision).not.toHaveBeenCalled();
    expect(onStartEdit).toHaveBeenCalled();
  });

  it('opens nothing on a double-click of a heading mark', async () => {
    const onOpenDecision = vi.fn();
    render(graph({ ...OPENED, onOpenDecision }));
    await userEvent.dblClick(screen.getByTestId('graph-mark-risk'));
    expect(onOpenDecision).not.toHaveBeenCalled();
  });

  it('opens a decision on Alt+Enter on its toggle, leaving Enter and Space to fold it', async () => {
    const onOpenDecision = vi.fn();
    render(graph({ onOpenDecision }));
    expect(toggle('risk')).toHaveAttribute('aria-keyshortcuts', 'Alt+Enter');
    toggle('risk').focus();
    await userEvent.keyboard('{Alt>}{Enter}{/Alt}');
    expect(onOpenDecision).toHaveBeenCalledTimes(1);
    expect(onOpenDecision).toHaveBeenCalledWith('risk');
    expect(toggle('risk')).toHaveAttribute('aria-expanded', 'false');
    await userEvent.keyboard('{Enter}');
    expect(toggle('risk')).toHaveAttribute('aria-expanded', 'true');
    await userEvent.keyboard(' ');
    expect(toggle('risk')).toHaveAttribute('aria-expanded', 'false');
    expect(onOpenDecision).toHaveBeenCalledTimes(1);
  });

  it('opens the decision a reference repeats, by double-click and by Alt+Enter on its link', async () => {
    const onOpenDecision = vi.fn();
    render(graph({ onOpenDecision }));
    await userEvent.dblClick(screen.getByTestId('graph-reference-pricing-risk'));
    expect(onOpenDecision).toHaveBeenCalledTimes(1);
    expect(onOpenDecision).toHaveBeenCalledWith('risk');
    const link = screen.getByTestId('graph-reference-link-pricing-risk');
    expect(link).toHaveAttribute('aria-keyshortcuts', 'Alt+Enter');
    link.focus();
    await userEvent.keyboard('{Alt>}{Enter}{/Alt}');
    expect(onOpenDecision).toHaveBeenLastCalledWith('risk');
    expect(onOpenDecision).toHaveBeenCalledTimes(2);
  });

  it('offers no open shortcut without a host to open in', () => {
    render(graph());
    expect(toggle('risk')).not.toHaveAttribute('aria-keyshortcuts');
    expect(screen.getByTestId('graph-reference-link-pricing-risk')).not.toHaveAttribute(
      'aria-keyshortcuts'
    );
  });
});

describe('DecisionGraphText mark clicks', () => {
  const scrolled = () => {
    const scroller = screen.getByTestId('graph-scroller');
    scroller.scrollTop = 240;
    return () => ({
      scrollTop: scroller.scrollTop,
      scrollTo: scrollToSpy.mock.calls.length,
      scrollIntoView: scrollIntoViewSpy.mock.calls.length,
    });
  };
  const UNMOVED = { scrollTop: 240, scrollTo: 0, scrollIntoView: 0 };

  it.each([
    'mouse',
    'touch',
  ] as const)('opens and flashes the rule a heading mark names on a %s click without scrolling or moving focus', async (pointerType) => {
    const onReveal = vi.fn();
    render(<SelectingHost onReveal={onReveal} />);
    const scrollNow = scrolled();
    const mark = screen.getByTestId('graph-mark-eligibility');
    const user = userEvent.setup();
    if (pointerType === 'touch') await user.pointer({ keys: '[TouchA]', target: mark });
    else await user.click(mark);
    expect(body('eligibility')).not.toBeNull();
    expect(scrollNow()).toEqual(UNMOVED);
    expect(onReveal).not.toHaveBeenCalled();
    expect(document.activeElement).toBe(mark);
  });

  it('flashes the decision when the rule its mark names is outside the mounted window', async () => {
    const animate = vi.fn();
    HTMLElement.prototype.animate = animate;
    const farMark = (nodes: readonly DecisionGraphNode[]): DecisionGraphNode[] =>
      nodes.map((node) =>
        node.kind === 'reference'
          ? node
          : {
              ...node,
              mark: node.mark?.kind === 'rule' ? { ...node.mark, rowId: 'r30' } : node.mark,
              children: farMark(node.children),
            }
      );
    render(<SelectingHost nodes={farMark(MARKED.nodes)} />);
    const scrollNow = scrolled();
    await userEvent.click(screen.getByTestId('graph-mark-risk'));
    expect(screen.queryByTestId('text-risk-row-r30')).toBeNull();
    await act(() => new Promise((resolve) => requestAnimationFrame(resolve)));
    expect(animate.mock.contexts).toContain(screen.getByTestId('graph-decision-risk'));
    expect(scrollNow()).toEqual(UNMOVED);
  });

  it('still reveals from the keyboard after a click on the same mark', async () => {
    render(<SelectingHost />);
    const mark = screen.getByTestId('graph-mark-eligibility');
    await userEvent.click(mark);
    expect(scrollIntoViewSpy).not.toHaveBeenCalled();
    await press(mark);
    expect(scrollIntoViewSpy).toHaveBeenCalled();
    expect(document.activeElement).toBe(screen.getByTestId('text-eligibility-row-r3'));
  });
});
