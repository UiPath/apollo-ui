import { cleanup, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';
import { SHARED_DEPENDENCY, tableOf } from './__fixtures__/decisionGraph.fixtures';
import { tableColumns, wordedRules } from './__fixtures__/editableSentences.fixtures';
import {
  COLUMN_TYPES,
  GRID_SENTENCE_POLICY,
  HIT_POLICIES,
} from './__fixtures__/sentences.fixtures';
import type { FixtureGraphProps } from './__fixtures__/textMode';
import { DecisionGraphText } from './DecisionGraphText';
import type { SentenceCitation } from './sentenceTypes';

const CITATION: SentenceCitation = {
  kind: 'box',
  page: 4,
  box: { x: 1, y: 2, width: 3, height: 4 },
};

const firstId = () => SHARED_DEPENDENCY.nodes[0]?.id ?? '';
const firstLabel = () => {
  const node = SHARED_DEPENDENCY.nodes[0];
  return node?.kind === 'decision' ? node.label : '';
};

const graph = (props: Partial<FixtureGraphProps> = {}) => (
  <DecisionGraphText
    nodes={SHARED_DEPENDENCY.nodes}
    renderBody={() => ({ kind: 'other', content: null })}
    mode={{ kind: 'read', selected: null }}
    dataTestId="graph"
    {...props}
  />
);

beforeEach(() => {
  vi.stubGlobal('IntersectionObserver', undefined);
});
afterEach(() => {
  vi.unstubAllGlobals();
});

describe('DecisionGraphText citations', () => {
  afterEach(cleanup);

  it('shows no citation without citations', () => {
    render(graph());
    expect(screen.queryAllByRole('button', { name: /Open source/ })).toHaveLength(0);
  });

  it('puts a cited decision citation on its heading, hidden at rest', () => {
    render(
      graph({
        citations: {
          kind: 'cited',
          decisions: new Map([[firstId(), [CITATION]]]),
          onOpenCitation: vi.fn(),
        },
      })
    );
    const button = within(screen.getByTestId(`graph-decision-${firstId()}`)).getByTestId(
      `graph-citation-${firstId()}`
    );
    expect(button.getAttribute('aria-label')).toBe(`Open source of ${firstLabel()}, page 4`);
    expect(button.className).toContain('opacity-0');
    expect(within(button).queryByText('Page 4')).toBeNull();
    expect(screen.getAllByRole('button', { name: /Open source/ })).toHaveLength(1);
  });

  it('shows the page once the decision is selected and opens it on click', async () => {
    const onOpenCitation = vi.fn();
    const onToggle = vi.fn();
    render(
      graph({
        mode: { kind: 'read', selected: firstId() },
        expansion: { expanded: new Set(), onChange: onToggle },
        citations: {
          kind: 'cited',
          decisions: new Map([[firstId(), [CITATION]]]),
          onOpenCitation,
        },
      })
    );
    const button = screen.getByTestId(`graph-citation-${firstId()}`);
    expect(within(button).getByText('Page 4')).toBeTruthy();
    await userEvent.click(button);
    expect(onOpenCitation).toHaveBeenCalledTimes(1);
    expect(onOpenCitation).toHaveBeenCalledWith(CITATION);
    expect(onToggle).not.toHaveBeenCalled();
  });

  it('leaves focus where the host moved it on Enter', async () => {
    const viewer = document.createElement('button');
    document.body.append(viewer);
    render(
      graph({
        mode: { kind: 'read', selected: firstId() },
        citations: {
          kind: 'cited',
          decisions: new Map([[firstId(), [CITATION]]]),
          onOpenCitation: () => viewer.focus(),
        },
      })
    );
    screen.getByTestId(`graph-citation-${firstId()}`).focus();
    await userEvent.keyboard('{Enter}');
    expect(document.activeElement).toBe(viewer);
    viewer.remove();
  });

  it('shows a folded decision citation on a touch screen', () => {
    render(
      graph({
        citations: {
          kind: 'cited',
          decisions: new Map([[firstId(), [CITATION]]]),
          onOpenCitation: vi.fn(),
        },
      })
    );
    expect(screen.getByTestId(`graph-citation-${firstId()}`).className).toContain(
      '[@media(hover:none)]:opacity-100'
    );
  });

  it('shows one button per citation of a decision', async () => {
    const onOpenCitation = vi.fn();
    const other: SentenceCitation = { kind: 'page', page: 9 };
    render(
      graph({
        citations: {
          kind: 'cited',
          decisions: new Map([[firstId(), [CITATION, other]]]),
          onOpenCitation,
        },
      })
    );
    const heading = within(screen.getByTestId(`graph-decision-${firstId()}`));
    expect(heading.getAllByRole('button', { name: /Open source/ })).toHaveLength(2);
    await userEvent.click(
      heading.getByRole('button', { name: `Open source of ${firstLabel()}, page 9` })
    );
    expect(onOpenCitation).toHaveBeenCalledWith(other);
  });

  it('puts the table body citations and mark on its card heading, the mark last', () => {
    const table = tableOf(2);
    render(
      graph({
        renderBody: (id) => ({
          kind: 'table',
          text: {
            table: {
              rules: wordedRules(table),
              ...tableColumns(table),
              hitPolicy: GRID_SENTENCE_POLICY,
            },
            hitPolicies: HIT_POLICIES,
            columnTypes: COLUMN_TYPES,
            ariaLabel: `Rules of ${id}`,
            dataTestId: `text-${id}`,
            mode: { kind: 'read', selected: null },
            citations: {
              kind: 'cited',
              decision: [CITATION],
              rules: new Map(),
              onOpenCitation: vi.fn(),
            },
            headerMark: { tone: 'error', title: 'Broken', glyph: true },
          },
        }),
      })
    );
    const heading = screen.getByTestId(`graph-toggle-${firstId()}`).parentElement;
    expect(
      within(screen.getByTestId(`graph-decision-${firstId()}`)).getByTestId(
        `graph-citation-${firstId()}`
      )
    ).toBeTruthy();
    expect(heading?.lastElementChild).toBe(screen.getByTestId(`graph-mark-${firstId()}`));
  });

  it.each([
    ['warning', 'error', 'Broken', { kind: 'decision' }],
    ['error', 'warning', 'Overlap', { kind: 'rule', rowId: 'r1' }],
  ] as const)('heads a card with a %s node mark and a %s table mark by the more severe one, and reveals what it shows', async (nodeTone, tableTone, shown, target) => {
    const onReveal = vi.fn();
    const table = tableOf(2);
    const nodes = SHARED_DEPENDENCY.nodes.map((node, index) =>
      index === 0 && node.kind === 'decision'
        ? {
            ...node,
            mark: {
              kind: 'rule' as const,
              rowId: 'r1',
              mark: { tone: nodeTone, title: 'Overlap', glyph: true as const },
            },
          }
        : node
    );
    render(
      graph({
        nodes,
        renderBody: () => ({
          kind: 'table',
          text: {
            table: {
              rules: wordedRules(table),
              ...tableColumns(table),
              hitPolicy: GRID_SENTENCE_POLICY,
            },
            hitPolicies: HIT_POLICIES,
            columnTypes: COLUMN_TYPES,
            ariaLabel: 'Rules',
            dataTestId: 'text',
            mode: { kind: 'read', selected: null },
            headerMark: { tone: tableTone, title: 'Broken', glyph: true },
          },
        }),
        mode: { kind: 'select', selected: null, onReveal },
      })
    );
    expect(screen.getByTestId(`graph-mark-${firstId()}`)).toHaveAttribute('data-mark-title', shown);
    screen.getByTestId(`graph-mark-${firstId()}`).focus();
    await userEvent.keyboard('{Enter}');
    expect(onReveal).toHaveBeenCalledWith({ ...target, decisionId: firstId() });
  });

  it('draws no second frame around a table body inside its card', async () => {
    const table = tableOf(2);
    render(
      graph({
        mode: { kind: 'read', selected: firstId() },
        expansion: { expanded: new Set([firstId()]), onChange: vi.fn() },
        renderBody: (id) => ({
          kind: 'table',
          text: {
            table: {
              rules: wordedRules(table),
              ...tableColumns(table),
              hitPolicy: GRID_SENTENCE_POLICY,
            },
            hitPolicies: HIT_POLICIES,
            columnTypes: COLUMN_TYPES,
            ariaLabel: `Rules of ${id}`,
            dataTestId: `text-${id}`,
            mode: { kind: 'read', selected: null },
          },
        }),
      })
    );
    expect((await screen.findByTestId(`text-${firstId()}-column`)).className).not.toMatch(
      /\bborder\b/
    );
  });
});
