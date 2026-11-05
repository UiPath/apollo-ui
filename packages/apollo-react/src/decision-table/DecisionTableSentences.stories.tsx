import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import {
  GRID_SENTENCE_BANDS,
  GRID_SENTENCE_HEADER,
  GRID_SENTENCE_ROWS,
  longValueListRow,
  MULTI_SENTENCE_BANDS,
  MULTI_SENTENCE_HEADER,
  MULTI_SENTENCE_ROWS,
  manyColumnBands,
  manyLinesRow,
  manySentenceRows,
  SENTENCE_LABELS,
} from './__fixtures__/sentences.fixtures';
import { DecisionTableSentences, type DecisionTableSentencesProps } from './DecisionTableSentences';
import type { RowMark, TableMarks } from './marks';
import type { SentenceCellId } from './sentenceTypes';

const DemoSentences = (props: Partial<DecisionTableSentencesProps>) => {
  const [hovered, setHovered] = useState<SentenceCellId | null>(null);
  return (
    <div className="flex h-[480px] flex-col gap-2">
      <DecisionTableSentences
        rows={GRID_SENTENCE_ROWS}
        bands={GRID_SENTENCE_BANDS}
        header={GRID_SENTENCE_HEADER}
        labels={SENTENCE_LABELS}
        ariaLabel="Rules"
        dataTestId="sentences"
        onTokenHover={setHovered}
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

const meta: Meta<typeof DecisionTableSentences> = {
  title: 'Decision Table Sentences',
  component: DecisionTableSentences,
  parameters: { layout: 'padded' },
};
export default meta;

type Story = StoryObj<typeof DecisionTableSentences>;

export const Default: Story = {
  render: () => <DemoSentences />,
};

export const WithMarks: Story = {
  render: () => (
    <DemoSentences
      rows={MULTI_SENTENCE_ROWS}
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
      <DemoSentences rows={[]} onAddRow={() => {}} />
      <DemoSentences rows={[]} ariaLabel="Rules without an add action" />
    </div>
  ),
};

const LONG_LIST = [longValueListRow(10_000)];

export const LongValueList: Story = {
  render: () => (
    <DemoSentences rows={LONG_LIST} bands={MULTI_SENTENCE_BANDS} header={MULTI_SENTENCE_HEADER} />
  ),
};

const MANY_ROWS = manySentenceRows(50_000);

export const ManyRows: Story = {
  render: () => (
    <DemoSentences
      rows={MANY_ROWS}
      bands={MULTI_SENTENCE_BANDS}
      header={MULTI_SENTENCE_HEADER}
      numbered
    />
  ),
};

const MANY_COLUMNS = manyColumnBands(50);
const MANY_LINES = [manyLinesRow(50)];

export const ManyColumns: Story = {
  render: () => (
    <DemoSentences bands={MANY_COLUMNS} rows={MANY_LINES} header={MULTI_SENTENCE_HEADER} />
  ),
};
