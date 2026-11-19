import type { Meta, StoryObj } from '@storybook/react';
import { useEffect, useMemo, useState } from 'react';
import {
  CYCLE,
  EMPTY_GRAPH,
  type GraphBody,
  type GraphFixture,
  largeGraph,
  MARKED,
  NOT_A_TABLE,
  SHARED_DEPENDENCY,
  SINGLE_DECISION,
} from './__fixtures__/decisionGraph.fixtures';
import { type EditableTable, wordedRules } from './__fixtures__/editableSentences.fixtures';
import {
  fixtureActions,
  graphOf,
  nodesOf,
  wordFixtureRefusal,
} from './__fixtures__/graphActionsHost';
import { COLUMN_TYPES, HIT_POLICIES } from './__fixtures__/sentences.fixtures';
import {
  type HostMode,
  type StoryGraphBody,
  type StoryTable,
  storyHeadingOf,
  storyTableOf,
  storyTableProps,
} from './__fixtures__/storyTableHost';
import { useStoryHistory } from './__fixtures__/useStoryHistory';
import { DecisionGraphText } from './DecisionGraphText';
import type {
  DecisionGraphCitations,
  DecisionGraphNode,
  DecisionGraphTarget,
} from './decisionGraphTypes';
import { liveSelection, sameSelection, selectedColumnOf } from './sentenceSelection';
import type { SentenceCitation, SentenceSelection, SentenceValueId } from './sentenceTypes';

interface GraphSelection {
  decisionId: string;
  selection: SentenceSelection | null;
}

interface GraphHostProps {
  graph: GraphFixture;
  mode?: HostMode;
  caption: string;
  cited: boolean;
}

const isTable = (body: GraphBody | undefined): body is EditableTable => typeof body === 'object';

const drawnIdsOf = (nodes: readonly DecisionGraphNode[]): string[] =>
  nodes.flatMap((node) =>
    node.kind === 'decision' ? [node.id, ...drawnIdsOf(node.children)] : []
  );

/** The table with each input linked only to a drawn decision other than its own. */
const linkedToDrawn = (
  decisionId: string,
  table: EditableTable,
  drawn: ReadonlySet<string>
): EditableTable => ({
  ...table,
  inputs: table.inputs.map(({ producedBy, ...input }) =>
    producedBy !== undefined && producedBy !== decisionId && drawn.has(producedBy)
      ? { ...input, producedBy }
      : input
  ),
});

const tablesOf = ({ bodies }: GraphFixture): Readonly<Record<string, StoryTable>> =>
  Object.fromEntries(
    Object.entries(bodies).flatMap(([id, body]) =>
      isTable(body) ? [[id, storyTableOf(body)]] : []
    )
  );

/** The graph's nodes with each table's heading as the host's table has it now. */
const headedNodes = (
  nodes: readonly DecisionGraphNode[],
  tables: Readonly<Record<string, StoryTable>>
): DecisionGraphNode[] =>
  nodes.map((node) => {
    if (node.kind === 'reference') return node;
    const state = node.logic.kind === 'table' ? tables[node.id] : undefined;
    return {
      ...node,
      ...(state ? storyHeadingOf(state) : {}),
      children: headedNodes(node.children, tables),
    };
  });

