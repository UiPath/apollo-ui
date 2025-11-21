import type { Meta, StoryObj } from "@storybook/react";
import { Button } from "./button";
import { Popover, PopoverContent, PopoverTrigger } from "./popover";

const meta: Meta<typeof Popover> = {
  title: "Design System/Overlays/Popover",
  component: Popover,
  tags: ["autodocs"],
};

export default meta;
type Story = StoryObj<typeof Popover>;

export const Default: Story = {
  render: () => (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline">Open popover</Button>
      </PopoverTrigger>
      <PopoverContent>
        <div className="grid gap-4">
          <div className="space-y-2">
            <h4 className="font-medium leading-none">Dimensions</h4>
            <p className="text-sm text-muted-foreground">Set the dimensions for the layer.</p>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  ),
};
