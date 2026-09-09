import type { Meta, StoryObj } from '@storybook/react-vite';
import type * as React from 'react';
import { useState } from 'react';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  FIELD_TYPE_META,
  FIELD_TYPE_ORDER,
  type LockableFieldType,
  LockableValueField,
  type LockableValueFieldMode,
} from '@/components/ui/lockable-value-field';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { fontFamily } from '@/foundation/Future/typography';
import { cn } from '@/lib';

const meta = {
  title: 'Apollo Wind/Forms/Field Types',
  parameters: { layout: 'fullscreen' },
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

type Status = 'supported' | 'needs-type' | 'needs-component';
type VisualExample = LockableFieldType | 'mode-fixed' | 'mode-expression';

interface TypeRow {
  type: string;
  source: string;
  support: string;
  status: Status;
  action?: string;
  visual?: VisualExample;
  // False when it is unconfirmed that flow-workbench itself renders this as a
  // distinct control, not just declares it in a schema. Defaults to true.
  flowWorkbenchConfirmed?: boolean;
}

interface Category {
  title: string;
  description: string;
  rows: TypeRow[];
  rowLabel?: string;
}

const CATEGORIES: Category[] = [
  {
    title: 'Temporal',
    description: 'Date and time values. Only bare dates are modeled today.',
    rows: [
      {
        type: 'date',
        source: 'JSON Schema, entity fields, hitl-schema-types',
        support: 'fieldType="date"',
        status: 'supported',
        visual: 'date',
      },
      {
        type: 'datetime / date-time',
        source: 'hitl-schema-types, integration-service WidgetType.Datetime, entity field dateTime',
        support: 'Not modeled. Distinct from date today.',
        status: 'needs-type',
        action: 'Add a datetime fieldType with a combined date and time control.',
      },
      {
        type: 'time',
        source: 'integration-service WidgetType.Time, entity field time',
        support: 'Not modeled.',
        status: 'needs-type',
        action: 'Add a time fieldType with a time-of-day control.',
      },
      {
        type: 'duration / timeSpan',
        source: 'integration-service WidgetType.Timespan',
        support: 'Not modeled.',
        status: 'needs-type',
        action: 'Add a duration fieldType. Likely a segmented number plus unit control.',
      },
    ],
  },
  {
    title: 'Numeric',
    description: 'Only integer is modeled today, without a decimal counterpart.',
    rows: [
      {
        type: 'integer',
        source: 'JSON Schema, hitl-schema-types',
        support: 'fieldType="integer"',
        status: 'supported',
        visual: 'integer',
      },
      {
        type: 'number / float / double',
        source: 'hitl-schema-types (float, double), JSON Schema number',
        support: 'Renders via integer today, but the control does not allow decimals.',
        status: 'needs-type',
        action: 'Add a number fieldType for decimal values, separate from integer.',
      },
      {
        type: 'int32 / int64',
        source: 'hitl-schema-types schema definitions',
        support: 'Renders via integer.',
        status: 'needs-type',
        action:
          'Confirm whether the 32 vs. 64 bit distinction matters at the UI layer. If it is a backend validation constraint only, no UI change is needed.',
        flowWorkbenchConfirmed: false,
      },
    ],
  },
  {
    title: 'Boolean',
    description: 'A single true or false value.',
    rows: [
      {
        type: 'boolean',
        source: 'JSON Schema, hitl-schema-types',
        support: 'fieldType="boolean"',
        status: 'supported',
        visual: 'boolean',
      },
    ],
  },
  {
    title: 'Text and string formats',
    description:
      'string covers the base case. JSON Schema format extensions and loose fallbacks currently render the same as a plain string, with no format-specific behavior.',
    rows: [
      {
        type: 'string',
        source: 'JSON Schema',
        support: 'fieldType="string"',
        status: 'supported',
        visual: 'string',
      },
      {
        type: 'text / any / json',
        source: 'argument-utils.ts, expression-model getEffectiveType fallback',
        support: 'Renders via string.',
        status: 'needs-type',
        action:
          'Decide whether any and json need a distinct, code-aware control, or should resolve to string with a monospace hint.',
      },
      {
        type: 'email / uri / uuid',
        source: 'JSON Schema format extensions',
        support: 'Renders via string. No format validation.',
        status: 'needs-type',
        action:
          'Add format-level validation and masking. Likely a format prop on string rather than a new fieldType.',
      },
      {
        type: 'monetary / currency',
        source: 'JSON Schema format extensions',
        support: 'Renders via string.',
        status: 'needs-type',
        action: 'Needs a currency-aware control with symbol and locale formatting.',
      },
      {
        type: 'verbatim',
        source: 'JSON Schema format extension',
        support: 'Renders via string.',
        status: 'needs-type',
        action:
          'Clarify what verbatim means at the UI layer. Likely no visual difference from string. Confirm with the flow-workbench team.',
        flowWorkbenchConfirmed: false,
      },
    ],
  },
  {
    title: 'Security',
    description: 'No masked or credential-aware control exists today.',
    rows: [
      {
        type: 'Secret',
        source: 'asset-binding.ts, schemaTypeDisplay.tsx',
        support: 'Not modeled.',
        status: 'needs-type',
        action: 'Add a secret fieldType: masked input, no plaintext reveal even when unlocked.',
      },
      {
        type: 'Credential',
        source: 'asset-binding.ts',
        support: 'Not modeled.',
        status: 'needs-type',
        action:
          'Add a credential fieldType. Likely a connection-style picker rather than free text.',
      },
      {
        type: 'secretAsset / credentialAsset',
        source: 'asset-binding.ts',
        support: 'Not modeled.',
        status: 'needs-type',
        action:
          'Likely the same secret and credential fieldTypes bound through the asset system. Confirm with flow-schema owners before adding separate variants.',
      },
    ],
  },
  {
    title: 'Object and collection',
    description:
      'object is modeled. Nothing today handles an arbitrary list, a key-value map, or a heterogeneous collection.',
    rows: [
      {
        type: 'object',
        source: 'JSON Schema',
        support: 'fieldType="object"',
        status: 'supported',
        visual: 'object',
      },
      {
        type: 'array (generic)',
        source: 'Workflow variables dropdown, JSON Schema',
        support:
          'No generic array editor. Only multi-select, which is a fixed list of string options.',
        status: 'needs-type',
        action:
          'Add a generic array fieldType: add, remove, and reorder rows of an arbitrary sub-type.',
      },
      {
        type: 'dictionary',
        source: 'integration-service WidgetType.dictionary',
        support: 'Not modeled.',
        status: 'needs-component',
        action: 'Build a dedicated key-value map editor. Does not fit the single-value model.',
      },
      {
        type: 'collection',
        source: 'integration-service WidgetType.collection',
        support: 'Not modeled.',
        status: 'needs-component',
        action:
          'Clarify against the generic array row above. May be the same concept under a different name.',
        flowWorkbenchConfirmed: false,
      },
      {
        type: 'stringArray / rawStringArray / stringArrayWithExpression',
        source: 'integration-service WidgetType',
        support: 'Overlaps with multi-select and generic array.',
        status: 'needs-type',
        action: 'De-duplicate with flow-workbench before adding a new fieldType.',
        flowWorkbenchConfirmed: false,
      },
    ],
  },
  {
    title: 'File and media',
    description: 'file covers upload only. There is no picker for existing resources or images.',
    rows: [
      {
        type: 'file',
        source: 'JSON Schema resource-kind extension, hitl-schema-types',
        support: 'fieldType="file"',
        status: 'supported',
        visual: 'file',
      },
      {
        type: 'browser / localResource',
        source: 'integration-service WidgetType',
        support: 'Not modeled.',
        status: 'needs-component',
        action:
          'Build a file system or folder picker. Different from the existing upload-only file control.',
      },
      {
        type: 'image / icon',
        source: 'integration-service WidgetType',
        support: 'Not modeled.',
        status: 'needs-component',
        action: 'Build an image or icon picker with a preview.',
      },
    ],
  },
  {
    title: 'Choice controls',
    description:
      'single-select and multi-select cover the base cases. Some flow-workbench choice controls may be visual variants of these rather than genuinely new types.',
    rows: [
      {
        type: 'single-select',
        source: 'JSON Schema enum, integration-service dropdown',
        support: 'fieldType="single-select"',
        status: 'supported',
        visual: 'single-select',
      },
      {
        type: 'multi-select',
        source: 'JSON Schema, integration-service',
        support: 'fieldType="multi-select"',
        status: 'supported',
        visual: 'multi-select',
      },
      {
        type: 'dropdown',
        source: 'integration-service WidgetType.dropdown',
        support: 'Renders via single-select. Naming alias only.',
        status: 'supported',
        visual: 'single-select',
      },
      {
        type: 'checkboxGroup',
        source: 'integration-service WidgetType.checkboxGroup',
        support: 'Closest existing analog is multi-select.',
        status: 'needs-type',
        action:
          'Confirm whether an all-options-visible checkbox group is a real visual distinction worth its own fieldType, versus multi-select’s dropdown and chips.',
        flowWorkbenchConfirmed: false,
      },
      {
        type: 'radioGroup',
        source: 'integration-service WidgetType.radioGroup',
        support: 'Closest existing analog is single-select.',
        status: 'needs-type',
        action:
          'Confirm whether a radio group is a real visual distinction worth its own fieldType, versus a single-select dropdown.',
        flowWorkbenchConfirmed: false,
      },
      {
        type: 'autoComplete / connectorAutocomplete / autoCompleteForExpression',
        source: 'integration-service WidgetType',
        support: 'Not modeled.',
        status: 'needs-component',
        action:
          'Build an async-search autocomplete control. The existing single-select assumes a static option list.',
      },
    ],
  },
  {
    title: 'Resource reference',
    description: 'A whole family with no equivalent today.',
    rows: [
      {
        type: 'connection / entity / process / app / portal / definition / solutionResource',
        source: 'solution-resource-picker/kinds',
        support: 'Not modeled.',
        status: 'needs-component',
        action:
          'Build one resource-reference picker component parameterized by kind, rather than seven separate fieldTypes.',
      },
    ],
  },
  {
    title: 'Rich and composite controls',
    description:
      'Controls whose interaction model is fundamentally different from a single value field.',
    rows: [
      {
        type: 'richText / richTextComposer',
        source: 'integration-service WidgetType',
        support: 'Not modeled.',
        status: 'needs-component',
        action: 'Build a rich text editor control.',
      },
      {
        type: 'promptComposer / promptSingleValue',
        source: 'integration-service WidgetType',
        support: 'Not modeled.',
        status: 'needs-component',
        action: 'Build an AI prompt composer control.',
      },
      {
        type: 'filter / conditionBuilder',
        source: 'integration-service WidgetType',
        support: 'Not modeled.',
        status: 'needs-component',
        action: 'Build a condition or query builder control.',
      },
      {
        type: 'outputMapping / dataMapping',
        source: 'integration-service WidgetType',
        support: 'Not modeled.',
        status: 'needs-component',
        action: 'Build a field-mapping control for source to target pairs.',
      },
      {
        type: 'typePicker',
        source: 'integration-service WidgetType',
        support: 'Not modeled.',
        status: 'needs-component',
        action: 'Build a schema or type picker control.',
      },
    ],
  },
  {
    title: 'Loose and fallback types',
    description: 'Edge cases that usually resolve to another row in this table.',
    rows: [
      {
        type: 'null',
        source: 'JSON Schema, flow-schema expression.ts',
        support: 'No explicit null state.',
        status: 'needs-type',
        action:
          'Usually paired with another type in a union, such as a nullable string. Confirm whether an explicit null or empty state is needed per type, or whether an empty value already covers it.',
        flowWorkbenchConfirmed: false,
      },
      {
        type: 'ref',
        source: 'generate-variable-declarations.ts',
        support: 'Overlaps with the resource reference family above.',
        status: 'needs-component',
        action: 'De-duplicate with the resource reference family before adding.',
        flowWorkbenchConfirmed: false,
      },
    ],
  },
];

const BINDING_STATE_ROWS: TypeRow[] = [
  {
    type: 'fixed  (LockableValueFieldMode)  ↔  Widget  (integration-service ValueType)',
    source: 'lockable-value-field/types.ts, integration-service ValueType',
    support: 'mode="fixed"',
    status: 'supported',
    visual: 'mode-fixed',
  },
  {
    type: 'expression  (LockableValueFieldMode)  ↔  Expression  (integration-service ValueType)',
    source: 'lockable-value-field/types.ts, integration-service ValueType',
    support: 'mode="expression"',
    status: 'supported',
    visual: 'mode-expression',
  },
  {
    type: 'Variable',
    source: 'integration-service ValueType.Variable',
    support: 'Not modeled as a distinct mode.',
    status: 'needs-type',
    action:
      'Clarify whether a bound-to-variable state needs its own visual treatment, or is already covered by inserting a variable into an expression.',
  },
  {
    type: 'Mapping / Dynamic',
    source: 'integration-service ValueType',
    support: 'Not modeled.',
    status: 'needs-type',
    action:
      'Add a read-only bound state to LockableValueFieldMode, rendered like the locked display but indicating an upstream binding rather than a static value.',
  },
];

// Every collapsible section on the page, category tables plus the binding-state
// table, in the order they render.
const ALL_SECTIONS: Category[] = [
  ...CATEGORIES,
  {
    title: 'Binding state',
    description:
      'Separate from field type: how a value relates to fixed input versus an upstream binding. LockableValueField only distinguishes fixed and expression. The integration-service widget catalog has a richer set.',
    rows: BINDING_STATE_ROWS,
    rowLabel: 'State',
  },
];

const STATUS_META: Record<Status, { label: string; variant: 'success' | 'warning' | 'info' }> = {
  supported: { label: 'Supported', variant: 'success' },
  'needs-type': { label: 'Needs fieldType', variant: 'warning' },
  'needs-component': { label: 'Needs component', variant: 'info' },
};

// Smaller and denser than the Table primitive's default h-12/text-sm header,
// so a 6-column reference table reads as a table, not a lighter block of prose.
const HEADER_CELL_CLASS =
  'h-9 whitespace-nowrap bg-muted/40 text-[11px] font-semibold uppercase tracking-wide';
// Tighter than the Table primitive's default p-4, since most cells here are one
// short line or a badge, not a paragraph.
const BODY_CELL_CLASS = 'align-top px-4 py-3';

function SectionTitle({ children }: { children: React.ReactNode }) {
  return <h2 className="mb-2 text-2xl font-bold tracking-tight text-foreground">{children}</h2>;
}

function SectionDescription({ children }: { children: React.ReactNode }) {
  return <p className="mb-6 text-base leading-7 text-muted-foreground">{children}</p>;
}

function Divider() {
  return <div className="my-10 h-px bg-border" />;
}

function InfoCallout({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-lg border border-border bg-muted/50 p-4 text-sm leading-6 text-muted-foreground">
      {children}
    </div>
  );
}

function StatusBadge({ status }: { status: Status }) {
  const meta = STATUS_META[status];
  return <Badge variant={meta.variant}>{meta.label}</Badge>;
}

// Live, interactive demo of a real fieldType, not a screenshot, so it can never drift
// out of sync with the component it documents. Seeded into fixed or expression mode
// so both variants are visible without anyone having to click the mode switch.
function FieldTypeExample({
  fieldType,
  initialMode = 'fixed',
  className,
}: {
  fieldType: LockableFieldType;
  initialMode?: LockableValueFieldMode;
  className?: string;
}) {
  const [value, setValue] = useState(initialMode === 'expression' ? '$vars.example' : '');
  const [mode, setMode] = useState<LockableValueFieldMode>(initialMode);
  return (
    <div className={cn('w-56', className)}>
      <LockableValueField
        fieldType={fieldType}
        value={value}
        onValueChange={setValue}
        locked={false}
        mode={mode}
        onModeChange={setMode}
        showFieldActions={false}
      />
    </div>
  );
}

// FileUpload's dropzone is a fixed h-32 with its own "Click to upload or drag
// and drop" copy, both sized for a full-width form field, not a compact
// side-by-side comparison cell. Collapses it to a single icon-only row here;
// the accessible name (aria-label="File upload area") is unaffected, it does
// not depend on this visible text.
const COMPACT_FILE_UPLOAD_CLASS =
  '[&_[role="button"]]:h-9 [&_[role="button"]]:flex-row [&_[role="button"]]:justify-start [&_[role="button"]]:gap-2 [&_[role="button"]]:px-3 [&_[role="button"]]:py-0 [&_[role="button"]_svg]:mb-0 [&_[role="button"]_svg]:size-4 [&_[role="button"]_p]:hidden';

function ExampleLabel({ children }: { children: React.ReactNode }) {
  return (
    <span className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
      {children}
    </span>
  );
}

function ModeExample({ mode }: { mode: LockableValueFieldMode }) {
  const [value, setValue] = useState(mode === 'expression' ? '$vars.example' : 'Example value');
  return (
    <div className="w-56">
      <LockableValueField
        fieldType="string"
        value={value}
        onValueChange={setValue}
        locked={false}
        mode={mode}
        showFieldActions={false}
      />
    </div>
  );
}

// Rendered instead of a fake mockup for gap rows: there is no real control to show,
// and a hand-drawn one would look like it already exists.
function GapPlaceholder() {
  return (
    <div className="flex h-9 w-56 items-center justify-center rounded-lg border border-dashed border-border px-2 text-center text-[11px] text-muted-foreground">
      No control yet
    </div>
  );
}

function VisualExampleCell({ visual }: { visual?: VisualExample }) {
  if (!visual) return <GapPlaceholder />;
  if (visual === 'mode-fixed') return <ModeExample mode="fixed" />;
  if (visual === 'mode-expression') return <ModeExample mode="expression" />;

  if (!FIELD_TYPE_META[visual].supportsExpression) {
    return <FieldTypeExample fieldType={visual} />;
  }

  // Expression-capable types get both variants stacked, since the fixed vs.
  // expression toggle changes the control's placeholder, styling, and (for a
  // custom renderExpressionEditor) the editor itself, not just its value.
  return (
    <div className="flex flex-col gap-2">
      <ExampleLabel>Fixed</ExampleLabel>
      <FieldTypeExample fieldType={visual} initialMode="fixed" />
      <ExampleLabel>Expression</ExampleLabel>
      <FieldTypeExample fieldType={visual} initialMode="expression" />
    </div>
  );
}

function gapCount(rows: TypeRow[]) {
  return rows.filter((row) => row.status !== 'supported').length;
}

function CategoryTable({ description, rows, rowLabel = 'Type' }: Category) {
  return (
    <div>
      <p className="mb-4 text-sm leading-6 text-muted-foreground">{description}</p>
      <div className="overflow-hidden rounded-lg border border-border">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead className={cn(HEADER_CELL_CLASS, 'w-[13%]')}>{rowLabel}</TableHead>
              <TableHead className={cn(HEADER_CELL_CLASS, 'w-[23%]')}>Visual example</TableHead>
              <TableHead className={cn(HEADER_CELL_CLASS, 'w-[13%]')}>
                Apollo Wind support
              </TableHead>
              <TableHead className={cn(HEADER_CELL_CLASS, 'w-[10%]')}>Status</TableHead>
              <TableHead className={cn(HEADER_CELL_CLASS, 'w-[21%]')}>Recommended action</TableHead>
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
                      title="Not confirmed as a distinct, separately-rendered type in flow-workbench either, only a schema-level type name. See Recommended action."
                    >
                      †
                    </sup>
                  )}
                </TableCell>
                <TableCell className={BODY_CELL_CLASS}>
                  <VisualExampleCell visual={row.visual} />
                </TableCell>
                <TableCell className={cn(BODY_CELL_CLASS, 'text-xs text-muted-foreground')}>
                  {row.support}
                </TableCell>
                <TableCell className={BODY_CELL_CLASS}>
                  <StatusBadge status={row.status} />
                </TableCell>
                <TableCell className={cn(BODY_CELL_CLASS, 'text-xs text-muted-foreground')}>
                  {row.action ?? '—'}
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

function SupportedTodayStrip() {
  return (
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
  );
}

// A side-by-side visual comparison across types, each in its default fixed
// state. Distinct from the per-category tables below: this answers "what does
// a date field look like next to a select," those answer "what's the gap for
// this one type."
function VisualReferenceGrid() {
  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
      {FIELD_TYPE_ORDER.map((type) => {
        const typeMeta = FIELD_TYPE_META[type];
        return (
          <div key={type} className="flex flex-col gap-2">
            <span className="flex items-center gap-1.5 text-xs font-medium text-foreground">
              <typeMeta.icon size={12} />
              {typeMeta.label}
            </span>
            <FieldTypeExample
              fieldType={type}
              className={type === 'file' ? COMPACT_FILE_UPLOAD_CLASS : undefined}
            />
          </div>
        );
      })}
    </div>
  );
}

