import { Button, Menu, MenuItem } from '@mui/material';
import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import {
  Edit,
  Folder,
  FolderOpen,
  Home,
  Info,
  Lock,
  New,
  Settings,
  StepOut,
  UploadFiles,
  User,
} from '../../icons';
import type { IMenuItem } from '../components';
import { ApButton, ApMenu } from '../components';
import { ConsumptionTabs, materialParameters, Section } from './storybook-helpers';

/**
 * Menus exist on two consumption paths:
 * - `Menu` + `MenuItem` from `@mui/material` — styled by the Apollo theme
 *   overrides with custom background colors, text colors, and interactive
 *   hover/focus/disabled feedback.
 * - `ApMenu` from `@uipath/apollo-react/material/components` — a dropdown menu
 *   with support for icons, subtitles, sections, separators, and nested items.
 */
const meta: Meta = {
  title: 'Components/Menu',
  parameters: {
    ...materialParameters,
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj;

const MUI_IMPORT = "import { Menu, MenuItem } from '@mui/material';";
const AP_IMPORT = "import { ApMenu } from '@uipath/apollo-react/material/components';";

function MuiBasicMenuDemo() {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const handleClose = () => setAnchorEl(null);
  return (
    <>
      <Button variant="outlined" onClick={(e) => setAnchorEl(e.currentTarget)}>
        Open Menu
      </Button>
      <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={handleClose}>
        <MenuItem onClick={handleClose}>Profile</MenuItem>
        <MenuItem onClick={handleClose}>My Account</MenuItem>
        <MenuItem onClick={handleClose}>Settings</MenuItem>
        <MenuItem onClick={handleClose}>Logout</MenuItem>
      </Menu>
    </>
  );
}

function ApBasicMenuDemo() {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const close = () => setAnchorEl(null);
  const menuItems: IMenuItem[] = [
    { variant: 'item', title: 'Profile', onClick: close, startIcon: <User size={20} /> },
    { variant: 'item', title: 'Settings', onClick: close, startIcon: <Settings size={20} /> },
    { variant: 'separator' },
    { variant: 'item', title: 'Logout', onClick: close, startIcon: <StepOut size={20} /> },
  ];
  return (
    <>
      <ApButton
        label="Open Basic Menu"
        onClick={(e) => setAnchorEl(e.currentTarget as HTMLElement)}
      />
      <ApMenu
        anchorEl={anchorEl}
        isOpen={Boolean(anchorEl)}
        onClose={close}
        menuItems={menuItems}
      />
    </>
  );
}

function MuiIconsMenuDemo() {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const handleClose = () => setAnchorEl(null);
  const iconSx = { marginRight: 12 } as const;
  return (
    <>
      <Button variant="outlined" onClick={(e) => setAnchorEl(e.currentTarget)}>
        Open Menu with Icons
      </Button>
      <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={handleClose}>
        <MenuItem onClick={handleClose}>
          <Home size={20} style={iconSx} />
          Home
        </MenuItem>
        <MenuItem onClick={handleClose}>
          <User size={20} style={iconSx} />
          Profile
        </MenuItem>
        <MenuItem onClick={handleClose}>
          <Settings size={20} style={iconSx} />
          Settings
        </MenuItem>
        <MenuItem onClick={handleClose} disabled>
          <Lock size={20} style={iconSx} />
          Locked Option
        </MenuItem>
        <MenuItem onClick={handleClose}>
          <StepOut size={20} style={iconSx} />
          Logout
        </MenuItem>
      </Menu>
    </>
  );
}

function ApSubtitlesMenuDemo() {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const close = () => setAnchorEl(null);
  const menuItems: IMenuItem[] = [
    {
      variant: 'item',
      title: 'New File',
      subtitle: 'Create a new file in the project',
      onClick: close,
      startIcon: <New size={20} />,
    },
    {
      variant: 'item',
      title: 'New Folder',
      subtitle: 'Create a new folder in the project',
      onClick: close,
      startIcon: <FolderOpen size={20} />,
    },
    { variant: 'separator' },
    {
      variant: 'item',
      title: 'Import',
      subtitle: 'Import files from external source',
      onClick: close,
      startIcon: <UploadFiles size={20} />,
    },
  ];
  return (
    <>
      <ApButton
        label="Open Menu with Subtitles"
        onClick={(e) => setAnchorEl(e.currentTarget as HTMLElement)}
      />
      <ApMenu
        anchorEl={anchorEl}
        isOpen={Boolean(anchorEl)}
        onClose={close}
        menuItems={menuItems}
      />
    </>
  );
}

function ApStatesMenuDemo() {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const close = () => setAnchorEl(null);
  const menuItems: IMenuItem[] = [
    { variant: 'item', title: 'Active Item', isSelected: true, onClick: close },
    { variant: 'item', title: 'Normal Item', onClick: close },
    { variant: 'item', title: 'Disabled Item', disabled: true },
    { variant: 'separator' },
    { variant: 'section', title: 'Section Header' },
    { variant: 'item', title: 'Item in Section', onClick: close },
  ];
  return (
    <>
      <ApButton
        label="Open Menu with States"
        onClick={(e) => setAnchorEl(e.currentTarget as HTMLElement)}
      />
      <ApMenu
        anchorEl={anchorEl}
        isOpen={Boolean(anchorEl)}
        onClose={close}
        menuItems={menuItems}
      />
    </>
  );
}

function ApNestedMenuDemo() {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const close = () => setAnchorEl(null);
  const menuItems: IMenuItem[] = [
    {
      variant: 'submenu',
      title: 'File',
      startIcon: <Folder size={20} />,
      subItems: [
        { variant: 'item', title: 'New', onClick: close },
        { variant: 'item', title: 'Open', onClick: close },
        { variant: 'item', title: 'Save', onClick: close },
      ],
    },
    {
      variant: 'submenu',
      title: 'Edit',
      startIcon: <Edit size={20} />,
      subItems: [
        { variant: 'item', title: 'Cut', onClick: close },
        { variant: 'item', title: 'Copy', onClick: close },
        { variant: 'item', title: 'Paste', onClick: close },
      ],
    },
    { variant: 'separator' },
    { variant: 'item', title: 'About', onClick: close, startIcon: <Info size={20} /> },
  ];
  return (
    <>
      <ApButton
        label="Open Nested Menu"
        onClick={(e) => setAnchorEl(e.currentTarget as HTMLElement)}
      />
      <ApMenu
        anchorEl={anchorEl}
        isOpen={Boolean(anchorEl)}
        onClose={close}
        menuItems={menuItems}
      />
    </>
  );
}

export const BasicMenu: Story = {
  render: () => (
    <ConsumptionTabs
      muiImport={MUI_IMPORT}
      apImport={AP_IMPORT}
      mui={<MuiBasicMenuDemo />}
      ap={<ApBasicMenuDemo />}
    />
  ),
};

export const WithIcons: Story = {
  render: () => (
    <Section
      title="Menu with Icons"
      description="Menu items with leading icons for better visual communication, including a disabled item — MUI only."
    >
      <MuiIconsMenuDemo />
    </Section>
  ),
};

export const WithSubtitles: Story = {
  render: () => (
    <Section
      title="Menu with Subtitles"
      description="ApMenu items with descriptive subtitles — Ap component only."
    >
      <ApSubtitlesMenuDemo />
    </Section>
  ),
};

export const ItemStates: Story = {
  render: () => (
    <Section
      title="Menu Item States"
      description="Menu items demonstrate hover, focus, selected, disabled, and section header states with Apollo theme styling — Ap component only."
    >
      <ApStatesMenuDemo />
    </Section>
  ),
};

export const NestedMenu: Story = {
  render: () => (
    <Section
      title="Nested Menu"
      description="Menu with submenu items (hover over items with arrows) — Ap component only."
    >
      <ApNestedMenuDemo />
    </Section>
  ),
};
