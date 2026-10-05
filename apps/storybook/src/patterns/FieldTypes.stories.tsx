import type { Meta, StoryObj } from '@storybook/react-vite';
import type * as React from 'react';
import { useState } from 'react';
import {
  createInsertVariableAction,
  FIELD_CONTROL_GEOMETRY,
  type FieldMetadata,
  type FieldType,
  type FormPlugin,
  type FormSchema,
  MetadataForm,
} from '@/components/forms';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
  FIELD_TYPE_META,
  FIELD_TYPE_ORDER,
  type QuickFieldType,
  QuickFormField,
  type QuickFormFieldMode,
} from '@/components/ui/quick-form-field';
import { Switch } from '@/components/ui/switch';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { TooltipProvider } from '@/components/ui/tooltip';
import { cn } from '@/lib';
import {
  CodeBlock,
  Divider,
  GuidanceItem,
  GuidanceList,
  GuidancePage,
  InfoCallout,
  InlineCode,
  SectionDescription,
} from './guidance-primitives';

const meta = {
  title: 'Apollo Wind/Forms/Guidance Field Type',
  parameters: { layout: 'fullscreen' },
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

// ============================================================================
// Live examples
// ============================================================================

const VARIABLES = [
  {
    id: 'vars',
    label: '$vars',
    children: [
      { id: 'customerName', label: 'customerName', value: '$vars.customerName', type: 'string' },
      { id: 'orderId', label: 'orderId', value: '$vars.orderId', type: 'string' },
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

/** A one-field form with no title or buttons, built once per field so its schema stays stable. */
const SCHEMAS = new Map<string, FormSchema>();
function schemaFor(field: FieldMetadata): FormSchema {
  let schema = SCHEMAS.get(field.name);
  if (!schema) {
    schema = {
      id: `example-${field.name}`,
      title: '',
      actions: [],
      sections: [{ id: 'main', fields: [field] }],
    };
    SCHEMAS.set(field.name, schema);
  }
  return schema;
}

function FieldExample({ field }: { field: FieldMetadata }) {
  return (
    <div className="w-64">
      <MetadataForm schema={schemaFor(field)} plugins={PLUGINS} container="div" />
    </div>
  );
}

const OPTIONS = [
  { label: 'Invoices', value: 'invoices' },
  { label: 'Receipts', value: 'receipts' },
  { label: 'Contracts', value: 'contracts' },
];

/** One example field per MetadataForm field type. `custom` has none: the host registers it. */
const TYPE_EXAMPLES: Partial<Record<FieldType, FieldMetadata>> = {
  text: { name: 'text', type: 'text', label: 'Customer name', placeholder: 'Ada Lovelace' },
  email: { name: 'email', type: 'email', label: 'Email', placeholder: 'ada@example.com' },
  textarea: { name: 'textarea', type: 'textarea', label: 'Notes', minRows: 2 },
  number: { name: 'number', type: 'number', label: 'Retries', min: 0, max: 10 },
  select: { name: 'select', type: 'select', label: 'Queue', options: OPTIONS },
  multiselect: { name: 'multiselect', type: 'multiselect', label: 'Queues', options: OPTIONS },
  radio: { name: 'radio', type: 'radio', label: 'Priority', options: OPTIONS.slice(0, 2) },
  checkbox: { name: 'checkbox', type: 'checkbox', label: 'Notify the owner' },
  switch: { name: 'switch', type: 'switch', label: 'Enabled' },
  boolean: { name: 'boolean', type: 'boolean', label: 'Approved' },
  slider: { name: 'slider', type: 'slider', label: 'Confidence', min: 0, max: 100 },
  date: { name: 'date', type: 'date', label: 'Due date' },
  datetime: { name: 'datetime', type: 'datetime', label: 'Starts at' },
  file: { name: 'file', type: 'file', label: 'Attachment' },
  'string-list': { name: 'stringList', type: 'string-list', label: 'Keywords' },
};

// ============================================================================
// MetadataForm field types
// ============================================================================

interface FieldTypeRow {
  type: FieldType;
  control: string;
  value: string;
  props: string;
}

const FIELD_TYPE_ROWS: FieldTypeRow[] = [
  {
    type: 'text',
    control: 'Input',
    value: 'string',
    props: 'placeholder, validation.minLength / maxLength / pattern',
  },
  { type: 'email', control: 'Input type="email"', value: 'string', props: 'validation.email' },
  { type: 'textarea', control: 'Textarea', value: 'string', props: 'rows, minRows, maxLength' },
  {
    type: 'number',
    control: 'Input type="number"',
    value: 'number',
    props: 'min, max, step, validation.integer',
  },
  { type: 'select', control: 'Select', value: 'string', props: 'options, or dataSource' },
  {
    type: 'multiselect',
    control: 'MultiSelect',
    value: 'string[]',
    props: 'options, maxSelected, validation.minItems',
  },
  { type: 'radio', control: 'RadioGroup', value: 'string', props: 'options' },
  { type: 'checkbox', control: 'Checkbox', value: 'boolean', props: 'description' },
  { type: 'switch', control: 'Switch', value: 'boolean', props: 'description' },
  {
    type: 'boolean',
    control: 'BooleanRadioGroup',
    value: 'boolean | null',
    props: 'True, False, or not set',
  },
  { type: 'slider', control: 'Slider', value: 'number', props: 'min, max, step, maxRef' },
  { type: 'date', control: 'DatePicker', value: 'Date', props: 'placeholder' },
  { type: 'datetime', control: 'DateTimePicker', value: 'Date', props: 'use12Hour' },
  {
    type: 'file',
    control: 'FileUpload',
    value: 'File | File[]',
    props: 'accept, multiple, maxSize',
  },
  {
    type: 'string-list',
    control: 'Rows of Textarea',
    value: 'string[]',
    props: 'maxItems, maxLength, addItemLabel',
  },
  {
    type: 'custom',
    control: 'The registered component',
    value: 'valueType',
    props: 'component, componentProps, valueType',
  },
];

// Smaller and denser than the Table primitive's default header, so a wide reference table reads as
// a table rather than prose.
const HEADER_CELL_CLASS =
  'h-9 whitespace-nowrap bg-muted/40 text-[11px] font-semibold uppercase tracking-wide';
const BODY_CELL_CLASS = 'align-top px-4 py-3';

function FieldTypesTable() {
  return (
    <div className="rounded-lg border border-border">
      <Table>
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            <TableHead className={cn(HEADER_CELL_CLASS, 'w-[12%]')}>type</TableHead>
            <TableHead className={cn(HEADER_CELL_CLASS, 'w-[30%]')}>Example</TableHead>
            <TableHead className={cn(HEADER_CELL_CLASS, 'w-[15%]')}>Control</TableHead>
            <TableHead className={cn(HEADER_CELL_CLASS, 'w-[11%]')}>Value</TableHead>
            <TableHead className={cn(HEADER_CELL_CLASS, 'w-[10%]')}>Anatomy box</TableHead>
            <TableHead className={HEADER_CELL_CLASS}>Type-specific metadata</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {FIELD_TYPE_ROWS.map((row) => {
            const example = TYPE_EXAMPLES[row.type];
            const geometry = FIELD_CONTROL_GEOMETRY[row.type];
            return (
              <TableRow key={row.type}>
                <TableCell className={cn(BODY_CELL_CLASS, 'font-mono text-xs')}>
                  {row.type}
                </TableCell>
                <TableCell className={BODY_CELL_CLASS}>
                  {example ? <FieldExample field={example} /> : <HostRegistered />}
                </TableCell>
                <TableCell className={cn(BODY_CELL_CLASS, 'text-xs text-muted-foreground')}>
                  {row.control}
                </TableCell>
                <TableCell
                  className={cn(BODY_CELL_CLASS, 'font-mono text-xs text-muted-foreground')}
                >
                  {row.value}
                </TableCell>
                <TableCell className={cn(BODY_CELL_CLASS, 'text-xs text-muted-foreground')}>
                  {row.type === 'custom'
                    ? 'Its registration'
                    : geometry
                      ? geometry.layout
                      : 'Not fitted yet'}
                </TableCell>
                <TableCell className={cn(BODY_CELL_CLASS, 'text-xs text-muted-foreground')}>
                  {row.props}
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}

function HostRegistered() {
  return (
    <div className="flex h-9 w-64 items-center justify-center rounded-lg border border-dashed border-border px-2 text-center text-[11px] text-muted-foreground">
      Registered by the host
    </div>
  );
}

// ============================================================================
// Value modes
// ============================================================================

const ALL_MODES_FIELD: FieldMetadata = {
  name: 'recipient',
  type: 'text',
  label: 'Recipient',
  placeholder: 'Enter a name',
  description: 'Switch the mode from the menu at the end of the box.',
  valueModes: { modes: ['literal', 'expression', 'variable', 'prompt'] },
  headerActions: ['insert-variable'],
};

// ============================================================================
// flow-workbench type coverage
// ============================================================================

type Status = 'supported' | 'custom-control' | 'needs-component';

interface TypeRow {
  type: string;
  source: string;
  support: string;
  status: Status;
  action?: string;
  /** False when flow-workbench is not confirmed to render this as a distinct control. */
  flowWorkbenchConfirmed?: boolean;
}

interface Category {
  title: string;
  description: string;
  rows: TypeRow[];
}

const CATEGORIES: Category[] = [
  {
    title: 'Temporal',
    description:
      'Dates and date-times have field types. Time of day and durations have no control.',
    rows: [
      {
        type: 'date',
        source: 'JSON Schema, entity fields, hitl-schema-types',
        support: "type: 'date'",
        status: 'supported',
      },
      {
        type: 'datetime / date-time',
        source: 'hitl-schema-types, integration-service WidgetType.Datetime, entity field dateTime',
        support: "type: 'datetime'",
        status: 'supported',
      },
      {
        type: 'time',
        source: 'integration-service WidgetType.Time, entity field time',
        support: 'No time-of-day control.',
        status: 'needs-component',
        action: 'Build a time picker, then register it as a custom control or add a field type.',
      },
      {
        type: 'duration / timeSpan',
        source: 'integration-service WidgetType.Timespan',
        support: 'No duration control.',
        status: 'needs-component',
        action: 'Build a segmented number plus unit control.',
      },
    ],
  },
  {
    title: 'Numeric',
    description: 'One number field type covers integers and decimals; validation narrows it.',
    rows: [
      {
        type: 'integer',
        source: 'JSON Schema, hitl-schema-types',
        support: "type: 'number' with validation.integer",
        status: 'supported',
      },
      {
        type: 'number / float / double',
        source: 'hitl-schema-types (float, double), JSON Schema number',
        support: "type: 'number'",
        status: 'supported',
      },
      {
        type: 'int32 / int64',
        source: 'hitl-schema-types schema definitions',
        support: "type: 'number' with min and max",
        status: 'supported',
        action:
          'The bit width is a backend constraint; express its range with min and max if it matters.',
        flowWorkbenchConfirmed: false,
      },
    ],
  },
  {
    title: 'Boolean',
    description: 'A true or false value, with or without an unset state.',
    rows: [
      {
        type: 'boolean',
        source: 'JSON Schema, hitl-schema-types',
        support:
          "type: 'boolean' (True, False or not set); 'switch' or 'checkbox' when it is never unset",
        status: 'supported',
      },
    ],
  },
  {
    title: 'Text and string formats',
    description:
      'Text field types with validation cover most formats. Code-like values need an editor.',
    rows: [
      {
        type: 'string',
        source: 'JSON Schema',
        support: "type: 'text', or 'textarea' for long text",
        status: 'supported',
      },
      {
        type: 'email',
        source: 'JSON Schema format',
        support: "type: 'email'",
        status: 'supported',
      },
      {
        type: 'uri / uuid',
        source: 'JSON Schema format extensions',
        support: "type: 'text' with validation.pattern",
        status: 'supported',
      },
      {
        type: 'text / any / json',
        source: 'argument-utils.ts, expression-model getEffectiveType fallback',
        support: "type: 'textarea', or a code editor registered as a custom control",
        status: 'custom-control',
        action:
          'Register a code editor (see Patterns/Code Editors) with layout "fill" and labelTarget "labelledby".',
      },
      {
        type: 'monetary / currency',
        source: 'JSON Schema format extensions',
        support: "type: 'number' holds the amount; no symbol or locale formatting",
        status: 'custom-control',
        action: 'Register a currency input as a custom control.',
      },
      {
        type: 'verbatim',
        source: 'JSON Schema format extension',
        support: "type: 'text'",
        status: 'supported',
        action: 'Confirm with flow-workbench whether verbatim differs from string at the UI layer.',
        flowWorkbenchConfirmed: false,
      },
    ],
  },
  {
    title: 'Security',
    description: 'No masked or credential-aware control exists.',
    rows: [
      {
        type: 'Secret',
        source: 'asset-binding.ts, schemaTypeDisplay.tsx',
        support: 'No masked control.',
        status: 'needs-component',
        action: 'Build a masked input with no plaintext reveal.',
      },
      {
        type: 'Credential',
        source: 'asset-binding.ts',
        support: 'No credential picker.',
        status: 'needs-component',
        action: 'Likely a connection-style picker rather than free text.',
      },
      {
        type: 'secretAsset / credentialAsset',
        source: 'asset-binding.ts',
        support: 'No control.',
        status: 'needs-component',
        action:
          'Likely the secret and credential controls bound through the asset system; confirm with flow-schema owners.',
      },
    ],
  },
  {
    title: 'Object and collection',
    description:
      'Lists of strings have a field type. Objects, maps and lists of anything else need a control.',
    rows: [
      {
        type: 'stringArray / rawStringArray',
        source: 'integration-service WidgetType',
        support: "type: 'string-list', or 'multiselect' for a fixed set",
        status: 'supported',
      },
      {
        type: 'object',
        source: 'JSON Schema',
        support: 'No object field type.',
        status: 'custom-control',
        action: 'Register a JSON or code editor as a custom control.',
      },
      {
        type: 'array (generic)',
        source: 'Workflow variables dropdown, JSON Schema',
        support: 'No row editor for an arbitrary item type.',
        status: 'needs-component',
        action: 'Build a row editor: add, remove and reorder rows of any item type.',
      },
      {
        type: 'dictionary',
        source: 'integration-service WidgetType.dictionary',
        support: 'No key-value editor.',
        status: 'needs-component',
        action: 'Build a key-value map editor.',
      },
      {
        type: 'collection',
        source: 'integration-service WidgetType.collection',
        support: 'No control.',
        status: 'needs-component',
        action: 'Clarify against the generic array row; it may be the same concept.',
        flowWorkbenchConfirmed: false,
      },
      {
        type: 'stringArrayWithExpression',
        source: 'integration-service WidgetType',
        support: "type: 'string-list', with value modes on the field as a whole",
        status: 'supported',
        action: 'Per-row modes need a row editor; see the generic array row.',
        flowWorkbenchConfirmed: false,
      },
    ],
  },
  {
    title: 'File and media',
    description: 'Upload has a field type; picking an existing resource does not.',
    rows: [
      {
        type: 'file',
        source: 'JSON Schema resource-kind extension, hitl-schema-types',
        support: "type: 'file'",
        status: 'supported',
      },
      {
        type: 'browser / localResource',
        source: 'integration-service WidgetType',
        support: 'No file system or folder picker.',
        status: 'needs-component',
        action: 'Build a picker for existing resources.',
      },
      {
        type: 'image / icon',
        source: 'integration-service WidgetType',
        support: 'No image picker.',
        status: 'needs-component',
        action: 'Build an image or icon picker with a preview.',
      },
    ],
  },
  {
    title: 'Choice controls',
    description: 'Single and multiple choice have field types, with static or fetched options.',
    rows: [
      {
        type: 'single-select / dropdown',
        source: 'JSON Schema enum, integration-service dropdown',
        support: "type: 'select'",
        status: 'supported',
      },
      {
        type: 'multi-select',
        source: 'JSON Schema, integration-service',
        support: "type: 'multiselect'",
        status: 'supported',
      },
      {
        type: 'radioGroup',
        source: 'integration-service WidgetType.radioGroup',
        support: "type: 'radio'",
        status: 'supported',
      },
      {
        type: 'checkboxGroup',
        source: 'integration-service WidgetType.checkboxGroup',
        support: "Closest is type: 'multiselect'",
        status: 'custom-control',
        action: 'Register an all-options-visible checkbox group if the distinction matters.',
        flowWorkbenchConfirmed: false,
      },
      {
        type: 'autoComplete / connectorAutocomplete',
        source: 'integration-service WidgetType',
        support:
          "type: 'select' with a remote dataSource loads options, but does not search as you type",
        status: 'needs-component',
        action: 'Build an async-search control; Combobox is the starting point.',
      },
    ],
  },
  {
    title: 'Resource reference',
    description: 'A whole family with no control.',
    rows: [
      {
        type: 'connection / entity / process / app / portal / definition / solutionResource',
        source: 'solution-resource-picker/kinds',
        support: 'No resource picker.',
        status: 'needs-component',
        action:
          'Build one resource-reference picker parameterized by kind, then register it as a custom control.',
      },
    ],
  },
  {
    title: 'Rich and composite controls',
    description: 'Controls whose interaction is not a single value field.',
    rows: [
      {
        type: 'promptComposer / promptSingleValue',
        source: 'integration-service WidgetType',
        support: 'The prompt value mode (PromptValueControl); PromptEditor for prompts with tokens',
        status: 'supported',
      },
      {
        type: 'richText / richTextComposer',
        source: 'integration-service WidgetType',
        support: 'No rich text editor.',
        status: 'needs-component',
        action: 'Build a rich text editor control.',
      },
      {
        type: 'filter / conditionBuilder',
        source: 'integration-service WidgetType',
        support: 'No condition builder.',
        status: 'needs-component',
        action: 'Build a condition or query builder control.',
      },
      {
        type: 'outputMapping / dataMapping',
        source: 'integration-service WidgetType',
        support: 'No mapping control.',
        status: 'needs-component',
        action: 'Build a field-mapping control for source to target pairs.',
      },
      {
        type: 'typePicker',
        source: 'integration-service WidgetType',
        support: 'No type picker.',
        status: 'needs-component',
        action: 'Build a schema or type picker control.',
      },
    ],
  },
  {
    title: 'Loose and fallback types',
    description: 'Edge cases that usually resolve to another row.',
    rows: [
      {
        type: 'null',
        source: 'JSON Schema, flow-schema expression.ts',
        support:
          'Any field can be empty: a cleared value is null, or { $mode } for a field with modes',
        status: 'supported',
        flowWorkbenchConfirmed: false,
      },
      {
        type: 'ref',
        source: 'generate-variable-declarations.ts',
        support: 'Overlaps with the resource reference family.',
        status: 'needs-component',
        action: 'De-duplicate with the resource reference family before adding.',
        flowWorkbenchConfirmed: false,
      },
    ],
  },
];

const BINDING_ROWS: TypeRow[] = [
  {
    type: 'Widget',
    source: 'integration-service ValueType',
    support: "The 'literal' mode: the field type's own control",
    status: 'supported',
  },
  {
    type: 'Expression',
    source: 'integration-service ValueType',
    support: "The 'expression' mode",
    status: 'supported',
  },
  {
    type: 'Variable',
    source: 'integration-service ValueType.Variable',
    support: "The 'variable' mode (VariableValueControl)",
    status: 'supported',
  },
  {
    type: 'Mapping / Dynamic',
    source: 'integration-service ValueType',
    support: 'No built-in mode.',
    status: 'custom-control',
    action: 'Register a host mode in valueModes.definitions, with its own control.',
  },
  {
    type: 'Insert variable',
    source: 'Apollo Wind, not a flow-workbench type',
    support: "headerActions: ['insert-variable'] (createInsertVariableAction)",
    status: 'supported',
  },
  {
    type: 'Inline reference autocomplete',
    source: 'integration-service WidgetType.autoCompleteForExpression',
    support: 'The expression mode is a plain input with no suggestions.',
    status: 'custom-control',
    action:
      'Register an editor with suggestions (see Patterns/Code Editors) as the expression control in valueModes.definitions.',
  },
];

const ALL_SECTIONS: Category[] = [
  ...CATEGORIES,
  {
    title: 'Binding state',
    description:
      'Separate from the type: whether the value is fixed or bound. In MetadataForm these are value modes, available on any field type.',
    rows: BINDING_ROWS,
  },
];

const STATUS_META: Record<Status, { label: string; variant: 'success' | 'info' | 'warning' }> = {
  supported: { label: 'Supported', variant: 'success' },
  'custom-control': { label: 'Custom control', variant: 'info' },
  'needs-component': { label: 'Needs component', variant: 'warning' },
};

function StatusBadge({ status }: { status: Status }) {
  const statusMeta = STATUS_META[status];
  return (
    <Badge variant={statusMeta.variant} className="whitespace-nowrap">
      {statusMeta.label}
    </Badge>
  );
}

function gapCount(rows: TypeRow[]) {
  return rows.filter((row) => row.status !== 'supported').length;
}

function CategoryTable({ description, rows }: Category) {
  return (
    <div>
      <p className="mb-4 text-sm leading-6 text-muted-foreground">{description}</p>
      <div className="rounded-lg border border-border">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead className={cn(HEADER_CELL_CLASS, 'w-[15%]')}>
                flow-workbench type
              </TableHead>
              <TableHead className={cn(HEADER_CELL_CLASS, 'w-[23%]')}>In MetadataForm</TableHead>
              <TableHead className={cn(HEADER_CELL_CLASS, 'w-[12%]')}>Status</TableHead>
              <TableHead className={cn(HEADER_CELL_CLASS, 'w-[22%]')}>Recommended action</TableHead>
              <TableHead className={HEADER_CELL_CLASS}>Source</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((row) => (
              <TableRow key={row.type}>
                <TableCell className={cn(BODY_CELL_CLASS, 'font-mono text-xs')}>
                  {row.type}
                  {row.flowWorkbenchConfirmed === false && (
                    <sup
                      className="ml-0.5 cursor-help text-muted-foreground"
                      title="Not confirmed as a separately rendered type in flow-workbench, only a schema-level type name."
                    >
                      †
                    </sup>
                  )}
                </TableCell>
                <TableCell className={cn(BODY_CELL_CLASS, 'text-xs text-muted-foreground')}>
                  {row.support}
                </TableCell>
                <TableCell className={BODY_CELL_CLASS}>
                  <StatusBadge status={row.status} />
                </TableCell>
                <TableCell className={cn(BODY_CELL_CLASS, 'text-xs text-muted-foreground')}>
                  {row.action ?? ''}
                </TableCell>
                <TableCell className={cn(BODY_CELL_CLASS, 'text-xs text-muted-foreground')}>
                  {row.source}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

function CoverageAudit() {
  const [openSections, setOpenSections] = useState<string[]>([]);
  const [onlyGaps, setOnlyGaps] = useState(false);
  const visibleSections = onlyGaps
    ? ALL_SECTIONS.map((section) => ({
        ...section,
        rows: section.rows.filter((row) => row.status !== 'supported'),
      })).filter((section) => section.rows.length > 0)
    : ALL_SECTIONS;

  return (
    <>
      <div className="mb-4 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Switch id="only-gaps" size="sm" checked={onlyGaps} onCheckedChange={setOnlyGaps} />
          <Label htmlFor="only-gaps" className="text-sm font-medium text-foreground">
            Only show gaps
          </Label>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="2xs"
            onClick={() => setOpenSections(visibleSections.map((section) => section.title))}
          >
            Expand all
          </Button>
          <Button variant="outline" size="2xs" onClick={() => setOpenSections([])}>
            Collapse all
          </Button>
        </div>
      </div>
      <Accordion type="multiple" value={openSections} onValueChange={setOpenSections}>
        {visibleSections.map((section, index) => (
          <AccordionItem
            key={section.title}
            value={section.title}
            className={cn('border-border', index === visibleSections.length - 1 && 'border-b-0')}
          >
            <AccordionTrigger className="text-lg font-semibold text-foreground hover:no-underline">
              <span>
                {section.title}
                <span className="ml-2 text-sm font-normal text-muted-foreground">
                  {gapCount(section.rows) === 0
                    ? 'all supported'
                    : `${gapCount(section.rows)} gap${gapCount(section.rows) === 1 ? '' : 's'}`}
                </span>
              </span>
            </AccordionTrigger>
            <AccordionContent>
              <CategoryTable {...section} />
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </>
  );
}

// ============================================================================
// Page
// ============================================================================

// One level below the page's h1; the guidance-primitives SectionTitle is an h2 too, so this page
// nests h3 section titles under these parts.
function PartTitle({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="mb-6 text-[1.75rem] font-bold tracking-tight text-foreground">{children}</h2>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return <h3 className="mb-2 text-2xl font-bold tracking-tight text-foreground">{children}</h3>;
}

function StoryLink({ id, children }: { id: string; children: React.ReactNode }) {
  return (
    <a
      // Relative to the iframe path so the link also works when Storybook is hosted under a subpath.
      href={`./?path=/${id}`}
      target="_top"
      className="text-primary underline-offset-4 hover:underline"
    >
      {children}
    </a>
  );
}

const CUSTOM_CONTROL_CODE = `// The host registers the control once, with its place in the field anatomy.
const plugin: FormPlugin = {
  name: 'host',
  components: {
    'json-editor': { component: JsonEditor, layout: 'fill', labelTarget: 'labelledby' },
  },
};

// A field names it. valueType lets required and the other constraints apply.
{ name: 'payload', type: 'custom', component: 'json-editor', label: 'Payload', valueType: 'string' }`;

const LITERAL_CONTROL_CODE = `// Replace the fixed-value control of a built-in type, for fields with value modes.
const plugin: FormPlugin = {
  name: 'host',
  valueModes: { literalControls: { number: { component: Stepper } } },
};`;

const QUICK_FORM_VARIABLES = [
  {
    label: '$vars',
    value: '',
    children: [
      { label: 'customerName', value: '$vars.customerName' },
      { label: 'orderId', value: '$vars.orderId' },
    ],
  },
];

function QuickFormFieldExample() {
  const [fieldType, setFieldType] = useState<QuickFieldType>('string');
  const [value, setValue] = useState('Invoices');
  const [mode, setMode] = useState<QuickFormFieldMode>('literal');
  const [locked, setLocked] = useState(false);
  const [required, setRequired] = useState(true);
  return (
    <div className="w-80">
      <QuickFormField
        fieldType={fieldType}
        onFieldTypeChange={(next) => {
          setFieldType(next);
          // Each type encodes its value differently, so a new type starts empty.
          setValue('');
        }}
        value={value}
        onValueChange={setValue}
        mode={mode}
        onModeChange={setMode}
        locked={locked}
        onLockedChange={setLocked}
        required={required}
        onRequiredChange={setRequired}
        variables={QUICK_FORM_VARIABLES}
        compact
      />
    </div>
  );
}

const QUICK_FORM_FIELD_CODE = `<QuickFormField
  fieldType={fieldType}
  onFieldTypeChange={setFieldType}
  value={value}
  onValueChange={setValue}
  mode={mode}
  onModeChange={setMode}
  locked={locked}
  onLockedChange={setLocked}
  required={required}
  onRequiredChange={setRequired}
  variables={variables}
  compact
/>`;

function FieldTypesPage({ globalTheme }: { globalTheme: string }) {
  return (
    <GuidancePage
      globalTheme={globalTheme}
      title="Field Type Guidance"
      intro="How a value's type becomes a field. In a MetadataForm, a field's type picks its control, the shape of its value and its validation, and value modes let any field take an expression, a variable or a prompt instead. Use this page to map a type you need onto a field type, or onto a custom control when no field type covers it."
      maxWidth="max-w-6xl"
    >
      <Divider />

      <PartTitle>Field types in MetadataForm</PartTitle>

      <section>
        <SectionTitle>How a type becomes a field</SectionTitle>
        <SectionDescription>
          A field&rsquo;s <InlineCode>type</InlineCode> decides four things: the control that edits
          it, the value it stores, the validation its metadata can express, and how the control sits
          in the field anatomy&rsquo;s box. Everything else about the field, its label, help,
          actions and modes, works the same for every type.
        </SectionDescription>
        <GuidanceList>
          <GuidanceItem>
            Pick the field type that matches the value, then narrow it with metadata:{' '}
            <InlineCode>validation</InlineCode>, <InlineCode>min</InlineCode> and{' '}
            <InlineCode>max</InlineCode>, <InlineCode>options</InlineCode> or a{' '}
            <InlineCode>dataSource</InlineCode>.
          </GuidanceItem>
          <GuidanceItem>
            Add <InlineCode>valueModes</InlineCode> when the value can also be bound: the type still
            decides the control for a fixed value.
          </GuidanceItem>
          <GuidanceItem>
            When no field type fits, register a control as a <InlineCode>custom</InlineCode> field
            rather than building a field outside the form.
          </GuidanceItem>
        </GuidanceList>
        <p className="mt-4 text-sm leading-6 text-muted-foreground">
          The parts around the control are on the Field Anatomy Guidance page. For help text and
          validation messages, see the Field Help and Field Validation Guidance pages.
        </p>
      </section>

      <Divider />

      <section>
        <SectionTitle>Every field type</SectionTitle>
        <SectionDescription>
          Each example is a live MetadataForm field. Anatomy box is the layout the control takes in
          the field anatomy, read from FIELD_CONTROL_GEOMETRY; a type not fitted yet still renders,
          without a tuned box.
        </SectionDescription>
        <FieldTypesTable />
      </section>

      <Divider />

      <section>
        <SectionTitle>Value modes</SectionTitle>
        <SectionDescription>
          Separate from the type: whether the value is fixed or bound. A field lists the modes it
          offers in <InlineCode>valueModes.modes</InlineCode>, and stores its value as{' '}
          <InlineCode>{'{ $mode, value }'}</InlineCode>. The fixed value keeps the type&rsquo;s
          control; Expression is a plain input, Variable picks a variable, and Prompt describes the
          value for an agent.
        </SectionDescription>
        <div className="grid gap-5 md:grid-cols-2">
          <div className="rounded-lg border border-border bg-card p-5">
            <div className="w-full max-w-sm">
              <MetadataForm schema={schemaFor(ALL_MODES_FIELD)} plugins={PLUGINS} container="div" />
            </div>
          </div>
          <CodeBlock>{`{
  name: 'recipient',
  type: 'text',
  label: 'Recipient',
  valueModes: {
    modes: ['literal', 'expression',
            'variable', 'prompt'],
  },
  headerActions: ['insert-variable'],
}`}</CodeBlock>
        </div>
        <p className="mt-4 text-sm leading-6 text-muted-foreground">
          A host adds its own modes, controls and codecs through{' '}
          <InlineCode>FormPlugin.valueModes</InlineCode>. See{' '}
          <StoryLink id="docs/apollo-wind-forms-value-modes--docs">Forms/Value modes</StoryLink>.
        </p>
      </section>

      <Divider />

      <section>
        <SectionTitle>Custom controls for uncovered types</SectionTitle>
        <SectionDescription>
          For a value no field type covers, register a control and keep the field in the form: it
          gets the same validation, actions and modes as every other field. Build it from the field
          anatomy parts too, so its label, description and message match: without value modes or
          actions the component renders the whole field, and with them MetadataForm renders those
          parts around it. See the Field Anatomy Guidance page.
        </SectionDescription>
        <div className="space-y-4">
          <CodeBlock>{CUSTOM_CONTROL_CODE}</CodeBlock>
          <GuidanceList>
            <GuidanceItem>
              The component gets the value, <InlineCode>onChange</InlineCode> and{' '}
              <InlineCode>onBlur</InlineCode>; in the anatomy also{' '}
              <InlineCode>controlRef</InlineCode> for Insert variable and{' '}
              <InlineCode>labelId</InlineCode> for a control that names itself.
            </GuidanceItem>
            <GuidanceItem>
              <InlineCode>layout</InlineCode> and <InlineCode>variant</InlineCode> fit it to the
              box; <InlineCode>insertable</InlineCode> lets Insert variable write at its caret.
            </GuidanceItem>
          </GuidanceList>
          <CodeBlock>{LITERAL_CONTROL_CODE}</CodeBlock>
          <p className="text-sm leading-6 text-muted-foreground">
            A field can also name a control for one mode with{' '}
            <InlineCode>valueModes.controls</InlineCode>. See{' '}
            <StoryLink id="docs/apollo-wind-forms-custom-controls--docs">
              Forms/Custom Controls
            </StoryLink>
            .
          </p>
        </div>
      </section>

      <Divider />

      <section>
        <SectionTitle>When QuickFormField fits</SectionTitle>
        <SectionDescription>
          QuickFormField is for the people building a Quick Form, not for form authors. The end user
          picks each field&rsquo;s type in place, from the type menu in the field&rsquo;s header,
          and sets the rest of the field up there too. For any other form, the author picks the type
          in the schema: describe the fields to MetadataForm.
        </SectionDescription>
        <div className="grid items-start gap-5 md:grid-cols-2">
          <div className="space-y-4">
            <div className="rounded-lg border border-border bg-card p-5">
              <QuickFormFieldExample />
            </div>
            <CodeBlock>{QUICK_FORM_FIELD_CODE}</CodeBlock>
          </div>
          <div className="space-y-4">
            <GuidanceList>
              <GuidanceItem>
                <span className="font-medium text-foreground">Type.</span>{' '}
                <InlineCode>onFieldTypeChange</InlineCode> puts the type menu in the header, and the
                control swaps to match the type chosen. <InlineCode>fieldTypes</InlineCode> narrows
                the menu to the types a surface supports.
              </GuidanceItem>
              <GuidanceItem>
                <span className="font-medium text-foreground">Required.</span>{' '}
                <InlineCode>onRequiredChange</InlineCode> adds the Required switch to the header.
              </GuidanceItem>
              <GuidanceItem>
                <span className="font-medium text-foreground">Lock.</span>{' '}
                <InlineCode>locked</InlineCode> and <InlineCode>onLockedChange</InlineCode> make the
                value read-only for the person filling in the form, shown as plain text;{' '}
                <InlineCode>showLock</InlineCode> hides the toggle.
              </GuidanceItem>
              <GuidanceItem>
                <span className="font-medium text-foreground">Mode.</span>{' '}
                <InlineCode>mode</InlineCode> and <InlineCode>onModeChange</InlineCode> switch
                between a fixed value and an expression; <InlineCode>renderModeControl</InlineCode>{' '}
                supplies the control for any mode, Variable and Prompt included.
              </GuidanceItem>
              <GuidanceItem>
                <span className="font-medium text-foreground">Actions.</span>{' '}
                <InlineCode>variables</InlineCode> adds Insert variable to the header and{' '}
                <InlineCode>onGenerateWithAi</InlineCode> adds AI assist;{' '}
                <InlineCode>showFieldActions</InlineCode> hides both, and{' '}
                <InlineCode>headerActions</InlineCode> appends your own.
              </GuidanceItem>
              <GuidanceItem>
                <span className="font-medium text-foreground">Compact.</span>{' '}
                <InlineCode>compact</InlineCode> keeps the header to icons, for a narrow column; it
                collapses to icons on its own when the container is narrow.
              </GuidanceItem>
              <GuidanceItem>
                <span className="font-medium text-foreground">Strings.</span>{' '}
                <InlineCode>strings</InlineCode> overrides any of its text, for localisation.
              </GuidanceItem>
            </GuidanceList>
            <p className="text-sm leading-6 text-muted-foreground">
              Its types are its own list, the types a Quick Form persists:
            </p>
            <div className="flex flex-wrap gap-2">
              {FIELD_TYPE_ORDER.map((type) => {
                const typeMeta = FIELD_TYPE_META[type];
                return (
                  <span
                    key={type}
                    className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-3 py-1 text-xs font-medium text-foreground"
                  >
                    <typeMeta.icon size={12} />
                    {typeMeta.label}
                  </span>
                );
              })}
            </div>
            <p className="text-sm leading-6 text-muted-foreground">
              The <InlineCode>LockableValueField</InlineCode> names are deprecated aliases, removed
              in the next major release. See{' '}
              <StoryLink id="docs/apollo-wind-components-uipath-quick-form-field--docs">
                Quick Form Field
              </StoryLink>
              .
            </p>
          </div>
        </div>
      </section>

      <Divider />

      <PartTitle>flow-workbench type coverage</PartTitle>

      <section>
        <SectionDescription>
          flow-workbench has no single type enum: at least six overlapping type systems define field
          types across workflow variables, JSON Schema manifests, entity fields, HITL forms and the
          integration-service widget catalog. Each row maps one of those types onto MetadataForm.
        </SectionDescription>
        <div className="mb-6 grid gap-4 sm:grid-cols-3">
          <div className="rounded-lg border border-border bg-card p-4">
            <div className="mb-2">
              <StatusBadge status="supported" />
            </div>
            <p className="text-sm leading-6 text-muted-foreground">
              A field type or value mode covers it. Use it as it is.
            </p>
          </div>
          <div className="rounded-lg border border-border bg-card p-4">
            <div className="mb-2">
              <StatusBadge status="custom-control" />
            </div>
            <p className="text-sm leading-6 text-muted-foreground">
              An existing component can edit it: register that component as a custom control or a
              host mode.
            </p>
          </div>
          <div className="rounded-lg border border-border bg-card p-4">
            <div className="mb-2">
              <StatusBadge status="needs-component" />
            </div>
            <p className="text-sm leading-6 text-muted-foreground">
              No component edits it yet. Build one, then register it as a custom control.
            </p>
          </div>
        </div>
        <InfoCallout>
          A point-in-time audit, not a live sync: types were last checked against flow-workbench on
          2026-09-09 and mapped onto MetadataForm on 2026-10-05. A type marked{' '}
          <span className="font-mono text-foreground">†</span> is only a schema-level name; it is
          not confirmed that flow-workbench renders it as a distinct control. Re-check the cited
          source before trusting a stale-looking row.
        </InfoCallout>
        <div className="mt-6">
          <CoverageAudit />
        </div>
      </section>

      <Divider />

      <section>
        <SectionTitle>Out of scope</SectionTitle>
        <SectionDescription>
          Left out of the audit on purpose, so it stays focused on value fields.
        </SectionDescription>
        <ul className="space-y-2 text-sm leading-6 text-muted-foreground">
          <li>
            <span className="font-medium text-foreground">
              textBlock, button, addActivityWidget:
            </span>{' '}
            display-only or action widgets from the integration-service catalog. They hold no value.
          </li>
          <li>
            <span className="font-medium text-foreground">Evals FieldType:</span> a separate list
            used for eval scoring (llmModel, toolCallArgs and similar), unrelated to form rendering.
          </li>
        </ul>
      </section>
    </GuidancePage>
  );
}

export const Documentation: Story = {
  name: 'Documentation',
  render: (_args, { globals }) => (
    <TooltipProvider>
      <FieldTypesPage globalTheme={globals.theme || 'future-dark'} />
    </TooltipProvider>
  ),
};