const GraphHost = ({ graph, mode = 'edit', caption, cited }: GraphHostProps) => {
  const { state: tables, set: setTables, onUndo, onRedo } = useStoryHistory(() => tablesOf(graph));
  const [selected, setSelected] = useState<GraphSelection | null>(null);
  const [editing, setEditing] = useState<{ decisionId: string; value: SentenceValueId } | null>(
    null
  );
  const [revealed, setRevealed] = useState<DecisionGraphTarget | null>(null);
  const [opened, setOpened] = useState<string | null>(null);
  const [moreProperties, setMoreProperties] = useState<string | null>(null);
  const [model, setModel] = useState(() => graphOf(graph.nodes));
  const nodes = useMemo(() => headedNodes(nodesOf(model), tables), [model, tables]);
  const rulesById = useMemo(() => {
    const drawn = new Set(drawnIdsOf(nodes));
    return new Map(
      Object.entries(tables).map(([id, { table }]) => [
        id,
        wordedRules(linkedToDrawn(id, table, drawn)),
      ])
    );
  }, [tables, nodes]);
  useEffect(() => {
    setSelected((current) => {
      if (!current) return current;
      const live = liveSelection(rulesById.get(current.decisionId) ?? [], current.selection);
      return sameSelection(live, current.selection)
        ? current
        : live && { ...current, selection: live };
    });
  }, [rulesById]);
  const [openedCitation, setOpenedCitation] = useState<SentenceCitation | null>(null);
  const citations = useMemo((): DecisionGraphCitations => {
    if (!cited) return { kind: 'none' };
    const [first, second] = drawnIdsOf(nodes);
    const box = { x: 72, y: 120, width: 420, height: 32 };
    const decisions = new Map<string, readonly SentenceCitation[]>();
    if (first)
      decisions.set(first, [
        { kind: 'block', page: 1, blockId: 4, box },
        { kind: 'page', page: 2 },
      ]);
    if (second) decisions.set(second, [{ kind: 'box', page: 3, box }]);
    return { kind: 'cited', decisions, onOpenCitation: setOpenedCitation };
  }, [cited, nodes]);
  const notes = [...model.decisions.values()].reduce((count, { notes }) => count + notes.length, 0);

  const isTableNow = (decisionId: string) =>
    model.decisions.get(decisionId)?.node.logic.kind === 'table';

  const renderBody = (decisionId: string): StoryGraphBody => {
    const table = isTableNow(decisionId);
    const state = table ? tables[decisionId] : undefined;
    if (!state) {
      const body = graph.bodies[decisionId];
      return {
        kind: 'other',
        content: (
          <p className="m-0 px-4 py-3 text-sm text-foreground-de-emp">
            {table
              ? 'Empty decision table'
              : typeof body === 'string'
                ? body
                : 'Literal expression'}
          </p>
        ),
      };
    }
    const shown = selected?.decisionId === decisionId ? selected.selection : null;
    const onSelect = (selection: SentenceSelection | null) =>
      setSelected(selection ? { decisionId, selection } : null);
    const { columns, hitPolicy, edit, onPolicyChange, onAddRule } = storyTableProps({
      state,
      onChange: (next) => setTables((current) => ({ ...current, [decisionId]: next })),
      onSelect,
      onMoreProperties: setMoreProperties,
    });
    return {
      kind: 'table',
      text: {
        table: { rules: rulesById.get(decisionId) ?? [], ...columns, hitPolicy },
        hitPolicies: HIT_POLICIES,
        columnTypes: COLUMN_TYPES,
        ariaLabel: `Rules of ${decisionId}`,
        dataTestId: `text-${decisionId}`,
        mode:
          mode === 'read'
            ? { kind: 'read', selected: shown }
            : mode === 'edit'
              ? {
                  kind: 'edit',
                  selected: shown,
                  onSelect,
                  onPolicyChange,
                  onAddRule,
                  onUndo,
                  onRedo,
                  edit: {
                    ...edit,
                    editing: editing?.decisionId === decisionId ? editing.value : null,
                    onStartEdit: (value: SentenceValueId) => setEditing({ decisionId, value }),
                    onCancel: () => setEditing(null),
                    onCommit: (...args: Parameters<typeof edit.onCommit>) => {
                      const refused = edit.onCommit(...args);
                      if (typeof refused !== 'string') setEditing(null);
                      return refused;
                    },
                  },
                }
              : { kind: 'select', selected: shown, onSelect },
      },
    };
  };

  const onReveal = (target: DecisionGraphTarget) => {
    setRevealed(target);
    if (target.kind === 'rule') {
      setSelected({
        decisionId: target.decisionId,
        selection: { kind: 'rule', rowId: target.rowId },
      });
    }
  };
  const selectedDecision = selected?.decisionId ?? null;

  return (
    <div className="flex flex-col gap-2">
      <div className="flex h-[640px] flex-col border border-border-de-emp">
        <DecisionGraphText
          citations={citations}
          nodes={nodes}
          renderBody={renderBody}
          onFold={(decisionId) => {
            if (editing?.decisionId === decisionId) setEditing(null);
          }}
          rules={(decisionId) => (isTableNow(decisionId) ? (rulesById.get(decisionId) ?? []) : [])}
          onOpenDecision={setOpened}
          mode={
            mode === 'edit'
              ? {
                  kind: 'edit',
                  selected: selectedDecision,
                  onReveal,
                  edit: {
                    actions: fixtureActions(model, setModel),
                    wordRefusal: wordFixtureRefusal,
                  },
                }
              : { kind: 'select', selected: selectedDecision, onReveal }
          }
          dataTestId="graph"
        />
      </div>
      <p className="text-xs text-foreground-de-emp" data-testid="graph-caption">
        Selected:{' '}
        {selected
          ? `${selected.decisionId} / ${selected.selection?.rowId ?? 'none'} / ${selectedColumnOf(selected.selection) ?? 'rule'}`
          : 'none'}{' '}
        · Revealed:{' '}
        {revealed
          ? `${revealed.decisionId} / ${revealed.kind === 'rule' ? revealed.rowId : 'decision'}`
          : 'none'}{' '}
        · Opened: {opened ?? 'none'} · More properties: {moreProperties ?? 'none'} · Notes: {notes}{' '}
        · Source: {openedCitation ? `page ${openedCitation.page}` : 'none'}
      </p>
      <p className="text-xs text-foreground-de-emp">{caption}</p>
      <p className="text-xs text-foreground-de-emp">
        Double-click a heading, or press Alt+Enter on it, to open that decision on its own. In edit
        mode each heading's menu renames, adds, links, moves and deletes decisions; on a heading, F2
        renames, Delete deletes and Alt+Shift+arrows move it.
      </p>
    </div>
  );
};

