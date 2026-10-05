import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import { Label } from '@/components/ui/label';
import { Toaster } from '@/components/ui/sonner';
import { Switch } from '@/components/ui/switch';
import { setupDemoMocks } from './demo-mocks';
import {
  cascadingDropdownsSchema,
  conditionalQuestionsSchema,
  conditionalSectionsSchema,
  FileUploadExample,
  fileUploadSchema,
  multiStepSchema,
} from './form-examples';
import { analyticsPlugin, autoSavePlugin } from './form-plugins';
import type { FormPlugin, FormSchema } from './form-schema';
import { MetadataForm } from './metadata-form';
import { SchemaViewer } from './schema-viewer';

// Serves the remote data sources the stories fetch from.
setupDemoMocks();

const meta: Meta<typeof MetadataForm> = {
  title: 'Forms/Metadata Form',
  component: MetadataForm,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component: `
\`MetadataForm\` renders a whole form from a \`FormSchema\`: layout, validation, rules, data sources and steps, and per
field the value modes and field actions of the field anatomy. It is the default way to build a form with Apollo Wind. It
owns the form's state (react-hook-form and zod), and a host reads or drives values through plugins.

Each story shows one capability; the button above it opens the story's schema. Related pages:

- **Forms/Value modes** and **Forms/Field actions**: the mode-aware field anatomy (\`valueModes\`, \`headerActions\`,
  \`menuActions\`, \`badge\`).
- **Forms/Custom Controls**: registering a control for a value no built-in field type covers.
- **Forms/Designer**: building a schema interactively.
        `,
      },
    },
  },
  decorators: [
    (Story, context) => {
      const schema = context.args.schema as FormSchema | undefined;
      return (
        <>
          {schema && (
            <div className="flex justify-end mb-4">
              <SchemaViewer schema={schema} />
            </div>
          )}
          <Story />
          <Toaster />
        </>
      );
    },
  ],
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof MetadataForm>;

// ============================================================================
// BASIC FORM
// ============================================================================

const contactFormSchema: FormSchema = {
  id: 'contact-form',
  title: 'Contact Us',
  description: 'Get in touch with our team',
  layout: {
    columns: 2,
    gap: 6,
  },
  sections: [
    {
      id: 'contact-info',
      fields: [
        {
          name: 'name',
          type: 'text',
          label: 'Full Name',
          placeholder: 'John Doe',
          validation: {
            required: true,
            minLength: 2,
            messages: { minLength: 'Name must be at least 2 characters' },
          },
          grid: { span: 2 },
        },
        {
          name: 'email',
          type: 'email',
          label: 'Email Address',
          placeholder: 'john@example.com',
          validation: {
            required: true,
            email: true,
            messages: { email: 'Please enter a valid email' },
          },
        },
        {
          name: 'phone',
          type: 'text',
          label: 'Phone Number',
          placeholder: '+1 (555) 123-4567',
        },
        {
          name: 'subject',
          type: 'select',
          label: 'Subject',
          options: [
            { label: 'General Inquiry', value: 'general' },
            { label: 'Technical Support', value: 'support' },
            { label: 'Sales', value: 'sales' },
          ],
        },
        {
          name: 'urgent',
          type: 'switch',
          label: 'Urgent Request',
          description: 'Check if this requires immediate attention',
          defaultValue: false,
        },
        {
          name: 'message',
          type: 'textarea',
          label: 'Message',
          placeholder: 'How can we help you?',
          validation: {
            required: true,
            minLength: 10,
            messages: { minLength: 'Please provide more details' },
          },
          grid: { span: 2 },
        },
      ],
    },
  ],
};

/**
 * A two-column grid with column spans, the common field types, and validation with custom messages.
 */
export const BasicForm: Story = {
  name: 'Basic form',
  args: {
    schema: contactFormSchema,
    onSubmit: async (data) => {
      console.log('Form submitted:', data);
      alert('Form submitted! Check console for data.');
    },
  },
};

