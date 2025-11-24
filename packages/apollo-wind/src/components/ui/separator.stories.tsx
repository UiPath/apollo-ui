import type { Meta, StoryObj } from "@storybook/react";
import { Separator } from "./separator";
import { Row, Column } from "./layout";

const meta: Meta<typeof Separator> = {
  title: "Design System/Layout/Separator",
  component: Separator,
  tags: ["autodocs"],
};

export default meta;
type Story = StoryObj<typeof Separator>;

export const Horizontal: Story = {
  render: () => (
    <Column gap={4}>
      <div>
        <h4 className="text-sm font-medium">Apollo Wind</h4>
        <p className="text-sm text-muted-foreground">A comprehensive design system for React</p>
      </div>
      <Separator />
      <Row h={5} gap={4} align="center" className="text-sm">
        <div>Blog</div>
        <Separator orientation="vertical" />
        <div>Docs</div>
        <Separator orientation="vertical" />
        <div>Source</div>
      </Row>
    </Column>
  ),
};

export const Vertical: Story = {
  render: () => (
    <Row h={20} gap={4} align="center">
      <div>Item 1</div>
      <Separator orientation="vertical" />
      <div>Item 2</div>
      <Separator orientation="vertical" />
      <div>Item 3</div>
    </Row>
  ),
};
