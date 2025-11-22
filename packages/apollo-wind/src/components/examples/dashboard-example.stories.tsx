import type { Meta, StoryObj } from "@storybook/react-vite";
import { DashboardExample } from "./dashboard-example";

const meta = {
  title: "Examples/Dashboard",
  component: DashboardExample,
  parameters: {
    layout: "fullscreen",
  },
} satisfies Meta<typeof DashboardExample>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
