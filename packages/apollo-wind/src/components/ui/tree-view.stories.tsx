import type { Meta } from '@storybook/react-vite';
import { Folder, File, Globe, Pencil } from 'lucide-react';
import TreeView, {
  type TreeViewItem,
  type TreeViewIconMap,
  type TreeViewMenuItem,
} from './tree-view';

const meta: Meta<typeof TreeView> = {
  title: 'Components/Data Display/Tree View',
  component: TreeView,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: `
A hierarchical tree component for displaying and selecting items like file explorers, navigation, or admin sidebars.

## Features

- **Search** – Filters by name and auto-expands matching branches
- **Selection modes** – \`multiple\` (default), \`single\`, or \`none\`
- **Selection checkboxes** – Shown only on leaf items (folders do not get checkboxes)
- **Disabled items** – Set \`disabled: true\` on items to grey them out and prevent selection
- **Badges & metadata** – Add \`badge\` and \`meta\` to items for status, version, or counts
- **Item actions** – Add \`actions\` for Edit/Delete; rendered in a compact dropdown (single "more" icon) to prevent horizontal scroll
- **Context menu** – Right-click with \`menuItems\` for custom actions
- **Access checkboxes** – \`showCheckboxes\` for check/uncheck with \`onCheckChange\`

## Layout

The tree uses a fixed vertical layout: **Title** → **Search bar** (full width) → **Expand / Collapse / Selected count / Clear** → **Tree content**. Overflow is handled so the tree never scrolls horizontally.
        `,
      },
    },
  },
  argTypes: {
    selectionMode: {
      control: 'select',
      options: ['single', 'multiple', 'none'],
      description: 'Controls selection behavior. "multiple" allows shift/ctrl-click and drag-select.',
    },
    showSelectionCheckboxes: {
      description: 'Shows checkboxes on leaf items only. Folders do not get checkboxes.',
    },
    showCheckboxes: {
      description: 'Shows access-rights checkboxes with Check/Uncheck actions in the toolbar.',
    },
  },
};

export default meta;

const sampleData: TreeViewItem[] = [
  {
    id: '1',
    name: 'Root',
    type: 'region',
    children: [
      {
        id: '1.1',
        name: 'Folder 1',
        type: 'store',
        children: [
          {
            id: '1.1.1',
            name: 'Subfolder',
            type: 'department',
            children: [
              { id: '1.1.1.1', name: 'File 1', type: 'item' },
              { id: '1.1.1.2', name: 'File 2', type: 'item' },
            ],
          },
        ],
      },
      {
        id: '1.2',
        name: 'Folder 2',
        type: 'store',
        children: [
          { id: '1.2.1', name: 'Document.pdf', type: 'item' },
          { id: '1.2.2', name: 'Spreadsheet.xlsx', type: 'item' },
        ],
      },
    ],
  },
];

const iconMap: TreeViewIconMap = {
  region: <Globe className="h-4 w-4 text-muted-foreground" />,
  store: <Folder className="h-4 w-4 text-primary/80" />,
  department: <Folder className="h-4 w-4 text-primary/60" />,
  item: <File className="h-4 w-4 text-muted-foreground" />,
};

// ============================================================================
// Basic
// ============================================================================

export const Basic = {
  name: 'Basic',
  parameters: {
    docs: { description: { story: 'Default tree with expand/collapse and search.' } },
  },
  render: () => (
    <TreeView
      data={sampleData}
      title="File Explorer"
      iconMap={iconMap}
    />
  ),
};

// ============================================================================
// With Checkboxes
// ============================================================================

export const WithCheckboxes = {
  name: 'With Checkboxes',
  parameters: {
    docs: { description: { story: 'Access-rights checkboxes with Check/Uncheck toolbar actions.' } },
  },
  render: () => (
    <TreeView
      data={sampleData}
      title="Select Items"
      showCheckboxes
      iconMap={iconMap}
      onCheckChange={(item, checked) => {
        console.log(`${item.name} ${checked ? 'checked' : 'unchecked'}`);
      }}
    />
  ),
};

// ============================================================================
// With Disabled Items, Badges, Meta, and Actions
// ============================================================================

const sampleDataWithFeatures: TreeViewItem[] = [
  {
    id: '1',
    name: 'Root',
    type: 'region',
    children: [
      {
        id: '1.1',
        name: 'Folder 1',
        type: 'store',
        children: [
          {
            id: '1.1.1',
            name: 'Active Item',
            type: 'item',
            badge: <span className="text-xs px-1.5 py-0.5 rounded bg-green-100 text-green-800">Live</span>,
            meta: '2.4.1',
            actions: [
              {
                id: 'edit',
                icon: <Pencil className="h-3.5 w-3.5" />,
                label: 'Edit',
                onClick: (item) => console.log('Edit', item.name),
              },
            ],
          },
          {
            id: '1.1.2',
            name: 'Disabled Item',
            type: 'item',
            disabled: true,
            meta: 'Unavailable',
          },
        ],
      },
    ],
  },
];

export const WithDisabledBadgesMetaAndActions = {
  name: 'With Disabled, Badges, Meta & Actions',
  parameters: {
    docs: {
      description: {
        story:
          'Demonstrates disabled items (greyed out), badges, meta text, and item actions in a dropdown. Actions use a single "more" icon to prevent horizontal scroll.',
      },
    },
  },
  render: () => (
    <TreeView
      data={sampleDataWithFeatures}
      title="Feature showcase"
      iconMap={iconMap}
      showSelectionCheckboxes
    />
  ),
};

// ============================================================================
// Single Selection Mode
// ============================================================================

export const SingleSelectionMode = {
  name: 'Single Selection',
  parameters: {
    docs: { description: { story: 'Only one item can be selected at a time.' } },
  },
  render: () => (
    <TreeView
      data={sampleData}
      title="Single selection only"
      iconMap={iconMap}
      selectionMode="single"
      showSelectionCheckboxes
    />
  ),
};

// ============================================================================
// No Selection (Expand only)
// ============================================================================

export const NoSelectionMode = {
  name: 'No Selection',
  parameters: {
    docs: { description: { story: 'Expand/collapse only; no selection or selection UI.' } },
  },
  render: () => (
    <TreeView
      data={sampleData}
      title="Expand/collapse only"
      iconMap={iconMap}
      selectionMode="none"
    />
  ),
};

// ============================================================================
// With Context Menu
// ============================================================================

export const WithContextMenu = {
  name: 'With Context Menu',
  parameters: {
    docs: { description: { story: 'Right-click for custom context menu actions.' } },
  },
  render: () => {
    const menuItems: TreeViewMenuItem[] = [
      {
        id: 'open',
        label: 'Open',
        action: (items) => console.log('Open:', items.map((i) => i.name)),
      },
      {
        id: 'download',
        label: 'Download',
        action: (items) => console.log('Download:', items.map((i) => i.name)),
      },
    ];

    return (
      <TreeView
        data={sampleData}
        title="Right-click for menu"
        iconMap={iconMap}
        menuItems={menuItems}
      />
    );
  },
};
