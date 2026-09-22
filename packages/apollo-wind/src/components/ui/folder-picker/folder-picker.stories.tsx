import type { Meta, StoryObj } from '@storybook/react-vite';
import * as React from 'react';
import { FolderPicker, FolderPickerContent, type FolderPickerEntry } from './folder-picker';

/**
 * A OneDrive / SharePoint shaped tree. Keys are folder names, values are their
 * children, and an empty object is a folder whose contents are not yet known.
 */
const DRIVE_TREE: Record<string, unknown> = {
  OneDrive: {
    Documents: { Reports: {}, Drafts: {} },
    Pictures: {},
  },
  'Shared with me': {
    'Vendor Uploads': {},
    'Team Exports': {},
  },
  'SharePoint Document Libraries': {
    Finance: { Invoices: {}, Receipts: {}, 'Purchase Orders': {} },
    Legal: { Contracts: {}, Policies: {} },
    Operations: {},
  },
  Groups: {
    'AP Team': {},
    Engineering: {},
  },
};

const levelAt = (path: string[]): Record<string, unknown> =>
  path.reduce<Record<string, unknown>>(
    (level, segment) => (level[segment] as Record<string, unknown>) ?? {},
    DRIVE_TREE
  );

/** Stands in for a connector call, latency included. */
const loadChildren = (path: string[]): Promise<FolderPickerEntry[]> =>
  new Promise((resolve) => {
    setTimeout(() => resolve(Object.keys(levelAt(path)).map((name) => ({ name }))), 600);
  });

const meta = {
  title: 'Components/UiPath/Folder Picker',
  component: FolderPicker,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: `
A drill-in chooser for one folder in a remote tree, such as a OneDrive or SharePoint drive.

The picker follows the platform chooser convention that macOS **Choose**, the Google Drive picker and the Windows folder dialog share. A single click highlights a row as the pending selection, a double click or the trailing chevron opens it, the breadcrumb jumps back up, and the footer confirms. With nothing highlighted, **Select** confirms the folder currently being browsed, so a folder can be chosen by opening it. At the root with nothing highlighted there is nothing valid to confirm and **Select** is disabled.

## Loading

Levels are fetched one at a time through \`onLoadChildren\`, which receives the path segments and resolves the entries at that level. The root is requested with an empty array when the surface opens. Whether a folder has children is usually unknown before it is opened, so every entry gets an open affordance unless it sets \`hasChildren: false\`. While a level loads, that row's chevron becomes a spinner and the current list stays visible rather than blanking. Resolved levels are cached, so navigating back up is instant, and a level abandoned mid-flight is discarded rather than navigated into.

## Consumer guidance

- Return entries from \`onLoadChildren\` in the order they should appear. The picker does not sort.
- Set \`hasChildren: false\` on known leaves to hide an open affordance that would resolve to nothing.
- \`onSelect\` receives a path such as \`/Finance/Invoices\`, and an empty string when the field is cleared.
- Use \`FolderPickerContent\` when the consumer already owns a popover, dialog or sheet.
- Use \`trailingAdornment\` for a field-mode menu or another control that belongs inside the field.
- Search filters the level being browsed. It is not a tree-wide search.
- \`FolderPickerContent\` renders **Cancel** only when given \`onCancel\`, so an embedded surface with nothing to dismiss shows just **Select**.

## Accessibility

The list is a \`tree\` of \`treeitem\` rows rather than a listbox, because a listbox option is atomic to assistive technology and would swallow the per-row open control. Rows carry \`aria-selected\`, and a row that can be opened reports \`aria-expanded="false"\` since its children have not been fetched yet. Enter or Space highlights a row, ArrowRight opens it, and neither acts on a row declared \`hasChildren: false\`.
        `,
      },
    },
  },
  argTypes: {
    value: { description: 'Selected folder path, or an empty string.' },
    onSelect: { description: 'Called with the confirmed path, or an empty string when cleared.' },
    onLoadChildren: { description: 'Resolves the entries at a path. Called for the root on open.' },
    rootLabel: { description: "Label for the breadcrumb's first segment." },
    clearable: { description: "Toggles the field's hover-revealed clear control." },
    open: { description: 'Controlled open state.' },
    onOpenChange: { description: 'Called whenever the popover requests an open-state change.' },
    children: { control: false, description: 'Optional custom trigger element.' },
    trailingAdornment: { control: false, description: 'Rendered inside the field, trailing edge.' },
  },
} satisfies Meta<typeof FolderPicker>;

export default meta;
type Story = StoryObj<typeof meta>;

function FieldDemo(props: Partial<React.ComponentProps<typeof FolderPicker>>) {
  const [value, setValue] = React.useState(props.value ?? '');

  return (
    <div className="w-[360px] space-y-2">
      <span className="text-sm font-medium text-foreground">In location</span>
      <FolderPicker {...props} value={value} onSelect={setValue} onLoadChildren={loadChildren} />
    </div>
  );
}

export const Default: Story = {
  args: { onSelect: () => {}, onLoadChildren: loadChildren },
  render: () => <FieldDemo />,
};

/** Browsing resumes at the parent of the current value, with that folder highlighted. */
export const WithValue: Story = {
  args: { onSelect: () => {}, onLoadChildren: loadChildren },
  render: () => <FieldDemo value="/SharePoint Document Libraries/Finance" />,
};

/** Without the clear control, the value can only be replaced, not emptied. */
export const NotClearable: Story = {
  args: { onSelect: () => {}, onLoadChildren: loadChildren },
  render: () => <FieldDemo value="/OneDrive/Documents" clearable={false} />,
};

export const Disabled: Story = {
  args: { onSelect: () => {}, onLoadChildren: loadChildren },
  render: () => <FieldDemo value="/OneDrive/Pictures" disabled />,
};

/** A folder the connector cannot list surfaces the failure in place. */
export const LoadFailure: Story = {
  args: { onSelect: () => {}, onLoadChildren: loadChildren },
  render: function Render() {
    const [value, setValue] = React.useState('');
    return (
      <div className="w-[360px]">
        <FolderPicker
          value={value}
          onSelect={setValue}
          onLoadChildren={(path) =>
            path.length > 0
              ? Promise.reject(new Error('You do not have access to this folder.'))
              : loadChildren(path)
          }
        />
      </div>
    );
  },
};

/** Embedded directly when the consumer already owns the surface. */
export const ContentOnly: Story = {
  args: { onSelect: () => {}, onLoadChildren: loadChildren },
  render: () => (
    <div className="w-[360px] overflow-hidden rounded-xl border border-border bg-surface-raised shadow-lg">
      <FolderPickerContent onLoadChildren={loadChildren} onSelect={() => {}} />
    </div>
  ),
};
