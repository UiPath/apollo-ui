import { act, cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe } from 'jest-axe';
import { useState } from 'react';
import { createRoot } from 'react-dom/client';
import { vi } from 'vitest';
import {
  CYCLE,
  MARKED,
  NOT_A_TABLE,
  SHARED_DEPENDENCY,
  tableOf,
} from './__fixtures__/decisionGraph.fixtures';
import { tableColumns, wordedRules } from './__fixtures__/editableSentences.fixtures';
import { DecisionGraphText, type DecisionGraphTextProps } from './DecisionGraphText';
import type { DecisionGraphNode, DecisionGraphTarget } from './decisionGraphTypes';
import { DecisionText } from './DecisionText';
import type { DecisionTextEdit } from './decisionTextTypes';
import type { SentenceSelection, SentenceValueId } from './sentenceTypes';
import type { DecisionTextScroll } from './useRuleWindow';

vi.unmock('@uipath/apollo-wind/components/ui/tooltip');

const TABLE = tableOf(30);
const RULES = wordedRules(TABLE);

const textBody = (
  decisionId: string,
  scroll: DecisionTextScroll,
  selected: SentenceSelection | null = null,
  onSelect?: (selection: SentenceSelection | null) => void,
  edit?: DecisionTextEdit
) => (
  <DecisionText
    rules={RULES}
    {...tableColumns(TABLE)}
    header={{ label: 'Unique', hint: '' }}
    ariaLabel={`Rules of ${decisionId}`}
    dataTestId={`text-${decisionId}`}
    scroll={scroll}
    {...(onSelect ? { selected, onSelect, edit } : { selected })}
  />
);

const graph = (props: Partial<DecisionGraphTextProps> = {}) => (
  <DecisionGraphText
    nodes={SHARED_DEPENDENCY.nodes}
    renderBody={(id, scroll) => textBody(id, scroll)}
    dataTestId="graph"
    {...props}
  />
);

const toggle = (id: string) => screen.getByTestId(`graph-toggle-${id}`);
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
      renderBody={(id, scroll) =>
        textBody(id, scroll, selected?.id === id ? { rowId: selected.rowId } : null, () => {})
      }
      selected={selected?.id ?? null}
      onReveal={(target) => {
        onReveal?.(target);
        if (target.rowId) setSelected({ id: target.decisionId, rowId: target.rowId });
      }}
      dataTestId="graph"
    />
  );
};

let scrollToSpy: ReturnType<typeof vi.fn>;
beforeEach(() => {
  scrollToSpy = vi.fn();
  HTMLElement.prototype.scrollTo = scrollToSpy as unknown as HTMLElement['scrollTo'];
});
afterEach(cleanup);

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
    const onExpandedChange = vi.fn();
    render(graph({ expanded: new Set(['pricing']), onExpandedChange }));
    expect(body('pricing')).not.toBeNull();
    await userEvent.click(toggle('risk'));
    expect(onExpandedChange).toHaveBeenCalledWith(new Set(['pricing', 'risk']));
    expect(body('risk')).toBeNull();
  });

  it('links a decision drawn elsewhere, opening it and bringing it to the top without moving focus', async () => {
    const onReveal = vi.fn();
    render(graph({ onReveal }));
    const link = screen.getByTestId('graph-reference-link-pricing-risk');
    expect(screen.getByTestId('graph-reference-pricing-risk')).toHaveTextContent('See Risk above');
    await userEvent.click(link);
    expect(body('risk')).not.toBeNull();
    expect(onReveal).toHaveBeenCalledWith({ decisionId: 'risk', rowId: undefined });
    expect(scrollToSpy).toHaveBeenCalledTimes(1);
    expect(scrollToSpy.mock.contexts[0]).toBe(screen.getByTestId('graph-scroller'));
    expect(document.activeElement).toBe(link);
  });

  it('brings an open decision to the top again from its link', async () => {
    render(graph({ expanded: new Set(['risk']) }));
    await userEvent.click(screen.getByTestId('graph-reference-link-pricing-risk'));
    expect(scrollToSpy).toHaveBeenCalledTimes(1);
  });

  it('ends a cycle in a link back to its start', () => {
    render(graph({ nodes: CYCLE.nodes }));
    expect(screen.getByTestId('graph-reference-limit-approval')).toHaveTextContent(
      'See Approval above'
    );
  });

  it('shows what the host gives for a decision that is not a table', async () => {
    render(
      graph({
        nodes: NOT_A_TABLE.nodes,
        renderBody: (id) => <p>{String(NOT_A_TABLE.bodies[id])}</p>,
      })
    );
    expect(screen.queryByTestId('graph-rule-count-discount')).toBeEmptyDOMElement();
    await userEvent.click(toggle('discount'));
    expect(body('discount')).toHaveTextContent("isn't a decision table");
  });

  it('opens a marked decision on the rule its mark names, focused and centred', async () => {
    const onReveal = vi.fn();
    render(<SelectingHost onReveal={onReveal} />);
    const mark = screen.getByTestId('graph-mark-eligibility');
    expect(mark).toHaveAccessibleName('Error: Rules 1 and 3 overlap. Show it');
    await userEvent.click(mark);
    expect(onReveal).toHaveBeenCalledWith({ decisionId: 'eligibility', rowId: 'r3' });
    expect(document.activeElement).toBe(screen.getByTestId('text-eligibility-row-r3'));
    expect(scrollToSpy).toHaveBeenCalled();
  });

  it('reveals a rule outside the mounted window once the host selects it', async () => {
    render(<SelectingHost />);
    await userEvent.click(screen.getByTestId('graph-mark-risk'));
    expect(document.activeElement).toBe(screen.getByTestId('text-risk-row-r20'));
  });

  it('leaves keys typed in a body to the body', async () => {
    const user = userEvent.setup();
    render(
      graph({
        expanded: undefined,
        renderBody: () => <input aria-label="Inside" />,
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
        expanded: new Set(['pricing']),
        renderBody: () => <button type="button">Inside</button>,
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
    const edit: DecisionTextEdit = {
      editing,
      onCommit: vi.fn(),
      onCancel,
      onClearCell: vi.fn(),
      onDeleteRule: vi.fn(),
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
            expanded={expanded}
            onExpandedChange={setExpanded}
            onFold={(decisionId) => {
              onFold(decisionId);
              edit.onCancel?.();
            }}
            renderBody={(id, scroll) =>
              textBody(id, scroll, { rowId: 'r1', columnId: 'age' }, () => {}, edit)
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
    const given: { id: string; container: HTMLElement | null | undefined }[] = [];
    await act(async () =>
      root.render(
        graph({
          expanded: new Set(['risk']),
          renderBody: (id, scroll) => {
            given.push({ id, container: scroll.container });
            return textBody(id, scroll);
          },
        })
      )
    );
    const scroller = shadow.querySelector('[data-testid="graph-scroller"]');
    expect(scroller).not.toBeNull();
    expect(given).toEqual([{ id: 'risk', container: scroller }]);
    expect(shadow.querySelector('[data-testid="text-risk"]')).not.toBeNull();
    const link = shadow.querySelector<HTMLElement>(
      '[data-testid="graph-reference-link-pricing-risk"]'
    );
    await act(async () => link?.click());
    expect(scrollToSpy.mock.contexts[0]).toBe(scroller);
    act(() => root.unmount());
    host.remove();
  });

  it('has no axe violations, folded and open', async () => {
    const { container, rerender } = render(graph());
    expect(await axe(container)).toHaveNoViolations();
    rerender(graph({ expanded: new Set(['eligibility', 'risk']) }));
    expect(await axe(container)).toHaveNoViolations();
  });
});
