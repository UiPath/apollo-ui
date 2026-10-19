import type { Meta, StoryObj } from '@storybook/react-vite';
import { TooltipProvider } from '@uipath/apollo-wind';
import { type ComponentProps, useState } from 'react';
import { ClassifierCustomQuestionsEditor } from './classifier-custom-questions-editor';
import { readClassifierCustomQuestions, writeClassifierCustomQuestions } from './classifier-utils';
import type { GuardrailValidatorParameter } from './types';

const TOOLTIP =
  "Yes/no questions about the payload, where 'yes' means the payload should be flagged. Added on top of any predefined questions you selected.";

const meta = {
  title: 'Components/UiPath/Classifier Custom Questions Editor',
  component: ClassifierCustomQuestionsEditor,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component: `
The classifier guardrail's own questions. Each row is a yes/no question where yes flags, its
Strictness, and optional definitions of what counts as yes and as no, which the classifier
anchors its calibration on.

The rows persist as the questions text-list plus sidecar parameters keyed by position:
questionCriteriaTrue.{i}, questionCriteriaFalse.{i} and questionThreshold.{i}, the last omitted
at the default 0.5. readClassifierCustomQuestions and writeClassifierCustomQuestions do that
mapping; the stories below show what each edit writes. A row stays on screen while its question
is blank, but persists only once it holds one.
        `,
      },
    },
  },
  tags: ['autodocs'],
  decorators: [
    (Story) => (
      <TooltipProvider>
        <div className="w-[640px]">
          <Story />
        </div>
      </TooltipProvider>
    ),
  ],
} satisfies Meta<typeof ClassifierCustomQuestionsEditor>;

export default meta;
type Story = StoryObj<typeof meta>;

const noop = () => {};

type HostProps = { initial: GuardrailValidatorParameter[] } & Omit<
  ComponentProps<typeof ClassifierCustomQuestionsEditor>,
  'rows' | 'onRowsChange' | 'label'
>;

/** Persists through the sidecar helpers, and shows the parameters each edit writes. */
function EditorHost({ initial, ...props }: HostProps) {
  const [parameters, setParameters] = useState(initial);
  return (
    <div className="space-y-4">
      <ClassifierCustomQuestionsEditor
        maxItems={10}
        maxLength={500}
        {...props}
        rows={readClassifierCustomQuestions(parameters)}
        label="Your questions"
        tooltip={TOOLTIP}
        onRowsChange={(rows) => setParameters((p) => writeClassifierCustomQuestions(p, rows))}
      />
      <pre className="overflow-x-auto rounded-md bg-muted p-2 text-xs">
        {JSON.stringify(parameters, null, 2)}
      </pre>
    </div>
  );
}

const ARGS = { rows: [], onRowsChange: noop, label: 'Your questions' };

/** No question yet. Add starts a row. */
export const Empty: Story = {
  args: ARGS,
  render: () => <EditorHost initial={[]} />,
};

/** Two questions: one with a definition of yes, one tuned more lenient. */
export const WithQuestions: Story = {
  args: ARGS,
  render: () => (
    <EditorHost
      initial={[
        {
          $parameterType: 'text-list',
          id: 'questions',
          value: ['Does the reply promise a refund?', 'Is the reply rude to the customer?'],
        },
        {
          $parameterType: 'text',
          id: 'questionCriteriaTrue.0',
          value: 'The content commits to a refund.',
        },
        { $parameterType: 'number', id: 'questionThreshold.1', value: 0.8 },
      ]}
    />
  ),
};

/** The definition's cap reached: Add is gone. */
export const AtTheCap: Story = {
  args: ARGS,
  render: () => (
    <EditorHost
      maxItems={2}
      initial={[
        {
          $parameterType: 'text-list',
          id: 'questions',
          value: ['Does the reply promise a refund?', 'Is the reply rude to the customer?'],
        },
      ]}
    />
  ),
};
