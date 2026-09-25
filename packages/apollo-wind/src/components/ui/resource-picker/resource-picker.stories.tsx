import type { Meta, StoryObj } from '@storybook/react-vite';
import { Archive, Boxes, Database, ListChecks, Plus } from 'lucide-react';
import * as React from 'react';
import { Button } from '@/components/ui/button';
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

## Accessibility

Opening the picker puts focus in the search, so typing filters at once and
the arrow keys move through the rows. Closing returns focus to the field.
Rows are cmdk options and the group headings are plain buttons, so the
keyboard cursor moves between selectable records and never lands on a
heading. The search matches group names as well as rows: a group whose
name matches is listed whole. Searching force expands every group, so a
match is never hidden inside one that was collapsed before typing. Escape clears the query before
the popover reads it as a dismiss, so a typo costs nothing.
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
            <Button variant="link" size="sm" className="-ml-3 gap-1">
              <Plus className="size-3.5" />
              Add new entity
            </Button>
          ) : undefined
        }
        footerTrailing={
          withFooter ? (
            <Button variant="link" size="sm" className="-mr-3">
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

/** The two ways the list can come up without rows. A picker with nothing in it
 * is not the same as a search that matched nothing, so each says so plainly.
 */
export const EmptyStates: Story = {
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        story:
          'The rows are supplied by the consumer rather than fetched, so there is no loading or failure state to show here.',
      },
    },
  },
  render: () => (
    <div className="flex flex-wrap items-start gap-6">
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