const compactFormSchema: FormSchema = {
  id: 'compact-form',
  title: 'Quick Survey',
  description: "This won't take long",
  layout: {
    columns: 1,
    gap: 4,
    variant: 'compact',
  },
  sections: [
    {
      id: 's1',
      fields: [
        {
          name: 'rating',
          type: 'slider',
          label: 'How satisfied are you?',
          min: 1,
          max: 5,
          step: 1,
          defaultValue: 3,
        },
        {
          name: 'recommend',
          type: 'radio',
          label: 'Would you recommend us?',
          options: [
            { label: 'Yes', value: 'yes' },
            { label: 'No', value: 'no' },
          ],
        },
        {
          name: 'feedback',
          type: 'textarea',
          label: 'Additional Feedback',
          placeholder: 'Optional...',
        },
      ],
    },
  ],
};

/**
 * `layout.variant: 'compact'` tightens the spacing between fields.
 */
export const CompactLayout: Story = {
  name: 'Compact layout',
  args: {
    schema: compactFormSchema,
    onSubmit: async (data) => {
      console.log('Survey submitted:', data);
      alert('Thanks for your feedback!');
    },
  },
};

// ============================================================================
// SECTIONS AND STEPS
// ============================================================================

// A tabbed node schema exercising both section shapes the properties panel
// produces: Parameters carries two titled, collapsible sections (where the two
// sectionVariants differ visibly), while Error handling and Advanced each hold a
// single untitled, non-collapsible section. That mirrors the consumer rule that a
// tab's lone section drops the collapse affordance and title because the tab
// already labels it. `card` frames each section in its own bordered box; `plain`
// renders flush headers separated by hairline dividers (the host frames the
// panel).
const sectionVariantSchema: FormSchema = {
  id: 'section-variant-demo',
  title: 'Node properties',
  actions: [],
  initialData: {
    'inputs.method': 'GET',
    'inputs.url': 'https://api.example.com/v1/orders',
    'inputs.timeout': 30,
    'inputs.errorHandlingEnabled': false,
    nodeId: 'httpRequest1',
    'display.label': 'HTTP request',
  },
  steps: [
    {
      id: 'parameters',
      title: 'Parameters',
      sections: [
        {
          id: 'connection',
          title: 'Connection',
          collapsible: true,
          defaultExpanded: true,
          fields: [
            {
              name: 'inputs.method',
              type: 'select',
              label: 'Method',
              options: [
                { label: 'GET', value: 'GET' },
                { label: 'POST', value: 'POST' },
                { label: 'PUT', value: 'PUT' },
              ],
            },
            { name: 'inputs.url', type: 'text', label: 'URL' },
          ],
        },
        {
          id: 'options',
          title: 'Options',
          collapsible: true,
          defaultExpanded: false,
          fields: [{ name: 'inputs.timeout', type: 'number', label: 'Timeout (s)' }],
        },
      ],
    },
    {
      id: 'error-handling',
      title: 'Error handling',
      sections: [
        // Sole section in its tab: no title, no collapse. The tab labels it.
        {
          id: 'error',
          fields: [
            {
              name: 'inputs.errorHandlingEnabled',
              type: 'switch',
              label: 'Enable error handling',
              description: 'Add an error output handle on the node to catch and handle failures.',
            },
          ],
        },
      ],
    },
    {
      id: 'advanced',
      title: 'Advanced',
      sections: [
        // Sole section in its tab: no title, no collapse. The tab labels it.
        {
          id: 'general',
          fields: [
            { name: 'nodeId', type: 'text', label: 'ID', disabled: true },
            { name: 'display.label', type: 'text', label: 'Label' },
            { name: 'display.description', type: 'textarea', label: 'Description' },
          ],
        },
      ],
    },
  ],
};

