import type { Meta, StoryObj } from '@storybook/react-vite';
import { GuardrailFileSupportIndicator } from './guardrail-file-support-indicator';

const meta = {
  title: 'Components/UiPath/Guardrail File Support Indicator',
  component: GuardrailFileSupportIndicator,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component: `
Says whether a guardrail validator reads the files attached to a run, and which kinds.

**It never branches on a validator.** The host derives \`fileSupport\` from the feature flags that
switch file support on in the backend, and from its deployment, then stamps it onto the
definition. This renders that and nothing else, so the card and the run cannot disagree, and a
validator that gains coverage is a flag flip rather than a UI change.

Three states, all reached from data alone:

| \`fileSupport\` | renders |
| --- | --- |
| absent | nothing |
| \`{ supported: true, formats: [...] }\` | the kinds it reads |
| ...plus \`uninspectedFormats\` or \`visionModelFormats\` | the kinds, and a warning naming the rest |
| \`{ supported: false, unavailableReason }\` | why it reads none |

Absent is *unknown*, not "reads none": a host that has not adopted the field, and every BYO
definition, say nothing, and the card stays quiet rather than claiming either way.

In \`GuardrailBuilder\` a supported indicator sits under the Applies to field and shows only while
it selects Files or Both; see the builder's FileSupport stories.
        `,
      },
    },
  },
  tags: ['autodocs'],
  args: { fileSupport: { supported: true, formats: ['Text', 'Pdf', 'Image'] } },
} satisfies Meta<typeof GuardrailFileSupportIndicator>;

export default meta;
type Story = StoryObj<typeof meta>;

/** A validator reading text and binaries. */
export const ReadsFiles: Story = {};

/** Before file text extraction is rolled out, most validators inline text only. */
export const TextFilesOnly: Story = {
  args: { fileSupport: { supported: true, formats: ['Text'] } },
};

/** Text is read, the extracted kinds are not yet, so the card says they pass unchecked. */
export const TextOnlyWithWarning: Story = {
  args: {
    fileSupport: {
      supported: true,
      formats: ['Text'],
      uninspectedFormats: ['Pdf', 'Image', 'Office', 'Html'],
    },
  },
};

/** A judge without text extraction: PDF and images go to the model, Office and HTML do not. */
export const JudgeWithoutExtraction: Story = {
  args: {
    fileSupport: {
      supported: true,
      formats: ['Text', 'Pdf', 'Image'],
      uninspectedFormats: ['Office', 'Html'],
      visionModelFormats: ['Pdf', 'Image'],
    },
  },
};

/** Everything the backend can currently offer. */
export const EveryFormat: Story = {
  args: { fileSupport: { supported: true, formats: ['Text', 'Pdf', 'Image', 'Office', 'Html'] } },
};

/** File support has not reached this validator yet. */
export const NotEnabled: Story = {
  args: { fileSupport: { supported: false, formats: [], unavailableReason: 'NotEnabled' } },
};

/** Automation Suite forwards no attachments, so no validator reads files there. */
export const UnavailableOnAutomationSuite: Story = {
  args: { fileSupport: { supported: false, formats: [], unavailableReason: 'AutomationSuite' } },
};

/** No descriptor: a host that has not adopted the field, or a BYO definition. */
export const Unknown: Story = {
  args: { fileSupport: undefined },
  parameters: {
    docs: { description: { story: 'Renders nothing. The preview below is intentionally empty.' } },
  },
};

/** Every state at once, which is what a palette of validators looks like mid-rollout. */
export const AllStates: Story = {
  render: () => (
    <div className="space-y-2">
      <GuardrailFileSupportIndicator
        fileSupport={{ supported: true, formats: ['Text', 'Pdf', 'Image'] }}
      />
      <GuardrailFileSupportIndicator fileSupport={{ supported: true, formats: ['Text'] }} />
      <GuardrailFileSupportIndicator
        fileSupport={{
          supported: true,
          formats: ['Text'],
          uninspectedFormats: ['Pdf', 'Image', 'Office', 'Html'],
        }}
      />
      <GuardrailFileSupportIndicator
        fileSupport={{
          supported: true,
          formats: ['Text', 'Pdf', 'Image'],
          uninspectedFormats: ['Office', 'Html'],
          visionModelFormats: ['Pdf', 'Image'],
        }}
      />
      <GuardrailFileSupportIndicator
        fileSupport={{ supported: false, formats: [], unavailableReason: 'NotEnabled' }}
      />
      <GuardrailFileSupportIndicator
        fileSupport={{ supported: false, formats: [], unavailableReason: 'AutomationSuite' }}
      />
    </div>
  ),
};
