import type { Meta, StoryObj } from "@storybook/react";
import { DashboardTemplate } from "./dashboard-template";

const meta: Meta<typeof DashboardTemplate> = {
  title: "Templates/Dashboard",
  component: DashboardTemplate,
  parameters: {
    layout: "fullscreen",
  },
};

export default meta;
type Story = StoryObj<typeof DashboardTemplate>;

export const Default: Story = {
  args: {},
};
