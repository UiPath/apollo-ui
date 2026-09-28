import FolderIcon from '@mui/icons-material/Folder';
import GroupIcon from '@mui/icons-material/Group';
import InsertDriveFileIcon from '@mui/icons-material/InsertDriveFile';
import PersonIcon from '@mui/icons-material/Person';
import Box from '@mui/material/Box';
import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import type { ApTreeViewItem } from '../components';
import { ApTreeView } from '../components';
import { materialParameters, Row, Section } from './storybook-helpers';

/**
 * `ApTreeView` from `@uipath/apollo-react/material/components` — a
 * hierarchical data display component for nested structures, with selection,
 * expansion control, icons, descriptions and additional info.
 *
 * ```ts
 * import { ApTreeView } from '@uipath/apollo-react/material/components';
 * ```
 */
const meta: Meta = {
  title: 'Components/Tree View',
  parameters: {
    ...materialParameters,
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj;

const fileSystemData: ApTreeViewItem[] = [
  {
    id: '1',
    title: 'src',
    description: 'Source code directory',
    icon: <FolderIcon />,
    iconColor: 'var(--color-warning)',
    children: [
      {
        id: '2',
        title: 'components',
        description: 'React components',
        icon: <FolderIcon />,
        iconColor: 'var(--color-warning)',
        children: [
          {
            id: '3',
            title: 'Header.tsx',
            description: 'Main header component',
            icon: <InsertDriveFileIcon />,
            iconColor: 'var(--color-info)',
            additionalInfo: '2.4 KB',
          },
          {
            id: '4',
            title: 'Footer.tsx',
            description: 'Main footer component',
            icon: <InsertDriveFileIcon />,
            iconColor: 'var(--color-info)',
            additionalInfo: '1.8 KB',
          },
        ],
      },
      {
        id: '5',
        title: 'pages',
        description: 'Page components',
        icon: <FolderIcon />,
        iconColor: 'var(--color-warning)',
        children: [
          {
            id: '6',
            title: 'Home.tsx',
            description: 'Home page',
            icon: <InsertDriveFileIcon />,
            iconColor: 'var(--color-info)',
            additionalInfo: '5.2 KB',
          },
          {
            id: '7',
            title: 'About.tsx',
            description: 'About page',
            icon: <InsertDriveFileIcon />,
            iconColor: 'var(--color-info)',
            additionalInfo: '3.1 KB',
            disabled: true,
          },
        ],
      },
      {
        id: '8',
        title: 'App.tsx',
        description: 'Main application component',
        icon: <InsertDriveFileIcon />,
        iconColor: 'var(--color-success)',
        additionalInfo: '4.7 KB',
      },
    ],
  },
  {
    id: '9',
    title: 'public',
    description: 'Public assets',
    icon: <FolderIcon />,
    iconColor: 'var(--color-warning)',
    children: [
      {
        id: '10',
        title: 'index.html',
        icon: <InsertDriveFileIcon />,
        additionalInfo: '512 B',
      },
      {
        id: '11',
        title: 'favicon.ico',
        icon: <InsertDriveFileIcon />,
        additionalInfo: '15 KB',
      },
    ],
  },
  {
    id: '12',
    title: 'package.json',
    description: 'NPM package configuration',
    icon: <InsertDriveFileIcon />,
    iconColor: 'var(--color-error)',
    additionalInfo: '1.2 KB',
  },
  {
    id: '13',
    title: 'tsconfig.json',
    description: 'TypeScript configuration',
    icon: <InsertDriveFileIcon />,
    iconColor: 'var(--color-info)',
    additionalInfo: '856 B',
  },
];

const organizationData: ApTreeViewItem[] = [
  {
    id: '1',
    title: 'Engineering',
    description: 'Engineering department',
    icon: <GroupIcon />,
    iconColor: 'var(--color-primary)',
    additionalInfo: '24 members',
    children: [
      {
        id: '2',
        title: 'Frontend',
        description: 'Frontend team',
        icon: <GroupIcon />,
        additionalInfo: '12 members',
        children: [
          {
            id: '3',
            title: 'Alice Johnson',
            description: 'Senior Frontend Developer',
            icon: <PersonIcon />,
            titleColor: 'var(--color-success)',
          },
          {
            id: '4',
            title: 'Bob Smith',
            description: 'Frontend Developer',
            icon: <PersonIcon />,
          },
        ],
      },
      {
        id: '5',
        title: 'Backend',
        description: 'Backend team',
        icon: <GroupIcon />,
        additionalInfo: '12 members',
        children: [
          {
            id: '6',
            title: 'Carol Williams',
            description: 'Senior Backend Developer',
            icon: <PersonIcon />,
            titleColor: 'var(--color-success)',
          },
          {
            id: '7',
            title: 'David Brown',
            description: 'Backend Developer - On leave',
            icon: <PersonIcon />,
            disabled: true,
          },
        ],
      },
    ],
  },
  {
    id: '8',
    title: 'Design',
    description: 'Design department',
    icon: <GroupIcon />,
    iconColor: 'var(--color-primary)',
    additionalInfo: '8 members',
    children: [
      {
        id: '9',
        title: 'Eve Davis',
        description: 'Lead Designer',
        icon: <PersonIcon />,
        titleColor: 'var(--color-success)',
      },
      {
        id: '10',
        title: 'Frank Miller',
        description: 'UI/UX Designer',
        icon: <PersonIcon />,
      },
    ],
  },
];

const simpleData: ApTreeViewItem[] = [
  {
    id: '1',
    title: 'Item 1',
    children: [
      { id: '2', title: 'Item 1.1' },
      { id: '3', title: 'Item 1.2' },
    ],
  },
  {
    id: '4',
    title: 'Item 2',
    children: [
      { id: '5', title: 'Item 2.1' },
      { id: '6', title: 'Item 2.2' },
    ],
  },
];

function SelectedInfo({ children }: { children: React.ReactNode }) {
  return (
    <Box
      sx={{
        mt: 1.5,
        p: 1.5,
        backgroundColor: 'action.hover',
        borderRadius: 1,
        fontSize: 14,
      }}
    >
      {children}
    </Box>
  );
}

function FileBrowserDemo() {
  const [selectedFileId, setSelectedFileId] = useState<string | undefined>('6');
  return (
    <>
      <ApTreeView
        items={fileSystemData}
        selectedItemId={selectedFileId}
        onSelectedItemsChange={setSelectedFileId}
        showSelectedChevron
      />
      {selectedFileId && (
        <SelectedInfo>
          Selected item ID: <strong>{selectedFileId}</strong>
        </SelectedInfo>
      )}
    </>
  );
}

function OrganizationDemo() {
  const [selectedTeamMember, setSelectedTeamMember] = useState<string | undefined>();
  return (
    <>
      <ApTreeView
        items={organizationData}
        selectedItemId={selectedTeamMember}
        onSelectedItemsChange={setSelectedTeamMember}
      />
      {selectedTeamMember && (
        <SelectedInfo>
          Selected team member: <strong>{selectedTeamMember}</strong>
        </SelectedInfo>
      )}
    </>
  );
}

export const InteractiveSelection: Story = {
  render: () => (
    <Section
      title="Interactive Selection with Chevron"
      description="File browser with selection tracking and chevron indicator."
    >
      <FileBrowserDemo />
    </Section>
  ),
};

export const RichContent: Story = {
  render: () => (
    <Section
      title="Rich Content"
      description="Tree with icons, colors, descriptions (tooltips), and additional info."
    >
      <OrganizationDemo />
    </Section>
  ),
};

export const ExpansionControl: Story = {
  render: () => (
    <>
      <Section
        title="Expansion Control"
        description="The expanded prop accepts a boolean to expand or collapse all items."
      >
        <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 3 }}>
          <Row label="All items expanded">
            <ApTreeView items={simpleData} expanded={true} />
          </Row>
          <Row label="All items collapsed (default)">
            <ApTreeView items={simpleData} expanded={false} />
          </Row>
        </Box>
      </Section>
      <Section
        title="Specific Items Expanded"
        description='Only "src" and "components" folders expanded via an array of item IDs.'
      >
        <ApTreeView items={fileSystemData} expanded={['1', '2']} />
      </Section>
    </>
  ),
};

export const FlatListMode: Story = {
  render: () => (
    <Section title="Flat List Mode" description="Disable expand/collapse for flat display.">
      <ApTreeView items={fileSystemData} disableExpandCollapse />
    </Section>
  ),
};

export const DisabledItems: Story = {
  render: () => (
    <Section
      title="Disabled Items"
      description="Individual items can be disabled to prevent selection."
    >
      <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 3 }}>
        <Row label="File system with disabled file (About.tsx)">
          <ApTreeView items={fileSystemData} expanded={['1', '5']} />
        </Row>
        <Row label="Organization with disabled member (David Brown)">
          <ApTreeView items={organizationData} expanded={true} />
        </Row>
      </Box>
    </Section>
  ),
};
