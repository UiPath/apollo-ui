import type { Meta, StoryObj } from '@storybook/react';
import type React from 'react';
import { useState } from 'react';
import {
  DECISION_TEXT_LABELS,
  GRID_SENTENCE_BANDS,
  GRID_SENTENCE_HEADER,
  GRID_SENTENCE_RULES,
  longValueListRule,
  MULTI_SENTENCE_BANDS,
  MULTI_SENTENCE_HEADER,
  MULTI_SENTENCE_RULES,
  manyColumnBands,
  manyLinesRule,
  manySentenceRules,
} from './__fixtures__/sentences.fixtures';
import { DecisionText, type DecisionTextProps } from './DecisionText';
import type { RowMark, TableMarks } from './marks';
import type { SentenceCellId, SentenceSelection } from './sentenceTypes';

const selectionText = (selection: SentenceSelection | null) =>
  selection ? [selection.rowId, selection.columnId ?? 'rule'].join(' / ') : 'none';

const cellText = (cell: SentenceCellId | null) =>
  cell ? `${cell.rowId} / ${cell.columnId}` : 'none';

interface StoryCaptionProps {
  children: React.ReactNode;
}

const StoryCaption = ({ children }: StoryCaptionProps) => (
  <p className="text-xs text-foreground-de-emp">{children}</p>
);

interface ReadOnlyDemoProps extends Partial<DecisionTextProps> {
  caption: string;
}

/** A host that only shows the rules and reports the hovered cell. */
const ReadOnlyDemo = ({ caption, ...props }: ReadOnlyDemoProps) => {
  const [hovered, setHovered] = useState<SentenceCellId | null>(null);
  return (
    <div className="flex h-[480px] flex-col gap-2">
      <DecisionText
        rules={GRID_SENTENCE_RULES}
        bands={GRID_SENTENCE_BANDS}
        header={GRID_SENTENCE_HEADER}
        labels={DECISION_TEXT_LABELS}
        ariaLabel="Rules"
        dataTestId="decision-text"
        onCellHover={setHovered}
        {...props}
      />
      <StoryCaption>Hovered cell: {cellText(hovered)}</StoryCaption>
      <StoryCaption>{caption}</StoryCaption>
    </div>
  );
};

interface SelectionDemoProps extends Partial<DecisionTextProps> {
  caption: string;
  initialSelected?: SentenceSelection | null;
}

/** A host that owns the selection, as it owns the grid's. */
const SelectionDemo = ({ caption, initialSelected = null, ...props }: SelectionDemoProps) => {
  const [selected, setSelected] = useState(initialSelected);
  return (
    <div className="flex h-[480px] flex-col gap-2">
      <DecisionText
        rules={GRID_SENTENCE_RULES}
        bands={GRID_SENTENCE_BANDS}
        header={GRID_SENTENCE_HEADER}
        labels={DECISION_TEXT_LABELS}
        ariaLabel="Rules"
        dataTestId="decision-text"
        selected={selected}
        onSelect={setSelected}
        {...props}
      />
      <StoryCaption>Selected: {selectionText(selected)}</StoryCaption>
      <StoryCaption>{caption}</StoryCaption>
    </div>
  );
};

const DEMO_MARKS: TableMarks = {
  rows: new Map<string, RowMark>([
    [
      'm1',
      {
        cells: {
          debt: { tone: 'error', title: 'Not a number', glyph: true },
          country: { tone: 'warning', title: 'Overlaps row 2', glyph: true },
        },
      },
    ],
    [
      'm3',
      {
        cells: {
          score: { tone: 'warning', title: 'Overlaps row 4', glyph: true },
          channel: { tone: 'error', title: 'Unknown channel', glyph: true },
        },
      },
    ],
    ['m5', { tone: 'warning', title: 'Never reached', glyph: true }],
  ]),
  columns: new Map([['start', { tone: 'warning', title: 'No type', glyph: true }]]),
};

const meta: Meta<typeof DecisionText> = {
  title: 'Decision Text',
  component: DecisionText,
  parameters: { layout: 'padded' },
};
export default meta;

type Story = StoryObj<typeof DecisionText>;

export const Default: Story = {
  render: () => <ReadOnlyDemo caption="Read only: no selection and no editing." />,
};

export const WithMarks: Story = {
  render: () => (
    <ReadOnlyDemo
      rules={MULTI_SENTENCE_RULES}
      bands={MULTI_SENTENCE_BANDS}
      header={MULTI_SENTENCE_HEADER}
      numbered
      marks={DEMO_MARKS}
      caption="The grid's marks on values, rules and band columns. Each glyph's message is read with its line; a host shows it on hover from data-mark-title, as the grid's host does."
    />
  ),
};

export const Selection: Story = {
  render: () => (
    <div className="w-[420px]">
      <SelectionDemo
        numbered
        initialSelected={{ rowId: 'r2', columnId: 'income' }}
        caption="Click a value or a rule. Arrows, Home and End move, Tab walks a rule's values, Escape clears."
      />
    </div>
  ),
};

export const Empty: Story = {
  render: () => (
    <div className="grid grid-cols-2 gap-4">
      <ReadOnlyDemo
        rules={[]}
        addRule={{ label: 'Add rule', onAdd: () => {} }}
        caption="With addRule the empty state offers the add action."
      />
      <ReadOnlyDemo
        rules={[]}
        ariaLabel="Rules without an add action"
        dataTestId="decision-text-no-add"
        caption="Without addRule there is no add action."
      />
    </div>
  ),
};

const LONG_LIST = [longValueListRule(10_000)];

export const LongValueList: Story = {
  render: () => (
    <ReadOnlyDemo
      rules={LONG_LIST}
      bands={MULTI_SENTENCE_BANDS}
      header={MULTI_SENTENCE_HEADER}
      caption="A 10,000-value line shows its first 20 values and counts the rest."
    />
  ),
};

const MANY_RULES = manySentenceRules(50_000);

export const ManyRules: Story = {
  render: () => (
    <ReadOnlyDemo
      rules={MANY_RULES}
      bands={MULTI_SENTENCE_BANDS}
      header={MULTI_SENTENCE_HEADER}
      numbered
      caption="50,000 rules, windowed."
    />
  ),
};

const MANY_COLUMNS = manyColumnBands(50);
const MANY_LINES = [manyLinesRule(50)];

export const ManyColumns: Story = {
  render: () => (
    <SelectionDemo
      bands={MANY_COLUMNS}
      rules={MANY_LINES}
      header={MULTI_SENTENCE_HEADER}
      caption="50 band columns scroll on one line, and a 50-line rule is taller than the view."
    />
  ),
};
