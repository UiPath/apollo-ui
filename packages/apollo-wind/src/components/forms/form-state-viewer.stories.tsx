import type { Meta, StoryObj } from '@storybook/react-vite';
import { useEffect } from 'react';
import { type FieldValues, type UseFormReturn, useForm } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { FormStateViewer } from './form-state-viewer';

const meta: Meta<typeof FormStateViewer> = {
  title: 'Forms/State Viewer',
  component: FormStateViewer,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component: `
A developer tool that displays React Hook Form state in a friendly way.

**Features:**
- Live view of form values, updated as the user types
- Validation errors listed per field
- Internal state flags: valid, dirty, submitting, submit count
- Dirty and touched field tracking
- Compact mode for inline monitoring

Pass any \`useForm\` instance via the \`form\` prop. The viewer is read-only, it never mutates form state.
        `,
      },
    },
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof FormStateViewer>;

// ============================================================================
// Demo forms
// ============================================================================

const LiveFormExample = () => {
  const form = useForm({
    mode: 'onChange',
    defaultValues: {
      name: '',
      email: '',
    },
  });

  const {
    register,
    formState: { errors },
  } = form;

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <form
        onSubmit={form.handleSubmit((data) => console.log('Submitted:', data))}
        className="space-y-4 p-6 border rounded-lg"
      >
        <div>
          <h2 className="text-xl font-bold">User Profile</h2>
          <p className="text-sm text-muted-foreground">
            Type into the fields and watch the state viewer update in real time.
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="sv-name">Full Name</Label>
          <Input
            id="sv-name"
            placeholder="John Doe"
            {...register('name', {
              required: 'Name is required',
              minLength: { value: 2, message: 'Name must be at least 2 characters' },
            })}
          />
          {errors.name && (
            <p className="text-sm text-destructive">{errors.name.message as string}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="sv-email">Email Address</Label>
          <Input
            id="sv-email"
            type="email"
            placeholder="john@example.com"
            {...register('email', {
              required: 'Email is required',
              pattern: {
                value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                message: 'Invalid email address',
              },
            })}
          />
          {errors.email && (
            <p className="text-sm text-destructive">{errors.email.message as string}</p>
          )}
        </div>

        <Button type="submit">Submit</Button>
      </form>

      <FormStateViewer form={form as unknown as UseFormReturn<FieldValues>} />
    </div>
  );
};

const WithErrorsExample = () => {
  const form = useForm({
    mode: 'onChange',
    defaultValues: {
      name: 'J',
      email: 'not-an-email',
    },
  });

  // Seed manual errors so the Errors tab has content immediately.
  useEffect(() => {
    form.setError('name', { type: 'minLength', message: 'Name must be at least 2 characters' });
    form.setError('email', { type: 'pattern', message: 'Invalid email address' });
  }, [form]);

  return (
    <FormStateViewer
      form={form as unknown as UseFormReturn<FieldValues>}
      title="Form State With Errors"
    />
  );
};

const CompactExample = () => {
  const form = useForm({
    mode: 'onChange',
    defaultValues: {
      name: '',
    },
  });

  return (
    <div className="space-y-4 max-w-md">
      <form className="space-y-2 p-4 border rounded-lg">
        <Label htmlFor="sv-compact-name">Name</Label>
        <Input
          id="sv-compact-name"
          placeholder="Type to see live updates"
          {...form.register('name')}
        />
      </form>

      <FormStateViewer form={form as unknown as UseFormReturn<FieldValues>} compact />
    </div>
  );
};

// ============================================================================
// Stories
// ============================================================================

/**
 * Live Form
 *
 * A form and the state viewer side by side:
 * - Values update as you type
 * - Validation errors surface in the Errors tab
 * - Dirty and touched fields are tracked in the Fields tab
 */
export const LiveForm: Story = {
  render: () => <LiveFormExample />,
};

/**
 * With Errors
 *
 * The viewer with seeded validation errors:
 * - Header badge shows the error count
 * - The Errors tab lists each field with its message
 */
export const WithErrors: Story = {
  render: () => <WithErrorsExample />,
};

/**
 * Compact
 *
 * The condensed variant, ideal for monitoring form state below a form
 * without taking up much space. Shows the validity badge and current values.
 */
export const Compact: Story = {
  render: () => <CompactExample />,
};
