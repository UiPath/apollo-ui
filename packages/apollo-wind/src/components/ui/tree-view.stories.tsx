import type { Meta } from '@storybook/react-vite';
import { Folder, File, Globe } from 'lucide-react';
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
// With Context Menu
// ============================================================================

export const WithContextMenu = {
  name: 'With Context Menu',
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
