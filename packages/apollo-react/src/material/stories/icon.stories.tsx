import Box from '@mui/material/Box';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import type { Meta, StoryObj } from '@storybook/react';
import type { ReactNode } from 'react';
import { useState } from 'react';
import { ApIcon } from '../components';
import { materialParameters, Row, Section } from './storybook-helpers';

/**
 * `ApIcon` from `@uipath/apollo-react/material/components`.
 *
 * Icon component with support for Material Icons (normal & outlined variants)
 * and custom UiPath icons.
 */
const meta: Meta = {
  title: 'Components/Icon',
  parameters: {
    ...materialParameters,
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj;

const MATERIAL_ICONS = [
  'home',
  'search',
  'settings',
  'favorite',
  'star',
  'delete',
  'edit',
  'check',
  'close',
  'add',
  'remove',
  'arrow_forward',
  'arrow_back',
  'arrow_upward',
  'arrow_downward',
  'expand_more',
  'expand_less',
  'menu',
  'more_vert',
  'more_horiz',
  'info',
  'warning',
  'error',
  'help',
  'visibility',
  'visibility_off',
  'person',
  'lock',
  'check_circle',
  'cancel',
  'save',
  'download',
  'upload',
  'refresh',
  'folder',
  'folder_open',
  'description',
] as const;

const CUSTOM_ICONS = [
  { name: 'agent', label: 'Agent' },
  { name: 'agentic_process', label: 'Agentic Process' },
  { name: 'api_automation', label: 'API Automation' },
  { name: 'app', label: 'App' },
  { name: 'arrow_down', label: 'Arrow Down' },
  { name: 'arrow_right', label: 'Arrow Right' },
  { name: 'attention_badge', label: 'Attention Badge' },
  { name: 'automation', label: 'Automation' },
  { name: 'autopilot', label: 'Autopilot' },
  { name: 'autopilot_color', label: 'Autopilot Color' },
  { name: 'autopilot_toggle', label: 'Autopilot Toggle' },
  { name: 'basic_auth_user', label: 'Basic Auth User' },
  { name: 'book_2', label: 'Book 2' },
  { name: 'burger', label: 'Burger' },
  { name: 'category', label: 'Category' },
  { name: 'chevron', label: 'Chevron' },
  { name: 'cloud_download', label: 'Cloud Download' },
  { name: 'dashboard', label: 'Dashboard' },
  { name: 'date_time', label: 'Date Time' },
  { name: 'directory_app', label: 'Directory App' },
  { name: 'directory_group', label: 'Directory Group' },
  { name: 'directory_user', label: 'Directory User' },
  { name: 'error', label: 'Error' },
  { name: 'expand_message', label: 'Expand Message' },
  { name: 'history', label: 'History' },
  { name: 'info', label: 'Info' },
  { name: 'library', label: 'Library' },
  { name: 'line_arrow', label: 'Line Arrow' },
  { name: 'line_arrow_left', label: 'Line Arrow Left' },
  { name: 'line_arrow_right', label: 'Line Arrow Right' },
  { name: 'local_group', label: 'Local Group' },
  { name: 'machine', label: 'Machine' },
  { name: 'model', label: 'Model' },
  { name: 'navigate_browser', label: 'Navigate Browser' },
  { name: 'new_chat', label: 'New Chat' },
  { name: 'right_panel_close', label: 'Right Panel Close' },
  { name: 'right_panel_open', label: 'Right Panel Open' },
  { name: 'robot', label: 'Robot' },
  { name: 'screenplay', label: 'Screenplay' },
  { name: 'success', label: 'Success' },
  { name: 'template', label: 'Template' },
  { name: 'user', label: 'User' },
  { name: 'waffle', label: 'Waffle' },
  { name: 'warning', label: 'Warning' },
  { name: 'website', label: 'Website' },
] as const;

const SIZES = ['16px', '24px', '32px', '48px'] as const;

function IconItem({ label, children }: { label: string; children: ReactNode }) {
  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 1,
        p: 2,
        border: '1px solid',
        borderColor: 'divider',
        borderRadius: 1,
        minWidth: 100,
      }}
    >
      {children}
      <Typography
        variant="caption"
        sx={{
          fontWeight: 600,
          color: 'text.secondary',
          textAlign: 'center',
          wordBreak: 'break-word',
        }}
      >
        {label}
      </Typography>
    </Box>
  );
}

