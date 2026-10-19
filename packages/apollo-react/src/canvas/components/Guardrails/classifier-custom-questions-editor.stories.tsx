import type { Meta, StoryObj } from '@storybook/react-vite';
import { TooltipProvider } from '@uipath/apollo-wind';
import { useState } from 'react';
import { ClassifierCustomQuestionsEditor } from './classifier-custom-questions-editor';
import { readClassifierCustomQuestions, writeClassifierCustomQuestions } from './classifier-utils';
import type { GuardrailValidatorParameter } from './types';

const PARAMETER = {
  id: 'questions',
  type: 'text-list' as const,
  label: 'Your questions',
  tooltip: "Yes/no questions about the payload, where 'yes' means the payload should be flagged.",
  required: false,
  defaultValue: [],
  maxItems: 10,
  maxLength: 500,
};

const meta = {
  title: 'Components/UiPath/Classifier Custom Questions Editor',
  component: ClassifierCustomQuestionsEditor,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component: `
The classifier guardrail's own questions, each with its Strictness and optional definitions of yes
and no. They persist as the questions list plus position-keyed sidecars, through
readClassifierCustomQuestions and writeClassifierCustomQuestions; the stories show what each edit
writes.
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

function EditorHost({ initial }: { initial: GuardrailValidatorParameter[] }) {
  const [parameters, setParameters] = useState(initial);
  return (
    <div className="space-y-4">
      <ClassifierCustomQuestionsEditor
        parameter={PARAMETER}
        rows={readClassifierCustomQuestions(parameters)}
        onRowsChange={(rows) => setParameters((p) => writeClassifierCustomQuestions(p, rows))}
      />
      <pre className="overflow-x-auto rounded-md bg-muted p-2 text-xs">
        {JSON.stringify(parameters, null, 2)}
      </pre>
    </div>
  );
}

const ARGS = { parameter: PARAMETER, rows: [], onRowsChange: () => {} };

export const Empty: Story = { args: ARGS, render: () => <EditorHost initial={[]} /> };

/** One question with a definition of yes, one tuned more lenient. */
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
        { $parameterType: 'text', id: 'questionCriteriaTrue.0', value: 'A refund is promised.' },
        { $parameterType: 'number', id: 'questionThreshold.1', value: 0.8 },
      ]}
    />
  ),
};
