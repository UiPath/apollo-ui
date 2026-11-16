import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import {
  MULTI_SENTENCE_COLUMNS,
  MULTI_SENTENCE_HEADER,
  manySentenceRules,
} from './__fixtures__/sentences.fixtures';
import { DecisionText } from './DecisionText';
import type { SentenceSelection } from './sentenceTypes';
import type { DecisionTextScroll } from './useRuleWindow';

const RULES = manySentenceRules(300);
const IDS = ['first', 'second', 'third'] as const;

const StackedHost = ({ scroll }: { scroll: DecisionTextScroll }) => {
  const [selected, setSelected] = useState<Record<string, SentenceSelection | null>>({});
  return (
    <div
      className="h-[600px] scroll-pt-4 overflow-auto border border-border-de-emp"
      data-testid="stacked-scroller"
    >
      {IDS.map((id) => (
        <div key={id} className="flex flex-col" data-testid={`stacked-${id}`}>
          <DecisionText
            rules={RULES}
            {...MULTI_SENTENCE_COLUMNS}
            header={MULTI_SENTENCE_HEADER}
            ariaLabel={`Rules of ${id}`}
            dataTestId={`text-${id}`}
            numbered
            scroll={scroll}
            selected={selected[id] ?? null}
            onSelect={(next) => setSelected((current) => ({ ...current, [id]: next }))}
          />
        </div>
      ))}
    </div>
  );
};

const meta: Meta = {
  title: 'Decision Text/Stacked',
  parameters: { layout: 'padded' },
};
export default meta;

export const OwnFrames: StoryObj = { render: () => <StackedHost scroll="self" /> };

export const OnePageScrolls: StoryObj = { render: () => <StackedHost scroll="ancestor" /> };
