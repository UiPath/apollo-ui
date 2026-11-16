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
import {
  type EditableTable,
  tableColumns,
  tableWithCondition,
  tableWithExpression,
  tableWithoutCell,
  tableWithoutRule,
  wordedRules,
} from './__fixtures__/editableSentences.fixtures';
import { DecisionGraphText, type DecisionGraphTextProps } from './DecisionGraphText';
import type { DecisionGraphTarget } from './decisionGraphTypes';
import { DecisionText } from './DecisionText';
import type { DecisionTextEdit } from './decisionTextTypes';
import type { SentenceSelection, SentenceValueId } from './sentenceTypes';

type HostMode = 'read' | 'select' | 'edit';

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

const GraphHost = ({ graph, mode = 'select', caption }: GraphHostProps) => {
  const [bodies, setBodies] = useState(graph.bodies);
  const [selected, setSelected] = useState<GraphSelection | null>(null);
  const [editing, setEditing] = useState<{ decisionId: string; value: SentenceValueId } | null>(
    null
  );
  const [revealed, setRevealed] = useState<DecisionGraphTarget | null>(null);
  const rulesById = useMemo(
    () =>
      new Map(
        Object.entries(bodies).flatMap(([id, body]) =>
          isTable(body) ? [[id, wordedRules(body)] as const] : []
        )
      ),
    [bodies]
  );

  const update = (decisionId: string, change: (table: EditableTable) => EditableTable) =>
    setBodies((current) => {
      const body = current[decisionId];
      return isTable(body) ? { ...current, [decisionId]: change(body) } : current;
    });

  const editOf = (decisionId: string): DecisionTextEdit => ({
    editing: editing?.decisionId === decisionId ? editing.value : null,
    onStartEdit: (value) => setEditing({ decisionId, value }),
    onCancel: () => setEditing(null),
    onCommit: (value, commit) => {
      update(decisionId, (table) =>
        commit.kind === 'values'
          ? tableWithCondition(table, value, commit)
          : tableWithExpression(table, value, commit.text)
      );
      setEditing(null);
    },
    onClearCell: (cell) => update(decisionId, (table) => tableWithoutCell(table, cell)),
    onDeleteRule: (rowId) => update(decisionId, (table) => tableWithoutRule(table, rowId)),
  });

  const renderBody: DecisionGraphTextProps['renderBody'] = (decisionId, scroll) => {
    const body = bodies[decisionId];
    if (!isTable(body)) {
      return <p className="m-0 px-4 py-3 text-sm text-foreground-de-emp">{body}</p>;
    }
    const shown = selected?.decisionId === decisionId ? selected.selection : null;
    const onSelect = (selection: SentenceSelection | null) =>
      setSelected(selection ? { decisionId, selection } : null);
    return (
      <DecisionText
        rules={rulesById.get(decisionId) ?? []}
        {...tableColumns(body)}
        header={{ label: 'Unique', hint: 'One rule matches at most' }}
        ariaLabel={`Rules of ${decisionId}`}
        dataTestId={`text-${decisionId}`}
        numbered
        scroll={scroll}
        {...(mode === 'read'
          ? { selected: shown }
          : {
              selected: shown,
              onSelect,
              edit: mode === 'edit' ? editOf(decisionId) : undefined,
            })}
      />
    );
  };

  return (
    <div className="flex flex-col gap-2">
      <div className="flex h-[640px] flex-col border border-border-de-emp">
        <DecisionGraphText
          nodes={graph.nodes}
          renderBody={renderBody}
          onFold={(decisionId) => {
            if (editing?.decisionId === decisionId) setEditing(null);
          }}
          selected={selected?.decisionId ?? null}
          onReveal={(target) => {
            setRevealed(target);
            if (target.rowId !== undefined && mode !== 'read') {
              setSelected({ decisionId: target.decisionId, selection: { rowId: target.rowId } });
            }
          }}
          dataTestId="graph"
        />
      </div>
      <p className="text-xs text-foreground-de-emp" data-testid="graph-caption">
        Selected:{' '}
        {selected
          ? `${selected.decisionId} / ${selected.selection?.rowId ?? 'none'} / ${selected.selection?.columnId ?? 'rule'}`
          : 'none'}{' '}
        · Revealed: {revealed ? `${revealed.decisionId} / ${revealed.rowId ?? 'decision'}` : 'none'}
      </p>
      <p className="text-xs text-foreground-de-emp">{caption}</p>
    </div>
  );
};

const meta: Meta<typeof DecisionGraphText> = {
  title: 'Decision Graph Text',
  component: DecisionGraphText,
  parameters: { layout: 'padded' },
};
export default meta;

type Story = StoryObj<typeof DecisionGraphText>;

export const Empty: Story = {
  render: () => <GraphHost graph={EMPTY_GRAPH} caption="A graph with no decisions." />,
};

export const SingleDecision: Story = {
  render: () => (
    <GraphHost graph={SINGLE_DECISION} caption="One decision, folded: open it to read its rules." />
  ),
};

export const SharedDependency: Story = {
  render: () => (
    <GraphHost
      graph={SHARED_DEPENDENCY}
      caption="Risk is required by both Eligibility and Pricing: drawn once, linked from Pricing."
    />
  ),
};

export const Cycle: Story = {
  render: () => (
    <GraphHost
      graph={CYCLE}
      caption="Approval requires Limit, which requires Approval: the loop ends in a link."
    />
  ),
};

export const NotATable: Story = {
  render: () => (
    <GraphHost
      graph={NOT_A_TABLE}
      caption="Discount rate is a literal expression, so its body is the host's own text."
    />
  ),
};

export const HeaderMarks: Story = {
  render: () => (
    <GraphHost
      graph={MARKED}
      caption="An error and a warning on the headings: the glyph opens the decision on the rule it names."
    />
  ),
};

export const ReadOnly: Story = {
  render: () => (
    <GraphHost graph={SHARED_DEPENDENCY} mode="read" caption="Bodies without selection." />
  ),
};

export const Editable: Story = {
  render: () => (
    <GraphHost
      graph={SHARED_DEPENDENCY}
      mode="edit"
      caption="Each open decision edits in place: click a value, change it, apply."
    />
  ),
};
