import type { Meta, StoryObj } from "@storybook/react-vite";
import { FormBuilderTemplate } from "./form-builder-template";

const meta = {
  title: "Templates/Form Builder",
  component: FormBuilderTemplate,
  parameters: {
    layout: "fullscreen",
  },
} satisfies Meta<typeof FormBuilderTemplate>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