function CustomIconSearchDemo() {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredIcons = CUSTOM_ICONS.filter(
    (icon) =>
      icon.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      icon.label.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <Section
      title={`Custom UiPath Icons (${filteredIcons.length} icons)`}
      description="Custom icon set from UiPath legacy portal icons."
    >
      <TextField
        placeholder="Search custom icons..."
        value={searchTerm}
        onChange={(event) => setSearchTerm(event.target.value)}
        size="small"
        sx={{ mb: 2, width: '100%', maxWidth: 400 }}
      />
      <Row>
        {filteredIcons.map((icon) => (
          <IconItem key={icon.name} label={icon.label}>
            <ApIcon name={icon.name} variant="custom" size="24px" />
          </IconItem>
        ))}
      </Row>
    </Section>
  );
}

export const MaterialIcons: Story = {
  render: () => (
    <Section
      title="Material Icons (Normal Variant)"
      description='Standard Material Design icons using the "normal" variant.'
    >
      <Row>
        {MATERIAL_ICONS.map((icon) => (
          <IconItem key={icon} label={icon}>
            <ApIcon name={icon} variant="normal" size="24px" />
          </IconItem>
        ))}
      </Row>
    </Section>
  ),
};

export const OutlinedIcons: Story = {
  render: () => (
    <Section
      title="Material Icons (Outlined Variant)"
      description="Outlined version of Material Design icons."
    >
      <Row>
        {MATERIAL_ICONS.slice(0, 18).map((icon) => (
          <IconItem key={icon} label={icon}>
            <ApIcon name={icon} variant="outlined" size="24px" />
          </IconItem>
        ))}
      </Row>
    </Section>
  ),
};

export const CustomIcons: Story = {
  render: () => <CustomIconSearchDemo />,
};

export const Sizes: Story = {
  render: () => (
    <Section title="Sizes" description="Icons can be displayed in different sizes.">
      <Row>
        {SIZES.map((size) => (
          <IconItem key={size} label={size}>
            <ApIcon name="star" size={size} />
          </IconItem>
        ))}
      </Row>
    </Section>
  ),
};

export const CustomColors: Story = {
  render: () => (
    <>
      <Section
        title="Custom Colors (Material)"
        description="Material icons with custom colors applied."
      >
        <Row>
          <IconItem label="Primary">
            <ApIcon name="favorite" color="var(--color-primary)" size="32px" />
          </IconItem>
          <IconItem label="Brand Orange">
            <ApIcon name="favorite" color="#fa4616" size="32px" />
          </IconItem>
          <IconItem label="Purple">
            <ApIcon name="favorite" color="#764ba2" size="32px" />
          </IconItem>
          <IconItem label="Green">
            <ApIcon name="favorite" color="#00ff00" size="32px" />
          </IconItem>
          <IconItem label="Red">
            <ApIcon name="favorite" color="#ff0000" size="32px" />
          </IconItem>
        </Row>
      </Section>
      <Section
        title="Custom Colors (Custom Icons)"
        description="Custom UiPath icons with custom colors applied."
      >
        <Row>
          <IconItem label="Primary">
            <ApIcon name="robot" variant="custom" color="var(--color-primary)" size="32px" />
          </IconItem>
          <IconItem label="Brand Orange">
            <ApIcon name="robot" variant="custom" color="#fa4616" size="32px" />
          </IconItem>
          <IconItem label="Purple">
            <ApIcon name="robot" variant="custom" color="#764ba2" size="32px" />
          </IconItem>
          <IconItem label="Agent (Green)">
            <ApIcon name="agent" variant="custom" color="#00ff00" size="32px" />
          </IconItem>
          <IconItem label="Automation (Blue)">
            <ApIcon name="automation" variant="custom" color="#0066ff" size="32px" />
          </IconItem>
        </Row>
      </Section>
    </>
  ),
};
