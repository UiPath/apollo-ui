import type { Meta, StoryObj } from "@storybook/react";
import { Button } from "./button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "./tooltip";

const meta: Meta<typeof Tooltip> = {
  title: "Design System/Overlays/Tooltip",
  component: Tooltip,
  tags: ["autodocs"],
};

export default meta;
type Story = StoryObj<typeof Tooltip>;

export const Default: Story = {
  render: () => (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button variant="outline">Hover me</Button>
        </TooltipTrigger>
        <TooltipContent>
          <p>Add to library</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  ),
};
