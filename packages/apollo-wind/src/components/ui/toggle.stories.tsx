import type { Meta, StoryObj } from "@storybook/react";
import { Toggle } from "./toggle";

const meta: Meta<typeof Toggle> = {
  title: "Design System/Core/Toggle",
  component: Toggle,
  tags: ["autodocs"],
};

export default meta;
type Story = StoryObj<typeof Toggle>;

export const Default: Story = {
  render: () => <Toggle>Toggle</Toggle>,
};

export const Outline: Story = {
  render: () => <Toggle variant="outline">Outline</Toggle>,
};

export const Disabled: Story = {
  render: () => <Toggle disabled>Disabled</Toggle>,
};

export const WithText: Story = {
  render: () => <Toggle aria-label="Toggle bold">Bold</Toggle>,
};
