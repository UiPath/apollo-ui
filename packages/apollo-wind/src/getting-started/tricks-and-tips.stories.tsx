import type { Meta, StoryObj } from '@storybook/react-vite';
import * as React from 'react';

const meta = {
  title: "Introduction/Tricks & Tips + What's New",
  parameters: {
    layout: 'fullscreen',
  },
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

function TricksAndTipsPage() {
  return (
    <iframe
      src="/apollo-tricks-tips.html"
      style={{
        width: '100%',
        height: '100vh',
        border: 'none',
        display: 'block',
      }}
      title="Apollo — Tricks & Tips + What's New"
    />
  );
}

export const Default: Story = {
  name: "Tricks & Tips + What's New",
  render: () => <TricksAndTipsPage />,
};
