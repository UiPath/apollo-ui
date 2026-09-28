import {
  Avatar,
  Divider,
  List,
  ListItem,
  ListItemAvatar,
  ListItemButton,
  ListItemIcon,
  ListItemText,
} from '@mui/material';
import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import {
  Delete,
  EmailDraft,
  EmailMessage,
  Folder,
  Home,
  Image,
  Send,
  Settings,
  User,
  Video,
  VolumeUp,
} from '../../icons';
import { materialParameters, Section } from './storybook-helpers';

/**
 * Material UI List components (`List`, `ListItem`, `ListItemButton`,
 * `ListItemIcon`, `ListItemAvatar`, `ListItemText`) styled by the Apollo theme
 * overrides. Displays lists of items with various configurations and
 * interactive states.
 */
const meta: Meta = {
  title: 'Components/List',
  parameters: {
    ...materialParameters,
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj;

const listSx = {
  maxWidth: 500,
  border: '1px solid',
  borderColor: 'divider',
  borderRadius: '8px',
} as const;

const INTERACTIVE_ITEMS = [
  { text: 'Inbox', icon: <EmailMessage /> },
  { text: 'Drafts', icon: <EmailDraft /> },
  { text: 'Sent', icon: <Send /> },
  { text: 'Trash', icon: <Delete /> },
] as const;

function InteractiveListDemo() {
  const [selectedIndex, setSelectedIndex] = useState(0);
  return (
    <List sx={listSx}>
      {INTERACTIVE_ITEMS.map(({ text, icon }, index) => (
        <ListItem key={text} disablePadding>
          <ListItemButton
            selected={selectedIndex === index}
            onClick={() => setSelectedIndex(index)}
          >
            <ListItemIcon>{icon}</ListItemIcon>
            <ListItemText primary={text} />
          </ListItemButton>
        </ListItem>
      ))}
    </List>
  );
}

export const Basic: Story = {
  render: () => (
    <Section title="Basic List" description="Standard list items with primary and secondary text.">
      <List sx={listSx}>
        <ListItem>
          <ListItemText primary="Single-line item" />
        </ListItem>
        <ListItem>
          <ListItemText primary="Two-line item" secondary="Secondary text" />
        </ListItem>
        <ListItem>
          <ListItemText
            primary="Three-line item"
            secondary="This is a longer secondary text that demonstrates multiline content in a list item."
          />
        </ListItem>
      </List>
    </Section>
  ),
};

export const WithIconsAndAvatars: Story = {
  render: () => (
    <>
      <Section title="With Icons" description="List items with leading icons for visual clarity.">
        <List sx={listSx}>
          <ListItem>
            <ListItemIcon>
              <Home />
            </ListItemIcon>
            <ListItemText primary="Home" secondary="Dashboard" />
          </ListItem>
          <ListItem>
            <ListItemIcon>
              <Settings />
            </ListItemIcon>
            <ListItemText primary="Settings" secondary="Preferences" />
          </ListItem>
          <ListItem>
            <ListItemIcon>
              <User />
            </ListItemIcon>
            <ListItemText primary="Profile" secondary="Account info" />
          </ListItem>
        </List>
      </Section>
      <Section title="With Avatars" description="List items with avatar icons.">
        <List sx={listSx}>
          <ListItem>
            <ListItemAvatar>
              <Avatar>
                <User />
              </Avatar>
            </ListItemAvatar>
            <ListItemText primary="John Doe" secondary="john@example.com" />
          </ListItem>
          <ListItem>
            <ListItemAvatar>
              <Avatar>
                <User />
              </Avatar>
            </ListItemAvatar>
            <ListItemText primary="Jane Smith" secondary="jane@example.com" />
          </ListItem>
        </List>
      </Section>
    </>
  ),
};

export const Interactive: Story = {
  render: () => (
    <Section
      title="Interactive List"
      description="Clickable list items with hover and selection states."
    >
      <InteractiveListDemo />
    </Section>
  ),
};

export const DividersAndDense: Story = {
  render: () => (
    <>
      <Section title="With Dividers" description="List items separated by dividers.">
        <List sx={listSx}>
          <ListItem>
            <ListItemText primary="Item One" secondary="First item" />
          </ListItem>
          <Divider component="li" />
          <ListItem>
            <ListItemText primary="Item Two" secondary="Second item" />
          </ListItem>
          <Divider component="li" />
          <ListItem>
            <ListItemText primary="Item Three" secondary="Third item" />
          </ListItem>
        </List>
      </Section>
      <Section title="Dense List" description="Compact list with reduced spacing.">
        <List dense sx={listSx}>
          <ListItem>
            <ListItemIcon>
              <Folder />
            </ListItemIcon>
            <ListItemText primary="Documents" />
          </ListItem>
          <ListItem>
            <ListItemIcon>
              <Image />
            </ListItemIcon>
            <ListItemText primary="Images" />
          </ListItem>
          <ListItem>
            <ListItemIcon>
              <VolumeUp />
            </ListItemIcon>
            <ListItemText primary="Music" />
          </ListItem>
          <ListItem>
            <ListItemIcon>
              <Video />
            </ListItemIcon>
            <ListItemText primary="Videos" />
          </ListItem>
        </List>
      </Section>
    </>
  ),
};

export const DisabledItems: Story = {
  render: () => (
    <Section title="Disabled Items" description="List with disabled interactive items.">
      <List sx={listSx}>
        <ListItem disablePadding>
          <ListItemButton>
            <ListItemText primary="Active item" />
          </ListItemButton>
        </ListItem>
        <ListItem disablePadding>
          <ListItemButton disabled>
            <ListItemText primary="Disabled item" />
          </ListItemButton>
        </ListItem>
        <ListItem disablePadding>
          <ListItemButton>
            <ListItemText primary="Another active item" />
          </ListItemButton>
        </ListItem>
      </List>
    </Section>
  ),
};