const meta: Meta = {
  title: 'Decision Graph Text',
  parameters: { layout: 'padded' },
};
export default meta;

const GRAPHS = {
  'shared dependency': {
    graph: SHARED_DEPENDENCY,
    caption: 'Risk is required by both Eligibility and Pricing: drawn once, linked from Pricing.',
  },
  'single decision': {
    graph: SINGLE_DECISION,
    caption: 'One decision, folded: open it to read its rules.',
  },
  cycle: {
    graph: CYCLE,
    caption: 'Approval requires Limit, which requires Approval: the loop ends in a link.',
  },
  'not a table': {
    graph: NOT_A_TABLE,
    caption: "Discount rate is a literal expression, so its body is the host's own text.",
  },
  empty: { graph: EMPTY_GRAPH, caption: 'A graph with no decisions.' },
} as const;

const MODE_ARG = {
  control: 'inline-radio',
  options: ['read', 'select', 'edit'],
  description: 'What the host wires: bodies only, then selection, then editing in place.',
} as const;

interface GraphArgs {
  mode: HostMode;
}

interface DefaultArgs extends GraphArgs {
  graph: keyof typeof GRAPHS;
}

export const Default: StoryObj<DefaultArgs> = {
  args: { graph: 'shared dependency', mode: 'edit' },
  argTypes: {
    graph: { control: 'select', options: Object.keys(GRAPHS) },
    mode: MODE_ARG,
  },
  render: ({ graph, mode }) => (
    <GraphHost
      cited={false}
      key={`${graph}-${mode}`}
      graph={GRAPHS[graph].graph}
      mode={mode}
      caption={GRAPHS[graph].caption}
    />
  ),
};

export const Editing: StoryObj = {
  render: () => (
    <GraphHost
      cited={false}
      graph={SHARED_DEPENDENCY}
      mode="edit"
      caption="Open a decision and edit its rules in place, as on its own: pick a value, add a rule, change the hit policy or a column; Ctrl+Z undoes and Ctrl+Shift+Z redoes."
    />
  ),
};

export const Errors: StoryObj<GraphArgs> = {
  args: { mode: 'edit' },
  argTypes: { mode: MODE_ARG },
  render: ({ mode }) => (
    <GraphHost
      cited={false}
      key={mode}
      graph={MARKED}
      mode={mode}
      caption="An error and a warning on the headings: a click on the glyph opens the decision and flashes the rule it names, in place; Enter on it brings the rule into view."
    />
  ),
};

const LARGE_GRAPH = largeGraph(50, 10);

export const LargeGraph: StoryObj<GraphArgs> = {
  args: { mode: 'edit' },
  argTypes: { mode: MODE_ARG },
  render: ({ mode }) => (
    <GraphHost
      cited={false}
      key={mode}
      graph={LARGE_GRAPH}
      mode={mode}
      caption="50 decisions and 500 rules: open the minimap top left, search, and pick a decision or a rule."
    />
  ),
};

export const Citations: StoryObj = {
  render: () => (
    <GraphHost
      cited
      graph={GRAPHS['shared dependency'].graph}
      mode="select"
      caption="The first decision has two sources and the second one: hover a heading for its source buttons, or select it to show their pages."
    />
  ),
};
