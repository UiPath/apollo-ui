import type { Meta } from "@storybook/react-vite";
import { Label } from "./label";
import { Switch } from "./switch";
import { Row } from "./layout";

const meta: Meta<typeof Switch> = {
  title: "Design System/Core/Switch",
  component: Switch,
  tags: ["autodocs"],
};

export default meta;

export const Default = {
  args: {},
  render: () => <Switch />,
};

export const WithLabel = {
  args: {},
  render: () => (
    <Row gap={2} align="center">
      <Switch id="airplane-mode" />
      <Label htmlFor="airplane-mode">Airplane Mode</Label>
    </Row>
  ),
};

export const Disabled = {
  args: {},
  render: () => (
    <Row gap={2} align="center">
      <Switch id="disabled" disabled />
      <Label htmlFor="disabled">Disabled</Label>
    </Row>
  ),
};
