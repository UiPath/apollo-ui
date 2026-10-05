import type { Meta, StoryObj } from '@storybook/react-vite';
import { X } from 'lucide-react';
import type * as React from 'react';
import { useState } from 'react';
import {
  createInsertVariableAction,
  type FormPlugin,
  type FormSchema,
  MetadataForm,
} from '@/components/forms';
import { InsertVariableAction } from '@/components/ui/field-actions';
import { FieldMenu, type ValueMode, ValueModeIndicator } from '@/components/ui/field-addons';
import {
  FormField,
  FormFieldDescription,
  FormFieldHeader,
  FormFieldLabel,
} from '@/components/ui/form-field';
import { Input } from '@/components/ui/input';
import { InputGroup, InputGroupAddon } from '@/components/ui/input-group';
import { Label } from '@/components/ui/label';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { TooltipProvider } from '@/components/ui/tooltip';
import {
  CodeBlock,
  Divider,
  ExampleCard,
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
  title: 'Apollo Wind/Forms/Guidance Field Anatomy',
  parameters: { layout: 'fullscreen' },
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

const VARIABLES = [
  {
    id: 'vars',
    label: '$vars',
    children: [
      { id: 'orderId', label: 'orderId', value: '$vars.orderId', type: 'string' },
      { id: 'customerId', label: 'customerId', value: '$vars.customerId', type: 'string' },
    ],
  },
];

// Module-level: MetadataForm expects its plugins to keep their identity between renders.
const PLUGINS: FormPlugin[] = [
  {
    name: 'host',
    variables: VARIABLES,
    fieldActions: { header: { 'insert-variable': createInsertVariableAction({}) } },
  },
];

const SCHEMA: FormSchema = {
  id: 'anatomy',
  title: '',
  actions: [],
  mode: 'onChange',
  sections: [
    {
      id: 'main',
      fields: [
        {
          name: 'orderId',
          type: 'text',
          label: 'Order id',
          tooltip: 'The order to look up.',
          placeholder: 'Enter an order id',
          description: 'Switch the mode from the menu, or insert a variable from the header.',
          validation: { required: true, messages: { required: 'Enter an order id to continue.' } },
          valueModes: { modes: ['literal', 'expression', 'variable'] },
          headerActions: ['insert-variable'],
          menuActions: ['clear'],
        },
      ],
    },
  ],
};

const SCHEMA_CODE = `const schema: FormSchema = {
  id: 'lookup',
  title: 'Look up an order',
  sections: [{
    id: 'main',
    fields: [{
      name: 'orderId',
      type: 'text',
      label: 'Order id',
      tooltip: 'The order to look up.',
      description: 'Switch the mode from the menu, or insert a variable.',
      validation: { required: true },
      valueModes: { modes: ['literal', 'expression', 'variable'] },
      headerActions: ['insert-variable'],
      menuActions: ['clear'],
    }],
  }],
};

// Stable: declared once, outside the component.
const plugins: FormPlugin[] = [{
  name: 'host',
  variables: [/* VariablePickerItem[], or a function */],
  fieldActions: { header: { 'insert-variable': createInsertVariableAction({}) } },
}];

<MetadataForm schema={schema} plugins={plugins} onSubmit={save} />`;

function MetadataFormExample() {
  const [values, setValues] = useState<Record<string, unknown>>({});
  // Reading values is a plugin's job; this one only mirrors them for the page.
  const [observer] = useState<FormPlugin>(() => ({
    name: 'observer',
    onValueChange: (_name, _value, context) => setValues({ ...context.values }),
  }));
  const [plugins] = useState(() => [...PLUGINS, observer]);
  return (
    <div className="max-w-md space-y-4">
      <MetadataForm schema={SCHEMA} plugins={plugins} container="div" />
      <div>
        <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          Stored value
        </span>
        <pre className="mt-1 text-xs text-muted-foreground">
          {JSON.stringify(values.orderId ?? null)}
        </pre>
      </div>
    </div>
  );
}

const HAND_CODE = `<FormField>
  <FormFieldHeader
    label="Order id"
    htmlFor="order-id"
    tooltip="The order to look up."
    actions={<InsertVariableAction variables={variables} onInsert={insert} />}
  />
  <InputGroup error={value ? undefined : 'Enter an order id to continue.'}>
    <InputGroupAddon>
      <ValueModeIndicator mode={mode} className="px-0" />
    </InputGroupAddon>
    <Input id="order-id" value={value} onChange={(e) => setValue(e.target.value)} />
    <InputGroupAddon align="inline-end">
      <FieldMenu
        mode={mode}
        onSelect={setMode}
        actions={[{ id: 'clear', label: 'Clear value', icon: X, onSelect: () => setValue('') }]}
      />
    </InputGroupAddon>
  </InputGroup>
  <FormFieldDescription>Switch the mode from the menu, or insert a variable.</FormFieldDescription>
</FormField>`;

function HandComposedExample() {
  const [mode, setMode] = useState<ValueMode>('literal');
  const [value, setValue] = useState('1042');
  const expression = mode === 'expression';
  return (
    <FormField className="max-w-md">
      <FormFieldHeader
        label="Order id"
        htmlFor="hand-order-id"
        tooltip="The order to look up."
        actions={
          <InsertVariableAction
            variables={VARIABLES}
            onInsert={(reference) => {
              setMode('expression');
              setValue((current) => (current ? `${current} ${reference}` : reference));
            }}
          />
        }
      />
      <InputGroup
        error={value ? undefined : 'Enter an order id to continue.'}
        errorId="hand-order-id-error"
      >
        <InputGroupAddon>
          <ValueModeIndicator mode={mode} className="px-0" />
        </InputGroupAddon>
        <Input
          id="hand-order-id"
          value={value}
          onChange={(event) => setValue(event.target.value)}
          className={expression ? 'font-mono' : undefined}
          placeholder={expression ? '$vars.orderId' : 'Enter an order id'}
        />
        <InputGroupAddon align="inline-end">
          <FieldMenu
            mode={mode}
            onSelect={setMode}
            modes={['literal', 'expression']}
            actions={[{ id: 'clear', label: 'Clear value', icon: X, onSelect: () => setValue('') }]}
          />
        </InputGroupAddon>
      </InputGroup>
      <FormFieldDescription>
        Switch the mode from the menu, or insert a variable.
      </FormFieldDescription>
    </FormField>
  );
}

interface PartRow {
  part: string;
  component: React.ReactNode;
  metadata: React.ReactNode;
}

const PARTS: PartRow[] = [
  {
    part: 'Field',
    component: <InlineCode>FormField</InlineCode>,
    metadata: 'The field, stacked with the field rhythm.',
  },
  {
    part: 'Header',
    component: (
      <>
        <InlineCode>FormFieldHeader</InlineCode> (label, required marker, tooltip, badge, actions)
      </>
    ),
    metadata: (
      <>
        <InlineCode>label</InlineCode>, <InlineCode>validation.required</InlineCode>,{' '}
        <InlineCode>tooltip</InlineCode>, <InlineCode>badge</InlineCode>,{' '}
        <InlineCode>headerActions</InlineCode>
      </>
    ),
  },
  {
    part: 'Box',
    component: (
      <>
        <InlineCode>InputGroup</InlineCode> (<InlineCode>layout</InlineCode>,{' '}
        <InlineCode>variant</InlineCode>)
      </>
    ),
    metadata: (
      <>
        The control's registration, or <InlineCode>FIELD_CONTROL_GEOMETRY</InlineCode> for its field
        type
      </>
    ),
  },
  {
    part: 'Mode glyph',
    component: (
      <>
        <InlineCode>ValueModeIndicator</InlineCode> in an <InlineCode>InputGroupAddon</InlineCode>
      </>
    ),
    metadata: 'The active mode: = for an expression, or the mode definition’s indicator',
  },
  {
    part: 'Control',
    component: (
      <>
        <InlineCode>FieldControl</InlineCode>, <InlineCode>VariableValueControl</InlineCode>,{' '}
        <InlineCode>PromptValueControl</InlineCode>, or a registered control
      </>
    ),
    metadata: (
      <>
        <InlineCode>type</InlineCode> and the active mode;{' '}
        <InlineCode>valueModes.controls</InlineCode> names a registered one
      </>
    ),
  },
  {
    part: 'Menu',
    component: (
      <>
        <InlineCode>FieldMenu</InlineCode> in a trailing <InlineCode>InputGroupAddon</InlineCode>
      </>
    ),
    metadata: (
      <>
        <InlineCode>valueModes.modes</InlineCode> (when switchable), then{' '}
        <InlineCode>menuActions</InlineCode>
      </>
    ),
  },
  {
    part: 'Description',
    component: <InlineCode>FormFieldDescription</InlineCode>,
    metadata: <InlineCode>description</InlineCode>,
  },
  {
    part: 'Message',
    component: (
      <>
        <InlineCode>FormFieldError</InlineCode>, or the <InlineCode>error</InlineCode> prop of a
        control with a message slot
      </>
    ),
    metadata: (
      <>
        <InlineCode>validation</InlineCode>, or{' '}
        <InlineCode>ValueModeDefinition.validate</InlineCode> in another mode
      </>
    ),
  },
];

function PartsTable() {
  return (
    <div className="rounded-lg border border-border">
      <Table>
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            <TableHead className="w-[14%]">Part</TableHead>
            <TableHead className="w-[43%]">Component</TableHead>
            <TableHead>In MetadataForm, from</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {PARTS.map((row) => (
            <TableRow key={row.part}>
              <TableCell className="align-top font-medium">{row.part}</TableCell>
              <TableCell className="align-top text-sm text-muted-foreground">
                {row.component}
              </TableCell>
              <TableCell className="align-top text-sm text-muted-foreground">
                {row.metadata}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

function StoryLink({ id, children }: { id: string; children: React.ReactNode }) {
  return (
    <a
      // Relative to the iframe path so the link also works when Storybook is hosted under a subpath.
      href={`./?path=/docs/${id}`}
      target="_top"
      className="text-primary underline-offset-4 hover:underline"
    >
      {children}
    </a>
  );
}

function FieldAnatomyGuidancePage({ globalTheme }: { globalTheme: string }) {
  return (
    <GuidancePage
      globalTheme={globalTheme}
      title="Field Anatomy Guidance"
      intro="Every form field in Apollo Wind is built from the same parts: a header, the control in its box, and a description or validation message. MetadataForm assembles them from a field's metadata and owns the field's value, validation and actions, so build forms with MetadataForm. Compose the parts by hand for a field that has no form to belong to, and inside a custom control, so its label, description and message match every other field."
      maxWidth="max-w-5xl"
    >
      <Divider />

      <section>
        <SectionTitle>Start with MetadataForm</SectionTitle>
        <SectionDescription>
          Describe the field and MetadataForm renders the whole anatomy, wired: ids and ARIA,
          validation messages, mode switching, the Insert and Clear actions, and the value in its
          stored shape. This is the fully controlled path, and the one every other page here
          assumes.
        </SectionDescription>
        <div className="grid gap-5">
          <PatternCard
            eyebrow="Live"
            title="A mode-aware field"
            description="Three value modes, Insert variable in the header and Clear in the menu. Clear the value to see the required message."
          >
            <MetadataFormExample />
          </PatternCard>
          <CodeBlock>{SCHEMA_CODE}</CodeBlock>
        </div>
        <div className="mt-6">
          <GuidanceList>
            <GuidanceItem>
              <span className="font-medium text-foreground">The value.</span> One react-hook-form
              instance holds every field. A field with modes stores{' '}
              <InlineCode>{'{ $mode, value }'}</InlineCode>; a cleared one stores{' '}
              <InlineCode>{'{ $mode }'}</InlineCode>. A host reads and drives values through a
              plugin.
            </GuidanceItem>
            <GuidanceItem>
              <span className="font-medium text-foreground">Validation.</span> A fixed value is
              checked by its field type&rsquo;s rules; another mode by{' '}
              <InlineCode>required</InlineCode> and the mode&rsquo;s{' '}
              <InlineCode>validate</InlineCode>. Messages render below the control.
            </GuidanceItem>
            <GuidanceItem>
              <span className="font-medium text-foreground">Rules and data sources.</span> Rules,
              section conditions and data-source params read a field&rsquo;s fixed value only; a
              field in another mode matches nothing.
            </GuidanceItem>
            <GuidanceItem>
              <span className="font-medium text-foreground">Actions.</span> Insert variable writes
              at the caret, or switches the field to a mode that takes the reference. AI assist and
              Clear are built in; the switch and replace dialogs ask before a value is lost.
            </GuidanceItem>
            <GuidanceItem>
              <span className="font-medium text-foreground">Strings.</span> Every built-in string
              comes through <InlineCode>FormPlugin.strings</InlineCode>, so a host localises the
              form in one place.
            </GuidanceItem>
          </GuidanceList>
        </div>
        <div className="mt-6">
          <InfoCallout>
            Validation in the browser helps people fix a value before they submit it. It is not a
            control: validate submitted values on the server as well.
          </InfoCallout>
        </div>
      </section>

      <Divider />

      <section>
        <SectionTitle>The parts</SectionTitle>
        <SectionDescription>
          MetadataForm renders a field with <InlineCode>valueModes</InlineCode>,{' '}
          <InlineCode>headerActions</InlineCode>, <InlineCode>menuActions</InlineCode> or{' '}
          <InlineCode>badge</InlineCode> through <InlineCode>ModeAwareField</InlineCode>, which
          stacks every part below. Any other field renders the label, the control, and the
          description or message.
        </SectionDescription>
        <PartsTable />
      </section>

      <Divider />

      <section>
        <SectionTitle>Composing the parts by hand</SectionTitle>
        <SectionDescription>
          For a field outside any form, such as a single setting in a panel that keeps its own
          state, compose the same parts so it looks and behaves like a MetadataForm field. You take
          on what MetadataForm did for you. The same goes for a custom control: build it from
          whichever parts apply rather than drawing its own label, box or message.
        </SectionDescription>
        <div className="grid gap-5">
          <PatternCard
            eyebrow="Live"
            title="The same field, composed"
            description="Local state for the mode and the value. Inserting a variable switches to Expression; clearing shows the message."
          >
            <HandComposedExample />
          </PatternCard>
          <CodeBlock>{HAND_CODE}</CodeBlock>
        </div>
        <div className="mt-6">
          <GuidanceList>
            <GuidanceItem>
              Hold the value and its mode, and convert between modes yourself: nothing stores an
              envelope for you.
            </GuidanceItem>
            <GuidanceItem>
              Name the control with the label&rsquo;s <InlineCode>htmlFor</InlineCode>, and pass{' '}
              <InlineCode>error</InlineCode> to a control with a message slot so the stroke and ARIA
              are wired. Otherwise set <InlineCode>aria-invalid</InlineCode> and render{' '}
              <InlineCode>FormFieldError</InlineCode>.
            </GuidanceItem>
            <GuidanceItem>
              Write what the actions produce: <InlineCode>InsertVariableAction</InlineCode> hands
              you the reference, and each <InlineCode>FieldMenu</InlineCode> item runs your handler.
            </GuidanceItem>
            <GuidanceItem>
              With a field&rsquo;s metadata but no form, <InlineCode>FieldControl</InlineCode>{' '}
              renders the built-in control for its type, with the ids MetadataForm would give it.
            </GuidanceItem>
            <GuidanceItem>
              <span className="font-medium text-foreground">In a custom control.</span> A component
              registered in <InlineCode>FormPlugin.components</InlineCode> renders the whole field
              when the field has no value modes or actions: compose{' '}
              <InlineCode>FormField</InlineCode>, <InlineCode>FormFieldLabel</InlineCode>,{' '}
              <InlineCode>FormFieldDescription</InlineCode> and{' '}
              <InlineCode>FormFieldError</InlineCode> around its control. With modes or actions,
              MetadataForm renders those parts and the component is only the control: let the{' '}
              <InlineCode>InputGroup</InlineCode> draw the box (mark the focusable element{' '}
              <InlineCode>data-slot=&quot;input-group-control&quot;</InlineCode>, or read{' '}
              <InlineCode>useInputGroup()</InlineCode>) instead of drawing its own.
            </GuidanceItem>
          </GuidanceList>
        </div>
      </section>

      <Divider />

      <section>
        <SectionTitle>Rules</SectionTitle>
        <div className="grid gap-5 md:grid-cols-2">
          <ExampleCard
            kind="do"
            note="Compose a custom field from the anatomy parts, so it matches the fields MetadataForm renders."
          >
            <FormField>
              <FormFieldLabel htmlFor="rules-do" required>
                Queue name
              </FormFieldLabel>
              <InputGroup error="Enter a queue name." errorId="rules-do-error">
                <Input id="rules-do" placeholder="Invoices" />
              </InputGroup>
            </FormField>
          </ExampleCard>
          <ExampleCard
            kind="dont"
            note="Don’t hand-roll the label, description or message, or wrap fields in a local shell. Field errors use FormFieldError’s text-error, never text-destructive."
          >
            <div className="grid gap-1">
              <Label htmlFor="rules-dont">Queue name *</Label>
              <Input id="rules-dont" placeholder="Invoices" aria-invalid />
              <p className="text-sm text-destructive">Enter a queue name.</p>
            </div>
          </ExampleCard>
        </div>
        <div className="mt-6">
          <GuidanceList>
            <GuidanceItem>
              Put actions in the header, never inside the box: the box holds only the control and
              its mode addons.
            </GuidanceItem>
            <GuidanceItem>
              Localise through each component&rsquo;s <InlineCode>strings</InlineCode> prop, or{' '}
              <InlineCode>FormPlugin.strings</InlineCode> for a MetadataForm. There is no provider.
            </GuidanceItem>
            <GuidanceItem>
              Keep plugin objects stable: declare them once, or memoize them. Pass variables as a
              function when the list is long or changes, so it is read only when a picker opens.
            </GuidanceItem>
          </GuidanceList>
        </div>
      </section>

      <Divider />

      <section>
        <SectionTitle>Related</SectionTitle>
        <GuidanceList>
          <GuidanceItem>
            <StoryLink id="apollo-wind-forms-metadata-form--docs">Forms/Metadata Form</StoryLink>:
            one story per MetadataForm capability.
          </GuidanceItem>
          <GuidanceItem>
            <StoryLink id="apollo-wind-forms-value-modes--docs">Forms/Value modes</StoryLink> and{' '}
            <StoryLink id="apollo-wind-forms-field-actions--docs">Forms/Field actions</StoryLink>:
            the modes, codecs, controls and actions in depth.
          </GuidanceItem>
          <GuidanceItem>
            <StoryLink id="apollo-wind-forms-custom-controls--docs">
              Forms/Custom Controls
            </StoryLink>
            : registering a control for a value no built-in field type covers.
          </GuidanceItem>
          <GuidanceItem>
            <StoryLink id="apollo-wind-components-core-form-field--docs">
              Components/Core/Form Field
            </StoryLink>
            : each part on its own.
          </GuidanceItem>
          <GuidanceItem>
            The Field Type, Field Help and Field Validation guidance pages: which field type to use,
            and how to write its help and messages.
          </GuidanceItem>
        </GuidanceList>
      </section>
    </GuidancePage>
  );
}

export const Documentation: Story = {
  name: 'Documentation',
  render: (_args, { globals }) => (
    <TooltipProvider>
      <FieldAnatomyGuidancePage globalTheme={globals.theme || 'future-dark'} />
    </TooltipProvider>
  ),
};
