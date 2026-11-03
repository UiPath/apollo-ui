import type { Meta, StoryObj } from '@storybook/react-vite';
import { Archive, Boxes, Database, ListChecks, Plus } from 'lucide-react';
import * as React from 'react';
import { Button } from '@/components/ui/button';
import { FieldMenu } from '@/components/ui/field-addons';
import { FormField, FormFieldError, FormFieldLabel } from '@/components/ui/form-field';
import { InputGroup, InputGroupAddon } from '@/components/ui/input-group';
import { ResourcePicker, ResourcePickerContent } from './resource-picker';
import type { ResourceGroup } from './types';

/**
 * Data Fabric entities, grouped by the folder they live in. Entity names are
 * not unique across folders, so each row's id carries its folder too.
 */
const ENTITY_GROUPS: ResourceGroup[] = [
  {
    id: 'HLConditionalPublished',
    label: 'HLConditionalPublished',
    items: ['CaseComments'].map((name) => ({
      id: `HLConditionalPublished/${name}`,
      label: name,
      icon: <Database size={14} />,
    })),
  },
  {
    id: 'Shared',
    label: 'Shared',
    items: ['Aavi', 'AvichalFolderEntity', 'AviNew', 'Avit1', 'avitestnew', 'Candidate'].map(
      (name) => ({ id: `Shared/${name}`, label: name, icon: <Database size={14} /> })
    ),
  },
  {
    id: 'Shared/ayush agrawal/case config soln',
    label: 'Shared/ayush agrawal/case config soln',
    items: ['CaseComments', 'CaseConfiguration'].map((name) => ({
      id: `Shared/ayush agrawal/case config soln/${name}`,
      label: name,
      icon: <Database size={14} />,
    })),
  },
];

const QUEUE_GROUPS: ResourceGroup[] = [
  {
    id: 'finance',
    label: 'Finance',
    items: [
      {
        id: 'Q01INVOICE',
        label: 'Invoice intake',
        description: '412 pending',
        icon: <ListChecks size={14} />,
      },
      {
        id: 'Q04REFUND',
        label: 'Refund requests',
        description: '1,204 pending',
        icon: <ListChecks size={14} />,
      },
      {
        id: 'Q14BILLING',
        label: 'Billing disputes',
        description: '41 pending',
        icon: <ListChecks size={14} />,
        disabled: true,
      },
    ],
  },
  {
    id: 'operations',
    label: 'Operations',
    items: [
      {
        id: 'Q02CLAIMS',
        label: 'Claims triage',
        description: '188 pending',
        icon: <ListChecks size={14} />,
      },
      {
        id: 'Q03ONBOARD',
        label: 'Vendor onboarding',
        description: '96 pending',
        icon: <ListChecks size={14} />,
      },
    ],
  },
];

const BUCKET_GROUPS: ResourceGroup[] = [
  {
    id: 'active',
    label: 'Active buckets',
    icon: <Boxes size={14} />,
    items: [
      {
        id: 'bkt-intake',
        label: 'document-intake',
        description: 'eu-west',
        icon: <Archive size={14} />,
      },
      {
        id: 'bkt-exports',
        label: 'nightly-exports',
        description: 'eu-west',
        icon: <Archive size={14} />,
      },
      { id: 'bkt-scratch', label: 'scratch', description: 'us-east', icon: <Archive size={14} /> },
    ],
  },
  {
    id: 'archived',
    label: 'Archived',
    icon: <Boxes size={14} />,
    defaultCollapsed: true,
    items: [
      {
        id: 'bkt-2023',
        label: 'invoices-2023',
        description: 'eu-west',
        icon: <Archive size={14} />,
      },
      {
        id: 'bkt-2022',
        label: 'invoices-2022',
        description: 'eu-west',
        icon: <Archive size={14} />,
      },
    ],
  },
];

