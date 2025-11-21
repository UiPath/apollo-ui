import type { Meta, StoryObj } from "@storybook/react-vite";
import { AppShellTemplate } from "./app-shell-template";

const meta = {
  title: "Templates/App Shell",
  component: AppShellTemplate,
  parameters: {
    layout: "fullscreen",
  },
} satisfies Meta<typeof AppShellTemplate>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
