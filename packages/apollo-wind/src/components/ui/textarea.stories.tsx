import type { Meta, StoryObj } from "@storybook/react-vite";
import { Label } from "./label";
import { Textarea } from "./textarea";

const meta = {
  title: "Design System/Core/Textarea",
  component: Textarea,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
} satisfies Meta<typeof Textarea>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    placeholder: "Type your message here...",
  },
};

export const WithLabel: Story = {
  render: () => (
    <div className="grid w-full max-w-sm gap-1.5">
      <Label htmlFor="message">Your message</Label>
      <Textarea id="message" placeholder="Type your message here..." />
    </div>
  ),
};

export const WithText: Story = {
  args: {
    value: "This is a pre-filled textarea with some content.",
  },
};

export const Disabled: Story = {
  args: {
    placeholder: "This textarea is disabled",
    disabled: true,
  },
};

export const WithRows: Story = {
  args: {
    placeholder: "This textarea has custom rows",
    rows: 10,
  },
};

export const WithDescription: Story = {
  render: () => (
    <div className="grid w-full max-w-sm gap-1.5">
      <Label htmlFor="bio">Biography</Label>
      <Textarea id="bio" placeholder="Tell us about yourself..." />
      <p className="text-sm text-muted-foreground">You can use markdown syntax here.</p>
    </div>
  ),
};