const meta = {
  title: 'Components/Core/Resource Picker',
  component: ResourcePicker,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: `
A field and popover for choosing one record from a grouped list.

The picker is generic over what it lists. A group is a heading with rows under
it, and a row is an id, a label and an optional icon, so the same control
serves Data Fabric entities, queues, storage buckets or anything else with
that shape. Picking a person is the exception: people carry avatars and a
resolved reference of their own, so they belong to a dedicated people picker.
The domain lives in the data a consumer passes, not in the component.

## Committing

Rows commit on click and close the popover. One resource is one decision, so
there is no Cancel and Select pair: a confirm step would only add a second
click to a choice that is already unambiguous. The footer's two slots are for
the ways out of the picker instead, such as a link to create a new record.

## Selection and cursor

The committed row carries a tick and the brand tint, cyan in the Future
themes. The neutral fill means cursor position, whether from the pointer or
the keyboard, and nothing else. The chosen row keeps its tint under the
cursor. \`surface-selected\` is not used for it because it resolves to the
same value as \`surface-hover\` in every theme, so a chosen row filled with
it would be indistinguishable from the row under the pointer.

## Consumer guidance

* Ids must be unique across every group. Labels need not be, and often are
  not: the same name can appear under two folders, so the id carries the path.
* Pass \`onClear\` to offer the field's hover revealed clear. Without a handler
  the control is not shown, since a field that cannot be emptied should not
  suggest otherwise.
* Footer links are slots, so the component never needs to know a product
  route.
* Use \`ResourcePickerContent\` on its own to place the same list inside a
  sheet, a dialog or a surface anchored to something other than a field.
  Pass \`keepResourceSearchOnEscape\` as that surface's \`onEscapeKeyDown\`,
  so Escape clears the search before it dismisses, as it does in
  \`ResourcePicker\`.

## Accessibility

Opening the picker puts focus in the search, so typing filters at once and
the arrow keys move through the rows. Closing returns focus to the field.
The rows sit in one listbox, the one the search controls, grouped under
\`role="group"\` elements named by their headings. A heading is a label, not
a control, since a listbox may hold only options and groups.

Keyboard:

* **ArrowUp / ArrowDown** move the cursor through the rows, wrapping at
  either end.
* **Enter** commits the row under the cursor.
* **ArrowLeft** on a row collapses its group. The group stays in the list as
  one row that reads as collapsed (\`collapsedGroupLabel\`, by default
  "Shared, collapsed"), and the cursor moves onto it.
* **ArrowRight** or **Enter** on a collapsed group opens it, and the cursor
  moves to its first row. Opening a group commits nothing.
* An open group whose rows are all disabled keeps its heading as a row the
  cursor can take (\`expandedGroupLabel\`, by default "Locked, expanded"),
  since cmdk skips disabled rows: ArrowLeft or Enter there folds the group.
* **Shift+Enter** on a row with \`itemActions\` opens them as a menu beside
  the row: ArrowUp and ArrowDown move through it, Enter runs an action, and
  Escape closes it and returns to the search; Tab and Shift+Tab close it and
  move on from the row in that direction. With nothing after the list, Tab
  leaves the picker: ResourcePicker closes its popover and moves on from the
  field, and an embedded \`ResourcePickerContent\` calls \`onTabOut\` or moves
  to whatever follows it. The row's own action shortcuts
  are for the pointer only, since nothing inside an option may take focus.
* **Escape** clears a search with text in it, and otherwise closes the
  picker.

ArrowLeft and ArrowRight only fold groups while the search is empty; with
text in it they move its caret, and a search keeps every group open anyway,
so a match is never hidden inside one that was collapsed before typing. With
the pointer, clicking an open group's heading collapses it, and clicking a
collapsed group opens it. The search matches group names as well as rows: a
group whose name matches is listed whole.

Rows announce their description with their label. The keyboard cursor is
the one selection state (\`aria-selected\`, which cmdk moves with it), and
the committed row is marked \`aria-current\` beside its visible tick, so the
two are never confused.

Pass \`id\` with a \`<label htmlFor>\`, or \`aria-labelledby\`, to name the
default field, and \`aria-describedby\` for its hint. A disabled picker
never opens, whatever element the trigger is.

## Field and validation

The field is an \`InputGroup\`, as every Apollo picker field is, so it
matches Select, Combobox and the date pickers in every theme. The resource
icon is its leading addon, and the clear control and \`trailingAdornment\`
share its trailing addon.

* Pass \`error\` for validation, as with every field control. The message
  renders below the field with \`FormFieldError\`, and the trigger is marked
  invalid and pointed at it.
* Pass \`warning\` for a value that is accepted but likely wrong. It draws
  the warning edge without marking the field invalid; render its message
  with \`FormFieldError severity="warning"\` and link it through
  \`aria-describedby\`. An error out-ranks it.
* Placed inside your own \`InputGroup\`, the picker becomes that group's
  control: the group draws the box and renders the picker's \`error\`, and
  its \`disabled\` disables the picker.

## Loading

The picker fetches nothing. While rows load, pass \`loading\`, and after a
failed load pass \`loadError\` with \`onRetry\`, so the list says so rather
than claiming to be empty. The list uses the same empty states as
FolderPicker.
        `,
      },
    },
  },
  // Satisfies the required props for the docs table. Each story renders its
  // own demo, so these are never the values on screen.
  args: {
    groups: ENTITY_GROUPS,
    onSelect: () => {},
  },
  argTypes: {
    groups: { description: 'Groups of rows, in the order they are listed.' },
    value: { description: 'Id of the chosen row, or an empty string.' },
    onSelect: { description: 'Called with the row that was committed.' },
    onClear: { description: 'Clears the field. Without it, no clear control is offered.' },
    icon: { description: 'Leading glyph for the field, matching the kind of row it picks.' },
    showCounts: { description: "Shows each group's row count at its trailing edge." },
    trailingAdornment: { description: 'Rendered inside the field at its trailing edge.' },
  },
} satisfies Meta<typeof ResourcePicker>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * A field wired to local state, as a consumer would wire it. The data lives in
 * module scope rather than in `args`, so the docs source snippet stays
 * readable and the icons are not serialized into it.
 */
