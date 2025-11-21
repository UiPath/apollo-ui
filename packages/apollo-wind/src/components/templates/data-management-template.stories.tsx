import type { Meta, StoryObj } from "@storybook/react-vite";
import { DataManagementTemplate } from "./data-management-template";

const meta = {
  title: "Templates/Data Management",
  component: DataManagementTemplate,
  parameters: {
    layout: "fullscreen",
  },
} satisfies Meta<typeof DataManagementTemplate>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
