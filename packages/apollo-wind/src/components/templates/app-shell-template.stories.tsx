import type { Meta, StoryObj } from "@storybook/react";
import { AppShellTemplate } from "./app-shell-template";

const meta: Meta<typeof AppShellTemplate> = {
  title: "Templates/App Shell",
  component: AppShellTemplate,
  parameters: {
    layout: "fullscreen",
  },
};

export default meta;
type Story = StoryObj<typeof AppShellTemplate>;

export const Default: Story = {
  args: {},
};
