import type { Meta, StoryObj } from "@storybook/react-vite";
import { SettingsTemplate } from "./settings-template";

const meta = {
  title: "Templates/Settings",
  component: SettingsTemplate,
  parameters: {
    layout: "fullscreen",
  },
} satisfies Meta<typeof SettingsTemplate>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
