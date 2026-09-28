import Badge from '@mui/material/Badge';
import Box from '@mui/material/Box';
import Tab from '@mui/material/Tab';
import Tabs from '@mui/material/Tabs';
import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import { EmailMessage, Help, Home, Notifications, Settings, User } from '../../icons';
import { materialParameters, Section } from './storybook-helpers';

/**
 * Material UI `Tabs` and `Tab` styled by the Apollo theme overrides. Covers
 * labels, icons, badges, disabled items and the layout variants (centered,
 * full width, scrollable).
 */
const meta: Meta = {
  title: 'Components/Tabs',
  parameters: {
    ...materialParameters,
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj;

function BasicTabsDemo() {
  const [value, setValue] = useState(0);
  return (
    <>
      <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
        <Tabs value={value} onChange={(_, newValue) => setValue(newValue)}>
          <Tab label="Tab One" />
          <Tab label="Tab Two" />
          <Tab label="Tab Three" />
        </Tabs>
      </Box>
      <Box sx={{ p: 3 }}>
        {value === 0 && <div>Content for Tab One</div>}
        {value === 1 && <div>Content for Tab Two</div>}
        {value === 2 && <div>Content for Tab Three</div>}
      </Box>
    </>
  );
}

export const Basic: Story = {
  render: () => (
    <Section title="Basic Tabs" description="Simple tabs with text labels and content switching.">
      <BasicTabsDemo />
    </Section>
  ),
};

function IconTabsDemo() {
  const [value, setValue] = useState(0);
  return (
    <>
      <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
        <Tabs value={value} onChange={(_, newValue) => setValue(newValue)}>
          <Tab icon={<Home size={20} />} label="Home" />
          <Tab icon={<User size={20} />} label="Profile" />
          <Tab icon={<Settings size={20} />} label="Settings" />
        </Tabs>
      </Box>
      <Box sx={{ p: 3 }}>
        {value === 0 && <div>Home content with dashboard</div>}
        {value === 1 && <div>Profile settings and information</div>}
        {value === 2 && <div>Application settings and preferences</div>}
      </Box>
    </>
  );
}

function IconOnlyTabsDemo() {
  const [value, setValue] = useState(0);
  return (
    <>
      <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
        <Tabs value={value} onChange={(_, newValue) => setValue(newValue)}>
          <Tab icon={<EmailMessage size={20} />} aria-label="messages" />
          <Tab icon={<Notifications size={20} />} aria-label="notifications" />
          <Tab icon={<User size={20} />} aria-label="profile" />
          <Tab icon={<Help size={20} />} aria-label="help" />
        </Tabs>
      </Box>
      <Box sx={{ p: 3 }}>
        {value === 0 && <div>Messages inbox</div>}
        {value === 1 && <div>Notifications feed</div>}
        {value === 2 && <div>Profile overview</div>}
        {value === 3 && <div>Help center</div>}
      </Box>
    </>
  );
}

export const WithIcons: Story = {
  render: () => (
    <>
      <Section title="Tabs with Icons" description="Tabs displaying both icons and text labels.">
        <IconTabsDemo />
      </Section>
      <Section title="Icon-Only Tabs" description="Tabs with only icon elements (no text labels).">
        <IconOnlyTabsDemo />
      </Section>
    </>
  ),
};

function BadgeTabsDemo() {
  const [value, setValue] = useState(0);
  return (
    <>
      <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
        <Tabs value={value} onChange={(_, newValue) => setValue(newValue)}>
          <Tab
            label={
              <Badge badgeContent={4} color="error">
                Messages
              </Badge>
            }
          />
          <Tab
            label={
              <Badge badgeContent={2} color="warning">
                Notifications
              </Badge>
            }
          />
          <Tab label="Archive" />
        </Tabs>
      </Box>
      <Box sx={{ p: 3 }}>
        {value === 0 && <div>4 unread messages</div>}
        {value === 1 && <div>2 new notifications</div>}
        {value === 2 && <div>Archived items</div>}
      </Box>
    </>
  );
}

export const WithBadges: Story = {
  render: () => (
    <Section
      title="Tabs with Badges"
      description="Tabs displaying notification badges for unread items."
    >
      <BadgeTabsDemo />
    </Section>
  ),
};

function DisabledTabsDemo() {
  const [value, setValue] = useState(0);
  return (
    <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
      <Tabs value={value} onChange={(_, newValue) => setValue(newValue)}>
        <Tab label="Active" />
        <Tab label="Disabled" disabled />
        <Tab label="Also Disabled" disabled />
      </Tabs>
    </Box>
  );
}

export const DisabledTabs: Story = {
  render: () => (
    <Section title="Disabled Tabs" description="Tabs with some items in disabled state.">
      <DisabledTabsDemo />
    </Section>
  ),
};

function CenteredTabsDemo() {
  const [value, setValue] = useState(0);
  return (
    <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
      <Tabs value={value} onChange={(_, newValue) => setValue(newValue)} centered>
        <Tab label="Item One" />
        <Tab label="Item Two" />
        <Tab label="Item Three" />
      </Tabs>
    </Box>
  );
}

function FullWidthTabsDemo() {
  const [value, setValue] = useState(0);
  return (
    <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
      <Tabs value={value} onChange={(_, newValue) => setValue(newValue)} variant="fullWidth">
        <Tab label="First" />
        <Tab label="Second" />
        <Tab label="Third" />
      </Tabs>
    </Box>
  );
}

function ScrollableTabsDemo() {
  const [value, setValue] = useState(0);
  return (
    <Box sx={{ borderBottom: 1, borderColor: 'divider', maxWidth: 500 }}>
      <Tabs
        value={value}
        onChange={(_, newValue) => setValue(newValue)}
        variant="scrollable"
        scrollButtons="auto"
      >
        <Tab label="Tab 1" />
        <Tab label="Tab 2" />
        <Tab label="Tab 3" />
        <Tab label="Tab 4" />
        <Tab label="Tab 5" />
        <Tab label="Tab 6" />
        <Tab label="Tab 7" />
        <Tab label="Tab 8" />
      </Tabs>
    </Box>
  );
}

export const Layouts: Story = {
  render: () => (
    <>
      <Section title="Centered Tabs" description="Tabs centered in their container.">
        <CenteredTabsDemo />
      </Section>
      <Section
        title="Full Width Tabs"
        description="Tabs that stretch to fill the container width equally."
      >
        <FullWidthTabsDemo />
      </Section>
      <Section
        title="Scrollable Tabs"
        description="Tabs with horizontal scrolling for overflow content."
      >
        <ScrollableTabsDemo />
      </Section>
    </>
  ),
};
