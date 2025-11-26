import type { Meta, StoryObj } from "@storybook/react";
import { Label } from "./label";
import { Switch } from "./switch";
import { Row } from "./layout";

const meta: Meta<typeof Switch> = {
  title: "Design System/Core/Switch",
  component: Switch,
  tags: ["autodocs"],
};

export default meta;
type Story = StoryObj<typeof Switch>;

export const Default: Story = {
  render: () => <Switch />,
};

export const WithLabel: Story = {
  render: () => (
    <Row gap={2} align="center">
      <Switch id="airplane-mode" />
      <Label htmlFor="airplane-mode">Airplane Mode</Label>
    </Row>
  ),
};

export const Disabled: Story = {
  render: () => (
    <Row gap={2} align="center">
      <Switch id="disabled" disabled />
      <Label htmlFor="disabled">Disabled</Label>
    </Row>
  ),
};