/**
 * Steps rendered as tabs (`stepVariant="tabs"`) over one form instance, so switching tabs keeps
 * every value, and collapsible sections (`collapsible`, `defaultExpanded`). Flip the toggle to
 * compare the two `sectionVariant` treatments: `card` (default) boxes each section; `plain` drops
 * the box so sections read as flush headers, for a host that frames the panel itself, such as the
 * canvas node properties panel shown here.
 */
export const SectionVariants: Story = {
  name: 'Sections and tabs',
  render: (args) => {
    const [plain, setPlain] = useState(true);
    return (
      // Canvas backdrop + panel frame matching the NodePropertyPanel stories:
      // the canvas sits on `--surface` and the docked panel is a raised,
      // subtly-bordered card (bg-surface-raised) floating over it. The variant
      // toggle floats on the canvas, centered above the panel it controls.
      <div className="flex flex-col items-center gap-6 rounded-lg bg-surface p-10">
        <div className="flex items-center gap-2">
          <Switch id="section-variant-toggle" checked={plain} onCheckedChange={setPlain} />
          <Label htmlFor="section-variant-toggle">
            Plain sections (host-framed) {'·'} currently{' '}
            <code>sectionVariant="{plain ? 'plain' : 'card'}"</code>
          </Label>
        </div>
        <div className="w-[380px] overflow-hidden rounded-2xl border border-border-subtle bg-surface-raised px-4 py-3 shadow-lg">
          <MetadataForm
            {...args}
            schema={sectionVariantSchema}
            stepVariant="tabs"
            sectionVariant={plain ? 'plain' : 'card'}
          />
        </div>
      </div>
    );
  },
};

/**
 * `steps` with the default stepper: step descriptions, Previous / Next / Submit, `initialData`,
 * and a field rule inside a step.
 */
export const MultiStep: Story = {
  name: 'Multi-step wizard',
  args: {
    schema: multiStepSchema,
    onSubmit: async (data) => {
      console.log('Onboarding complete:', data);
      alert('Welcome! Your account is set up.');
    },
  },
};

// ============================================================================
// RULES
// ============================================================================

/**
 * Field `rules` built with `RuleBuilder`: a rating of 6 or less shows a follow-up through
 * `withCustomExpression`, and a negative answer shows another through `.in([...])`. Rules read a
 * mode-aware field's fixed value only (see Forms/Value modes).
 */
export const FieldRules: Story = {
  name: 'Field rules',
  args: {
    schema: conditionalQuestionsSchema,
    onSubmit: async (data) => {
      console.log('Survey responses:', data);
      alert('Thank you for your feedback!');
    },
  },
};

/**
 * Section `conditions`: the work experience section shows for mid and senior levels only, and
 * references become required for senior.
 */
export const SectionConditions: Story = {
  name: 'Section conditions',
  args: {
    schema: conditionalSectionsSchema,
    onSubmit: async (data) => {
      console.log('Application submitted:', data);
      alert('Application submitted successfully!');
    },
  },
};

// ============================================================================
// DATA SOURCES
// ============================================================================

/**
 * Options from data sources: countries from a `fetch` source with a `transform`, then states and
 * cities from `remote` sources whose `params` name the field they depend on (`$countryCode`), so
 * each select reloads when the one before it changes.
 */
export const RemoteDataSources: Story = {
  name: 'Remote data sources',
  args: {
    schema: cascadingDropdownsSchema,
    onSubmit: async (data) => {
      console.log('Registration data:', data);
      alert('Registration submitted! Check console for data.');
    },
  },
};

// ============================================================================
// FIELD TYPES WITH EXTRA BEHAVIOUR
// ============================================================================