const ALL_SECTION_TITLES = ALL_SECTIONS.map((section) => section.title);

function FieldTypesPage({ globalTheme }: { globalTheme: string }) {
  const [openSections, setOpenSections] = useState<string[]>(ALL_SECTION_TITLES);
  return (
    <div
      className={cn(globalTheme, 'min-h-screen w-full bg-background text-foreground')}
      style={{ fontFamily: fontFamily.base }}
    >
      <main className="mx-auto max-w-5xl p-8">
        <header>
          <h1 className="text-[2rem] font-bold tracking-tight text-foreground">Field types</h1>
          <p className="mt-2 text-base leading-7 text-muted-foreground">
            A single reference for every field, property, and parameter type flow-workbench needs to
            support, cross-referenced against what LockableValueField and the rest of Apollo Wind
            implement today. Use this before adding a new type case: check whether it already has a
            home, and if not, follow the recommended action instead of improvising a one-off
            control.
          </p>
        </header>

        <Divider />

        <section>
          <SectionTitle>Why this exists</SectionTitle>
          <SectionDescription>
            flow-workbench does not have one canonical type enum. At least six separate, partially
            overlapping type systems define field types across workflow variables, JSON Schema
            manifests, entity fields, HITL forms, and the integration-service widget catalog. Apollo
            Wind&rsquo;s LockableFieldType was designed against a narrower slice of that list, which
            is why some flow-workbench types have nowhere to go yet.
          </SectionDescription>
          <InfoCallout>
            This table is a point-in-time audit, not a live sync. It was last checked against
            flow-workbench on 2026-09-09. If a type here looks stale, re-check the cited source file
            before trusting the row.
          </InfoCallout>
        </section>

        <Divider />

        <section>
          <SectionTitle>Supported today</SectionTitle>
          <SectionDescription>
            The fieldType values LockableValueField already implements, read live from{' '}
            <code className="rounded bg-muted px-1.5 py-0.5 text-sm font-medium text-foreground">
              FIELD_TYPE_META
            </code>
            .
          </SectionDescription>
          <SupportedTodayStrip />
        </section>

        <Divider />

        <section>
          <SectionTitle>What each type looks like</SectionTitle>
          <SectionDescription>
            A side-by-side comparison, each type in its default fixed-value state. The tables below
            drill into one type at a time: its gaps, its status, and (where it applies) its
            expression variant.
          </SectionDescription>
          <VisualReferenceGrid />
        </section>

        <Divider />

        <section>
          <SectionTitle>How to read the status column</SectionTitle>
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="rounded-lg border border-border bg-card p-4">
              <div className="mb-2">
                <StatusBadge status="supported" />
              </div>
              <p className="text-sm leading-6 text-muted-foreground">
                Already implemented. Use the existing fieldType, no contribution needed.
              </p>
            </div>
            <div className="rounded-lg border border-border bg-card p-4">
              <div className="mb-2">
                <StatusBadge status="needs-type" />
              </div>
              <p className="text-sm leading-6 text-muted-foreground">
                Fits LockableValueField&rsquo;s existing lock, mode, and value model. Needs a new{' '}
                <code className="rounded bg-muted px-1 py-0.5 text-xs font-medium text-foreground">
                  fieldType
                </code>{' '}
                (or format) added to that component.
              </p>
            </div>
            <div className="rounded-lg border border-border bg-card p-4">
              <div className="mb-2">
                <StatusBadge status="needs-component" />
              </div>
              <p className="text-sm leading-6 text-muted-foreground">
                Does not fit the single-value model at all. Needs a dedicated component, not another
                fieldType case.
              </p>
            </div>
          </div>
          <p className="mt-4 text-sm leading-6 text-muted-foreground">
            Status describes the gap on the Apollo Wind side only. It assumes flow-workbench already
            renders the type distinctly, which is true for most rows (backed by a real renderer: the
            integration-service widget catalog, JSON Schema, entity fields). A type marked{' '}
            <span className="font-mono text-foreground">†</span> is different: it is only a
            schema-level type name, and it is not confirmed that flow-workbench itself treats it as
            a separately-rendered control. For those rows the gap may not be &ldquo;Apollo Wind is
            missing this,&rdquo; it may be &ldquo;no one has decided this is a real distinction yet,
            in either place.&rdquo; See that row&rsquo;s recommended action before treating it as a
            straightforward addition.
          </p>
        </section>

        <Divider />

        <div className="mb-4 flex items-center justify-end gap-2">
          <Button variant="outline" size="2xs" onClick={() => setOpenSections(ALL_SECTION_TITLES)}>
            Expand all
          </Button>
          <Button variant="outline" size="2xs" onClick={() => setOpenSections([])}>
            Collapse all
          </Button>
        </div>

        <Accordion type="multiple" value={openSections} onValueChange={setOpenSections}>
          {ALL_SECTIONS.map((section) => (
            <AccordionItem key={section.title} value={section.title} className="border-border">
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

        <Divider />

        <section>
          <SectionTitle>Out of scope</SectionTitle>
          <SectionDescription>
            Left out of the table above on purpose, so the list stays focused on value fields.
          </SectionDescription>
          <GuidanceOutOfScope />
        </section>
      </main>
    </div>
  );
}

function GuidanceOutOfScope() {
  return (
    <ul className="space-y-2 text-sm leading-6 text-muted-foreground">
      <li>
        <span className="font-medium text-foreground">textBlock, button, addActivityWidget:</span>{' '}
        display-only or action-triggering widgets from the integration-service catalog. They do not
        bind to a value, so they are not a LockableValueField concern.
      </li>
      <li>
        <span className="font-medium text-foreground">Evals FieldType:</span> a separate, narrower
        type list used for eval scoring (llmModel, toolCallArgs, and similar). Unrelated to node or
        form rendering.
      </li>
    </ul>
  );
}

export const Documentation: Story = {
  name: 'Documentation',
  render: (_args, { globals }) => <FieldTypesPage globalTheme={globals.theme || 'future-dark'} />,
};
