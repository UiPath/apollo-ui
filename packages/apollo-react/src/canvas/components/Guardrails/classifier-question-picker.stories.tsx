import type { Meta, StoryObj } from '@storybook/react-vite';
import { TooltipProvider } from '@uipath/apollo-wind';
import { useState } from 'react';
import { CLASSIFIER_QUESTIONS_WIRE } from './__fixtures__/classifier-questions.fixtures';
import { ClassifierQuestionPicker } from './classifier-question-picker';
import { useClassifierQuestions } from './use-classifier-questions';

const PARAMETER = {
  id: 'selectedQuestions',
  type: 'enum-list' as const,
  label: 'Predefined questions',
  tooltip: 'Curated questions grouped by category. Pick any across categories.',
  required: false,
  defaultValue: [],
};

const meta = {
  title: 'Components/UiPath/Classifier Question Picker',
  component: ClassifierQuestionPicker,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component: `
The classifier guardrail's predefined questions, by category. A selected yes/no question takes a
Strictness slider; a selected score question takes the severity it flags from. Controlled through
selectedQuestions, questionThresholds and one onChange; useClassifierGuardrailParameters mounts it
inside GuardrailBuilder.
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
} satisfies Meta<typeof ClassifierQuestionPicker>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Keeps both values in state and shows what would be saved. */
function PickerHost({ initial = [], error }: { initial?: string[]; error?: string }) {
  const { categories } = useClassifierQuestions(null, { questions: CLASSIFIER_QUESTIONS_WIRE });
  const [value, setValue] = useState({
    selectedQuestions: initial,
    questionThresholds: {} as Record<string, number>,
  });
  return (
    <div className="space-y-4">
      <ClassifierQuestionPicker
        parameter={PARAMETER}
        categories={categories}
        selectedQuestions={value.selectedQuestions}
        questionThresholds={value.questionThresholds}
        error={error}
        onChange={(selectedQuestions, questionThresholds) =>
          setValue({ selectedQuestions, questionThresholds })
        }
      />
      <pre className="overflow-x-auto rounded-md bg-muted p-2 text-xs">
        {JSON.stringify(value, null, 2)}
      </pre>
    </div>
  );
}

const ARGS = {
  parameter: PARAMETER,
  categories: [],
  selectedQuestions: [],
  questionThresholds: {},
  onChange: () => {},
};

export const Empty: Story = { args: ARGS, render: () => <PickerHost /> };

/** One question of each kind. Open PII and Harmful content to tune them. */
export const MixedSelection: Story = {
  args: ARGS,
  render: () => <PickerHost initial={['pii_contact_information', 'harmful_hate']} />,
};

/** The message Save shows when no question is picked or added. */
export const WithError: Story = {
  args: ARGS,
  render: () => <PickerHost error="Pick at least one question or add your own." />,
};