const sliderMaxRefSchema: FormSchema = {
  id: 'slider-max-ref',
  title: 'Slider with dynamic max',
  description:
    "The slider's `max` is bound to the value of the 'Available capacity' field via " +
    '`maxRef`. Change the number input above to see the slider re-scale (and clamp the ' +
    'current value if it now exceeds the new max).',
  sections: [
    {
      id: 's1',
      fields: [
        {
          name: 'availableCapacity',
          type: 'number',
          label: 'Available capacity (stand-in for e.g. model.maxTokens at runtime)',
          min: 0,
          defaultValue: 16384,
        },
        {
          name: 'tokens',
          type: 'slider',
          label: 'Token allocation',
          min: 0,
          step: 100,
          maxRef: { fromField: 'availableCapacity', fallback: 16384 },
          defaultValue: 8000,
        },
      ],
    },
  ],
  initialData: { availableCapacity: 16384, tokens: 8000 },
};

/**
 * A slider whose max is another field's value (`maxRef: { fromField, fallback }`). Lower
 * "Available capacity" below the slider's value: the slider rescales and clamps the value.
 */
export const SliderMaxRef: Story = {
  name: 'Slider max from another field',
  args: {
    schema: sliderMaxRefSchema,
    onSubmit: async (data) => {
      console.log('Submitted:', data);
    },
  },
};

/**
 * The `file` field type with `multiple`, `accept` and `maxSize`, and upload progress reported by
 * the host.
 */
export const FileUpload = {
  name: 'File upload',
  render: () => (
    <>
      <div className="flex justify-end mb-4">
        <SchemaViewer schema={fileUploadSchema} />
      </div>
      <FileUploadExample />
    </>
  ),
} satisfies Story;

const stringListSchema: FormSchema = {
  id: 'string-list-demo',
  title: '',
  actions: [],
  mode: 'onChange',
  sections: [
    {
      id: 'main',
      fields: [
        {
          name: 'blockedPhrases',
          type: 'string-list',
          label: 'Blocked phrases',
          tooltip: 'Each row is matched against generated output.',
          defaultValue: ['confidential'],
          maxItems: 5,
          maxLength: 200,
          addItemLabel: 'Add phrase',
          removeItemAriaLabel: 'Remove {{label}} {{position}}',
          validation: {
            required: true,
            minItems: 1,
            messages: { minItems: 'Add at least one phrase.' },
          },
        },
      ],
    },
  ],
};

const StringListExample = () => {
  const [seen, setSeen] = useState<Record<string, unknown>>({
    blockedPhrases: ['confidential'],
  });

  // Reading values is a plugin concern; the form stays the owner of its state.
  const plugin: FormPlugin = {
    name: 'story-observer',
    onValueChange: (name, value) => setSeen((prev) => ({ ...prev, [name]: value })),
  };

  return (
    <div className="max-w-md space-y-4">
      <MetadataForm schema={stringListSchema} plugins={[plugin]} container="div" />
      <pre className="text-xs text-muted-foreground">{JSON.stringify(seen, null, 2)}</pre>
    </div>
  );
};

/**
 * The `string-list` field type (rows with Add / Remove) with a `tooltip`, validated by the schema:
 * `minItems: 1` requires at least one row. `pattern` applies to whole string fields, not to list
 * items, so a rule such as "no whitespace-only row" belongs in a `FormPlugin`. The values below
 * come from a plugin's `onValueChange`: a host reads and drives values through plugins.
 */
export const StringList = {
  name: 'String list',
  render: () => <StringListExample />,
} satisfies Story;

// ============================================================================
// PLUGINS
// ============================================================================

/**
 * The built-in `autoSavePlugin` (fill the form, then reload the story) and `analyticsPlugin`
 * (field changes in the console). A plugin is how a host reads and drives a form's values.
 */
export const Plugins: Story = {
  name: 'Plugins',
  args: {
    schema: contactFormSchema,
    plugins: [autoSavePlugin, analyticsPlugin],
    onSubmit: async (data) => {
      console.log('Form with plugins submitted:', data);
      alert('Form submitted with auto-save and analytics!');
    },
  },
};
