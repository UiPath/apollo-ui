import type { Meta, StoryObj } from '@storybook/react-vite';
import { AlertCircle } from 'lucide-react';
import { useState } from 'react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Combobox } from '@/components/ui/combobox';
import { FormField, FormFieldError } from '@/components/ui/form-field';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { FullWorkbenchComposition } from '../../../../packages/apollo-react/src/canvas/stories/templates/Flow.stories';
import { withCanvasProviders } from '../../../../packages/apollo-react/src/canvas/storybook-utils';
import {
  CodeBlock,
  Divider,
  ExampleCard,
  FieldExample,
  GuidanceItem,
  GuidanceList,
  GuidancePage,
  InfoCallout,
  InlineCode,
  PatternCard,
  SectionDescription,
  SectionTitle,
} from './guidance-primitives';

const meta = {
  title: 'Apollo Wind/Forms/Field Validation Guidance',
  parameters: { layout: 'fullscreen' },
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

// ---------------------------------------------------------------------------
// Live examples
// ---------------------------------------------------------------------------

function AnatomyExample() {
  return (
    <FieldExample htmlFor="anatomy-node-name" label="Node name" required>
      <Input
        id="anatomy-node-name"
        defaultValue="Invoice processor"
        error="This node name is already in use. Enter a unique name before saving."
      />
    </FieldExample>
  );
}

const stages = [
  { value: 'intake', label: 'Intake' },
  { value: 'review', label: 'Review' },
  { value: 'approval', label: 'Approval' },
];

function ApiExample() {
  const [stage, setStage] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const error = submitted && !stage ? 'Select a stage before assigning permissions.' : undefined;

  return (
    <div className="grid gap-3">
      <FieldExample htmlFor="api-stage" label="Stage" required>
        <Combobox
          id="api-stage"
          items={stages}
          value={stage}
          onValueChange={setStage}
          placeholder="Select a stage"
          searchPlaceholder="Search stages"
          className="w-full"
          error={error}
        />
      </FieldExample>
      <div>
        <Button variant="outline" size="sm" onClick={() => setSubmitted(true)}>
          Assign permissions
        </Button>
      </div>
    </div>
  );
}

function CheckboxExample() {
  return (
    <FormField>
      <div className="flex items-center gap-2">
        <Checkbox
          id="guidance-terms"
          aria-invalid
          aria-describedby="guidance-terms-error"
          aria-errormessage="guidance-terms-error"
        />
        <Label htmlFor="guidance-terms">I accept the terms of use</Label>
      </div>
      <FormFieldError id="guidance-terms-error">Accept the terms to continue.</FormFieldError>
    </FormField>
  );
}

function FormLevelExample() {
  return (
    <div className="space-y-4">
      <Alert variant="destructive">
        <AlertCircle />
        <AlertTitle>Resolve 2 issues before running this node</AlertTitle>
        <AlertDescription>
          Fix the highlighted fields in Parameters and Error handling before you run or publish this
          workflow.
        </AlertDescription>
      </Alert>
      <FieldExample htmlFor="form-level-recipient" label="To" required>
        <Input
          id="form-level-recipient"
          placeholder="Recipient email address"
          error="This field is required. Enter a recipient or bind a variable."
        />
      </FieldExample>
      <FieldExample htmlFor="form-level-retries" label="Retry count">
        <Input
          id="form-level-retries"
          defaultValue="8"
          error="Retry count must be between 0 and 5."
        />
      </FieldExample>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Coverage matrix
// ---------------------------------------------------------------------------

type Coverage = {
  component: string;
  api: 'error prop' | 'aria-invalid';
  where: string;
  storyId: string;
};

const COVERAGE: Coverage[] = [
  {
    component: 'Input',
    api: 'error prop',
    where: 'Below the input',
    storyId: 'apollo-wind-components-core-input--with-inline-validation',
  },
  {
    component: 'Input Group',
    api: 'error prop',
    where: 'Below the group; the group owns the stroke',
    storyId: 'apollo-wind-components-core-input-group--with-inline-validation',
  },
  {
    component: 'Textarea',
    api: 'error prop',
    where: 'Below the textarea',
    storyId: 'apollo-wind-components-core-textarea--with-inline-validation',
  },
  {
    component: 'Search',
    api: 'error prop',
    where: 'Below the search field',
    storyId: 'apollo-wind-components-navigation-search--with-inline-validation',
  },
  {
    component: 'Select (SelectTrigger)',
    api: 'error prop',
    where: 'Below the trigger',
    storyId: 'apollo-wind-components-core-select--with-inline-validation',
  },
  {
    component: 'Combobox',
    api: 'error prop',
    where: 'Below the trigger',
    storyId: 'apollo-wind-components-core-combobox--with-inline-validation',
  },
  {
    component: 'Multi Select',
    api: 'error prop',
    where: 'Below the trigger',
    storyId: 'apollo-wind-components-core-multi-select--with-inline-validation',
  },
  {
    component: 'Date Picker, Date Range Picker',
    api: 'error prop',
    where: 'Below the trigger; the story shows both',
    storyId: 'apollo-wind-components-core-date-picker--with-inline-validation',
  },
  {
    component: 'DateTime Picker',
    api: 'error prop',
    where: 'Below the trigger',
    storyId: 'apollo-wind-components-core-datetime-picker--with-inline-validation',
  },
  {
    component: 'File Upload',
    api: 'error prop',
    where: 'Below the dropzone; per-file problems use errors',
    storyId: 'apollo-wind-components-core-file-upload--with-inline-validation',
  },
  {
    component: 'Lockable Value Field',
    api: 'error prop',
    where: 'Below the composite field',
    storyId: 'apollo-wind-components-uipath-lockable-value-field--inline-validation',
  },
  {
    component: 'Prompt Editor',
    api: 'error prop',
    where: 'Below the editor, outside the focus frame',
    storyId: 'apollo-wind-components-uipath-prompt-editor--with-inline-validation',
  },
  {
    component: 'Dropdown (DropdownMenuTrigger)',
    api: 'error prop',
    where: 'Stroke only; the consumer renders the message',
    storyId: 'apollo-wind-components-overlays-dropdown--with-inline-validation',
  },
  {
    component: 'Checkbox',
    api: 'aria-invalid',
    where: 'Consumer renders FormFieldError',
    storyId: 'apollo-wind-components-core-checkbox--with-inline-validation',
  },
  {
    component: 'Radio Group',
    api: 'aria-invalid',
    where: 'Set on the group; consumer renders FormFieldError',
    storyId: 'apollo-wind-components-core-radio-group--with-inline-validation',
  },
  {
    component: 'Switch',
    api: 'aria-invalid',
    where: 'Consumer renders FormFieldError',
    storyId: 'apollo-wind-components-core-switch--with-inline-validation',
  },
  {
    component: 'Slider',
    api: 'aria-invalid',
    where: 'Forwarded to the thumb; consumer renders FormFieldError',
    storyId: 'apollo-wind-components-core-slider--with-inline-validation',
  },
];

function CoverageTable() {
  return (
    <div className="overflow-x-auto rounded-lg border border-border">
      <table className="w-full min-w-[40rem] border-collapse text-left text-sm">
        <thead className="bg-muted/50 text-xs uppercase tracking-wide text-muted-foreground">
          <tr>
            <th scope="col" className="px-4 py-3 font-medium">
              Component
            </th>
            <th scope="col" className="px-4 py-3 font-medium">
              API
            </th>
            <th scope="col" className="px-4 py-3 font-medium">
              Message
            </th>
            <th scope="col" className="px-4 py-3 font-medium">
              Story
            </th>
          </tr>
        </thead>
        <tbody>
          {COVERAGE.map((row) => (
            <tr key={row.component} className="border-t border-border">
              <td className="px-4 py-3 font-medium text-foreground">{row.component}</td>
              <td className="whitespace-nowrap px-4 py-3 text-muted-foreground">
                <InlineCode>
                  {row.api === 'error prop' ? 'error, errorId' : 'aria-invalid'}
                </InlineCode>
              </td>
              <td className="px-4 py-3 text-muted-foreground">{row.where}</td>
              <td className="px-4 py-3">
                {/* Relative to the iframe path so the link also works when Storybook is hosted under a subpath. */}
                <a
                  href={`./?path=/story/${row.storyId}`}
                  target="_top"
                  className="text-primary underline-offset-4 hover:underline"
                >
                  Open<span className="sr-only"> {row.component} story</span>
                </a>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

function FieldValidationGuidancePage({ globalTheme }: { globalTheme: string }) {
  return (
    <GuidancePage
      globalTheme={globalTheme}
      title="Field Validation Guidance"
      intro="Tell people what went wrong and how to fix it, right where the problem is. Every field control in Apollo Wind uses the same inline pattern: a red stroke on the control, a message directly below it, and the accessibility wiring that connects the two."
    >
      <Divider />

      <section>
        <SectionTitle>Anatomy</SectionTitle>
        <SectionDescription>
          One pattern for every control. The stroke marks the field, the message explains it, and
          assistive technology hears both.
        </SectionDescription>
        <div className="grid gap-5 md:grid-cols-2">
          <PatternCard
            eyebrow="Reference"
            title="Inline validation"
            description="The error token drives both the stroke and the message so the pair always reads as one state."
          >
            <AnatomyExample />
          </PatternCard>
          <div className="rounded-lg border border-border bg-card p-5">
            <GuidanceList>
              <GuidanceItem>
                <strong className="text-foreground">Stroke.</strong> The control border turns to the{' '}
                <InlineCode>error</InlineCode> token. Future themes have no border, so they show a
                1px outer ring instead.
              </GuidanceItem>
              <GuidanceItem>
                <strong className="text-foreground">Message.</strong> Rendered by{' '}
                <InlineCode>FormFieldError</InlineCode> directly below the control in{' '}
                <InlineCode>text-xs</InlineCode> and the error color.
              </GuidanceItem>
              <GuidanceItem>
                <strong className="text-foreground">Wiring.</strong> The control gets{' '}
                <InlineCode>aria-invalid</InlineCode>, and both{' '}
                <InlineCode>aria-describedby</InlineCode> and{' '}
                <InlineCode>aria-errormessage</InlineCode> point at the message id. The message is a
                polite live region, so it is announced when it appears.
              </GuidanceItem>
              <GuidanceItem>
                <strong className="text-foreground">Focus.</strong> The focus ring also takes the
                error color, so a focused invalid field is never mistaken for a valid one.
              </GuidanceItem>
            </GuidanceList>
          </div>
        </div>
      </section>

      <Divider />

      <section>
        <SectionTitle>When to validate</SectionTitle>
        <SectionDescription>
          Validate at the moment someone has finished with a field, not while they are still working
          in it and never before they have started.
        </SectionDescription>
        <GuidanceList>
          <GuidanceItem>
            Show the error on blur, or on submit for rules that need the whole form. Do not show
            required-field errors on mount.
          </GuidanceItem>
          <GuidanceItem>
            Clear the error as soon as the rule is satisfied. Do not wait for the next blur.
          </GuidanceItem>
          <GuidanceItem>
            For pickers and comboboxes, treat closing the list without a choice as the blur.
          </GuidanceItem>
          <GuidanceItem>
            Keep the required indicator on the label at all times. It tells people a value is needed
            before they get anything wrong.
          </GuidanceItem>
        </GuidanceList>
      </section>

      <Divider />

      <section>
        <SectionTitle>Writing the message</SectionTitle>
        <SectionDescription>
          Say what went wrong and what to do about it, in one or two short sentences. The message
          should make sense read on its own by a screen reader.
        </SectionDescription>
        <div className="grid gap-5 md:grid-cols-2">
          <ExampleCard
            kind="do"
            note="Names the problem and the action. Someone can fix it without asking anything else."
          >
            <FieldExample htmlFor="copy-do" label="Retry count">
              <Input id="copy-do" defaultValue="8" error="Retry count must be between 0 and 5." />
            </FieldExample>
          </ExampleCard>
          <ExampleCard
            kind="dont"
            note="Generic wording restates that something is wrong without saying what or how to fix it."
          >
            <FieldExample htmlFor="copy-dont" label="Retry count">
              <Input id="copy-dont" defaultValue="8" error="Invalid input." />
            </FieldExample>
          </ExampleCard>
        </div>
        <div className="mt-6">
          <InfoCallout>
            Validation messages are not help text. Requirements people need before they type belong
            in an inline description, covered on the Field Help Guidance page. Repeat the
            requirement in the error only when it is the fix.
          </InfoCallout>
        </div>
      </section>

      <Divider />

      <section>
        <SectionTitle>The API</SectionTitle>
        <SectionDescription>
          Controls with a message slot (text fields, pickers, selects, uploads) accept{' '}
          <InlineCode>error</InlineCode> and <InlineCode>errorId</InlineCode>. Pass{' '}
          <InlineCode>error</InlineCode> and the component renders the message, applies the stroke,
          and wires the aria attributes. Checkbox, Radio Group, Switch, and Slider have no message
          slot; for them you set <InlineCode>aria-invalid</InlineCode> and render the message
          yourself, as shown further down. The coverage table lists which is which.
        </SectionDescription>
        <div className="grid gap-5 md:grid-cols-2">
          <PatternCard
            eyebrow="Live"
            title="Required selection"
            description="A Combobox with nothing chosen. Choose Assign permissions to validate on submit. Picking a stage clears the error."
          >
            <ApiExample />
          </PatternCard>
          <div className="space-y-4">
            <CodeBlock>{`<Label htmlFor="stage">
  Stage <RequiredIndicator />
</Label>
<Combobox
  id="stage"
  items={stages}
  value={stage}
  onValueChange={setStage}
  error={submitted && !stage
    ? 'Select a stage before assigning permissions.'
    : undefined}
/>`}</CodeBlock>
            <GuidanceList>
              <GuidanceItem>
                <InlineCode>error</InlineCode> takes any React node. Pass{' '}
                <InlineCode>undefined</InlineCode> to clear it. An empty string renders nothing.
              </GuidanceItem>
              <GuidanceItem>
                <InlineCode>errorId</InlineCode> is optional. Without it the id is derived from the
                control id, or generated.
              </GuidanceItem>
              <GuidanceItem>
                Pass <InlineCode>id</InlineCode> so the visible label names the field. Trigger-based
                controls fall back to an <InlineCode>aria-label</InlineCode> only when no id is set.
              </GuidanceItem>
              <GuidanceItem>
                Every control, with or without a message slot, still accepts{' '}
                <InlineCode>aria-invalid</InlineCode> on its own for cases where the message lives
                elsewhere.
              </GuidanceItem>
            </GuidanceList>
          </div>
        </div>
      </section>

      <Divider />

      <section>
        <SectionTitle>Coverage</SectionTitle>
        <SectionDescription>
          Which controls take <InlineCode>error</InlineCode> directly, and which ones expect you to
          render the message. Each link opens the component story for the error state.
        </SectionDescription>
        <CoverageTable />
      </section>

      <Divider />

      <section>
        <SectionTitle>Controls without a message slot</SectionTitle>
        <SectionDescription>
          Checkbox, Radio Group, Switch, and Slider are usually one of several options under a
          shared label, so the message belongs to the group rather than the control.
        </SectionDescription>
        <div className="grid gap-5 md:grid-cols-2">
          <PatternCard
            eyebrow="Composed"
            title="Checkbox with FormFieldError"
            description="Set aria-invalid for the stroke, render the message yourself, and point the aria ids at it."
          >
            <CheckboxExample />
          </PatternCard>
          <div className="space-y-4">
            <CodeBlock>{`<Checkbox
  id="terms"
  aria-invalid
  aria-describedby="terms-error"
  aria-errormessage="terms-error"
/>
<Label htmlFor="terms">I accept the terms of use</Label>
<FormFieldError id="terms-error">
  Accept the terms to continue.
</FormFieldError>`}</CodeBlock>
            <InfoCallout>
              ARIA allows <InlineCode>aria-invalid</InlineCode> on a radiogroup but not on an
              individual radio, so set it on <InlineCode>RadioGroup</InlineCode>. Every item takes
              the stroke from the group. Slider forwards it to the thumb, which is the element with
              the slider role.
            </InfoCallout>
          </div>
        </div>
      </section>

      <Divider />

      <section>
        <SectionTitle>Field-level and form-level</SectionTitle>
        <SectionDescription>
          Inline messages fix one field. When a form or panel has several problems, or the problems
          are out of view, add a summary above them and keep the inline messages.
        </SectionDescription>
        <div className="grid gap-5 md:grid-cols-2">
          <PatternCard
            eyebrow="Summary"
            title="Alert plus inline"
            description="The alert counts the issues and says where they are. Each field still explains its own fix."
          >
            <FormLevelExample />
          </PatternCard>
          <div className="rounded-lg border border-border bg-card p-5">
            <GuidanceList>
              <GuidanceItem>
                Use the destructive <InlineCode>Alert</InlineCode> at the top of the form or panel
                content, not a toast. A toast disappears before the fix is made.
              </GuidanceItem>
              <GuidanceItem>
                Count the issues and name the sections that hold them. In tabbed panels, badge the
                tab with its count.
              </GuidanceItem>
              <GuidanceItem>
                Move focus to the first invalid field on submit so keyboard users land on the fix.
              </GuidanceItem>
              <GuidanceItem>
                Remove the summary as soon as the last inline error clears.
              </GuidanceItem>
            </GuidanceList>
          </div>
        </div>
      </section>
    </GuidancePage>
  );
}

export const Documentation: Story = {
  name: 'Documentation',
  render: (_args, { globals }) => (
    <FieldValidationGuidancePage globalTheme={globals.theme || 'future-dark'} />
  ),
};

export const Example: Story = {
  name: 'Example',
  decorators: [withCanvasProviders({ fullscreen: false })],
  render: () => <FullWorkbenchComposition rightPanelVariant="dap" />,
};
