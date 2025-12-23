import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState } from "react";
import { Combobox, ComboboxItem } from "./combobox";
import { Label } from "./label";

const meta = {
  title: "Design System/Core/Combobox",
  component: Combobox,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
} satisfies Meta<typeof Combobox>;

export default meta;
type Story = StoryObj<typeof meta>;

const frameworks: ComboboxItem[] = [
  { value: "next.js", label: "Next.js" },
  { value: "sveltekit", label: "SvelteKit" },
  { value: "nuxt.js", label: "Nuxt.js" },
  { value: "remix", label: "Remix" },
  { value: "astro", label: "Astro" },
];

const largeList: ComboboxItem[] = Array.from({ length: 50 }, (_, i) => ({
  value: `item-${i + 1}`,
  label: `Item ${i + 1}`,
}));

export const Default: Story = {
  // @ts-expect-error - args not needed when using render, but Storybook requires it
  args: {},
  render: () => {
    const [value, setValue] = useState<string>("");

    return (
      <Combobox
        items={frameworks}
        value={value}
        onValueChange={setValue}
        placeholder="Select framework..."
        searchPlaceholder="Search frameworks..."
      />
    );
  },
};
export const WithLabel: Story = {
  // @ts-expect-error - args not needed when using render, but Storybook requires it
  args: {},
  render: () => {
    const [value, setValue] = useState<string>("");

    return (
      <div className="grid w-full max-w-sm items-center gap-1.5">
        <Label htmlFor="framework">Framework</Label>
        <Combobox
          items={frameworks}
          value={value}
          onValueChange={setValue}
          placeholder="Select framework..."
          searchPlaceholder="Search frameworks..."
        />
      </div>
    );
  },
};

export const WithValue: Story = {
  // @ts-expect-error - args not needed when using render, but Storybook requires it
  args: {},
  render: () => {
    const [value, setValue] = useState<string>("next.js");

    return (
      <Combobox
        items={frameworks}
        value={value}
        onValueChange={setValue}
        placeholder="Select framework..."
        searchPlaceholder="Search frameworks..."
      />
    );
  },
};

export const Disabled: Story = {
  // @ts-expect-error - args not needed when using render, but Storybook requires it
  args: {},
  render: () => {
    const [value, setValue] = useState<string>("next.js");

    return (
      <Combobox
        items={frameworks}
        value={value}
        onValueChange={setValue}
        placeholder="Select framework..."
        searchPlaceholder="Search frameworks..."
        disabled
      />
    );
  },
};

export const LargeList: Story = {
  // @ts-expect-error - args not needed when using render, but Storybook requires it
  args: {},
  render: () => {
    const [value, setValue] = useState<string>("");

    return (
      <Combobox
        items={largeList}
        value={value}
        onValueChange={setValue}
        placeholder="Select item..."
        searchPlaceholder="Search items..."
      />
    );
  },
};
