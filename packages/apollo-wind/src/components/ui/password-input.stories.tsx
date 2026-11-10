import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import { Label } from './label';
import { PasswordInput } from './password-input';

const meta = {
  title: 'Components/Core/Password Input',
  component: PasswordInput,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'A masked input with a button inside the field to show or hide the value. Use it for passwords, API keys and other secrets. Hovering the button shows a tooltip. Pass translated `showLabel` and `hideLabel` strings; they label both the tooltip and the button for screen readers. Give each toggle a unique `showLabel` and `hideLabel` when a page has more than one field.',
      },
    },
  },
  argTypes: {
    variant: { control: 'select', options: ['default', 'ghost', 'none'] },
    size: { control: 'select', options: ['default', 'xs'] },
  },
} satisfies Meta<typeof PasswordInput>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    'aria-label': 'Password',
    placeholder: 'Enter password...',
  },
};

export const WithLabel: Story = {
  render: () => (
    <div className="grid w-full max-w-sm items-center gap-1.5">
      <Label htmlFor="password">Password</Label>
      <PasswordInput id="password" defaultValue="correct horse" />
    </div>
  ),
};

export const ApiKey: Story = {
  render: () => (
    <div className="grid w-80 gap-1.5">
      <Label htmlFor="api-key">API key</Label>
      <PasswordInput
        id="api-key"
        defaultValue="sk-live-3f9a2c7e1b"
        showLabel="Show API key"
        hideLabel="Hide API key"
      />
    </div>
  ),
};

export const Translated: Story = {
  render: () => (
    <div className="grid w-80 gap-1.5">
      <Label htmlFor="mot-de-passe">Mot de passe</Label>
      <PasswordInput
        id="mot-de-passe"
        defaultValue="cheval correct"
        showLabel="Afficher le mot de passe"
        hideLabel="Masquer le mot de passe"
      />
    </div>
  ),
};

export const SyncedVisibility: Story = {
  render: function SyncedVisibilityStory() {
    const [visible, setVisible] = useState(false);
    return (
      <div className="grid w-80 gap-1.5">
        <Label htmlFor="new-password">New password</Label>
        <PasswordInput
          id="new-password"
          visible={visible}
          onVisibleChange={setVisible}
          showLabel="Show new password"
          hideLabel="Hide new password"
        />
        <Label htmlFor="confirm-password">Confirm password</Label>
        <PasswordInput
          id="confirm-password"
          visible={visible}
          onVisibleChange={setVisible}
          showLabel="Show confirmed password"
          hideLabel="Hide confirmed password"
        />
      </div>
    );
  },
};

export const WithError: Story = {
  render: () => (
    <div className="grid w-80 gap-1.5">
      <Label htmlFor="pw-error">Password</Label>
      <PasswordInput id="pw-error" defaultValue="short" error="Use at least 12 characters." />
    </div>
  ),
};

export const Disabled: Story = {
  render: () => <PasswordInput aria-label="Password" defaultValue="correct horse" disabled />,
};
