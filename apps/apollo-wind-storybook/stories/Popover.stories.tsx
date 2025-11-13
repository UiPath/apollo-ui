import type { Meta, StoryObj } from '@storybook/react';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
  Button,
  Label,
  Input,
} from '@uipath/apollo-wind/components';

const meta = {
  title: 'Components/Popover',
  component: Popover,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof Popover>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Basic: Story = {
  render: () => (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline">Open Popover</Button>
      </PopoverTrigger>
      <PopoverContent>
        <div className="space-y-2">
          <h4 className="font-medium leading-none">Dimensions</h4>
          <p className="text-sm text-muted-foreground">Set the dimensions for the layer.</p>
        </div>
      </PopoverContent>
    </Popover>
  ),
};

export const WithForm: Story = {
  render: () => (
    <Popover>
      <PopoverTrigger asChild>
        <Button>Update Profile</Button>
      </PopoverTrigger>
      <PopoverContent className="w-80">
        <div className="grid gap-4">
          <div className="space-y-2">
            <h4 className="font-medium leading-none">Profile</h4>
            <p className="text-sm text-muted-foreground">Update your profile information.</p>
          </div>
          <div className="grid gap-2">
            <div className="grid grid-cols-3 items-center gap-4">
              <Label htmlFor="name">Name</Label>
              <Input id="name" defaultValue="Pedro Duarte" className="col-span-2 h-8" />
            </div>
            <div className="grid grid-cols-3 items-center gap-4">
              <Label htmlFor="username">Username</Label>
              <Input id="username" defaultValue="@peduarte" className="col-span-2 h-8" />
            </div>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  ),
};
