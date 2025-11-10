import type { Meta, StoryObj } from '@storybook/react';

const Welcome = () => {
  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-4">Apollo Wind Storybook</h1>
      <p className="text-gray-600">
        Hello World! This is a minimal Storybook with comprehensive tooling setup.
      </p>
      <p className="text-gray-600 mt-4">Real component stories will be added in Phase 2.</p>
    </div>
  );
};

const meta: Meta<typeof Welcome> = {
  title: 'Introduction/Welcome',
  component: Welcome,
};

export default meta;
type Story = StoryObj<typeof Welcome>;

export const HelloWorld: Story = {};
