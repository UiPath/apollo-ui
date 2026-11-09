import type { Meta, StoryObj } from '@storybook/react';
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
import type { SentenceCellId } from './sentenceTypes';

const DemoDecisionText = (props: Partial<DecisionTextProps>) => {
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
      <p className="text-xs text-foreground-de-emp">
        Hovered cell: {hovered ? `${hovered.rowId} / ${hovered.columnId}` : 'none'}
      </p>
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
  render: () => <DemoDecisionText />,
};

export const WithMarks: Story = {
  render: () => (
    <DemoDecisionText
      rules={MULTI_SENTENCE_RULES}
      bands={MULTI_SENTENCE_BANDS}
      header={MULTI_SENTENCE_HEADER}
      numbered
      marks={DEMO_MARKS}
    />
  ),
};

export const Empty: Story = {
  render: () => (
    <div className="grid grid-cols-2 gap-4">
      <DemoDecisionText rules={[]} addRule={{ label: 'Add rule', onAdd: () => {} }} />
      <DemoDecisionText rules={[]} ariaLabel="Rules without an add action" />
    </div>
  ),
};

const LONG_LIST = [longValueListRule(10_000)];

export const LongValueList: Story = {
  render: () => (
    <DemoDecisionText
      rules={LONG_LIST}
      bands={MULTI_SENTENCE_BANDS}
      header={MULTI_SENTENCE_HEADER}
    />
  ),
};

const MANY_RULES = manySentenceRules(50_000);

export const ManyRules: Story = {
  render: () => (
    <DemoDecisionText
      rules={MANY_RULES}
      bands={MULTI_SENTENCE_BANDS}
      header={MULTI_SENTENCE_HEADER}
      numbered
    />
  ),
};

const MANY_COLUMNS = manyColumnBands(50);
const MANY_LINES = [manyLinesRule(50)];

export const ManyColumns: Story = {
  render: () => (
    <DemoDecisionText bands={MANY_COLUMNS} rules={MANY_LINES} header={MULTI_SENTENCE_HEADER} />
  ),
};