function PickerDemo({
  groups,
  initialValue = '',
  withFooter = false,
  ...props
}: Partial<React.ComponentProps<typeof ResourcePicker>> & {
  groups: ResourceGroup[];
  initialValue?: string;
  withFooter?: boolean;
}) {
  const [value, setValue] = React.useState(initialValue);
  return (
    <div className="w-96">
      <ResourcePicker
        {...props}
        groups={groups}
        value={value}
        onSelect={(item) => setValue(item.id)}
        onClear={() => setValue('')}
        footerLeading={
          withFooter ? (
            <Button
              variant="ghost"
              size="2xs"
              className="-ml-2 gap-1 font-semibold text-brand hover:text-brand future:text-brand future:hover:text-brand"
            >
              <Plus className="size-3.5" />
              Add new entity
            </Button>
          ) : undefined
        }
        footerTrailing={
          withFooter ? (
            <Button variant="ghost" size="2xs" className="-mr-2">
              Open entities
            </Button>
          ) : undefined
        }
      />
    </div>
  );
}

/** Data Fabric entities, the case the picker was drawn from. */
export const Default: Story = {
  render: () => (
    <PickerDemo
      groups={ENTITY_GROUPS}
      placeholder="Select entity..."
      icon={<Database size={16} />}
      withFooter
    />
  ),
};

/** Rows carrying a second line of text, and one that cannot be chosen. */
export const WithDescriptions: Story = {
  render: () => (
    <PickerDemo
      groups={QUEUE_GROUPS}
      placeholder="Select queue..."
      icon={<ListChecks size={16} />}
    />
  ),
};

/** A group that opens collapsed, with its own heading glyph. */
export const CollapsedGroup: Story = {
  render: () => (
    <PickerDemo
      groups={BUCKET_GROUPS}
      placeholder="Select bucket..."
      icon={<Boxes size={16} />}
      showCounts={false}
    />
  ),
};

/** A chosen row, with the clear control the field reveals on hover. */
export const WithValue: Story = {
  render: () => (
    <PickerDemo
      groups={ENTITY_GROUPS}
      initialValue="Shared/Aavi"
      placeholder="Select entity..."
      icon={<Database size={16} />}
    />
  ),
};

/** Without the clear control, the value can only be replaced, not emptied. */
export const NotClearable: Story = {
  render: () => (
    <PickerDemo
      groups={ENTITY_GROUPS}
      initialValue="Shared/Aavi"
      placeholder="Select entity..."
      icon={<Database size={16} />}
      clearable={false}
    />
  ),
};

