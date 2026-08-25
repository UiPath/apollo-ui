import type { Meta, StoryObj } from '@storybook/react-vite';
import { Toaster } from '@/components/ui/sonner';
import { multiStepSchema } from './form-examples';
import type { FormSchema } from './form-schema';
import { MetadataForm } from './metadata-form';
import { FormWithSchemaViewer, SchemaViewer } from './schema-viewer';

const meta: Meta<typeof SchemaViewer> = {
  title: 'Forms/Schema Viewer',
  component: SchemaViewer,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component: `
Displays the backing JSON of a form schema in a slide-out sheet panel.

**Features:**
- One-click trigger button that opens a side sheet
- Pretty-printed, round-trippable schema JSON
- Copy to clipboard with toast feedback
- \`FormWithSchemaViewer\` wrapper to pair any form with its schema

Useful for debugging schema-driven forms and for handing a schema to another team or system.
        `,
      },
    },
  },
  decorators: [
    (Story) => (
      <>
        <Story />
        <Toaster />
      </>
    ),
  ],
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof SchemaViewer>;

// ============================================================================
// Demo schema
// ============================================================================

const registrationSchema: FormSchema = {
  id: 'registration-form',
  title: 'Event Registration',
  description: 'Register for the automation summit',
  sections: [
    {
      id: 'attendee',
      title: 'Attendee Details',
      fields: [
        {
          name: 'fullName',
          type: 'text',
          label: 'Full Name',
          placeholder: 'John Doe',
          validation: { required: true, minLength: 2 },
        },
        {
          name: 'email',
          type: 'email',
          label: 'Email Address',
          placeholder: 'john@example.com',
          validation: { required: true, email: true },
        },
        {
          name: 'role',
          type: 'select',
          label: 'Role',
          options: [
            { label: 'Developer', value: 'dev' },
            { label: 'Designer', value: 'design' },
            { label: 'Product Manager', value: 'pm' },
          ],
        },
      ],
    },
    {
      id: 'preferences',
      title: 'Preferences',
      collapsible: true,
      fields: [
        {
          name: 'dietaryNotes',
          type: 'textarea',
          label: 'Dietary Notes',
          placeholder: 'Anything we should know?',
        },
        {
          name: 'newsletter',
          type: 'switch',
          label: 'Subscribe to newsletter',
          defaultValue: false,
        },
      ],
    },
  ],
};

// ============================================================================
// Stories
// ============================================================================

/**
 * Default
 *
 * The standalone trigger button. Click "View Schema" to open the sheet with
 * the pretty-printed JSON, then use the Copy button to grab it.
 */
export const Default: Story = {
  args: {
    schema: registrationSchema,
  },
};

/**
 * Custom Trigger Label
 *
 * The trigger text is configurable via the triggerLabel prop.
 */
export const CustomTriggerLabel: Story = {
  args: {
    schema: registrationSchema,
    triggerLabel: 'Inspect JSON',
  },
};

/**
 * Multi-Step Schema
 *
 * The viewer works with any schema shape, including multi-step wizards.
 */
export const MultiStepSchema: Story = {
  args: {
    schema: multiStepSchema,
  },
};

/**
 * With Form
 *
 * FormWithSchemaViewer pairs a rendered form with its schema viewer button,
 * so consumers can see the live form and its backing JSON side by side.
 */
export const WithForm: Story = {
  render: () => (
    <FormWithSchemaViewer schema={registrationSchema}>
      <MetadataForm
        schema={registrationSchema}
        onSubmit={(data) => console.log('Submitted:', data)}
      />
    </FormWithSchemaViewer>
  ),
};
