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
  title: 'Components/Core/Folder Picker',
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
- Use \`FolderPickerContent\` when the consumer already owns a popover, dialog or sheet. Pass \`keepFolderSearchOnEscape\` as that surface's \`onEscapeKeyDown\`, so Escape clears the search before it dismisses, as it does in \`FolderPicker\`.
- Label the field with \`aria-labelledby\` or a \`<label htmlFor>\` pointing at \`id\`. The trigger is a combobox, so the selected path is announced as its value alongside that label.
- Use \`trailingAdornment\` for a field-mode menu or another control that belongs inside the field.
- Search filters the level being browsed. It is not a tree-wide search.
- \`FolderPickerContent\` renders **Cancel** only when given \`onCancel\`, so an embedded surface with nothing to dismiss shows just **Select**.

## Accessibility

Opening the picker puts focus in the search, so typing filters the level at once. Closing returns focus to the field.

The list is a \`tree\` of \`treeitem\` rows rather than a listbox, because a listbox option is atomic to assistive technology and would swallow the per-row open control. Rows carry \`aria-selected\` and \`aria-level\`, and a row that can be opened reports \`aria-expanded="false"\` since its children have not been fetched yet.

The tree is a single tab stop. Up, Down, Home and End move between rows, Left goes up a level, Enter or Space highlights a row, and ArrowRight opens it. A row declared \`hasChildren: false\` can still be highlighted but not opened. When a level has no enabled rows, the list itself takes the tab stop and still answers Left.

Loading and empty results are announced as a polite status, and load failures as an alert. Focus stays put or moves to the new level across every load, retry and clear, rather than falling to the page.
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
  // Follows the `value` control, while picks made in the story still stick.
  React.useEffect(() => setValue(props.value ?? ''), [props.value]);
  const labelId = React.useId();

  return (
    <div className="w-[360px] space-y-2">
      <span id={labelId} className="text-sm font-medium text-foreground">
        In location
      </span>
      <FolderPicker
        {...props}
        aria-labelledby={labelId}
        value={value}
        onSelect={setValue}
        onLoadChildren={loadChildren}
      />
    </div>
  );
}

export const Default: Story = {
  args: { onSelect: () => {}, onLoadChildren: loadChildren },
  render: (args) => <FieldDemo {...args} />,
};

/** Browsing resumes at the parent of the current value, with that folder highlighted. */
export const WithValue: Story = {
  args: { onSelect: () => {}, onLoadChildren: loadChildren },
  render: (args) => <FieldDemo {...args} value="/SharePoint Document Libraries/Finance" />,
};

/** Without the clear control, the value can only be replaced, not emptied. */
export const NotClearable: Story = {
  args: { onSelect: () => {}, onLoadChildren: loadChildren },
  render: (args) => <FieldDemo {...args} value="/OneDrive/Documents" clearable={false} />,
};

export const Disabled: Story = {
  args: { onSelect: () => {}, onLoadChildren: loadChildren },
  render: (args) => <FieldDemo {...args} value="/OneDrive/Pictures" disabled />,
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
 * The four ways the list can come up without rows, side by side. Each is a
 * distinct message: a level still loading is not an empty folder, an empty
 * folder is not a failed search, and none of them is an error.
 */
export const EmptyStates: Story = {
  args: { onSelect: () => {}, onLoadChildren: loadChildren },
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        story:
          'Reaching these in the Default story means waiting on a fetch or drilling into a particular folder, so they are collected here. Select is disabled in these panels, as each is at the root with nothing highlighted. Inside an empty folder below the root, Select stays enabled: the folder being browsed is still a valid choice, even with nothing inside it.',
      },
    },
  },
  render: function Render() {
    return (
      <div className="flex flex-wrap items-start gap-6">
        <Panel label="Loading">
          {/* Never resolves, so the level stays in flight. */}
          <FolderPickerContent onLoadChildren={() => new Promise(() => {})} onSelect={() => {}} />
        </Panel>

        <Panel label="No subfolders">
          <FolderPickerContent onLoadChildren={() => Promise.resolve([])} onSelect={() => {}} />
        </Panel>

        <Panel label="No search match">
          <FolderPickerContent
            onLoadChildren={loadChildren}
            onSelect={() => {}}
            initialSearch="zzz"
          />
        </Panel>

        <Panel label="Load failure">
          <FolderPickerContent
            onLoadChildren={() =>
              Promise.reject(new Error('You do not have access to this folder.'))
            }
            onSelect={() => {}}
          />
        </Panel>
      </div>
    );
  },
};
