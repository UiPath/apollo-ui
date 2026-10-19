import type { Meta, StoryObj } from '@storybook/react-vite';
import { TooltipProvider } from '@uipath/apollo-wind';
import { type ComponentProps, useState } from 'react';
import { CLASSIFIER_QUESTIONS_WIRE } from './__fixtures__/classifier-questions.fixtures';
import { ClassifierQuestionPicker } from './classifier-question-picker';
import { enrichClassifierQuestions } from './classifier-questions-enrich';

const CATEGORIES = enrichClassifierQuestions(CLASSIFIER_QUESTIONS_WIRE);

const TOOLTIP =
  'Curated questions grouped by category. Pick any across categories; score questions also take a severity cutoff. Add your own questions below.';

const meta = {
  title: 'Components/UiPath/Classifier Question Picker',
  component: ClassifierQuestionPicker,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component: `
The classifier guardrail's predefined questions, grouped by category. Search filters by question
text and opens every category with a match. Each category collapses, counts what is picked, and
selects or clears all of its questions at once.

A selected yes/no question takes a Strictness slider: lower flags more often. A selected score
question takes the severity it flags from, stored as level / (levels - 1). A question the user
never tunes stores nothing and runs at the backend's 0.5.

Controlled and resolves nothing: the host passes the catalog from useClassifierQuestions, the
selectedQuestions and questionThresholds values and the label, and gets both values back from one
onChange. Inside GuardrailBuilder, useClassifierGuardrailParameters mounts it for you.
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

const noop = () => {};

type HostProps = {
  initialSelected: string[];
  initialThresholds?: Record<string, number>;
} & Omit<
  ComponentProps<typeof ClassifierQuestionPicker>,
  'categories' | 'selectedQuestions' | 'questionThresholds' | 'onChange' | 'label'
>;

/** Keeps both values in state so the controls move, and shows what would be saved. */
function PickerHost({ initialSelected, initialThresholds = {}, ...props }: HostProps) {
  const [selected, setSelected] = useState(initialSelected);
  const [thresholds, setThresholds] = useState(initialThresholds);
  return (
    <div className="space-y-4">
      <ClassifierQuestionPicker
        {...props}
        categories={CATEGORIES}
        selectedQuestions={selected}
        questionThresholds={thresholds}
        label="Predefined questions"
        tooltip={TOOLTIP}
        onChange={(nextSelected, nextThresholds) => {
          setSelected(nextSelected);
          setThresholds(nextThresholds);
        }}
      />
      <pre className="overflow-x-auto rounded-md bg-muted p-2 text-xs">
        {JSON.stringify({ selectedQuestions: selected, questionThresholds: thresholds }, null, 2)}
      </pre>
    </div>
  );
}

const ARGS = {
  categories: CATEGORIES,
  selectedQuestions: [],
  questionThresholds: {},
  onChange: noop,
  label: 'Predefined questions',
};

/** Nothing picked yet: seven collapsed categories. */
export const Empty: Story = {
  args: ARGS,
  render: () => <PickerHost initialSelected={[]} />,
};

/**
 * A mix across categories. The contact question was tuned stricter; the hate question flags
 * from High. Open PII and Harmful content to see both editors.
 */
export const MixedSelection: Story = {
  args: ARGS,
  render: () => (
    <PickerHost
      initialSelected={['pii_contact_information', 'pii_health_information', 'harmful_hate']}
      initialThresholds={{ pii_contact_information: 0.3, harmful_hate: 0.75 }}
    />
  ),
};

/** The host's error, as Save shows it when no question is picked or added. */
export const WithError: Story = {
  args: ARGS,
  render: () => (
    <PickerHost initialSelected={[]} error="Pick at least one question or add your own." />
  ),
};

/** Before the catalog arrives, or when it fails: the label and the search stay, nothing to pick. */
export const NoCatalog: Story = {
  args: ARGS,
  render: () => (
    <ClassifierQuestionPicker
      categories={[]}
      selectedQuestions={[]}
      questionThresholds={{}}
      label="Predefined questions"
      tooltip={TOOLTIP}
      onChange={noop}
    />
  ),
};