export const Disabled: Story = {
  render: () => (
    <PickerDemo
      groups={ENTITY_GROUPS}
      initialValue="Shared/Candidate"
      icon={<Database size={16} />}
      disabled
    />
  ),
};

function Panel({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <figure className="m-0 w-[320px]">
      <figcaption className="mb-2 text-xs font-medium text-foreground-muted">{label}</figcaption>
      <div className="overflow-hidden rounded-xl border border-border bg-surface-raised shadow-lg">
        {children}
      </div>
    </figure>
  );
}

/**
 * Every way the list can come up without rows. Loading is not an empty list,
 * an empty list is not a failed search, and neither is a failed load, so each
 * says so plainly.
 */
export const EmptyStates: Story = {
  parameters: { layout: 'padded' },
  render: () => (
    <div className="flex flex-wrap items-start gap-6">
      <Panel label="Loading">
        <ResourcePickerContent
          groups={[]}
          onSelect={() => {}}
          loading
          loadingText="Loading entities…"
        />
      </Panel>

      <Panel label="Load failed">
        <ResourcePickerContent
          groups={[]}
          onSelect={() => {}}
          loadError="Could not load entities."
          onRetry={() => {}}
        />
      </Panel>

      <Panel label="Nothing to pick">
        <ResourcePickerContent groups={[]} onSelect={() => {}} emptyText="No entities yet." />
      </Panel>

      <Panel label="No search match">
        <ResourcePickerContent
          groups={ENTITY_GROUPS}
          onSelect={() => {}}
          initialSearch="zzz"
          emptyText="No entities match."
        />
      </Panel>
    </div>
  ),
};

/**
 * The field's validation states. An error is a message about the value and
 * marks the field invalid. A warning is advisory: the value is accepted, so
 * the field stays valid and only its edge and message change.
 */
export const Validation: Story = {
  parameters: { layout: 'padded' },
  render: function Render() {
    return (
      <div className="flex w-80 flex-col gap-6">
        <FormField>
          <FormFieldLabel htmlFor="entity-required" required>
            Entity
          </FormFieldLabel>
          <ResourcePicker
            id="entity-required"
            groups={ENTITY_GROUPS}
            onSelect={() => {}}
            placeholder="Select entity..."
            icon={<Database size={16} />}
            error="Choose the entity to read from."
          />
        </FormField>
        <FormField>
          <FormFieldLabel htmlFor="entity-archived">Entity</FormFieldLabel>
          <ResourcePicker
            id="entity-archived"
            groups={ENTITY_GROUPS}
            value="Shared/Candidate"
            onSelect={() => {}}
            onClear={() => {}}
            icon={<Database size={16} />}
            warning
            aria-describedby="entity-archived-warning"
          />
          <FormFieldError id="entity-archived-warning" severity="warning">
            This entity is archived. Records can be read but not written.
          </FormFieldError>
        </FormField>
      </div>
    );
  },
};

/**
 * Inside a consumer's InputGroup the picker is the group's control, so it
 * takes addons beside it, here a field menu, like any other field.
 */
export const InInputGroup: Story = {
  render: function Render() {
    const [value, setValue] = React.useState('Shared/Aavi');
    const [mode, setMode] = React.useState<'literal' | 'expression'>('literal');
    return (
      <FormField className="w-80">
        <FormFieldLabel htmlFor="entity-grouped">Entity</FormFieldLabel>
        <InputGroup>
          <ResourcePicker
            id="entity-grouped"
            groups={ENTITY_GROUPS}
            value={value}
            onSelect={(item) => setValue(item.id)}
            placeholder="Select entity..."
          />
          <InputGroupAddon align="inline-end">
            <FieldMenu mode={mode} onSelect={setMode} />
          </InputGroupAddon>
        </InputGroup>
      </FormField>
    );
  },
};

/** The list on its own, for a consumer supplying its own surface. */
export const ContentOnly: Story = {
  render: function Render() {
    const [value, setValue] = React.useState('Shared/Aavi');
    return (
      <div className="w-80 overflow-hidden rounded-md border border-border">
        <ResourcePickerContent
          groups={ENTITY_GROUPS}
          value={value}
          onSelect={(item) => setValue(item.id)}
          searchPlaceholder="Search entities..."
        />
      </div>
    );
  },
};
