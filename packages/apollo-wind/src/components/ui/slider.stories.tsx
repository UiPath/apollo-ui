import type { Meta, StoryObj } from "@storybook/react";
import { Slider } from "./slider";

const meta: Meta<typeof Slider> = {
  title: "Design System/Core/Slider",
  component: Slider,
  tags: ["autodocs"],
};

export default meta;
type Story = StoryObj<typeof Slider>;

export const Default: Story = {
  render: () => (
    <div className="w-[300px]">
      <Slider defaultValue={[33]} max={100} step={1} />
    </div>
  ),
};

export const WithRange: Story = {
  render: () => (
    <div className="w-[300px]">
      <Slider defaultValue={[25, 75]} max={100} step={1} />
    </div>
  ),
};
