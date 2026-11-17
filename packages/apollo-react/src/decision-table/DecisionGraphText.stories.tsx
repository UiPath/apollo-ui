import type { Meta, StoryObj } from '@storybook/react';
import { useMemo, useState } from 'react';
import {
  CYCLE,
  EMPTY_GRAPH,
  type GraphBody,
  type GraphFixture,
  MARKED,
  NOT_A_TABLE,
  SHARED_DEPENDENCY,
  SINGLE_DECISION,
} from './__fixtures__/decisionGraph.fixtures';
import { type EditableTable, wordedRules } from './__fixtures__/editableSentences.fixtures';
import {
  type HostMode,
  type StoryTable,
  storyHeadingOf,
  storyTableOf,
  storyTableProps,
} from './__fixtures__/storyTableHost';
import { DecisionGraphText, type DecisionGraphTextProps } from './DecisionGraphText';
import type { DecisionGraphNode, DecisionGraphTarget } from './decisionGraphTypes';
import { DecisionText } from './DecisionText';
import type { SentenceSelection, SentenceValueId } from './sentenceTypes';

interface GraphSelection {
  decisionId: string;
  selection: SentenceSelection | null;
}

interface GraphHostProps {
  graph: GraphFixture;
  mode?: HostMode;
  caption: string;
}

const isTable = (body: GraphBody | undefined): body is EditableTable => typeof body === 'object';

const tablesOf = (bodies: GraphFixture['bodies']): Readonly<Record<string, StoryTable>> =>
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
    const state = tables[node.id];
    return {
      ...node,
      ...(state ? storyHeadingOf(state) : {}),
      children: headedNodes(node.children, tables),
    };
  });

const GraphHost = ({ graph, mode = 'edit', caption }: GraphHostProps) => {
  const [tables, setTables] = useState(() => tablesOf(graph.bodies));
  const [selected, setSelected] = useState<GraphSelection | null>(null);
  const [editing, setEditing] = useState<{ decisionId: string; value: SentenceValueId } | null>(
    null
  );
  const [revealed, setRevealed] = useState<DecisionGraphTarget | null>(null);
  const [opened, setOpened] = useState<string | null>(null);
  const [moreProperties, setMoreProperties] = useState<string | null>(null);
  const rulesById = useMemo(
    () => new Map(Object.entries(tables).map(([id, { table }]) => [id, wordedRules(table)])),
    [tables]
  );
  const nodes = useMemo(() => headedNodes(graph.nodes, tables), [graph.nodes, tables]);

  const renderBody: DecisionGraphTextProps['renderBody'] = (decisionId, scroll) => {
    const state = tables[decisionId];
    if (!state) {
      return (
        <p className="m-0 px-4 py-3 text-sm text-foreground-de-emp">
          {String(graph.bodies[decisionId] ?? '')}
        </p>
      );
    }
    const shown = selected?.decisionId === decisionId ? selected.selection : null;
    const onSelect = (selection: SentenceSelection | null) =>
      setSelected(selection ? { decisionId, selection } : null);
    const { columns, header, edit, policy, addRule } = storyTableProps({
      state,
      onChange: (next) => setTables((current) => ({ ...current, [decisionId]: next })),
      onSelect,
      onMoreProperties: setMoreProperties,
    });
    const editable = mode === 'edit';
    return (
      <DecisionText
        rules={rulesById.get(decisionId) ?? []}
        {...columns}
        header={header}
        ariaLabel={`Rules of ${decisionId}`}
        dataTestId={`text-${decisionId}`}
        numbered
        scroll={scroll}
        onOpenDecision={setOpened}
        policy={editable ? policy : undefined}
        addRule={editable ? addRule : undefined}
        {...(mode === 'read'
          ? { selected: shown }
          : {
              selected: shown,
              onSelect,
              edit: editable
                ? {
                    ...edit,
                    editing: editing?.decisionId === decisionId ? editing.value : null,
                    onStartEdit: (value: SentenceValueId) => setEditing({ decisionId, value }),
                    onCancel: () => setEditing(null),
                    onCommit: (...args: Parameters<typeof edit.onCommit>) => {
                      const refused = edit.onCommit(...args);
                      if (typeof refused !== 'string') setEditing(null);
                      return refused;
                    },
                  }
                : undefined,
            })}
      />
    );
  };

  return (
    <div className="flex flex-col gap-2">
      <div className="flex h-[640px] flex-col border border-border-de-emp">
        <DecisionGraphText
          nodes={nodes}
          renderBody={renderBody}
          onFold={(decisionId) => {
            if (editing?.decisionId === decisionId) setEditing(null);
          }}
          selected={selected?.decisionId ?? null}
          onReveal={(target) => {
            setRevealed(target);
            if (target.rowId !== undefined) {
              setSelected({ decisionId: target.decisionId, selection: { rowId: target.rowId } });
            }
          }}
          onOpenDecision={setOpened}
          dataTestId="graph"
        />
      </div>
      <p className="text-xs text-foreground-de-emp" data-testid="graph-caption">
        Selected:{' '}
        {selected
          ? `${selected.decisionId} / ${selected.selection?.rowId ?? 'none'} / ${selected.selection?.columnId ?? 'rule'}`
          : 'none'}{' '}
        · Revealed: {revealed ? `${revealed.decisionId} / ${revealed.rowId ?? 'decision'}` : 'none'}{' '}
        · Opened: {opened ?? 'none'} · More properties: {moreProperties ?? 'none'}
      </p>
      <p className="text-xs text-foreground-de-emp">{caption}</p>
      <p className="text-xs text-foreground-de-emp">
        Double-click a heading, or press Alt+Enter on it, to open that decision on its own.
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
      key={`${graph}-${mode}`}
      graph={GRAPHS[graph].graph}
      mode={mode}
      caption={GRAPHS[graph].caption}
    />
  ),
};

export const Errors: StoryObj<GraphArgs> = {
  args: { mode: 'edit' },
  argTypes: { mode: MODE_ARG },
  render: ({ mode }) => (
    <GraphHost
      key={mode}
      graph={MARKED}
      mode={mode}
      caption="An error and a warning on the headings: a click on the glyph opens the decision and flashes the rule it names, in place; Enter on it brings the rule into view."
    />
  ),
};
